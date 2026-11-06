import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as presets from '../src/flow-presets.js';
import {flowStep} from '../src/models.js';
test('every topic independently executes original transitions from cold lookup to its boundary',()=>{
 assert.equal(typeof presets.runFlowTopic,'function');
 for(const [topic,end] of [2,3,6,6].entries()){
  const preset=presets.flowPreset(topic);
  assert.equal(preset.step,0);
  assert.equal(preset.client,topic===3?'mobile':'browser');
  const result=presets.runFlowTopic(topic);
  assert.equal(result.step,end);
  assert.equal(result.frames.length,end);
  let step=0;for(const frame of result.frames){step=flowStep(step);assert.equal(frame.step,step);}
  assert.equal(result.frames.at(-1).view.format,topic===3?'JSON':'HTML');
 }
});
