import test from 'node:test';
import assert from 'node:assert/strict';
import {queueTopics} from '../src/queue-presentation.js';
import {queueSequences} from '../src/queue-flow.js';
import {queueLayout} from '../src/message-queue-view.js';
test('LAB10 ends with five independent topics and no drain-only sequence',()=>{
 assert.equal(queueTopics.length,5);
 assert.equal(queueLayout.steps.length,queueTopics.length);
 assert.equal(queueTopics.at(-1)[0],'เพิ่ม Workers ลดงานค้าง');
 assert.equal(queueSequences.length,5);
});
