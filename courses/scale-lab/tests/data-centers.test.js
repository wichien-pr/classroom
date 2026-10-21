import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as model from '../src/data-centers.js';
test('routing does not copy missing data or provide capacity; versions need testing',()=>{
 const c={...model.dataCentersInitial(),westUp:false,redirect:true,synced:false};
 let r=model.evaluateDataCenters(c);assert.equal(r.missingData,40);
 c.synced=true;c.eastCapacity=60;r=model.evaluateDataCenters(c);assert.equal(r.missingData,0);assert.equal(r.overloaded,40);
 c.eastCapacity=100;c.sameRelease=false;r=model.evaluateDataCenters(c);assert.equal(r.overloaded,0);assert.equal(r.releaseMismatch,true);
 c.sameRelease=true;c.eastUp=false;c.westUp=true;c.westCapacity=70;r=model.evaluateDataCenters(c);assert.deepEqual(r.routes,[0,100]);assert.equal(r.overloaded,30);
 for(const eastShare of [0,100])assert.equal(model.evaluateDataCenters({...model.dataCentersInitial(),eastShare}).routes.reduce((a,b)=>a+b),100);
 for(const invalid of [{eastShare:-1},{eastShare:101},{eastShare:NaN},{eastShare:1.5},{eastCapacity:101},{westCapacity:-1},{synced:'true'},{freshDNS:null}])assert.throws(()=>model.evaluateDataCenters({...model.dataCentersInitial(),...invalid}));
});
test('GeoDNS routes a batch geographically; failover requires a new DNS answer',()=>{
 assert.equal(typeof model.evaluateDataCenters,'function');
 const c=model.dataCentersInitial();
 assert.deepEqual(model.evaluateDataCenters(c).routes,[60,40]);
 c.westUp=false;
 let r=model.evaluateDataCenters(c);assert.equal(r.unavailable,40);assert.deepEqual(r.routes,[60,40]);
 c.redirect=true;c.freshDNS=false;r=model.evaluateDataCenters(c);assert.equal(r.unavailable,40);
 c.freshDNS=true;r=model.evaluateDataCenters(c);assert.deepEqual(r.routes,[100,0]);assert.equal(r.unavailable,0);assert.equal(r.moved,40);
 c.eastUp=false;assert.equal(model.evaluateDataCenters(c).unavailable,100);
});
