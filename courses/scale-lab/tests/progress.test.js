import test from 'node:test';
import assert from 'node:assert/strict';
import * as adapter from '../src/progress.js';

test('account adapter loads then saves stable IDs with session and CSRF', async () => {
  assert.equal(typeof adapter.createAccountProgress, 'function');
  const calls=[];
  const store=adapter.createAccountProgress('/api/courses/new-course/progress', async (url, options) => {
    calls.push({url,options});
    return {ok:true,json:async()=>({completed:calls.length===1?[]:['intro'],total:2,csrf_token:'session-token'})};
  });
  assert.equal(store.status,'loading');
  await store.load();
  assert.deepEqual(store.completed,[]);
  await store.complete('intro');
  assert.deepEqual(store.completed,['intro']);
  assert.equal(store.status,'saved');
  assert.equal(calls[1].options.headers['X-CSRF-Token'],'session-token');
  assert.equal(calls[1].options.credentials,'same-origin');
  assert.deepEqual(JSON.parse(calls[1].options.body),{lesson_id:'intro',manual:true});
});

test('failed loading cannot save and retry is explicit; failed save never marks done', async () => {
  let fail=true;
  const store=adapter.createAccountProgress('/api/courses/test/progress',async()=>({ok:!fail,json:async()=>({completed:[],total:2,csrf_token:'token'})}));
  await assert.rejects(store.load());
  assert.equal(store.status,'load-error');
  await assert.rejects(store.complete('intro'));
  fail=false; await store.load();
  fail=true; await assert.rejects(store.complete('intro'));
  assert.equal(store.status,'save-error');
  assert.deepEqual(store.completed,[]);
  fail=false; await store.complete('intro');
  assert.equal(store.status,'saved');
});

test('serializes concurrent saves so older snapshots cannot lose completions', async () => {
  const pending=[]; let calls=0;
  const store=adapter.createAccountProgress('/api/courses/test/progress', async () => {
    calls++;
    if(calls===1) return {ok:true,json:async()=>({completed:[],total:2,csrf_token:'token'})};
    return new Promise(resolve=>pending.push(ids=>resolve({ok:true,json:async()=>({completed:ids,total:2})})));
  });
  await store.load();
  const first=store.complete('intro'), second=store.complete('practice');
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(pending.length,1);
  pending.shift()(['intro']); await first;
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(pending.length,1);
  pending.shift()(['intro','practice']); await second;
  assert.deepEqual(store.completed,['intro','practice']);
});

test('Scale Lab manifest declares exactly the stable lesson keys', async () => {
  const {readFile}=await import('node:fs/promises');
  const {lessons}=await import('../src/lessons.js');
  const manifest=JSON.parse(await readFile(new URL('../course.json',import.meta.url)));
  assert.deepEqual(manifest.lessons,lessons.map(l=>l.kind));
});
