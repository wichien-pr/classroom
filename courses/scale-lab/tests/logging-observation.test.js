import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLoggingStory,loggingStageFrames} from '../src/logging-story.js';
import {loggingScene} from '../src/logging-presentation.js';
test('observation preserves five frames, results and four awaited original operations',async()=>{
 const seen=[],saved=[];const flow=createLoggingStory({show:async f=>seen.push(f),record:async a=>saved.push(a)});
 await flow.run(2);assert.deepEqual(seen,loggingStageFrames().slice(7));
 assert.deepEqual(saved,['inspect-logs','inspect-metrics','inspect-metrics','inspect-metrics']);
 const final=seen.at(-1),html=loggingScene(final.state,final);
 assert.match(html,/ช่วง 5 \/ 5/);for(const key of ['host','tier','business'])assert.match(html,new RegExp(`data-metric="${key}"`));
 assert.match(html,/DB_TIMEOUT/);assert.match(html,/logging-observe/);
 await flow.replay();assert.equal(saved.length,4);
});
test('each observation save retries without remutation; cancel stops later stages',async()=>{
 for(const failAt of [1,2,3,4]){
  let calls=0;const seen=[],saved=[];
  const flow=createLoggingStory({show:async f=>seen.push(f.key),record:async(a,retry)=>{saved.push([a,retry]);if(!retry&&++calls===failAt)throw Error('lost');}});
  await assert.rejects(flow.run(2));await flow.run(2);
  assert.deepEqual(seen,['logs','host','tier','business','observe']);assert.equal(saved.length,5);assert.equal(saved.filter(x=>x[1]).length,1);
 }
 for(const boundary of ['show','record']){
  let release,arrive;const gate=new Promise(r=>release=r),ready=new Promise(r=>arrive=r),seen=[],saved=[];
  const flow=createLoggingStory({show:async f=>{seen.push(f.key);if(boundary==='show'){arrive();await gate;}},record:async a=>{saved.push(a);arrive();await gate;}});
  const run=flow.run(2);await ready;flow.cancel();release();await run;
  assert.deepEqual(seen,['logs']);assert.deepEqual(saved,boundary==='record'?['inspect-logs']:[]);assert.equal(flow.completed,false);
 }
});
