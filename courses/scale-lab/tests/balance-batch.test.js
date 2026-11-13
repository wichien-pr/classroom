import test from 'node:test';
import assert from 'node:assert/strict';
const flowModule=await import('../src/balance-flow.js').catch(()=>({}));
test('pause during a held save gates the next mutation; cancel releases it',async()=>{
 let release,arrive;const held=new Promise(r=>release=r),ready=new Promise(r=>arrive=r),frames=[];
 const flow=flowModule.createBalanceFlow({show:async f=>frames.push(f),record:async()=>{arrive();await held;}});
 const running=flow.run(0);await ready;flow.pause(true);release();await new Promise(r=>setTimeout(r,10));
 assert.equal(frames.length,1);flow.cancel();await running;assert.equal(frames.length,1);
});
test('failed save retries retained result without a duplicate mutation',async()=>{
 const frames=[],records=[];let fail=true;
 const flow=flowModule.createBalanceFlow({show:async f=>frames.push(f),record:async(a,retry)=>{records.push([a,retry]);if(fail){fail=false;throw Error('lost response');}}});
 await assert.rejects(flow.run(0),/lost response/);assert.equal(frames.length,1);
 await flow.run(0);assert.equal(frames.length,6);assert.deepEqual(frames.at(-1).state.counts,[3,3,0]);assert.equal(records.length,7);assert.deepEqual(records[1],['route',true]);
});
test('failed save while paused releases the pause for explicit retry',async()=>{
 let release,arrive;const held=new Promise(r=>release=r),ready=new Promise(r=>arrive=r);let fail=true;
 const flow=flowModule.createBalanceFlow({show:async()=>{},record:async()=>{if(fail){arrive();await held;fail=false;throw Error('lost');}}});
 const running=flow.run(0);await ready;flow.pause(true);release();await assert.rejects(running,/lost/);
 assert.equal(flow.paused,false);await flow.run(0);assert.equal(flow.completed,true);
});
test('batch controller exists',()=>assert.equal(typeof flowModule.createBalanceFlow,'function'));
test('six actual routes distribute independently in all four presets',async()=>{
 for(const [topic,counts] of [[0,[3,3,0]],[1,[0,6,0]],[2,[0,0,0]],[3,[0,3,3]]]){
  const frames=[],records=[];
  const flow=flowModule.createBalanceFlow({show:async f=>frames.push(f),record:async(...args)=>records.push(args)});
  await flow.run(topic);
  assert.equal(frames.length,6);assert.deepEqual(frames.at(-1).state.counts,counts);
  assert.deepEqual(records,Array.from({length:6},()=>['route',false]));
  assert.deepEqual(frames.map(f=>f.index),[0,1,2,3,4,5]);
  await flow.replay();assert.equal(frames.length,12);assert.equal(records.length,6);
 }
});
