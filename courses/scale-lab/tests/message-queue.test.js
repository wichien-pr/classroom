import {test} from 'node:test';
import assert from 'node:assert/strict';
test('producer publishes while workers offline; workers drain while producer offline',()=>{
 assert.equal(typeof queue.queueAction,'function');
 const s=queue.queueInitial();s.consumerUp=false;
 assert.equal(queue.queueAction(s,'enqueue-jobs','crop').meaningful,true);
 assert.equal(s.jobs.length,3);assert.equal(s.completed.length,0);
 assert.equal(queue.queueAction(s,'process-jobs').meaningful,false);
 s.producerUp=false;s.consumerUp=true;
 assert.equal(queue.queueAction(s,'enqueue-jobs','blur').meaningful,false);
 assert.equal(queue.queueAction(s,'process-jobs').meaningful,true);
 assert.equal(s.jobs.length,2);assert.deepEqual(s.completed,[{id:1,type:'crop'}]);
});
test('scale workers independently, bound buffer and reject invalid operations without mutation',()=>{
 const s=queue.queueInitial();
 queue.queueAction(s,'enqueue-jobs','crop');queue.queueAction(s,'enqueue-jobs','sharpen');queue.queueAction(s,'enqueue-jobs','blur');
 s.workers=4;queue.queueAction(s,'process-jobs');assert.equal(s.jobs.length,5);
 assert.deepEqual(s.completed.map(j=>j.type),['crop','crop','crop','sharpen']);
 s.workers=1;queue.queueAction(s,'process-jobs');assert.equal(s.jobs.length,4);
 while(s.jobs.length)queue.queueAction(s,'process-jobs');
 assert.equal(queue.queueAction(s,'process-jobs').meaningful,false);
 for(let i=0;i<10;i++)queue.queueAction(s,'enqueue-jobs','blur');
 const before=structuredClone(s);assert.equal(queue.queueAction(s,'enqueue-jobs').meaningful,false);assert.deepEqual(s,before);
 for(const n of [0,5,NaN,1.5]){s.workers=n;assert.throws(()=>queue.queueAction(s,'process-jobs'));}
 s.workers=1;assert.throws(()=>queue.queueAction(s,'enqueue-jobs','invalid'));
 assert.deepEqual(queue.queueInitial().jobs,[]);
});
test('active manifest and private bank replace region only',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../course.json',import.meta.url)));
 const bank=JSON.parse(readFileSync(new URL('../assessment.json',import.meta.url)));
 assert.deepEqual(manifest.lessons,lessons.map(l=>l.kind));
 assert.equal(manifest.participation.region,undefined);
 assert.deepEqual(manifest.participation['message-queue'],{'message-queue':['enqueue-jobs','process-jobs'],'check-your-thinking':['quiz-answer-a','quiz-answer-b']});
 assert.equal(bank.questions.some(q=>q.lesson_id==='region'),false);
 assert.deepEqual(bank.questions.filter(q=>q.lesson_id==='message-queue').map(q=>q.id),['message-queue-decoupling','message-queue-scaling']);
});
import {readFileSync} from 'node:fs';
import * as queue from '../src/message-queue.js';
import {lessons} from '../src/lessons.js';
import {readLocalProgress,mergeLocalProgress} from '../src/local-progress.js';
test('LAB10 uses new identity without reinterpreting retired history',()=>{
 assert.equal(lessons[9].kind,'message-queue');
 assert.deepEqual(readLocalProgress(null,'[9,10,11]'),['queue','observe','region']);
 assert.deepEqual(mergeLocalProgress(['region','queue'],['message-queue']),['region','queue','message-queue']);
});
