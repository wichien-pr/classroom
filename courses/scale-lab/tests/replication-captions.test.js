// Current restoration acceptance; supersedes the historical in-map caption contract.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createReplicationFlow} from '../src/replication-flow.js';
import {replicationScene} from '../src/replication-presentation.js';
test('recovery result stays once below diagram in toolbar with separate caveat',async()=>{
 const frames=[];await createReplicationFlow({show:async f=>frames.push(f),record:async()=>{}}).run(5);
 for(const f of frames){
  const html=replicationScene(f.state,f,5),toolbar=html.indexOf('class="workload-actions"');
  assert.doesNotMatch(html,/replication-scene-caption|replication-scene-caveat/);
  assert.equal((html.match(/id="replication-result"/g)||[]).length,1);
  assert.match(html.slice(toolbar),/id="replication-result" role="status"/);
  assert.match(html.slice(toolbar),/id="replication-stage" role="status"/);
  assert.match(html.slice(toolbar),/<figcaption>.*ไม่สลับอัตโนมัติ/);
 }
 assert.match(replicationScene(frames[9].state,frames[9],5),/สูญเสีย 1 งานเขียนแล้ว/);
});
