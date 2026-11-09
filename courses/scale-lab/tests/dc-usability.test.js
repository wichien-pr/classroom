import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as presentation from '../src/dc-presentation.js';
const {dcScene}=presentation;
import {dcPreset} from '../src/dc-flow.js';
import {evaluateDataCenters} from '../src/data-centers.js';
test('six concise outcomes retain each distinct reason and no false delivery claim',()=>{
 assert.equal(typeof presentation.dcOutcome,'function','concise model-backed outcome is available');
 const dcOutcome=presentation.dcOutcome;
 const expected=['60 / West 40','ล่ม 40','DNS เดิม','60 → 100','ขาดข้อมูล 40','เกินกำลัง 40'];
 expected.forEach((text,i)=>{const state=dcPreset(i),frame={state,result:evaluateDataCenters(state),topic:i};assert.ok(dcOutcome(frame).includes(text));assert.ok(dcOutcome(frame).length<150);const html=dcScene(state,frame);assert.doesNotMatch(html,/dc-details|เหตุผลและรายละเอียดทางเทคนิค|dc-route/);assert.match(html,/<figcaption>ภาพแสดงการเลือกเส้นทาง/);assert.match(html,/id="dc-result"/);});
});
