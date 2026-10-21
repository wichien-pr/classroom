import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons} from '../src/lessons.js';
import {readFileSync} from 'node:fs';

test('two-choice presentation contract preserves unique lesson keys and durable original choice actions',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../course.json',import.meta.url)));
 assert.equal(lessons.length,12);
 assert.equal(new Set(lessons.map(l=>l.kind)).size,lessons.length);
 for(const lesson of lessons){
  assert.equal(lesson.answers.length,2);
  assert.equal(new Set(lesson.answers).size,2);
  assert.deepEqual(manifest.participation[lesson.kind]['check-your-thinking'],['quiz-answer-a','quiz-answer-b']);
 }
});
