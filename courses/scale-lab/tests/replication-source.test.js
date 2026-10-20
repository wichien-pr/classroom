import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {lessons} from '../src/lessons.js';
test('private replication questions teach PDF routing and qualified reliability without changing IDs or correct option identities',()=>{
 const bank=JSON.parse(readFileSync(new URL('../assessment.json',import.meta.url)));
 const qs=bank.questions.filter(q=>q.lesson_id==='replica');
 assert.deepEqual(qs.map(q=>[q.id,q.answer,q.options.map(o=>o.id)]),[['replica-11','b',['a','b','c']],['replica-12','b',['a','b','c']]]);
 assert.match(qs[0].prompt,/INSERT.*UPDATE.*DELETE/);
 assert.match(qs[1].prompt,/Reliability/);
 assert.match(qs[1].options[1].text,/lag/);
 const l=lessons.find(l=>l.kind==='replica');assert.match(l.answers[0],/Replica เสมอ/);assert.match(l.answers[1],/Primary ที่รับ write สำเร็จ/);
});
