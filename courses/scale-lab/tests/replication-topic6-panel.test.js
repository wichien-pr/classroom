import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createReplicationFlow} from '../src/replication-flow.js';
import {replicationScene,replicationTopics} from '../src/replication-presentation.js';
test('compact recovery has no dormant duplicate-ledger renderer or styles',()=>{
 for(const file of ['replication-presentation.js','replication-presentation.css'])assert.doesNotMatch(readFileSync(new URL('../src/'+file,import.meta.url),'utf8'),/replication-data-ledger/);
});
test('six topics and all ten recovery snapshots retain one model-backed map and focused status',async()=>{
 assert.equal(replicationTopics.length,6);const frames=[];await createReplicationFlow({show:async f=>frames.push(f),record:async()=>{}}).run(5);assert.equal(frames.length,10);
 for(const frame of [null,...frames]){const html=replicationScene(frame?.state||frames[0].before,frame,5);assert.equal((html.match(/data-copy=/g)||[]).length,3);assert.equal((html.match(/data-node=/g)||[]).length,4);assert.doesNotMatch(html,/replication-data-ledger/);assert.match(html,/data-recovery-stage/);assert.match(html,/data-learner-beat/);assert.doesNotMatch(html,/replication-guards|data-consequence-verdict/);assert.match(html,/replication-replay/);}
});
