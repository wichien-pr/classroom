import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLoggingStory,loggingPages} from '../src/logging-story.js';
test('only one outer experiment; invalid page indices do no work',async()=>{let calls=0;const flow=createLoggingStory({show:async()=>calls++,record:async()=>calls++});assert.equal(loggingPages.length,1);for(const i of [-1,1,2,NaN])await flow.run(i);assert.equal(calls,0);});
test('duplicate run while animation held is ignored',async()=>{let release;const gate=new Promise(r=>release=r);let seen=0;const flow=createLoggingStory({show:async()=>{seen++;await gate;},record:async()=>{}});const pending=flow.run();await flow.run();assert.equal(seen,1);release();await pending;assert.equal(seen,2);});
test('replay unavailable before completion and after cancel',async()=>{let seen=0;const flow=createLoggingStory({show:async()=>seen++,record:async()=>{}});await flow.replay();assert.equal(seen,0);await flow.run();flow.cancel();await flow.replay();assert.equal(seen,2);});
