import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWebFlow} from '../src/web-flow.js';
import {webTopics} from '../src/web-presentation.js';
import {webSteps} from '../src/stateless-web-view.js';
import {lessons} from '../src/lessons.js';
test('single instruction matches registry and reading promises one click',()=>{
 assert.equal((webSteps().match(/<li>/g)||[]).length,webTopics.length);
 assert.ok(webSteps().includes(webTopics[0][2]));
 assert.match(lessons.find(l=>l.kind==='stateless-web').try,/กดทดลองครั้งเดียว/);
});
for(let boundary=0;boundary<4;boundary++){
 test(`save ${boundary} retries the captured request exactly once`,async()=>{
  let count=0,failed=false;const shown=[],calls=[];
  const flow=createWebFlow({show:async f=>shown.push(f),record:async(a,retry)=>{calls.push([a,retry]);if(count===boundary&&!failed){failed=true;throw Error('lost');}count++;}});
  await assert.rejects(flow.run(),/lost/);const retained=flow.frames;
  await flow.run();assert.deepEqual(flow.frames.slice(0,retained.length),retained);
  assert.equal(shown.length,4);assert.equal(count,4);assert.deepEqual(calls[boundary+1],['web-request',true]);
 });
 test(`cancel held save ${boundary} cannot start another request`,async()=>{
  let release,count=0;const shown=[];
  const flow=createWebFlow({show:async f=>shown.push(f),record:async()=>{if(count++===boundary)await new Promise(r=>release=r);}});
  const run=flow.run();while(!release)await new Promise(r=>setImmediate(r));
  flow.cancel();release();await run;assert.equal(shown.length,boundary+1);assert.equal(flow.completed,false);
 });
}
test('pause during a held save gates later requests; cancel releases gate',async()=>{
 let release,count=0;const shown=[];
 const flow=createWebFlow({show:async f=>shown.push(f),record:async()=>{if(count++===0)await new Promise(r=>release=r);}});
 const run=flow.run();while(!release)await new Promise(r=>setImmediate(r));
 flow.pause(true);release();await new Promise(r=>setImmediate(r));assert.equal(shown.length,1);
 flow.cancel();await run;assert.equal(shown.length,1);
});
test('one comparison sends the same user to A then B in each storage design',async()=>{
 assert.equal(webTopics.length,1);
 const frames=[],records=[];
 const flow=createWebFlow({show:async f=>frames.push(f),record:async(...args)=>records.push(args)});
 await flow.run(0);
 assert.deepEqual(frames.map(f=>f.state.last.code),['OK','NO_SESSION','OK','OK']);
 assert.deepEqual(frames.map(f=>f.state.last.server),[0,1,0,1]);
 assert.deepEqual(frames.map(f=>f.state.mode),['local','local','shared','shared']);
 assert.deepEqual(frames.map(f=>f.state.requests),[1,2,3,4]);
 assert.deepEqual(frames.map(f=>f.state.storeReads),[0,0,1,2]);
 assert.ok(frames.every(f=>f.options.sticky===false));
 assert.deepEqual(records,Array.from({length:4},()=>['web-request',false]));
 await flow.replay();assert.equal(records.length,4);assert.deepEqual(frames.slice(4),frames.slice(0,4));
});
