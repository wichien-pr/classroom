import test from 'node:test';
import assert from 'node:assert/strict';
import {tierPages,tierFrames,createTierFlow} from '../src/data-tier-flow.js';
test('two pages retain four guided evaluations and historical source indices',()=>{
 assert.equal(tierPages.length,2);
 assert.deepEqual(tierPages.map(p=>p.sourceTopics),[[0,1],[2]]);
 assert.deepEqual(tierPages.flatMap(p=>p.sourceTopics),[0,1,2]);
 const frames=tierPages.map((_,i)=>tierFrames(i));
 assert.deepEqual(frames.map(fs=>fs.map(f=>f.result.status)),[['overloaded','ready','unavailable'],['ready']]);
 assert.equal(frames[0][1].result.capacity,32);
 assert.deepEqual(frames[1][0].result.rows.map(r=>r.length),[4,4,4,4]);
 assert.throws(()=>tierFrames(2),/Unknown database page/);
 assert.ok(frames.flat().every(f=>f.caption&&f.situation&&f.takeaway));
});
