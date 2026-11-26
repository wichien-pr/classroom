import test from 'node:test';
import assert from 'node:assert/strict';
import * as scope from '../src/scope.js';
import {blueprintMarkup} from '../src/blueprint-view.js';
import {deepDiveMarkup,deepDiveResult} from '../src/deep-dive-view.js';
import {reviewDeepDive} from '../src/deep-dive.js';
import {wrapUpMarkup} from '../src/wrap-up-view.js';
import {lessons} from '../src/lessons.js';
test('wrap-up separates growth scenarios and offers an unscored unsaved spoken reflection',()=>{
 const html=wrapUpMarkup(lessons[3],state);
 for(const text of ['แยกจาก','10 ล้าน DAU','การตัดสินใจ','เหตุผล','สิ่งที่แลก','ความเสี่ยง','สิ่งที่จะวัด','คำถามถึงลูกค้า','พูดหรือเขียน','ไม่ให้คะแนน','ไม่บันทึก','ไม่ตรวจอัตโนมัติ'])assert.ok(html.includes(text),text);
 assert.match(html,/<details[^>]*id="wrap-reflection"/);
});
test('deep dive bounds the rubric and works through a measurable fanout decision',()=>{
 const html=deepDiveMarkup(lessons[2],state);
 for(const text of ['ไม่ใช่รายการหัวข้อทั้งหมด','สุ่มรหัส','ID','ความไม่ซ้ำ','คำถาม','trade-off','queue lag','retry','5,000'])assert.ok(html.includes(text),text);
 const result=deepDiveResult({result:reviewDeepDive({focus:'feed',topic:'ranking'})});
 assert.ok(result.includes('เกณฑ์ของแบบฝึก'));
});
const state={known:{},order:[0,1]};
test('blueprint teaches chosen write-time architecture alongside alternatives and costs',()=>{
 const html=blueprintMarkup(lessons[1],state);
 for(const text of ['fanout-on-write','fanout-on-read','hybrid','งานเขียน','พื้นที่เก็บ','อ่านเร็ว','Post Cache → Post DB','ไม่ใช่ลำดับบังคับ'])assert.ok(html.includes(text),text);
});
test('scope summary groups only opened facts and keeps unknown requirements unresolved',()=>{
 assert.equal(typeof scope.scopeSummary,'function');
 const empty=scope.scopeSummary({});
 assert.doesNotMatch(empty,/10 ล้าน DAU|5,000/);
 const html=scope.scopeSummary(Object.fromEntries(scope.questions.map(q=>[q.id,true])));
 for(const text of ['Functional requirements','ขนาดและข้อจำกัด','ยังต้องถาม','นอกขอบเขต','latency','availability','ไม่ใช่การอนุมัติ','10 ล้าน DAU','5,000'])assert.ok(html.includes(text),text);
 assert.doesNotMatch(html,/99\.9|100 ms/);
});
