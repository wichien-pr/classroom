import test from 'node:test';
import assert from 'node:assert/strict';
import * as dc from '../src/data-centers.js';
import {dcRoutes} from '../src/dc-presentation.js';
import * as presentation from '../src/dc-flow.js';
test('route projection shows only evaluated destinations, never fabricated DNS, copy or response routes',()=>{
 for(let topic=0;topic<6;topic++){
  const state=presentation.dcPreset(topic),result=dc.evaluateDataCenters(state),frame={state,result,topic},before=structuredClone(frame);
  const routes=dcRoutes(frame);assert.deepEqual(routes.map(r=>r.slice(0,2)),topic<3?[['client-0','east'],['client-1','west']]:[['client-0','east']]);assert.deepEqual(frame,before);
  if(topic===1||topic===2)assert.match(routes[1][2],/ปลายทางล่ม ไม่ได้รับบริการ/);
 }assert.deepEqual(dcRoutes(null),[]);
});
test('save retry retains captured frame rather than evaluating a different preset',async()=>{
 const frames=[],records=[];let fail=true;
 const flow=presentation.createDcFlow({show:async f=>frames.push(f),record:async(a,retry)=>{records.push([a,retry]);if(fail){fail=false;throw Error('lost response');}}});
 await assert.rejects(flow.run(4));assert.equal(flow.completed,false);await flow.run(0);assert.equal(frames.length,1);assert.equal(frames[0].result.missingData,40);assert.deepEqual(records,[['dc-request',false],['dc-request',true]]);await flow.replay();assert.deepEqual(frames[1],frames[0]);assert.equal(records.length,2);
});
test('one original action awaits traversal; replay is snapshot-only and cancellation prevents save',async()=>{
 assert.equal(typeof presentation.createDcFlow,'function');
 let release;const frames=[],actions=[];const flow=presentation.createDcFlow({show:f=>{frames.push(f);return new Promise(r=>release=r);},record:async a=>actions.push(a)});
 const run=flow.run(4);assert.equal(flow.busy,true);assert.deepEqual(actions,[]);await flow.run(0);assert.equal(frames.length,1);release();await run;assert.deepEqual(actions,['dc-request']);
 const replay=flow.replay();assert.deepEqual(frames[1],frames[0]);release();await replay;assert.deepEqual(actions,['dc-request']);
 const cancel=flow.run(5);flow.cancel();release();await cancel;assert.deepEqual(actions,['dc-request']);assert.equal(flow.completed,false);
});
test('six independent presets preserve every original cumulative condition and model result',()=>{
 assert.equal(typeof presentation.dcPreset,'function');
 const expected=[[[60,40],0,0,0,0,false],[[60,40],40,0,0,0,false],[[60,40],40,0,0,0,false],[[100,0],0,40,0,0,false],[[100,0],0,40,40,0,false],[[100,0],0,40,0,40,false]];
 for(let i=0;i<6;i++){const c=presentation.dcPreset(i),r=dc.evaluateDataCenters(c);assert.deepEqual([r.routes,r.unavailable,r.moved,r.missingData,r.overloaded,r.releaseMismatch],expected[i]);if(i>0)assert.equal(c.westUp,false);}
 const c=presentation.dcPreset(4);c.eastShare=0;assert.equal(presentation.dcPreset(4).eastShare,60);
});
