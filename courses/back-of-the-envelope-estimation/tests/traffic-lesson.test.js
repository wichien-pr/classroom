import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons} from '../src/lessons.js';

test('LAB04 introduces the hypothetical Twitter QPS and media-storage example without claiming real metrics', () => {
 const lesson = lessons.find(l => l.id === 'estimate-traffic');
 assert.equal(lesson.title, 'ประมาณ QPS และพื้นที่เก็บสื่อของ Twitter');
 assert.match(lesson.intro, /ไม่ใช่ข้อมูลจริงของ Twitter/);
 assert.match(lesson.intro, /เฉพาะคำขอสร้างทวีต/);
 assert.match(lesson.concept, /MAU.*รายเดือน.*DAU.*รายวัน/);
 assert.match(lesson.caveat, /140 bytes.*140 ตัวอักษร/);
 assert.deepEqual(lesson.answers.map(answer => answer.correct), [false, true]);
 assert.deepEqual(lesson.fields.map(field => [field.key,field.value]), [['mau',300e6],['daily',50],['posts',2],['peak',2]]);
});

const reference = await import('../src/traffic-reference.js').catch(() => ({}));
test('worked Twitter example preserves every assumption, size and both estimation chains', () => {
 assert.equal(typeof reference.renderTrafficReference, 'function', 'missing worked example');
 assert.deepEqual(reference.trafficAssumptions, [
  ['ผู้ใช้รายเดือน (MAU)', '300 ล้านคน'],
  ['สัดส่วนผู้ใช้รายวัน', '50% ของผู้ใช้รายเดือน'],
  ['ทวีตเฉลี่ยต่อผู้ใช้รายวัน', '2 ทวีต/คน/วัน'],
  ['ทวีตที่มีสื่อ', '10% ของทวีตทั้งหมด'],
  ['ระยะเก็บข้อมูล', '5 ปี'],
 ]);
 assert.deepEqual(reference.tweetSizes, [['tweet_id', '64 bytes'], ['ข้อความ', '140 bytes'], ['สื่อต่อทวีตที่มีสื่อ', '1 MB']]);
 const html = reference.renderTrafficReference();
 for (const text of ['300 ล้าน × 50% = 150 ล้านคน', '150 ล้าน × 2 ÷ 24 ÷ 3,600', '3,472.22', '3,500', '6,944.44', '7,000', '150 ล้าน × 2 × 10% × 1 MB = 30 TB/วัน', '30 TB × 365 × 5 = 54.75 PB ≈ 55 PB', 'ฐานสิบ', 'เฉพาะสื่อ', 'ไม่เปลี่ยนตาม', 'LAB05']) assert.ok(html.includes(text), text);
 assert.equal((html.match(/<caption>/g) || []).length, 2);
 assert.doesNotMatch(html, /dashboard_|clipboard|\.png/);
});
