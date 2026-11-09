import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as cache from '../src/cache.js';
import {cacheRoutes} from '../src/cache-presentation.js';
test('route projection separates miss DB read and fill without cache-to-DB calls',()=>{
 const before=cache.cacheInitial();
 assert.deepEqual(cacheRoutes({action:'read-cache',before}).map(r=>r.slice(0,2)),[['web','cache'],['web','db'],['db','web'],['web','cache']]);
 before.cache=100;before.db=150;
 assert.deepEqual(cacheRoutes({action:'read-cache',before}).map(r=>r.slice(0,2)),[['web','cache'],['cache','web']]);
 before.up=false;
 assert.deepEqual(cacheRoutes({action:'read-cache',before}).map(r=>r.slice(0,2)),[['web','db'],['db','web']]);
 for(const action of ['tick','outage','restart'])assert.deepEqual(cacheRoutes({action,before}),[]);
});
import {createCacheFlow,cacheSequences} from '../src/cache-flow.js';
test('cancel during stage prevents later actions and records; replay is snapshot-only',async()=>{
 let release;const shown=[],awards=[];
 const runner=createCacheFlow({record:async a=>awards.push(a),show:async f=>{shown.push(f);if(!release)await new Promise(r=>release=r);}});
 const pending=runner.run(0);await new Promise(r=>setImmediate(r));runner.cancel();release();await pending;
 assert.deepEqual(awards,[]);assert.equal(shown.length,1);assert.equal(runner.frames.length,0);
 await runner.run(1);const count=awards.length;shown.length=0;await runner.replay();
 assert.deepEqual(shown.map(f=>f.action),cacheSequences[1]);assert.equal(awards.length,count);
});
test('save failure stops and retry resumes the same stage without another model mutation',async()=>{
 const shown=[],records=[];let fail=true;
 const runner=createCacheFlow({show:async f=>shown.push(f),record:async(a,retry)=>{records.push([a,retry]);if(fail){fail=false;throw Error('save');}}});
 await assert.rejects(runner.run(0),/save/);assert.equal(shown.length,1);assert.equal(runner.busy,false);
 await runner.run(0);assert.deepEqual(shown.map(f=>f.action),['read-cache','read-cache']);assert.equal(shown[0].state.reads,1);assert.deepEqual(records,[['read-cache',false],['read-cache',true],['read-cache',false]]);
});

test('full cache scenarios preserve semantic actions and manual TTL',async()=>{
 const {createCacheFlow,cacheSequences}=await import('../src/cache-flow.js');
 const awards=new Set();
 for(let topic=0;topic<5;topic++){
  const frames=[];const runner=createCacheFlow({show:async f=>frames.push(f),record:async a=>awards.add(a)});
  await runner.run(topic);assert.deepEqual(frames.map(f=>f.action),cacheSequences[topic]);
  assert.equal(frames[0].state.path,'miss');assert.equal(frames[0].state.reads,1);
  if(topic===0){assert.equal(frames.at(-1).state.path,'hit');assert.equal(frames.at(-1).state.reads,1);}
  if(topic===1){assert.match(frames.at(-1).message,/STALE/);assert.equal(frames.at(-1).state.cache,100);}
  if(topic===2){assert.equal(frames.at(-1).state.cache,150);assert.equal(frames.at(-1).state.reads,2);}
  if(topic===3){assert.equal(frames.at(-1).state.now,3);assert.equal(frames.at(-1).state.reads,2);}
  if(topic===4){assert.equal(frames[2].state.path,'bypass');assert.equal(frames.at(-1).state.reads,3);}
  const before=[...awards];await runner.replay();assert.deepEqual([...awards],before);
 }
 assert.deepEqual([...awards].sort(),['invalidate','read-cache','update']);
});
test('each independent cache preset starts cold with a manual clock',()=>{
 assert.equal(typeof cache.cachePreset,'function');
 for(let i=0;i<5;i++)assert.deepEqual(cache.cachePreset(i),cache.cacheInitial());
});
