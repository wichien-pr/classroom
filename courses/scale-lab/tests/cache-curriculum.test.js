import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {lessons} from '../src/lessons.js';
import {readLocalProgress} from '../src/local-progress.js';
const manifest=JSON.parse(readFileSync(new URL('../course.json',import.meta.url)));
test('LAB06 replaces Session with original Cache identity, active bank and durable buttons',()=>{
 const ids=['flow','workload','stock','balance','replica','cache','cdn','stateless-web','data-centers','message-queue','logging-operations'];
 assert.deepEqual(lessons.map(l=>l.kind),ids);assert.deepEqual(manifest.lessons,ids);
 assert.deepEqual(manifest.participation.cache,{cache:['read-cache','update','invalidate'],'check-your-thinking':['quiz-answer-a','quiz-answer-b']});
 assert.equal(manifest.participation.session,undefined);
 const bank=JSON.parse(readFileSync(new URL('../assessment.json',import.meta.url)));
 assert.deepEqual([...new Set(bank.questions.map(q=>q.lesson_id))].sort(),[...ids].sort());
 assert.deepEqual(bank.questions.filter(q=>q.lesson_id==='cache').map(q=>[q.id,q.answer,q.options.map(o=>o.id)]),[['cache-13','a',['a','b','c']],['cache-14','b',['a','b','c']]]);
 assert.deepEqual(readLocalProgress(null,'[5,6,7,12]'),['session','replica','cache','shard']);
 assert.equal(lessons.filter(l=>readLocalProgress(null,'[5]').includes(l.kind)).length,0);
});

test('private cache bank tests expiration and volatile storage without reusing choice IDs',()=>{
 const bank=JSON.parse(readFileSync(new URL('../assessment.json',import.meta.url)));
 assert.match(bank.questions.find(q=>q.id==='cache-13').prompt,/memory/);
 assert.match(bank.questions.find(q=>q.id==='cache-14').prompt,/TTL/);
});

test('retiring a display slot does not shift other lesson reference chapters',()=>{assert.equal(lessons.find(l=>l.kind==='cdn').chapter,10);assert.equal(lessons.find(l=>l.kind==='logging-operations').chapter,14);});
