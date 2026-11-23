import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as cdn from '../src/cdn.js';
import {createCdnFlow,cdnSequences} from '../src/cdn-flow.js';
test('cancel during stage prevents later actions and records; replay is snapshot-only',async()=>{
 let release;const shown=[],awards=[];
 const runner=createCdnFlow({record:async a=>awards.push(a),show:async f=>{shown.push(f);if(!release)await new Promise(r=>release=r);}});
 const pending=runner.run(0);await new Promise(r=>setImmediate(r));runner.cancel();release();await pending;
 assert.deepEqual(awards,[]);assert.equal(shown.length,1);assert.equal(runner.frames.length,0);
 await runner.run(0);const count=awards.length;shown.length=0;await runner.replay();
 assert.deepEqual(shown.map(f=>f.action),cdnSequences[0]);assert.equal(awards.length,count);
});
test('save failure stops and retry resumes the same stage without another model mutation',async()=>{
 const shown=[],records=[];let fail=true;
 const runner=createCdnFlow({show:async f=>shown.push(f),record:async(a,retry)=>{records.push([a,retry]);if(fail){fail=false;throw Error('save');}}});
 await assert.rejects(runner.run(0),/save/);assert.equal(shown.length,1);assert.equal(runner.busy,false);
 await runner.run(0);assert.deepEqual(shown.map(f=>f.action),cdnSequences[0]);assert.equal(shown[0].state.originReads,1);assert.deepEqual(records,[['decision',false],['decision',true],['decision',false],['decision',false],['decision',false]]);
});


test('underlying TTL, version key and outage capabilities remain independent of guided topics',()=>{
 const run=(actions)=>{const state=cdn.cdnInitial();for(const a of actions)cdn.cdnAction(state,a);return state;};
 const ttl=run(['request','publish','tick','tick','tick','request']);
 assert.equal(ttl.path,'miss');assert.equal(ttl.delivered,2);assert.equal(ttl.now,3);
 const version=run(['request','publish','version','request']);
 assert.equal(version.delivered,2);assert.equal(Object.keys(version.objects).length,2);
 version.includeQuery=false;cdn.cdnAction(version,'request');assert.equal(version.delivered,1);
 const outage=cdn.cdnInitial();outage.up=false;cdn.cdnAction(outage,'request');assert.equal(outage.path,'failure');
 outage.fallback=true;cdn.cdnAction(outage,'request');assert.equal(outage.path,'fallback');assert.deepEqual(outage.objects,{});
 outage.originUp=false;cdn.cdnAction(outage,'request');assert.equal(outage.path,'failure');assert.equal(outage.originReads,1);
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
