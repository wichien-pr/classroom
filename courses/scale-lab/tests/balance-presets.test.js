import test from 'node:test';
import assert from 'node:assert/strict';
import * as balance from '../src/balance.js';
test('LAB04 independent presets preserve round robin, failover, no targets and registered replacement',()=>{
 assert.equal(typeof balance.balancePreset,'function');
 const sequences=[[0,1,0],[1,1,1],[null,null,null],[1,2,1]];
 for(let topic=0;topic<4;topic++){
  const s=balance.balancePreset(topic);
  assert.deepEqual(Array.from({length:3},()=>balance.routeBalance(s,s.up)),sequences[topic]);
  assert.equal(s.counts.reduce((a,b)=>a+b,0),topic===2?0:3);
  assert.deepEqual(balance.balancePreset(topic).counts,[0,0,0]);
 }
 assert.throws(()=>balance.balancePreset(4));
});
