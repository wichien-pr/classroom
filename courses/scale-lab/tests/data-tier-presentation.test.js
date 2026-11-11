import test from 'node:test';
import assert from 'node:assert/strict';
import {tierPages,tierFrames,createTierFlow} from '../src/data-tier-flow.js';
const tick=()=>new Promise(r=>setImmediate(r));
test('all three pages are independent snapshots with stable page and internal indices',()=>{
 for(let i=0;i<tierPages.length;i++){
  const frames=tierFrames(i);assert.notEqual(frames[0].config,tierFrames(i)[0].config);
  assert.deepEqual(frames.map(f=>[f.index,f.phase]),frames.map((_,phase)=>[i,phase]));
 }
 assert.throws(()=>tierFrames(3));
});
test('each failed original evaluation retains its exact snapshot before explicit continuation',async()=>{
 for(const index of [0,1,2])for(let boundary=0;boundary<tierFrames(index).length;boundary++){
  const shown=[],recorded=[];let fail=true;
  const flow=createTierFlow({show:async f=>shown.push(f),record:async(a,retry)=>{recorded.push([a,retry]);if(fail&&shown.length===boundary+1){fail=false;throw Error('lost response');}}});
  await assert.rejects(flow.run(index));const snapshot=structuredClone(shown.at(-1));
  await flow.run(index);assert.deepEqual(shown[boundary],snapshot);
  assert.equal(shown.length,tierFrames(index).length);
  assert.equal(recorded.filter(([,retry])=>retry).length,1);
  assert.ok(recorded.every(([a])=>a==='evaluate-data-tier'));
  const before=recorded.length;await flow.play(index);assert.equal(recorded.length,before);
 }
});
test('cancel at every save boundary prevents all later evaluations and keeps selected page',async()=>{
 for(const index of [0,1])for(let boundary=0;boundary<tierFrames(index).length;boundary++){
  let release;const seen=[],records=[];
  const flow=createTierFlow({show:async f=>seen.push(f),record:()=>{records.push(1);if(records.length===boundary+1)return new Promise(r=>release=r);}});
  const run=flow.run(index);await tick();flow.cancel();await flow.play(2);release();await run;
  assert.equal(records.length,boundary+1);assert.equal(seen.at(-1).index,2);assert.equal(flow.busy,false);
 }
});
test('pause during save holds the next internal phase and cancellation releases paused work',async()=>{
 let release;const seen=[];
 const flow=createTierFlow({show:async f=>seen.push(f),record:()=>new Promise(r=>release=r)});
 const run=flow.run(0);await tick();flow.setPaused(true);release();await tick();
 assert.equal(seen.length,1);flow.setPaused(false);await tick();assert.equal(seen.length,2);
 flow.setPaused(true);release();await tick();flow.cancel();await run;assert.equal(seen.length,2);
});
