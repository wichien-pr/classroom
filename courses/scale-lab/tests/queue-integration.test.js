import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('LAB10 mounts its awaited guided queue projection and cancels on remount',()=>{
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 assert.match(main,/import \{queueScene,bindQueuePlayback,stopQueuePlayback\}/);
 assert.match(main,/l.kind==='message-queue'\?prepareQueueTopic/);
 assert.match(main,/queueAnimation=bindQueuePlayback/);
 assert.match(main,/cancelWebFlow\(\);cancelDcFlow\(\);cancelQueueFlow\(\)/);
});
