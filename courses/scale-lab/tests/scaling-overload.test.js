import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scalingScene} from '../src/scaling-view.js';
import {evaluateScaling} from '../src/scaling.js';
import {scalingPreset} from '../src/scaling-presets.js';
test('single-machine overload projects evaluated capacity and persistent excess, not a failed machine',()=>{
 const config=scalingPreset(0),html=scalingScene(config,evaluateScaling(config));
 assert.match(html,/class="scaling-capacity"/);
 assert.match(html,/โหลด 3/);assert.match(html,/กำลังที่เข้าถึงได้ 1/);assert.match(html,/เกินกำลัง 2/);
 assert.doesNotMatch(html,/scaling-offline/);
 const changed={...config,traffic:5};assert.match(scalingScene(changed,evaluateScaling(changed)),/เกินกำลัง 4/);
});
test('every preset compares load with routed ready capacity on a common scale',()=>{
 for(let i=0;i<5;i++){
  const c=scalingPreset(i),r=evaluateScaling(c),html=scalingScene(c,r),scale=Math.max(c.traffic,r.capacity);
  assert.match(html,/class="scaling-capacity"/);
  assert.ok(html.includes(`กำลังที่เข้าถึงได้ ${r.capacity} หน่วย`));
  assert.ok(html.includes(`เกินกำลัง ${Math.max(0,c.traffic-r.capacity)} หน่วย`));
  assert.ok(html.includes(`class="scaling-load-fill" style="width:${c.traffic/scale*100}%"`));
  assert.ok(html.includes(`width:${r.capacity/scale*100}%`));
  if(c.servers>1){assert.match(html,/aria-label="เปรียบเทียบโหลดกับกำลัง Web tier"/);assert.doesNotMatch(html,/ไม่ใช่เครื่องล่ม/);}
  assert.match(scalingScene(c),/รอผลการทดลอง/);
 }
});
