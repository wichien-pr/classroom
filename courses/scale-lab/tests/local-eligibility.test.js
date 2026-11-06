import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createLocalEligibility,LOCAL_ELIGIBILITY_KEY} from '../src/local-eligibility.js';
const manifest=JSON.parse(readFileSync(new URL('../course.json',import.meta.url)));
test('local eligibility mirrors public allowlist for all lessons, deduplicates and reloads without guessing quiz correctness',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 let local=createLocalEligibility(manifest.participation,storage);
 for(const lesson of manifest.lessons){
  assert.deepEqual(local.criteria(lesson),{simulation:false,thinking:false});
  for(const action of ['next','reset','replay','pause','unknown'])local.record(lesson,action);
  assert.deepEqual(local.criteria(lesson),{simulation:false,thinking:false});
  local.record(lesson,'quiz-answer-a','check-your-thinking');
  assert.deepEqual(local.criteria(lesson),{simulation:false,thinking:true});
  const action=manifest.participation[lesson][lesson][0];local.record(lesson,action);local.record(lesson,action);
  assert.deepEqual(local.criteria(lesson),{simulation:true,thinking:true});
 }
 assert.equal(JSON.parse(values.get(LOCAL_ELIGIBILITY_KEY)).length,manifest.lessons.length*2);
 local=createLocalEligibility(manifest.participation,storage);
 for(const lesson of manifest.lessons)assert.deepEqual(local.criteria(lesson),{simulation:true,thinking:true});
});
test('corrupt/blocked storage and unknown identities cannot manufacture eligibility',()=>{
 for(const raw of ['{}','null','bad','[["flow","flow","replay"],["retired","flow","step"]]']){
  const local=createLocalEligibility(manifest.participation,{getItem:()=>raw,setItem:()=>{}});
  assert.deepEqual(local.criteria('flow'),{simulation:false,thinking:false});
 }
 const local=createLocalEligibility(manifest.participation,{getItem:()=>{throw Error('blocked')},setItem:()=>{throw Error('blocked')}});
 assert.equal(local.storageOK,false);local.record('flow','step');assert.equal(local.criteria('flow').simulation,true);
});
