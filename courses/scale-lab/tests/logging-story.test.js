import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLoggingStory,loggingStageFrames,loggingPages} from '../src/logging-story.js';
test('one experiment executes only the selected candidate pipeline',async()=>{
 assert.equal(loggingPages.length,1);
 for(const fixed of [false,true]){
 const seen=[],saved=[],flow=createLoggingStory({show:async f=>seen.push(f),record:async a=>saved.push(a)});
 await flow.run(0,fixed);
 assert.deepEqual(seen.map(f=>f.key),fixed?['build','tested','deployed']:['build','blocked']);
 assert.deepEqual(saved,fixed?['run-pipeline','run-pipeline','run-pipeline']:['run-pipeline','run-pipeline']);
 assert.deepEqual(seen,loggingStageFrames(fixed));
 const count=saved.length;await flow.replay();assert.equal(saved.length,count);
 assert.equal(seen.at(-1).state.logs,null);assert.equal(seen.at(-1).state.metrics,null);assert.ok(seen.every(f=>f.total===(fixed?3:2)));
 }
});
test('exact retry at each save boundary retains candidate and does not repeat operation',async()=>{
 for(let boundary=0;boundary<3;boundary++){
 let fail=true;const seen=[],saved=[],flow=createLoggingStory({show:async f=>seen.push(f.key),record:async(a,retry)=>{saved.push([a,retry]);if(saved.length===boundary+1&&fail){fail=false;throw Error('lost');}}});
 await assert.rejects(flow.run(0,true),/lost/);await flow.run(0,false);
 assert.deepEqual(seen,['build','tested','deployed']);assert.deepEqual(saved[boundary+1],[saved[boundary][0],true]);assert.equal(saved.length,4);
 }
});
test('cancel at every animation or save prevents later operations and stale completion',async()=>{
 for(const at of ['show','record'])for(let boundary=0;boundary<3;boundary++){
 let release,arrive;const gate=new Promise(r=>release=r),ready=new Promise(r=>arrive=r),seen=[],saved=[];
 const flow=createLoggingStory({show:async f=>{seen.push(f.key);if(at==='show'&&seen.length===boundary+1){arrive();await gate;}},record:async a=>{saved.push(a);if(at==='record'&&saved.length===boundary+1){arrive();await gate;}}});
 const running=flow.run(0,true);await ready;flow.cancel();release();await running;
 assert.equal(flow.completed,false);assert.equal(flow.busy,false);assert.equal(seen.length,boundary+1);assert.equal(saved.length,boundary+(at==='record'?1:0));
 }
});
