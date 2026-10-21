import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {lessons} from '../src/lessons.js';
import {readLocalProgress,mergeLocalProgress,encodeLocalProgress} from '../src/local-progress.js';
const model=await import('../src/database-scaling.js').catch(()=>({}));
test('vertical capacity grows with power but a failed single machine remains unavailable',()=>{
 assert.equal(typeof model.evaluateDataTier,'function');
 const c=model.dataTierInitial();assert.equal(model.evaluateDataTier(c).status,'overloaded');
 c.power=4;assert.equal(model.evaluateDataTier(c).status,'ready');assert.equal(model.evaluateDataTier(c).capacity,32);
 c.up=false;assert.equal(model.evaluateDataTier(c).status,'unavailable');
 for(const power of [0,5,NaN,1.5])assert.throws(()=>model.evaluateDataTier({...c,power}));
});
test('sharding separates row distribution from hot-key request distribution',()=>{
 const c={...model.dataTierInitial(),mode:'horizontal'};
 const r=model.evaluateDataTier(c);assert.deepEqual(r.rows,[[0,4,8,12],[1,5,9,13],[2,6,10,14],[3,7,11,15]]);assert.deepEqual(r.loads,[4,4,4,4]);assert.equal(r.target,3);assert.equal(r.status,'ready');
 const hot=model.evaluateDataTier({...c,traffic:'hotspot'});assert.deepEqual(hot.rows,r.rows);assert.deepEqual(hot.loads,[14,1,1,0]);assert.equal(hot.status,'overloaded');assert.equal(hot.total,16);
 const bad=model.evaluateDataTier({...c,key:'country'});assert.equal(bad.rows[0].length,16);assert.equal(bad.status,'overloaded');
 assert.equal(model.evaluateDataTier({...c,up:false}).status,'unavailable');
 for(const extra of [{shards:3},{user:-1},{user:1.5},{user:1000001},{key:'bad'},{mode:'bad'},{traffic:'bad'}])assert.throws(()=>model.evaluateDataTier({...c,...extra}));
});
test('resharding reports changed destinations without moving the baseline dataset',()=>{
 const c={...model.dataTierInitial(),mode:'horizontal'},before=structuredClone(c);
 assert.equal(model.evaluateDataTier(c).moves.length,0);
 const r=model.evaluateDataTier({...c,shards:8});assert.deepEqual(r.moves.map(x=>x.id),[4,5,6,7,12,13,14,15]);assert.deepEqual(r.moves[0],{id:4,from:0,to:4});
 assert.deepEqual(c,before);assert.equal(model.evaluateDataTier(c).moves.length,0);
 assert.equal(model.evaluateDataTier({...c,key:'country'}).moves.length,12);
});
test('LAB12 adds a fresh database-scaling identity without restoring retired Shard progress',()=>{
 const m=JSON.parse(readFileSync(new URL('../course.json',import.meta.url))),b=JSON.parse(readFileSync(new URL('../assessment.json',import.meta.url)));
 assert.equal(lessons.length,12);assert.equal(lessons[11].kind,'database-scaling');assert.deepEqual(m.lessons,lessons.map(x=>x.kind));
 assert.deepEqual(m.participation['database-scaling'],{'database-scaling':['evaluate-data-tier'],'check-your-thinking':['quiz-answer-a','quiz-answer-b']});
 assert.equal(m.participation.shard,undefined);assert.equal(b.questions.filter(q=>q.lesson_id==='database-scaling').length,2);
 const old=readLocalProgress(null,'[12]');assert.deepEqual(old,['shard']);assert.equal(old.includes('database-scaling'),false);
 assert.deepEqual(readLocalProgress(encodeLocalProgress(mergeLocalProgress(old,['database-scaling'])),null),['shard','database-scaling']);
 assert.equal(Object.values(m.participation).flatMap(s=>Object.values(s).flat()).length,44);
});
