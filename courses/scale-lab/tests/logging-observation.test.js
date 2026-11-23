import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loggingStageFrames} from '../src/logging-story.js';
import {loggingScene} from '../src/logging-presentation.js';
test('logs and metrics remain reading only, absent from every experiment frame',()=>{for(const fixed of [false,true])for(const f of loggingStageFrames(fixed)){assert.equal(f.state.logs,null);assert.equal(f.state.metrics,null);assert.equal(f.action,'run-pipeline');assert.doesNotMatch(loggingScene(f.state,f),/DB_TIMEOUT|900 ms|data-metric|logging-evidence/);}});
test('retained candidate outcome does not turn failed tests into a deployment',()=>{const a=loggingStageFrames(false),b=loggingStageFrames(true);assert.equal(a.at(-1).state.stage,'blocked');assert.equal(b.at(-1).state.stage,'deployed');assert.equal(a.some(f=>f.key==='deployed'),false);});
