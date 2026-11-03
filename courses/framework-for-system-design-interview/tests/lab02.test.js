import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {lessons} from '../src/lessons.js';
test('LAB02 has independent learning identity, allowlist and private bank',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../course.json',import.meta.url)));
 assert.deepEqual(lessons.map(l=>l.id),['framework-scope','framework-blueprint']);
 assert.deepEqual(manifest.lessons,lessons.map(l=>l.id));
 assert.deepEqual(manifest.participation['framework-blueprint']['framework-blueprint'],['review-blueprint']);
 const bank=JSON.parse(readFileSync(new URL('../assessment.json',import.meta.url)));
 assert.ok(bank.questions.filter(q=>q.lesson_id==='framework-blueprint').length>=3);
});
test('LAB02 review separates stored posts from delivery and sorts friend posts newest first',async()=>{
 assert.ok(existsSync(new URL('../src/blueprint.js',import.meta.url)),'blueprint model exists');
 const {reviewBlueprint}=await import('../src/blueprint.js');
 assert.deepEqual(reviewBlueprint({}).feed,[]);
 const stale=reviewBlueprint({publish:true,fanout:false,newest:true,feedback:true});
 assert.equal(stale.ready,false);assert.deepEqual(stale.feed,[]);
 const result=reviewBlueprint({publish:true,fanout:true,newest:true,feedback:true});
 assert.equal(result.ready,true);assert.deepEqual(result.feed,['มิน · 10:05','นิด · 10:00']);
 assert.equal(reviewBlueprint({publish:true,fanout:true,newest:false,feedback:true}).ready,false);
 assert.equal(reviewBlueprint({publish:true,fanout:true,newest:true,feedback:false}).ready,false);
});
