import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as story from '../src/logging-story.js';
test('three pages retain prerequisites privately with four-phase second and five-phase third pages',async()=>{
 assert.equal(story.loggingPages?.length,3);
 assert.deepEqual(story.loggingPages.map(p=>p.stages),[[2],[3,4,5,6],[7,8,9,10,11]]);
 assert.equal(story.loggingPages[1].title,'แก้ไข Code Version → Build → Test → Deploy');
 const frames=story.loggingStageFrames(),seen=[],saved=[];
 const flow=story.createLoggingStory({show:async f=>seen.push(f),record:async a=>saved.push(a)});
 await flow.run(1);
 assert.deepEqual(seen,frames.slice(3,7));
 assert.deepEqual(saved,['run-pipeline','run-pipeline','run-pipeline']);
 assert.deepEqual(seen.map(f=>f.state.stage),['ready','built','tested','deployed']);
 await flow.replay();assert.deepEqual(seen,[...frames.slice(3,7),...frames.slice(3,7)]);
 assert.equal(saved.length,3);
});
test('each merged save boundary retries only its captured mutation then completes remaining phases',async()=>{
 for(const failAt of [1,2,3]){
  let calls=0,failed=false;const seen=[],saved=[];
  const flow=story.createLoggingStory({show:async f=>seen.push(f.key),record:async(a,retry)=>{saved.push(retry);if(!retry&&++calls===failAt&&!failed){failed=true;throw Error('lost');}}});
  await assert.rejects(flow.run(1),/lost/);await flow.run(1);
  assert.deepEqual(seen,['fix','build-fixed','tested','deployed']);assert.equal(saved.filter(Boolean).length,1);assert.equal(saved.length,4);assert.equal(flow.completed,true);
 }
});
test('merged page awaits animation and save before later phases and cancellation cannot resume',async()=>{
 for(const at of ['show','record']){
  let release,arrive;const gate=new Promise(r=>release=r),ready=new Promise(r=>arrive=r),seen=[],saved=[];
  const flow=story.createLoggingStory({show:async f=>{seen.push(f.key);if(at==='show'&&f.key==='build-fixed'){arrive();await gate;}},record:async a=>{saved.push(a);if(at==='record'){arrive();await gate;}}});
  const running=flow.run(1);await ready;assert.deepEqual(seen,['fix','build-fixed']);
  flow.cancel();release();await running;assert.deepEqual(seen,['fix','build-fixed']);assert.equal(flow.completed,false);assert.equal(saved.length,at==='record'?1:0);
 }
});
