import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as cdn from '../src/cdn.js';
import {createCdnFlow,cdnSequences} from '../src/cdn-flow.js';
test('cancel during stage prevents later actions and records; replay is snapshot-only',async()=>{
 let release;const shown=[],awards=[];
 const runner=createCdnFlow({record:async a=>awards.push(a),show:async f=>{shown.push(f);if(!release)await new Promise(r=>release=r);}});
 const pending=runner.run(0);await new Promise(r=>setImmediate(r));runner.cancel();release();await pending;
 assert.deepEqual(awards,[]);assert.equal(shown.length,1);assert.equal(runner.frames.length,0);
 await runner.run(1);const count=awards.length;shown.length=0;await runner.replay();
 assert.deepEqual(shown.map(f=>f.action),cdnSequences[1]);assert.equal(awards.length,count);
});
test('save failure stops and retry resumes the same stage without another model mutation',async()=>{
 const shown=[],records=[];let fail=true;
 const runner=createCdnFlow({show:async f=>shown.push(f),record:async(a,retry)=>{records.push([a,retry]);if(fail){fail=false;throw Error('save');}}});
 await assert.rejects(runner.run(0),/save/);assert.equal(shown.length,1);assert.equal(runner.busy,false);
 await runner.run(0);assert.deepEqual(shown.map(f=>f.action),['request','request']);assert.equal(shown[0].state.originReads,1);assert.deepEqual(records,[['decision',false],['decision',true],['decision',false]]);
});


test('six complete sequences retain decision identity and model truth',async()=>{
 const {createCdnFlow,cdnSequences}=await import('../src/cdn-flow.js');
 const expected=['hit','hit','miss','miss','hit','failure'];
 for(let topic=0;topic<6;topic++){
  const shown=[],records=[];const runner=createCdnFlow({show:async f=>shown.push(f),record:async a=>records.push(a)});
  await runner.run(topic);assert.deepEqual(shown.map(f=>f.action),cdnSequences[topic]);assert.equal(shown.at(-1).state.path,expected[topic]);
  assert.ok(records.length>0);assert.ok(records.every(a=>a==='decision'));
  if(topic===0){assert.equal(shown.at(-1).state.originReads,1);assert.equal(shown.at(-1).state.now,0);}
  if(topic===1)assert.match(shown.at(-1).message,/STALE/);
  if(topic===2)assert.equal(shown.at(-1).state.now,3);
  if(topic===4){assert.equal(Object.keys(shown.at(-1).state.objects).length,2);assert.match(shown.at(-1).message,/STALE/);}
  if(topic===5){assert.ok(shown.some(f=>f.state.path==='fallback'));assert.equal(shown.at(-1).state.originReads,1);}
  const count=records.length;shown.length=0;await runner.replay();assert.equal(records.length,count);assert.equal(shown.length,cdnSequences[topic].length);
 }
});
test('route projection never invents origin traffic on HIT or unavailable delivery',async()=>{
 const {cdnRoutes}=await import('../src/cdn-presentation.js');
 const before=cdn.cdnInitial(),state=cdn.cdnInitial();cdn.cdnAction(state,'request');
 assert.deepEqual(cdnRoutes({action:'request',before,state}).map(r=>r.slice(0,2)),[['client','edge'],['edge','origin'],['origin','edge'],['edge','client']]);
 state.path='hit';assert.deepEqual(cdnRoutes({action:'request',before,state}).map(r=>r.slice(0,2)),[['client','edge'],['edge','client']]);
 state.path='failure';before.up=false;assert.deepEqual(cdnRoutes({action:'request',before,state}),[]);
 state.path='fallback';assert.deepEqual(cdnRoutes({action:'request',before,state}).map(r=>r.slice(0,2)),[['client','origin'],['origin','client']]);
});
test('independent CDN presets are cold and do not execute requests',()=>{
 assert.equal(typeof cdn.cdnPreset,'function');
 for(let i=0;i<6;i++)assert.deepEqual(cdn.cdnPreset(i),cdn.cdnInitial());
});
