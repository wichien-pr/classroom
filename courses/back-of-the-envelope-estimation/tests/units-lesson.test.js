import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons} from '../src/lessons.js';

test('LAB01 teaches Power of two with byte and ASCII basics before estimation',()=>{
 const lesson=lessons.find(l=>l.id==='estimate-units');
 assert.equal(lesson.title,'Power of two · กำลังของสอง');
 assert.match(lesson.intro,/ระบบกระจาย/);
 assert.match(lesson.intro,/1 byte = 8 bits/);
 assert.match(lesson.intro,/ASCII/);
 assert.match(lesson.concept,/2¹⁰ = 1,024/);
 assert.match(lesson.concept,/KiB/);
 assert.equal(lesson.model,'units');
 assert.deepEqual(lesson.answers.map(a=>a.correct),[false,true]);
});
