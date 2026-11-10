import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loggingScene} from '../src/logging-presentation.js';
import {loggingInitial} from '../src/logging.js';
import {loggingPages,loggingStageFrames,createLoggingStory} from '../src/logging-story.js';
test('initial and reset scene expose failed-test context without removed presentation pages',()=>{
 const html=loggingScene(loggingInitial(),null);
 assert.match(html,/data-stage="test" data-status="failed"/);
 assert.match(html,/1 \/ 3 · Tests ไม่ผ่าน/);
 assert.match(html,/🔒 ปิดทางปล่อย/);
 assert.equal(loggingPages[0].stages[0],2);
});
test('first page privately prepares Build then records only the failed Test',async()=>{
 const seen=[],actions=[];
 await createLoggingStory({show:async f=>seen.push(f),record:async a=>actions.push(a)}).run(0);
 assert.deepEqual(seen,[loggingStageFrames()[2]]);
 assert.equal(seen[0].before.stage,'built');assert.equal(seen[0].state.stage,'blocked');
 assert.deepEqual(actions,['run-pipeline']);
});
