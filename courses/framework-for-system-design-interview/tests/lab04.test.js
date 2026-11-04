import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {lessons} from '../src/lessons.js';
test('LAB04 owns a new lesson, main action and private questions without reusing previous awards',()=>{
 const m=JSON.parse(readFileSync(new URL('../course.json',import.meta.url)));
 assert.equal(lessons.at(-1).id,'framework-wrap-up');
 assert.deepEqual(m.lessons,lessons.map(l=>l.id));
 assert.deepEqual(m.participation['framework-wrap-up'],{'framework-wrap-up':['review-wrap-up'],'check-your-thinking':['quiz-answer-a','quiz-answer-b']});
 const bank=JSON.parse(readFileSync(new URL('../assessment.json',import.meta.url)));
 assert.equal(bank.questions.filter(q=>q.lesson_id==='framework-wrap-up').length,3);
});
test('wrap-up checklist flags missing topics and rejects unmeasured capacity claims',async()=>{
 assert.ok(existsSync(new URL('../src/wrap-up.js',import.meta.url)),'wrap-up model exists');
 const {reviewWrapUp,reviewTopics}=await import('../src/wrap-up.js');
 assert.equal(reviewWrapUp({}).ready,false);
 const all=Object.fromEntries(Object.keys(reviewTopics).map(k=>[k,true]));
 assert.equal(reviewWrapUp({...all,growth:'guarantee'}).ready,false);
 assert.equal(reviewWrapUp({...all,growth:'investigate'}).ready,true);
 for(const k of Object.keys(all))assert.ok(reviewWrapUp({...all,growth:'investigate',[k]:false}).missing.includes(k));
 assert.equal(reviewWrapUp({...all,growth:'unknown'}).ready,false);
 assert.equal(all.growth,undefined);
});
