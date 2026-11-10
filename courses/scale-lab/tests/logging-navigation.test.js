import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as story from '../src/logging-story.js';
test('navigation snapshots are isolated, deterministic and match the explicit story',async()=>{
 assert.equal(typeof story.loggingStageFrames,'function');
 const frames=story.loggingStageFrames(), actual=[];
 const flow=story.createLoggingStory({show:async f=>actual.push(f),record:async()=>{}});
 for(let index=0;index<3;index++)await flow.run(index);
 assert.deepEqual(frames.slice(2),actual);assert.equal(frames.length,12);
 frames[2].state.stage='changed';assert.equal(story.loggingStageFrames()[2].state.stage,'blocked');
});
