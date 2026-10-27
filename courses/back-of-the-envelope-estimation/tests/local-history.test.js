import test from 'node:test';
import assert from 'node:assert/strict';
const history=await import('../src/local-history.js').catch(()=>({}));
test('retired storage history survives saving but never qualifies Tips or the active total',()=>{
 assert.equal(typeof history.restoreLocalHistory,'function');
 const saved=history.restoreLocalHistory(['estimate-storage','estimate-tips','estimate-units','unknown','estimate-storage']);
 assert.deepEqual(saved,['estimate-storage','estimate-tips','estimate-units']);
 assert.deepEqual(history.activeLocalHistory(saved),['estimate-tips','estimate-units']);
 assert.deepEqual(history.activeLocalHistory(history.restoreLocalHistory(['estimate-storage'])),[]);
 assert.deepEqual(history.restoreLocalHistory(null),[]);
});
