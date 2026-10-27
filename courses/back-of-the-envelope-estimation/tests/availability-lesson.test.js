import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons} from '../src/lessons.js';
const reference = await import('../src/availability-reference.js').catch(() => ({}));
const expectedRows = [
 ['99%', '14.40 นาที', '1.68 ชั่วโมง', '7.31 ชั่วโมง', '3.65 วัน'],
 ['99.99%', '8.64 วินาที', '1.01 นาที', '4.38 นาที', '52.60 นาที'],
 ['99.999%', '864.00 มิลลิวินาที', '6.05 วินาที', '26.30 วินาที', '5.26 นาที'],
 ['99.9999%', '86.40 มิลลิวินาที', '604.80 มิลลิวินาที', '2.63 วินาที', '31.56 วินาที'],
];
test('availability copy defines high availability, measured 100%, SLA and nines without guarantees', () => {
 const lesson = lessons.find(l => l.id === 'estimate-availability');
 assert.match(lesson.intro, /High availability/);
 assert.match(lesson.intro, /100%.*ไม่มี downtime.*ช่วงเวลาที่วัด.*ไม่ได้รับประกัน/);
 assert.match(lesson.concept, /nines.*สิบเท่า/);
 assert.match(lesson.caveat, /ผู้ให้บริการ.*ผู้ใช้บริการ/);
 assert.match(lesson.caveat, /แผนบริการ.*ข้อยกเว้น/);
 assert.deepEqual(lesson.answers.map(a => a.correct), [true, false]);
});
test('availability reference preserves exactly four rows, precision and explicit Thai time units', () => {
 assert.deepEqual(reference.availabilityReference, expectedRows);
 const html = reference.renderAvailabilityReference();
 assert.match(html, /<caption>/);
 assert.equal((html.match(/scope="col"/g) || []).length, 5);
 assert.equal((html.match(/scope="row"/g) || []).length, 4);
 assert.match(html, /ประมาณ/);
 assert.match(html, /365 วัน/);
 assert.match(html, /30 วัน/);
});
