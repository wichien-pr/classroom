import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons} from '../src/lessons.js';
test('LAB02 uses one historical dataset for both comparison controls with unambiguous numeric choices',()=>{
 const l=lessons.find(l=>l.id==='estimate-latency');
 assert.equal(l.title,'Latency ที่โปรแกรมเมอร์ควรรู้');
 for(const key of ['first','second']){
  const options=l.fields.find(f=>f.key===key).options;
  assert.deepEqual(options.map(o=>o[0]),[.5,5,7,100,10000,20000,250000,500000,10000000,30000000,150000000]);
  assert.equal(new Set(options.map(o=>o[0])).size,options.length);
 }
 assert.match(l.concept,/2010/);assert.match(l.caveat,/SSD/);
 assert.deepEqual(l.answers.map(a=>a.correct),[false,true]);
});
const reference=await import('../src/latency-reference.js').catch(()=>({}));
test('latency reference preserves all 13 operations and nanosecond values from the 2010 table',()=>{
 assert.ok(Array.isArray(reference.latencyReference),'missing latency reference table');
 assert.deepEqual(reference.latencyReference.map(r=>[r.id,r.ns]),[
  ['l1',.5],['branch',5],['l2',7],['mutex',100],['memory',100],['compress',10000],['send',20000],['memory-read',250000],['datacenter',500000],['disk-seek',10000000],['network-read',10000000],['disk-read',30000000],['intercontinental',150000000],
 ]);
 assert.equal(reference.latencyReference.length,13);
});
