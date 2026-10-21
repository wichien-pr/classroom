import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {lessons} from '../src/lessons.js';
import {readLocalProgress,mergeLocalProgress,encodeLocalProgress} from '../src/local-progress.js';
const json=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
test('LAB11 replaces Sharding with a fresh logging-operations identity and retains historical IDs',()=>{
 const m=json('../course.json'),b=json('../assessment.json');
 assert.equal(lessons[10].kind,'logging-operations');
 assert.deepEqual(m.lessons,lessons.map(l=>l.kind));
 assert.equal(m.participation.shard,undefined);
 assert.deepEqual(m.participation['logging-operations'],{'logging-operations':['inspect-logs','inspect-metrics','run-pipeline'],'check-your-thinking':['quiz-answer-a','quiz-answer-b']});
 assert.equal(b.questions.some(q=>q.lesson_id==='shard'),false);
 assert.deepEqual(b.questions.filter(q=>q.lesson_id==='logging-operations').map(q=>q.id),['logging-operations-evidence','logging-operations-ci']);
 const old=readLocalProgress(null,'[10,12]');assert.deepEqual(old,['observe','shard']);
 assert.equal(old.includes('logging-operations'),false);
 assert.deepEqual(readLocalProgress(encodeLocalProgress(mergeLocalProgress(old,['logging-operations'])),null),['observe','shard','logging-operations']);
 assert.equal(Object.values(m.participation).flatMap(s=>Object.values(s).flat()).length,41);
});
