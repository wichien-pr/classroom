import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';

test('LAB 02 final assessment follows Database material and retains stable identifiers',()=>{
 const bank=JSON.parse(readFileSync(new URL('../assessment.json',import.meta.url),'utf8'));
 const questions=bank.questions.filter(q=>q.lesson_id==='workload');
 assert.deepEqual(questions.map(q=>q.id),['workload-3','workload-4']);
 assert.match(questions[0].prompt,/Web tier/);
 assert.match(questions[1].prompt,/NoSQL/);
});

test('database selection covers four NoSQL families without absolute guarantees',async()=>{
 const {evaluateDatabase}=await import('../src/database.js');
 for(const [scenario,engine] of [['orders','sql'],['session','key-value'],['catalog','document'],['connections','graph'],['events','column']]) {
  const r=evaluateDatabase({layout:'split',web:1,data:2,available:true,scenario,engine});
  assert.equal(r.fit,true,scenario);assert.ok(r.reason.length>30);assert.match(r.caveat,/ไม่|ต้อง/);
 }
 assert.equal(evaluateDatabase({layout:'split',web:1,data:1,available:true,scenario:'orders',engine:'key-value'}).fit,false);
 assert.throws(()=>evaluateDatabase({layout:'split',web:1,data:1,available:true,scenario:'unknown',engine:'sql'}));
});

test('separate tiers scale independently and DB outage still blocks data requests',async()=>{
 assert.ok(existsSync(new URL('../src/database.js',import.meta.url)), 'Database lab model must exist');
 const {evaluateDatabase}=await import('../src/database.js');
 const base={layout:'split',web:2,data:1,available:true,scenario:'orders',engine:'sql'};
 const r=evaluateDatabase(base);
 assert.equal(r.web,2);assert.equal(r.data,1);assert.equal(r.ready,true);assert.equal(r.fit,true);
 assert.equal(evaluateDatabase({...base,web:4}).data,1);
 assert.equal(evaluateDatabase({...base,available:false}).ready,false);
 const shared=evaluateDatabase({...base,layout:'single'});
 assert.equal(shared.independent,false);assert.equal(shared.data,2);
 assert.throws(()=>evaluateDatabase({...base,web:0}));
});
