import test from 'node:test';
import assert from 'node:assert/strict';
import {tierFrames} from '../src/data-tier-flow.js';
const sharding=await import('../src/data-tier-sharding.js').catch(()=>({}));
test('scene explains partitioning with distinct placement and request stages',()=>{
 assert.equal(typeof sharding.shardingScene,'function');
 const html=sharding.shardingScene(tierFrames(1)[0]);
 assert.match(html,/schema เดียวกัน · คนละแถว · ไม่ใช่สำเนา/);
 assert.equal((html.match(/data-row=/g)||[]).length,16);
 assert.equal((html.match(/data-shard=/g)||[]).length,4);
 assert.match(html,/16 → 4/);
});
test('projection partitions real rows and accumulates routed requests without copies',()=>{
 assert.equal(typeof sharding.shardSteps,'function');
 for(const frame of tierFrames(1)){
  const steps=sharding.shardSteps(frame);
  assert.equal(steps.length,4);
  assert.deepEqual(steps.at(-1).loads,frame.result.loads);
  assert.deepEqual(steps.flatMap(s=>s.requests.flat()).sort((a,b)=>a-b),frame.config.traffic==='uniform'?Array.from({length:16},(_,i)=>i):[0,1,2,...Array(13).fill(4)]);
  for(const step of steps)step.requests.forEach((ids,shard)=>ids.forEach(id=>assert.ok(frame.result.rows[shard].includes(id))));
 }
});
