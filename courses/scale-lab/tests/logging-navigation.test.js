import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loggingStageFrames,createLoggingStory} from '../src/logging-story.js';
test('single experiment snapshots are isolated and deterministic',async()=>{
 const frames=loggingStageFrames(),actual=[];await createLoggingStory({show:async f=>actual.push(f),record:async()=>{}}).run();assert.deepEqual(frames,actual);frames[1].state.stage='changed';assert.equal(loggingStageFrames()[1].state.stage,'blocked');
});
