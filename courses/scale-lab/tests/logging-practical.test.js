import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loggingDecision} from '../src/logging-practical.js';
import {inspectLogs,inspectMetrics} from '../src/logging.js';
test('incident evidence distinguishes relevant event from unsupported root cause',()=>{
 const logs=inspectLogs('all','error');
 assert.match(loggingDecision(0,'web-2',{logs}),/DB_TIMEOUT/);
 assert.match(loggingDecision(0,'worker-1',{logs}),/ภาพ/);
 assert.match(loggingDecision(0,'root',{logs}),/ยังยืนยัน/);
 assert.equal(loggingDecision(0,'web-2',null),'ค้นหรืออ่านหลักฐานก่อนเลือกข้อสรุป');
});
test('metric interpretations retain independent scope and never establish root cause',()=>{
 for(const group of ['host','tier','business']){
  const state={metrics:inspectMetrics(group)},before=structuredClone(state);
  assert.match(loggingDecision(1,'proof',state),/ยังสรุป/);
  assert.match(loggingDecision(1,'investigate',state),{host:/Web 1.*Web 2/,tier:/95%.*900 ms/,business:/D−7.*5 นาที/}[group]);
  assert.deepEqual(state,before);
 }
});
test('pipeline interpretation never repairs incident evidence or guarantees no bugs',()=>{
 assert.match(loggingDecision(2,'follow',{stage:'blocked'}),/หยุด Version นี้/);
 assert.match(loggingDecision(2,'follow',{stage:'deployed'}),/ไม่ได้วัดผลหลังแก้ไข/);
 assert.match(loggingDecision(2,'safe',{stage:'deployed'}),/ไม่รับประกัน.*ไม่ได้แก้ logs/);
});
