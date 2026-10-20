import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as local from '../src/local-progress.js';
test('adding current completion retains retired Session without granting Cache',()=>{
 assert.equal(typeof local.mergeLocalProgress,'function');
 const old=local.readLocalProgress(null,'[5,6,12]');
 assert.deepEqual(local.mergeLocalProgress(old,['flow']),['session','replica','shard','flow']);
 assert.deepEqual(local.mergeLocalProgress(old,['cache','cache']),['session','replica','shard','cache']);
});
