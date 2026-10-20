import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {lessons} from '../src/lessons.js';
test('LAB07 teaches static CDN workflow with preserved curriculum and private bank IDs',()=>{
 const l=lessons.find(l=>l.kind==='cdn');assert.equal(l.id,7);assert.match(l.explain,/TTL/);assert.match(l.question,/หมดอายุ/);assert.match(l.answers[1],/เก่า/);
 const bank=JSON.parse(readFileSync(new URL('../assessment.json',import.meta.url))).questions.filter(q=>q.lesson_id==='cdn');
 assert.deepEqual(bank.map(q=>[q.id,q.answer,q.options.map(o=>o.id)]),[['cdn-15','a',['a','b','c']],['cdn-16','a',['a','b','c']]]);
 assert.match(bank[0].prompt,/TTL/);assert.match(bank[1].prompt,/query/);
 const manifest=JSON.parse(readFileSync(new URL('../course.json',import.meta.url)));assert.equal(manifest.lessons.length,11);assert.deepEqual(manifest.participation.cdn,{cdn:['decision'],'check-your-thinking':['quiz-answer-a','quiz-answer-b']});
});
