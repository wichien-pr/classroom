import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dcScene,dcOutcome,dcRoutes,dcTopics} from '../src/dc-presentation.js';
import {dcPreset} from '../src/dc-flow.js';
import {evaluateDataCenters} from '../src/data-centers.js';
import {dataCentersLayout} from '../src/data-centers-view.js';
test('experiment ends at capacity with six topics and no release example',()=>{
 assert.equal(dcTopics.length,6);
 assert.equal(dataCentersLayout.steps.length,6);
 assert.equal(dcTopics.at(-1)[0],'ศูนย์เดียวรับไหวไหม');
 assert.throws(()=>dcPreset(6),/Unknown data-center topic/);
 for(let topic=0;topic<6;topic++){
  const state=dcPreset(topic),frame={state,result:evaluateDataCenters(state),topic};
  for(const f of [null,frame])assert.doesNotMatch(dcScene(state,f),/dc-release|fullName|Mali|ตรวจรุ่นบริการด้วย/);
 }
});
test('underlying release mismatch capability and honest warning remain',()=>{
 const state={...dcPreset(3),sameRelease:false},result=evaluateDataCenters(state),frame={state,result};
 assert.deepEqual(result,{routes:[100,0],unavailable:0,moved:40,missingData:0,overloaded:0,releaseMismatch:true});
 assert.equal(dcRoutes(frame).length,1);assert.equal(dcRoutes(frame)[0][1],'east');
 assert.match(dcOutcome(frame),/ไม่ได้แปลว่าทุกคำขอล้มเหลว/);
});
