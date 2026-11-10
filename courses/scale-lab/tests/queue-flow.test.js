import test from 'node:test';
import {queueAction} from '../src/message-queue.js';
import assert from 'node:assert/strict';
import {createQueueFlow,queuePreset} from '../src/queue-flow.js';
test('independent queue topics preserve enqueue/process identities and actual outcomes',async()=>{
 const expected=[[3,0],[6,0],[5,1],[8,1],[5,4]];
 for(let topic=0;topic<5;topic++){
  const records=[];const flow=createQueueFlow({show:async()=>{},record:async a=>records.push(a)});
  await flow.run(topic);const last=flow.frames.at(-1).state;
  assert.deepEqual([last.jobs.length,last.completed.length],expected[topic]);
  assert.ok(records.every(a=>['enqueue-jobs','process-jobs'].includes(a)));
  const before=structuredClone(records);await flow.replay();assert.deepEqual(records,before);
 }
 assert.equal(queuePreset(2).producerUp,false);
});
test('flow holds later mutations until projection and save finish; cancel never starts a later action',async()=>{
 let release,save;const shown=[],awards=[];
 const flow=createQueueFlow({show:f=>{shown.push(f);return new Promise(r=>release=r);},record:a=>{awards.push(a);return new Promise(r=>save=r);}});
 const pending=flow.run(3);assert.equal(shown.length,1);assert.deepEqual(awards,[]);release();await new Promise(r=>setImmediate(r));assert.equal(shown.length,1);assert.deepEqual(awards,['enqueue-jobs']);flow.cancel();save();await pending;assert.equal(shown.length,1);assert.equal(flow.busy,false);
});
test('failed save resumes same snapshot without repeating mutation; no-op work is unscored',async()=>{
 let fail=true;const calls=[],shown=[];
 const flow=createQueueFlow({show:async f=>shown.push(f),record:async(a,retry)=>{calls.push([a,retry]);if(fail){fail=false;throw Error('lost');}}});
 await assert.rejects(flow.run(1),/lost/);assert.equal(flow.frames[0].state.jobs.length,6);
 await flow.run(1);assert.deepEqual(calls,[['enqueue-jobs',false],['enqueue-jobs',true]]);assert.equal(shown.length,2);assert.equal(flow.frames.at(-1).state.jobs.length,6);
 const s=queuePreset(1);s.consumerUp=true;for(let i=0;i<3;i++)assert.equal(queueAction(s,'process-jobs').meaningful,true);assert.equal(queueAction(s,'process-jobs').meaningful,false);assert.equal(s.jobs.length,0);assert.equal(s.completed.length,3);
});
