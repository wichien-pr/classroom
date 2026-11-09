import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as view from '../src/dc-presentation.js';
import {dcPreset} from '../src/dc-flow.js';
import {evaluateDataCenters} from '../src/data-centers.js';
test('capacity projection partitions assigned requests without implying success',()=>{
 assert.equal(typeof view.dcCapacity,'function');
 for(const capacity of [0,1,59,60,99,100]){
  const state={...dcPreset(5),eastCapacity:capacity};const frame={state,result:evaluateDataCenters(state),topic:5};
  assert.deepEqual(view.dcCapacity(frame),{assigned:100,capacity,within:capacity,excess:100-capacity});
 }
 const state={...dcPreset(0),eastCapacity:80};
 assert.deepEqual(view.dcCapacity({state,result:evaluateDataCenters(state)}),{assigned:60,capacity:80,within:60,excess:0});
 const noOverload=view.dcScene(state,{state,result:evaluateDataCenters(state),topic:5});
 assert.match(noOverload,/ไม่เกินกำลัง/);assert.match(noOverload,/width:75%/);
 const empty={...state,eastShare:0,eastCapacity:0};
 assert.deepEqual(view.dcCapacity({state:empty,result:evaluateDataCenters(empty)}),{assigned:0,capacity:0,within:0,excess:0});
 assert.doesNotMatch(view.dcScene(empty,{state:empty,result:evaluateDataCenters(empty),topic:5}),/NaN|Infinity/);
});
