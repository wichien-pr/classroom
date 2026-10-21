import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createParticipation} from '../src/participation.js';
import {lessons} from '../src/lessons.js';

test('every Check your thinking quiz explicitly allows quiz-answer separately from simulation',async()=>{
 const {readFile}=await import('node:fs/promises');
 const manifest=JSON.parse(await readFile(new URL('../course.json',import.meta.url)));
 assert.deepEqual(manifest.lessons,lessons.map(l=>l.kind));
 for(const lesson of lessons){
  assert.deepEqual(Object.keys(manifest.participation[lesson.kind]).sort(),[lesson.kind,'check-your-thinking'].sort());
  assert.deepEqual(manifest.participation[lesson.kind]['check-your-thinking'],['quiz-answer-a','quiz-answer-b'],lesson.kind);
 }
});

test('already counted is a successful server result, not an error or optimistic score',async()=>{
 const client=createParticipation('/api/test',async()=>({ok:true,json:async()=>({score:1,csrf_token:'t',awarded:false,reason:'already_counted'})}));
 await client.load();await client.record('flow','step');
 assert.equal(client.score,1);assert.equal(client.status,'saved');assert.equal(client.reason,'already_counted');
});

test('all eleven lesson simulation definitions match reviewed actions',async()=>{
 const {readFile}=await import('node:fs/promises');
 const manifest=JSON.parse(await readFile(new URL('../course.json',import.meta.url)));
 assert.deepEqual(Object.fromEntries(Object.entries(manifest.participation).map(([lesson, definitions])=>[lesson,{[lesson]:definitions[lesson]}])),{
 flow:{flow:['step']},workload:{workload:['estimate']},stock:{stock:['order']},balance:{balance:['route']},
 replica:{replica:['write','read-replica','read-primary','sync']},
 cache:{cache:['read-cache','update','invalidate']},cdn:{cdn:['decision']},'stateless-web':{'stateless-web':['web-request']},
 'data-centers':{'data-centers':['dc-request']},'message-queue':{'message-queue':['enqueue-jobs','process-jobs']},'logging-operations':{'logging-operations':['inspect-logs','inspect-metrics','run-pipeline']}
 });
});

test('load errors block recording and recover; synchronous guard serializes writes',async()=>{
 let fail=true,release; const bodies=[];
 const client=createParticipation('/api/test',async(url,options)=>{
   if(!options?.method) return {ok:!fail,json:async()=>({score:4,csrf_token:'token'})};
   bodies.push(JSON.parse(options.body));await new Promise(resolve=>{release=resolve;});
   return {ok:true,json:async()=>({score:5,csrf_token:'token'})};
 });
 await client.load();assert.equal(client.status,'load-error');assert.equal(client.score,null);
 await client.record('flow','step');assert.equal(bodies.length,0);
 fail=false;await client.load();assert.equal(client.score,4);
 const first=client.record('flow','step');assert.equal(client.status,'saving');assert.equal(client.score,4);
 await client.record('workload','estimate');assert.equal(bodies.length,1);
 release();await first;assert.equal(client.score,5);
});

test('confirmed scores only; retry keeps captured event and lesson', async()=>{
  const bodies=[]; let fail=true;
  const client=createParticipation('/api/test', async(url, options)=>{
    if(!options?.method) return {ok:true,json:async()=>({score:0,csrf_token:'csrf'})};
    bodies.push(JSON.parse(options.body));
    if(fail) throw Error('lost response');
    return {ok:true,json:async()=>({score:1,csrf_token:'csrf'})};
  });
  await client.load();
  await client.record('flow','step');
  assert.equal(client.score,0);
  assert.equal(client.status,'save-error');
  fail=false; await client.retry();
  assert.deepEqual(bodies[0],bodies[1]);
  assert.equal(bodies[1].lesson_id,'flow');
  assert.equal(client.score,1);
  assert.equal(client.status,'saved');
});
