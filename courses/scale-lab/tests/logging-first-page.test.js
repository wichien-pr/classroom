import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loggingScene} from '../src/logging-presentation.js';
import {loggingInitial} from '../src/logging.js';
import {loggingPages,loggingStageFrames,createLoggingStory} from '../src/logging-story.js';
test('initial and reset scene waits for actual Build without invented failed test',()=>{
 const html=loggingScene(loggingInitial());assert.match(html,/data-stage="test" data-status="waiting"/);assert.match(html,/logging-candidate/);assert.equal(loggingPages.length,1);
});
test('default candidate actually builds and blocks without inspecting logs or metrics',async()=>{
 const seen=[],actions=[];await createLoggingStory({show:async f=>seen.push(f),record:async a=>actions.push(a)}).run();
 assert.deepEqual(seen,loggingStageFrames());assert.equal(seen[0].before.stage,'ready');assert.equal(seen[1].state.stage,'blocked');assert.deepEqual(actions,['run-pipeline','run-pipeline']);
});
