import test from 'node:test';
import assert from 'node:assert/strict';
import {singleTierScene} from '../src/data-tier-single.js';
import {tierFrames} from '../src/data-tier-flow.js';
test('page one always shows three labeled model comparisons at once',()=>{
 for(const frame of tierFrames(0)){
  const html=singleTierScene(frame);
  assert.equal((html.match(/class="tier-comparison"/g)||[]).length,3);
  assert.equal((html.match(/class="tier-node"/g)||[]).length,3);
  for(const phase of [1,2,3])assert.ok(html.includes(`ช่วง ${phase} ·`));
  assert.equal((html.match(/ข้อมูลทั้งหมด 16 แถว/g)||[]).length,3);
  assert.ok(html.includes('width:25%'));assert.ok(html.includes('width:100%'));
  assert.equal((html.match(/data-down="true"/g)||[]).length,1);
  assert.match(html,/replication และ failover/);
  assert.doesNotMatch(html,/tier-bridge|tier-shard-preview|tier-next-hint|tier-assumptions|ถ้าโตเกินเครื่องเดียว|Sharding แบ่งข้อมูลและงานไปหลายเครื่อง|หน้าถัดไป →|ขอบเขตแบบจำลอง|1 คำขอใช้กำลัง 1 หน่วย|เพดานฮาร์ดแวร์และค่าใช้จ่าย/);
  assert.match(html,/<div class="tier-toolbar">[\s\S]*?<\/div>\s*<\/figure>/);
 }
});
