import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons} from '../src/lessons.js';
import * as local from '../src/local-progress.js';
test('LAB05 is stable replica and LAB06 is stable session',()=>{assert.equal(lessons[4].kind,'replica');assert.equal(lessons[5].kind,'session');});
test('legacy positions map through the old curriculum, never the new order',()=>{
 assert.deepEqual(local.readLocalProgress(null,'[5,6,1,5,0,13,"5"]'),['session','replica','flow']);
 assert.deepEqual(local.readLocalProgress(null,'[5]'),['session']);
 assert.deepEqual(local.readLocalProgress(null,'[6]'),['replica']);
});
test('versioned stable storage wins; corrupt data fails closed',()=>{
 assert.deepEqual(local.readLocalProgress('{"version":2,"completed":["replica","bad","replica"]}','[5]'),['replica']);
 assert.deepEqual(local.readLocalProgress('{broken','[5]'),[]);
 assert.deepEqual(local.readLocalProgress(null,'{broken'),[]);
 assert.deepEqual(JSON.parse(local.encodeLocalProgress(['session','replica'])),{version:2,completed:['session','replica']});
});
