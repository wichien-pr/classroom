import test from 'node:test';
import assert from 'node:assert/strict';
import {tierPages,tierFrames} from '../src/data-tier-flow.js';
test('page one teaches concentration and capacity before secondary availability',()=>{
 const frames=tierFrames(0);
 assert.match(tierPages[0].title,/คอขวด/);
 assert.match(frames[0].situation,/16 แถว.*16 คำขอ.*เครื่องเดียว/);
 assert.match(frames[1].takeaway,/ฮาร์ดแวร์.*ค่าใช้จ่าย/);
 assert.match(frames[2].caption,/ประเด็นรอง/);
 assert.match(frames[2].takeaway,/replication.*failover.*Sharding.*ไม่/);
 assert.deepEqual(frames.map(f=>[f.result.status,f.result.capacity,f.result.loads]),[['overloaded',8,[16]],['ready',32,[16]],['unavailable',32,[16]]]);
});
