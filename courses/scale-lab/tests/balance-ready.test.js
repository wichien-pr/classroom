import {test} from 'node:test';
import assert from 'node:assert/strict';
import {balancePreset} from '../src/balance.js';
import {balanceScene} from '../src/balance-view.js';

test('backend readiness uses preset health/registration, not delivered counts',()=>{
 for(let topic=0;topic<4;topic++){
  const state=balancePreset(topic);
  for(const counts of [[0,0,0],[9,7,6]]){
   state.counts=counts;
   const html=balanceScene(state);
   const nodes=[...html.matchAll(/class="balance-node ([^"]*)" data-node="server-(\d)"/g)];
   assert.equal(nodes.length,3);
   for(const [,classes,index] of nodes){
    const i=Number(index);
    assert.equal(classes.includes('balance-ready'),state.up[i],`topic ${topic+1} server ${i} ready`);
    assert.equal(classes.includes('balance-offline'),!state.up[i]&&i!==2);
   }
   assert.doesNotMatch(html,/class="balance-node balance-(?:client|router) balance-ready/);
  }
 }
});
