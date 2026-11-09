import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as web from '../src/stateless-web.js';
test('guided request awaits playback and save, retry never mutates twice, replay is unscored and cancel stops saving',async()=>{
 const {createWebFlow}=await import('../src/web-flow.js');
 const frames=[],records=[];let fail=true;
 const runner=createWebFlow({show:async f=>frames.push(f),record:async(a,retry)=>{records.push([a,retry]);if(fail){fail=false;throw Error('save');}}});
 await assert.rejects(runner.run(0),/save/);assert.equal(frames[0].state.requests,1);
 await runner.run(0);assert.equal(frames.length,1);assert.deepEqual(records,[['web-request',false],['web-request',true]]);
 await runner.replay();assert.equal(frames.length,2);assert.equal(records.length,2);
 let release;const blocked=createWebFlow({show:()=>new Promise(r=>release=r),record:async()=>assert.fail('cancelled save')});
 const pending=blocked.run(3);assert.equal(blocked.busy,true);await blocked.run(3);blocked.cancel();release();await pending;assert.equal(blocked.completed,false);
});
test('no eligible Web preserves NO_WEB without attempting the store',()=>{
 const p=web.webPreset(6);assert.deepEqual(p.state.up,[false,false,false]);assert.equal(p.state.storeUp,true);
 assert.equal(web.webRequest(p.state,p.options).code,'NO_WEB');assert.equal(p.state.storeReads,0);
});
test('six independent web presets preserve every original instruction condition without executing requests',()=>{
 assert.equal(typeof web.webPreset,'function');
 const states=Array.from({length:6},(_,i)=>web.webPreset(i));
 assert.deepEqual(states.map(p=>[p.state.mode,p.options.target,p.options.sticky,p.state.up,p.state.storeUp]),[
 ['local',1,false,[true,true,false],true],['local',1,true,[true,true,false],true],['shared',1,false,[true,true,false],true],['shared',1,false,[false,true,false],true],['shared',2,false,[false,true,true],true],['shared',2,false,[false,true,true],false]]);
 for(const p of states){assert.equal(p.state.requests,0);assert.equal(p.state.storeReads,0);assert.equal(p.state.last,null);}
 assert.deepEqual(states.map(p=>web.webRequest(p.state,p.options).code),['NO_SESSION','OK','OK','OK','OK','STORE_UNAVAILABLE']);
 assert.deepEqual(states.map(p=>p.state.last.server),[1,0,1,1,2,2]);
});
