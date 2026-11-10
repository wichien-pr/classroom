import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLoggingFlow,loggingPreset} from '../src/logging-flow.js';
test('metrics are separate and pipelines await all original stages; terminal is unscored',async()=>{
 const recorded=[],frames=[];const flow=createLoggingFlow({record:async a=>recorded.push(a),show:async f=>frames.push(f)});
 for(let t=1;t<=3;t++){await flow.run(t);assert.equal(frames.at(-1).state.metrics.group,['host','tier','business'][t-1]);assert.equal(frames.at(-1).state.logs,null);}
 await flow.run(4);assert.equal(frames.at(-1).state.stage,'blocked');assert.deepEqual(flow.frames.map(f=>f.state.stage),['built','blocked']);
 await flow.run(5);assert.deepEqual(flow.frames.map(f=>f.state.stage),['built','tested','deployed']);
 const count=recorded.length;await flow.run(6);assert.equal(frames.at(-1).state.stage,'deployed');assert.equal(recorded.length,count);assert.deepEqual(recorded,['inspect-metrics','inspect-metrics','inspect-metrics',...Array(5).fill('run-pipeline')]);
});
test('failed save retries captured transition and cancellation holds later stages',async()=>{
 let fail=true;const records=[],shown=[];const flow=createLoggingFlow({show:async f=>shown.push(f),record:async(a,retry)=>{records.push([a,retry]);if(fail){fail=false;throw Error('lost');}}});
 await assert.rejects(flow.run(5),/lost/);assert.deepEqual(shown.map(f=>f.state.stage),['built']);
 await flow.run(5);assert.deepEqual(shown.map(f=>f.state.stage),['built','tested','deployed']);assert.deepEqual(records[1],['run-pipeline',true]);const count=records.length;await flow.replay();assert.equal(records.length,count);
 let release;const gate=new Promise(r=>release=r),seen=[];const canceled=createLoggingFlow({show:async f=>{seen.push(f);await gate;},record:async()=>assert.fail('canceled must not record')});
 const running=canceled.run(5);await Promise.resolve();canceled.cancel();release();await running;assert.equal(seen.length,1);assert.equal(canceled.completed,false);
});
test('first topic searches centralized logs with original action identity',async()=>{
 const recorded=[],frames=[];const flow=createLoggingFlow({record:async a=>recorded.push(a),show:async f=>frames.push(f)});
 assert.equal(loggingPreset(0).logs,null);assert.equal(recorded.length,0);
 await flow.run(0);assert.deepEqual(frames.at(-1).state.logs.map(l=>l.service),['web-2','worker-1']);
 await flow.replay();assert.deepEqual(recorded,['inspect-logs']);
});
