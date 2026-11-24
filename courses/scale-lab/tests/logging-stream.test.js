import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as stream from '../src/logging-stream.js';
import {loggingLayout} from '../src/logging-view.js';
import {loggingTopics} from '../src/logging-presentation.js';
test('teaching introduces the added unscored observation without removing pipeline',()=>{
 assert.equal(loggingTopics.length,2);assert.equal(loggingLayout.steps.length,2);
 assert.match(loggingLayout.intro,/Logs.*Metrics/);
 assert.doesNotMatch(loggingLayout.note,/อยู่ในเนื้อหาอ่าน ไม่ใช่ขั้นทดลอง/);
 assert.match(loggingLayout.note,/ไม่บันทึกกิจกรรม/);
});
test('each simulated second aggregates exactly its request logs and varies over time',()=>{
 assert.equal(typeof stream.loggingStreamSample,'function');
 const samples=Array.from({length:20},(_,i)=>stream.loggingStreamSample(i+1));
 for(const s of samples){
  assert.equal(s.rate,s.logs.length);
  assert.equal(s.latency,Math.round(s.logs.reduce((sum,l)=>sum+l.ms,0)/s.logs.length));
  assert.equal(s.errors,Math.round(s.logs.filter(l=>l.status===500).length/s.logs.length*100));
  assert.ok(s.logs.every(l=>l.second===s.second&&l.path==='/orders'&&l.id));
 }
 for(const key of ['rate','latency','errors'])assert.ok(new Set(samples.map(s=>s[key])).size>1,key);
 assert.deepEqual(stream.loggingStreamSample(1),samples[0]);
});
