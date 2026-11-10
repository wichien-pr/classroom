import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLoggingStory,loggingStageFrames,loggingPages} from '../src/logging-story.js';
test('explicit experiment plays only the selected page and records only its action',async()=>{
 const expected=[['run-pipeline'],['run-pipeline','run-pipeline','run-pipeline'],['inspect-logs','inspect-metrics','inspect-metrics','inspect-metrics']];
 for(let index=0;index<3;index++){
  const seen=[],saved=[],flow=createLoggingStory({show:async f=>seen.push(f),record:async a=>saved.push(a)});
  const frames=loggingPages[index].stages.map(i=>loggingStageFrames()[i]);
  await flow.run(index);assert.deepEqual(seen,frames);
  assert.deepEqual(saved,expected[index]);
  await flow.replay();assert.deepEqual(seen,[...frames,...frames]);
  assert.equal(saved.length,expected[index].length);
 }
});
test('save retry keeps selected snapshot and action without repeating model work',async()=>{
 let fail=true;const seen=[],saved=[],flow=createLoggingStory({show:async f=>seen.push(f.key),record:async(a,retry)=>{saved.push([a,retry]);if(fail){fail=false;throw Error('lost');}}});
 await assert.rejects(flow.run(2),/lost/);await flow.run(2);
 assert.deepEqual(seen,['logs','host','tier','business','observe']);assert.deepEqual(saved,[['inspect-logs',false],['inspect-logs',true],['inspect-metrics',false],['inspect-metrics',false],['inspect-metrics',false]]);
});
test('cancel during animation prevents record and cancel during save prevents stale completion',async()=>{
 for(const at of ['show','record']){
  let release,arrive;const gate=new Promise(r=>release=r),ready=new Promise(r=>arrive=r),seen=[],saved=[];
  const flow=createLoggingStory({show:async f=>{seen.push(f.key);if(at==='show'){arrive();await gate;}},record:async a=>{saved.push(a);arrive();await gate;}});
  const running=flow.run(0);await ready;flow.cancel();release();await running;
  assert.equal(flow.completed,false);assert.equal(flow.busy,false);assert.deepEqual(seen,['blocked']);assert.deepEqual(saved,at==='record'?['run-pipeline']:[]);
 }
});
