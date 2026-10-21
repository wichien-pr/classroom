import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {lessons} from '../src/lessons.js';
import {readLocalProgress,mergeLocalProgress,encodeLocalProgress} from '../src/local-progress.js';
const json=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
test('LAB09 is a new Data centers identity; old history never qualifies it',()=>{
 const manifest=json('../course.json'),bank=json('../assessment.json');
 assert.equal(lessons[8].kind,'data-centers');assert.equal(lessons[9].kind,'region');
 assert.deepEqual(manifest.lessons,lessons.map(l=>l.kind));
 assert.equal(manifest.participation.observe,undefined);
 assert.deepEqual(manifest.participation['data-centers'],{'data-centers':['dc-request'],'check-your-thinking':['quiz-answer-a','quiz-answer-b']});
 assert.equal(bank.questions.some(q=>q.lesson_id==='observe'),false);
 assert.deepEqual(bank.questions.filter(q=>q.lesson_id==='data-centers').map(q=>q.id),['data-centers-routing','data-centers-readiness']);
 const old=readLocalProgress(null,'[10]');assert.deepEqual(old,['observe']);
 assert.equal(lessons.some(l=>old.includes(l.kind)),false);
 assert.deepEqual(readLocalProgress(encodeLocalProgress(mergeLocalProgress(old,['data-centers'])),null),['observe','data-centers']);
 assert.equal(Object.values(manifest.participation).flatMap(x=>Object.values(x).flat()).length,38);
});
