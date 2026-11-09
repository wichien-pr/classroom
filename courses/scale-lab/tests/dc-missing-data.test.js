import test from 'node:test';
import assert from 'node:assert/strict';
import {dcPreset} from '../src/dc-flow.js';
import {evaluateDataCenters} from '../src/data-centers.js';
import {dcScene} from '../src/dc-presentation.js';
test('missing data groups reflect evaluated counts, not fixed 60/40 or successful reads',()=>{
 for(const share of [0,25,60,100]){
  const state={...dcPreset(4),eastShare:share},result=evaluateDataCenters(state),frame={state,result,topic:4},before=structuredClone(frame),html=dcScene(state,frame);
  assert.match(html,new RegExp(`data-data-count="${result.missingData}"`));
  assert.match(html,new RegExp(`ข้อมูลเดิม ${share} ราย`));
  assert.match(html,/เครื่องพร้อม/);assert.match(html,/อ่านไม่ได้/);
  assert.deepEqual(frame,before);
 }
 assert.doesNotMatch(dcScene(dcPreset(0),null),/dc-data-panel/);
});
