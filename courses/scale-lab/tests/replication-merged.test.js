import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createReplicationFlow,replicationSequences} from '../src/replication-flow.js';
import {replicationTopics,replicationConsequence,replicationScene} from '../src/replication-presentation.js';
import {lessonLayouts} from '../src/lesson-layout-data.js';
test('six outer topics merge original guards and authorized recovery into one continuous history',async()=>{
 assert.equal(replicationTopics.length,6);assert.equal(replicationSequences.length,6);assert.equal(lessonLayouts.replica.steps.length,6);
 const frames=[],records=[];const flow=createReplicationFlow({show:async f=>frames.push(f),record:async a=>records.push(a)});await flow.run(5);
 assert.deepEqual(frames.map(f=>f.action),['promote','fence','promote','accept-loss','promote','write','read-primary','read-replica','sync','read-replica']);
 assert.deepEqual(frames.filter(f=>f.action==='promote').map(f=>replicationConsequence(f).kind),['fence-blocked','loss-blocked','promoted']);
 for(const f of frames){const html=replicationScene(f.state,f,5);assert.match(html,/data-recovery="true"/);assert.match(html,/data-recovery-stage/);assert.doesNotMatch(html,/replication-data-ledger/);}
 assert.match(replicationScene(frames[8].state,frames[8],5),/ไม่กู้ข้อมูลที่สูญเสีย/);
 assert.equal(replicationConsequence(frames[1]).kind,'fenced');assert.equal(replicationConsequence(frames[3]).kind,'loss-accepted');
 assert.match(replicationScene(frames[2].state,frames[2],5),/ต้องยอมรับ 1 งานเขียนที่ขาด/);
 assert.equal(frames[0].before.up[0],false);assert.equal(frames[2].state.fenced,true);assert.equal(frames[2].state.acceptLoss,false);assert.equal(frames[4].state.lost,1);
 assert.deepEqual(frames[7].state.versions,[2,2,2]);assert.deepEqual(frames[7].state.histories,[0,1,0]);assert.deepEqual(frames[8].state.histories,[0,1,1]);
 assert.deepEqual(records,['write','read-primary','read-replica','sync','read-replica']);
 await flow.replay();assert.equal(records.length,5);
});
test('pause gates held saves and cancel releases the gate; failed stage retries without mutation',async()=>{
 let release,fail=true;const shown=[],records=[];
 const flow=createReplicationFlow({show:async f=>shown.push(f),record:async(a,retry)=>{records.push([a,retry]);if(fail){fail=false;throw Error('lost response');}if(a==='read-primary')await new Promise(r=>release=r);}});
 await assert.rejects(flow.run(5),/lost response/);assert.equal(shown.length,6);
 const pending=flow.run(5);await new Promise(r=>setImmediate(r));flow.pause(true);release();await new Promise(r=>setImmediate(r));
 assert.equal(shown.length,7);assert.deepEqual(records.slice(0,2),[['write',false],['write',true]]);
 flow.cancel();await pending;assert.equal(shown.length,7);assert.equal(flow.paused,false);
});
