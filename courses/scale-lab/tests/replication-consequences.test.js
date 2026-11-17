import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createReplicationFlow} from '../src/replication-flow.js';
import * as view from '../src/replication-presentation.js';
test('remaining outcomes expose stale availability, fallback, blocked gates and divergent histories without fake delivery',async()=>{
 const expected=[['read-stale'],['fallback'],['writer-down','sync-blocked','read-stale'],['fence-blocked','fenced','loss-blocked','loss-accepted','promoted','write','read-current','read-divergent','sync','read-current']];
 for(let topic=2;topic<6;topic++){
  const f=await frames(topic),v=f.map(view.replicationConsequence);
  assert.deepEqual(v.map(x=>x.kind),expected[topic-2]);
  for(let i=0;i<v.length;i++){
   const html=view.replicationScene(f[i].state,f[i],topic);
   assert.match(html,new RegExp(`data-consequence-kind="${v[i].kind}"`));
   if(topic<=4)assert.doesNotMatch(html,/class="replication-consequence"|replication-data-ledger|data-response|data-consequence-verdict/);
   else assert.match(html,/data-learner-beat=/);
   if(/blocked|writer-down|promoted/.test(v[i].kind))assert.deepEqual(v[i].routes,[]);
  }
  if(topic===2){assert.equal(v[0].returned,'v1 · สาย 0');assert.deepEqual(v[0].routes,[['web','db-2'],['db-2','web']]);}
  if(topic===3)assert.equal(v[0].returned,'v2 · สาย 0');
  if(topic===5)assert.match(v[0].detail,/fencing/);
  if(topic===5)assert.match(v[2].detail,/1 ขั้นเขียน/);
  if(topic===5){assert.match(v[4].detail,/1 ขั้นเขียน/);assert.equal(v[7].returned,'v2 · สาย 0');assert.equal(v[9].returned,'v2 · สาย 1');assert.match(v[7].detail,/version เท่ากัน/);}
 }
});
async function frames(topic){const found=[];await createReplicationFlow({show:async f=>found.push(f),record:async()=>{}}).run(topic);return found;}
test('healthy-copy visuals distinguish Primary response, explicit sync and caught-up Replica response',async()=>{
 const f=await frames(1);
 assert.equal(typeof view.replicationConsequence,'function');
 const v=f.map(view.replicationConsequence);
 assert.deepEqual(v.map(x=>x.kind),['read-current','sync','read-current']);
 assert.deepEqual(v[0].routes,[['web','db-0'],['db-0','web']]);
 assert.deepEqual(v[1].routes,[['db-0','db-1'],['db-0','db-2']]);
 assert.equal(v[2].returned,'v2 · สาย 0');
 for(const frame of [null,...f,...f]){
  const html=view.replicationScene(frame?.state||f[0].before,frame,1);
  assert.doesNotMatch(html,/class="replication-consequence"|replication-data-ledger|data-response|data-consequence-verdict/);
  assert.match(html,/class="replication-map"/);
  assert.match(html,/id="replication-result"/);
  if(frame)assert.match(html,new RegExp(`data-consequence-kind="${view.replicationConsequence(frame).kind}"`));
 }
});
