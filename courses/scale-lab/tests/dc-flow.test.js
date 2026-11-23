import test from 'node:test';
import assert from 'node:assert/strict';
import {createDcFlow,dcPreset} from '../src/dc-flow.js';
import {dcTopics,dcScene} from '../src/dc-presentation.js';
test('one experiment compares the same 100 reads at one versus two prepared sites',async()=>{
 const frames=[],records=[];const flow=createDcFlow({show:async f=>frames.push(f),record:async(...a)=>records.push(a)});
 await flow.run(0);assert.equal(dcTopics.length,1);
 assert.deepEqual(frames[0].comparison.map(x=>x.result.routes),[[100,0],[60,40]]);
 assert.deepEqual(frames[0].comparison.map(x=>x.result.overloaded),[40,0]);
 assert.deepEqual(records,[['dc-request',false],['dc-request',false]]);
 assert.match(dcScene(dcPreset(0),frames[0]),/100 \/ 60/);
 await flow.replay();assert.equal(records.length,2);assert.deepEqual(frames[1],frames[0]);
});
test('retry resumes exact failed evaluation; cancel prevents later save',async()=>{
 let fail=true;const frames=[],records=[];const flow=createDcFlow({show:async f=>frames.push(f),record:async(a,retry)=>{records.push([a,retry]);if(records.length===2&&fail){fail=false;throw Error('lost');}}});
 await assert.rejects(flow.run(0));await flow.run(0);assert.equal(frames.length,1);assert.deepEqual(records,[['dc-request',false],['dc-request',false],['dc-request',true]]);assert.equal(flow.completed,true);
 let release;const canceled=[];const f=createDcFlow({show:()=>new Promise(r=>release=r),record:async a=>canceled.push(a)});const pending=f.run(0);await f.run(0);f.cancel();release();await pending;assert.deepEqual(canceled,[]);assert.equal(f.completed,false);
});
