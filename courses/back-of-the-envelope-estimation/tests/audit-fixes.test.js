import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {latency} from '../src/models.js';
import {lessons} from '../src/lessons.js';
import {renderTrafficReference} from '../src/traffic-reference.js';
test('traffic uses unique-user cardinality and offers an unscored media prediction',()=>{
 assert.match(lessons.find(l=>l.id==='estimate-traffic').fields[0].label,/ผู้ใช้ไม่ซ้ำ/);
 assert.doesNotMatch(source('main.js'),/fmt\(r.dau\)\} คน\/วัน/);
 const html=renderTrafficReference();
 assert.match(html,/storage-prediction/);assert.match(html,/ไม่คิดคะแนน/);
 assert.match(html,/60 TB\/วัน/);assert.match(html,/109.5 PB/);
});
test('unit and rounding caveats distinguish estimates from safe capacity; synthesis is unscored',()=>{
 assert.match(source('units-reference.js'),/1 PiB ≈ 1.126 PB/);
 assert.match(source('tips-reference.js'),/safe upper bound/);
 assert.match(source('tips-reference.js'),/ไม่คิดคะแนน/);
 assert.match(source('tips-reference.js'),/ข้อมูลจากโจทย์/);
 assert.match(source('tips-reference.js'),/สิ่งที่ต้องวัด/);
});
const source = name => fs.readFileSync(new URL('../src/'+name,import.meta.url),'utf8');
test('latency result labels the directional ratio, including reverse and equal comparisons',()=>{
 assert.ok(latency({first:150000000,second:100,count:10}).ratio<1);
 assert.equal(latency({first:100,second:100,count:1}).ratio,1);
 assert.match(source('main.js'),/อัตราส่วนเวลา/);
 assert.match(source('main.js'),/ใช้เวลาเท่ากัน/);
 assert.doesNotMatch(source('main.js'),/ช้ากว่างานอ้างอิง \(เท่า\)/);
});
