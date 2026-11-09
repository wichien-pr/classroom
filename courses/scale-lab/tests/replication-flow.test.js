import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as flow from '../src/replication-flow.js';
test('manual sync waits for each captured stage before the next real action',async()=>{
 const frames=[],awards=[];let release;
 const runner=flow.createReplicationFlow({record:async a=>awards.push(a),show:async f=>{frames.push(f);if(frames.length===1)await new Promise(r=>release=r);}});
 const pending=runner.run(1);await new Promise(r=>setImmediate(r));
 assert.equal(frames.length,1);assert.deepEqual(frames[0].state.versions,[2,1,1]);assert.equal(runner.busy,true);
 await runner.run(1);assert.equal(frames.length,1);release();await pending;
 assert.deepEqual(frames.map(f=>f.action),['read-primary','sync','read-replica']);assert.deepEqual(frames[1].state.versions,[2,2,2]);assert.deepEqual(awards,['read-primary','sync','read-replica']);assert.equal(runner.busy,false);
});
test('cancel during stage prevents later actions and records; replay is snapshot-only',async()=>{
 let release;const shown=[],awards=[];
 const runner=flow.createReplicationFlow({record:async a=>awards.push(a),show:async f=>{shown.push(f);if(!release)await new Promise(r=>release=r);}});
 const pending=runner.run(0);await new Promise(r=>setImmediate(r));runner.cancel();release();await pending;
 assert.deepEqual(awards,[]);assert.equal(shown.length,1);assert.equal(runner.frames.length,0);
 await runner.run(1);const count=awards.length;shown.length=0;await runner.replay();
 assert.deepEqual(shown.map(f=>f.action),flow.replicationSequences[1]);assert.equal(awards.length,count);
});
test('all eight flows preserve real guard outcomes and all four semantic awards',async()=>{
 const awards=new Set();
 for(let topic=0;topic<8;topic++){
  const snapshots=[];const runner=flow.createReplicationFlow({show:async f=>snapshots.push(f),record:async a=>awards.add(a)});
  await runner.run(topic);assert.deepEqual(snapshots.map(f=>f.action),flow.replicationSequences[topic]);
  if(topic===4){assert.match(snapshots[0].message,/503/);assert.deepEqual(snapshots[0].routes,[]);assert.deepEqual(snapshots[1].routes,[]);}
  if(topic===5||topic===6){assert.equal(snapshots[0].state.writer,0);assert.match(snapshots[0].message,/ยัง promote ไม่ได้/);}
  if(topic===7){assert.equal(snapshots[0].state.writer,1);assert.equal(snapshots[0].state.lost,1);assert.match(snapshots[3].message,/คนละสายข้อมูล/);assert.deepEqual(snapshots[4].routes,[['db-1','db-2']]);assert.deepEqual(snapshots.at(-1).state.up,[false,true,true]);}
 }
 assert.deepEqual([...awards].sort(),['read-primary','read-replica','sync','write']);
});
test('save failure stops and retry resumes the same stage without another model mutation',async()=>{
 const shown=[],records=[];let fail=true;
 const runner=flow.createReplicationFlow({show:async f=>shown.push(f),record:async(a,retry)=>{records.push([a,retry]);if(fail){fail=false;throw Error('save');}}});
 await assert.rejects(runner.run(0),/save/);assert.equal(shown.length,1);assert.equal(runner.busy,false);
 await runner.run(0);assert.deepEqual(shown.map(f=>f.action),['write','read-replica']);assert.equal(shown[0].state.versions[0],1);assert.deepEqual(records,[['write',false],['write',true],['read-replica',false]]);
});
