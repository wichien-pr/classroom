import test from 'node:test';
import assert from 'node:assert/strict';
import {createQueueFlow} from '../src/queue-flow.js';
for(let boundary=0;boundary<4;boundary++){
 test(`queue save ${boundary} retries exact frame without mutation`,async()=>{
  const frames=[],calls=[];let fail=true;
  const flow=createQueueFlow({show:async f=>frames.push(f),record:async(a,retry)=>{calls.push([a,retry]);if(frames.length===boundary+1&&fail){fail=false;throw Error('lost');}}});
  await assert.rejects(flow.run(0),/lost/);const captured=structuredClone(flow.frames);
  await flow.run(0);assert.deepEqual(flow.frames.slice(0,boundary+1),captured);assert.equal(frames.length,4);assert.equal(calls.filter(c=>c[1]).length,1);assert.equal(flow.frames.at(-1).state.completed.length,3);
 });
 test(`queue cancel at save ${boundary} cannot start later jobs`,async()=>{
  let release;const frames=[];
  const flow=createQueueFlow({show:async f=>frames.push(f),record:async()=>{if(frames.length===boundary+1)await new Promise(r=>release=r);}});
  const running=flow.run(0);while(!release)await new Promise(r=>setImmediate(r));flow.cancel();release();await running;
  assert.equal(frames.length,boundary+1);assert.equal(flow.completed,false);assert.deepEqual(flow.frames,[]);
 });
}
