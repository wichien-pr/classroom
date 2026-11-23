import test from 'node:test';
import assert from 'node:assert/strict';
import {queueTopics} from '../src/queue-presentation.js';
import {queueSequences} from '../src/queue-flow.js';
import {queueLayout} from '../src/message-queue-view.js';
test('LAB10 ends with one cohesive submission experiment',()=>{
 assert.equal(queueTopics.length,1);
 assert.equal(queueLayout.steps.length,queueTopics.length);
 assert.equal(queueTopics.at(-1)[0],'ส่งรูปไว้ แล้วให้ Worker ทำต่อ');
 assert.equal(queueSequences.length,1);
});
