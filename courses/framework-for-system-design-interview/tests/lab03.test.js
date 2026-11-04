import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {lessons} from '../src/lessons.js';
test('LAB03 has independent manifest, assessment and unchanged prior choices',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../course.json',import.meta.url)));
 assert.deepEqual(lessons.slice(0,3).map(l=>l.id),['framework-scope','framework-blueprint','framework-deep-dive']);
 assert.deepEqual(manifest.lessons,lessons.map(l=>l.id));
 assert.deepEqual(manifest.participation['framework-deep-dive']['framework-deep-dive'],['review-deep-dive']);
 const bank=JSON.parse(readFileSync(new URL('../assessment.json',import.meta.url)));
 assert.equal(bank.questions.filter(q=>q.lesson_id==='framework-deep-dive').length,3);
 assert.deepEqual(lessons.slice(0,2).map(l=>l.answers.map(a=>a.correct)),[[false,true],[true,false]]);
});
test('LAB03 selects deep dive based on agreed foundations and customer priority, not detail for its own sake',async()=>{
 assert.ok(existsSync(new URL('../src/deep-dive.js',import.meta.url)),'deep dive model exists');
 const {reviewDeepDive}=await import('../src/deep-dive.js');
 assert.equal(reviewDeepDive({}).ready,false);
 const input={scope:true,blueprint:true,feedback:true,priority:true,focus:'feed',topic:'ranking'};
 assert.equal(reviewDeepDive(input).ready,false);
 assert.equal(reviewDeepDive({...input,topic:'publishing'}).ready,true);
 assert.equal(reviewDeepDive({...input,focus:'performance',topic:'bottleneck'}).ready,true);
 assert.equal(reviewDeepDive({...input,focus:'chat',topic:'presence'}).ready,true);
 assert.equal(reviewDeepDive({...input,focus:'shortener',topic:'hash'}).ready,true);
 assert.equal(reviewDeepDive({...input,topic:'publishing',feedback:false}).ready,false);
 assert.equal(reviewDeepDive({...input,focus:'unknown',topic:'hash'}).ready,false);
 assert.equal(input.topic,'ranking');
});
