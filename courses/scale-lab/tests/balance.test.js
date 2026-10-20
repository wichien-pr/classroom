import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {lessons} from '../src/lessons.js';
test('LAB04 source-aligned lesson and private bank retain durable identities',()=>{
 const l=lessons.find(l=>l.kind==='balance');
 assert.match(l.explain,/DNS/);assert.match(l.explain,/private IP/);assert.match(l.try,/Server 3/);
 const q=JSON.parse(readFileSync(new URL('../assessment.json',import.meta.url))).questions.filter(q=>q.lesson_id==='balance');
 assert.deepEqual(q.map(q=>q.id),['balance-7','balance-8']);
 assert.match(q[0].prompt,/DNS/);assert.match(q[1].prompt,/Server 1/);
 assert.deepEqual(q.map(q=>q.answer),['c','b']);
});
test('LAB04 distributes requests to healthy registered servers and counts only deliveries',async()=>{
 assert.ok(existsSync(new URL('../src/balance.js',import.meta.url)),'load balancer model exists');
 const {balanceInitial,routeBalance}=await import('../src/balance.js');
 const s=balanceInitial();
 assert.equal(routeBalance(s,[true,true,false]),0);
 assert.equal(routeBalance(s,[true,true,false]),1);
 assert.equal(routeBalance(s,[false,true,false]),1);
 assert.deepEqual(s.counts,[1,2,0]);
 assert.equal(routeBalance(s,[false,false,false]),null);
 assert.deepEqual(s.counts,[1,2,0]);
 assert.equal(routeBalance(s,[false,false,true]),2);
 assert.deepEqual(s.counts,[1,2,1]);
 assert.deepEqual(balanceInitial().counts,[0,0,0]);
});
