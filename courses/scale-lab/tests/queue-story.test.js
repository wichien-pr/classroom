import test from 'node:test';
import assert from 'node:assert/strict';
import {createQueueFlow,queuePreset,queueSequences} from '../src/queue-flow.js';
import {queueScene,queueTopics} from '../src/queue-presentation.js';
import {queueLayout} from '../src/message-queue-view.js';
test('one photo submission survives a stopped worker and drains without its producer',async()=>{
 assert.equal(queueTopics.length,1);assert.equal(queueLayout.steps.length,1);assert.equal(queueSequences.length,1);
 assert.equal(queuePreset(0).consumerUp,false);
 assert.match(queueScene(queuePreset(0),null,0),/เมย์/);
 assert.match(queueScene(queuePreset(0),null,0),/queue-story/);
 const shown=[],saved=[];const flow=createQueueFlow({show:async f=>shown.push(f),record:async a=>saved.push(a)});
 await flow.run(0);
 assert.deepEqual(shown.map(f=>[f.state.jobs.length,f.state.completed.length]),[[3,0],[2,1],[1,2],[0,3]]);
 assert.equal(shown[0].state.consumerUp,false);
 assert.ok(shown.slice(1).every(f=>!f.state.producerUp&&f.state.consumerUp));
 assert.deepEqual(shown.at(-1).state.completed.map(j=>j.id),[1,2,3]);
 assert.deepEqual(saved,['enqueue-jobs','process-jobs','process-jobs','process-jobs']);
 await flow.replay();assert.equal(saved.length,4);
});
