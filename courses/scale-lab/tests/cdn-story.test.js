import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCdnFlow,cdnSequences} from '../src/cdn-flow.js';
import {lessonLayouts} from '../src/lesson-layout-data.js';
import {cdnInitial} from '../src/cdn.js';
import {cdnScene,cdnTopics} from '../src/cdn-presentation.js';
for(let boundary=0;boundary<4;boundary++)test(`request save boundary ${boundary} retries captured frame and replay does not record`,async()=>{
 const frames=[],records=[];let failed=false,successes=0;
 const flow=createCdnFlow({show:async f=>frames.push(f),record:async(action,retry)=>{
  records.push([action,retry]);if(successes===boundary&&!failed){failed=true;throw Error('lost response');}successes++;
 }});
 await assert.rejects(flow.run(0),/lost response/);const retained=structuredClone(flow.frames);
 await flow.run(0);assert.deepEqual(flow.frames.slice(0,retained.length),retained);
 assert.equal(frames.length,6);assert.equal(successes,4);
 assert.deepEqual(records[boundary+1],['decision',true]);
 const saved=records.length;await flow.replay();assert.equal(records.length,saved);
 assert.deepEqual(frames.slice(6),flow.frames);
});
for(let boundary=0;boundary<4;boundary++)test(`cancel during request save ${boundary} never advances to later model operations`,async()=>{
 let release,count=0;const frames=[];
 const flow=createCdnFlow({show:async f=>frames.push(f),record:async()=>{if(count++===boundary)await new Promise(r=>release=r);}});
 const run=flow.run(0);while(!release)await new Promise(r=>setImmediate(r));
 const before=frames.length;flow.cancel();release();await run;
 assert.equal(frames.length,before);assert.equal(count,boundary+1);assert.equal(flow.completed,false);
});
test('registry describes only the retained story and leaves version settings to read more',()=>{
 assert.deepEqual(lessonLayouts.cdn.steps,cdnTopics.map(t=>t[2]));
 assert.doesNotMatch(lessonLayouts.cdn.note,/ตั้ง TTL|เปลี่ยน URL/);
});
test('guided scene leaves TTL, query-key and failure details to read more',()=>{
 const html=cdnScene(cdnInitial(),null);
 assert.doesNotMatch(html,/TTL|query|ทางสำรอง|stale-on-error|หมดอายุที่|อายุสำเนา/);
});
test('one CDN story has four learner beats and four original request saves',async()=>{
 assert.equal(cdnTopics.length,1);assert.equal(cdnTopics[0][0],'ทำไม CDN ยังส่งไฟล์เก่า?');
 assert.deepEqual(cdnSequences,[['request','request','publish','request','invalidate','request']]);
 const frames=[],records=[];
 await createCdnFlow({show:async f=>frames.push(f),record:async (...args)=>records.push(args)}).run(0);
 assert.deepEqual(frames.map(f=>f.beat),[1,2,3,3,4,4]);
 assert.ok(frames.every(f=>f.beatTotal===4));
 assert.deepEqual(frames.filter(f=>f.action==='request').map(f=>[f.state.path,f.state.delivered,f.state.origin]),[['miss',1,1],['hit',1,1],['hit',1,2],['miss',2,2]]);
 assert.deepEqual(records,Array.from({length:4},()=>['decision',false]));
 assert.equal(frames.at(-1).state.now,0);assert.equal(frames.at(-1).state.originReads,2);
});
