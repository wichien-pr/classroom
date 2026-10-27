import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {lessons} from '../src/lessons.js';
import {renderTipsReference} from '../src/tips-reference.js';
import {restoreLocalHistory,activeLocalHistory} from '../src/local-history.js';
test('five active lessons end at Tips and no longer link to LAB06',()=>{
 const ids=['estimate-units','estimate-latency','estimate-availability','estimate-traffic','estimate-tips'];
 assert.deepEqual(lessons.map(l=>l.id),ids);
 const manifest=JSON.parse(readFileSync(new URL('../course.json',import.meta.url)));
 const bank=JSON.parse(readFileSync(new URL('../assessment.json',import.meta.url)));
 assert.deepEqual(manifest.lessons,ids);
 assert.deepEqual(Object.keys(manifest.participation),ids);
 assert.equal(Object.values(manifest.participation).flatMap(s=>Object.values(s).flat()).length,15);
 assert.deepEqual(bank.questions.map(q=>q.lesson_id),ids);
 assert.doesNotMatch(renderTipsReference(),/LAB06/);
});
test('retired rounding and storage history stay saved without completing active lessons',()=>{
 const saved=restoreLocalHistory(['estimate-storage','estimate-rounding','estimate-tips']);
 assert.deepEqual(saved,['estimate-storage','estimate-rounding','estimate-tips']);
 assert.deepEqual(activeLocalHistory(saved),['estimate-tips']);
});
