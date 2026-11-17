import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createReplicationFlow} from '../src/replication-flow.js';
import * as view from '../src/replication-presentation.js';
test('ten preserved transitions project into three learner beats without a second dashboard',async()=>{
 const frames=[],records=[];
 const flow=createReplicationFlow({show:async f=>frames.push(f),record:async a=>records.push(a)});await flow.run(5);
 assert.equal(typeof view.replicationRecoveryBeat,'function');
 assert.deepEqual(frames.map(view.replicationRecoveryBeat),[0,1,1,1,1,2,2,2,2,2]);
 assert.deepEqual(records,['write','read-primary','read-replica','sync','read-replica']);
 for(const f of frames){const html=view.replicationScene(f.state,f,5);assert.match(html,new RegExp(`data-learner-beat="${view.replicationRecoveryBeat(f)}"`));assert.doesNotMatch(html,/replication-consequence|replication-guards|สาย [01]|\/ 10/);assert.match(html,/data-model-stage/);}
 assert.match(view.replicationScene(frames[3].state,frames[3],5),/ยอมรับ.*1.*ก่อน/);
 assert.match(view.replicationScene(frames[4].state,frames[4],5),/Primary ใหม่/);
 assert.match(view.replicationScene(frames[7].state,frames[7],5),/ข้อมูลยังไม่ตรง/);
 assert.match(view.replicationScene(frames[9].state,frames[9],5),/รับข้อมูลจาก Primary ใหม่แล้ว/);
});
for(let failed=0;failed<5;failed++)test(`save failure ${failed} retains exact captured model transition and replay stays unscored`,async()=>{
 const shown=[],calls=[];let n=0;
 const flow=createReplicationFlow({show:async f=>shown.push(f),record:async(a,retry)=>{calls.push({a,retry});if(n++===failed)throw Error('save failed');}});
 await assert.rejects(flow.run(5),/save failed/);const captured=structuredClone(shown);await flow.run(5);
 assert.deepEqual(shown.slice(0,captured.length),captured);assert.equal(shown.length,10);assert.equal(calls[failed+1].retry,true);assert.equal(calls[failed+1].a,calls[failed].a);
 const saved=calls.length;await flow.replay();assert.equal(calls.length,saved);assert.deepEqual(shown.slice(10),shown.slice(0,10));
});
