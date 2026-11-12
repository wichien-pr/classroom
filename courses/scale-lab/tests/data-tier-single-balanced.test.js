import test from 'node:test';
import assert from 'node:assert/strict';
import {tierPages,tierFrames,createTierFlow} from '../src/data-tier-flow.js';
import {shardingScene} from '../src/data-tier-sharding.js';
import {dataTierLayout} from '../src/database-scaling-view.js';
test('page two is one balanced evaluation with concise title and no phase counter',async()=>{
 assert.equal(tierPages[1].title,'Sharding · แบ่งข้อมูล กระจายภาระงาน');
 assert.deepEqual(tierPages.map(p=>p.sourceTopics),[[0,1],[2]]);
 assert.deepEqual(tierPages.map((_,i)=>tierFrames(i).length),[3,1]);
 const [frame]=tierFrames(1);assert.deepEqual(frame.result.loads,[4,4,4,4]);assert.equal(frame.result.capacity,8);
 assert.doesNotMatch(shardingScene(frame),/ช่วง|ข้อจำกัด · user|ประเทศเดียวกัน/);
 assert.equal(dataTierLayout.steps.length,2);
 assert.doesNotMatch(dataTierLayout.steps[1],/Hotspot|ประเทศเดียวกัน/);
 const writes=[],shown=[];const flow=createTierFlow({show:async f=>shown.push(f),record:async a=>writes.push(a)});
 await flow.run(1);assert.deepEqual(writes,['evaluate-data-tier']);assert.equal(shown.length,1);
 await flow.play(1);assert.equal(writes.length,1);assert.equal(shown.length,2);assert.equal(flow.busy,false);
});
