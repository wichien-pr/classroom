import test from 'node:test';
import assert from 'node:assert/strict';
import * as presets from '../src/scaling-presets.js';
import {evaluateScaling,scalingNotes} from '../src/scaling.js';
test('guided instructions describe presets rather than removed settings',()=>{
 assert.ok(scalingNotes().includes('เปรียบเทียบสถานการณ์แต่ละหัวข้อ'));
 assert.ok(!scalingNotes().includes('ขอบเขต UI'));
});
test('LAB03 prepares five independent scenarios preserving routing, outage and capacity',()=>{
 assert.equal(typeof presets.scalingPreset,'function');
 const configs=Array.from({length:5},(_,i)=>presets.scalingPreset(i));
 assert.deepEqual(configs.map(evaluateScaling),[
  {healthy:1,routed:1,capacity:1,status:'overloaded'},
  {healthy:1,routed:1,capacity:3,status:'ready'},
  {healthy:2,routed:0,capacity:0,status:'offline'},
  {healthy:2,routed:2,capacity:6,status:'ready'},
  {healthy:2,routed:2,capacity:6,status:'overloaded'},
 ]);
 configs[0].power=4;assert.equal(presets.scalingPreset(0).power,1);
});
