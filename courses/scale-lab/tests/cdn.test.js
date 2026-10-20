import test from 'node:test';
import assert from 'node:assert/strict';
import {cdnInitial,cdnAction} from '../src/cdn.js';
test('CDN outage requires configured fallback and available origin; origin outage still permits fresh hit',()=>{
 const s=cdnInitial();s.up=false;
 assert.equal(cdnAction(s,'request').path,'failure');assert.equal(s.delivered,null);assert.equal(s.originReads,0);
 s.fallback=true;assert.equal(cdnAction(s,'request').path,'fallback');assert.equal(s.originReads,1);assert.equal(s.cache,null);
 s.originUp=false;assert.equal(cdnAction(s,'request').path,'failure');assert.equal(s.delivered,null);
 const t=cdnInitial();cdnAction(t,'request');t.originUp=false;
 assert.equal(cdnAction(t,'request').path,'hit');for(let i=0;i<3;i++)cdnAction(t,'tick');
 assert.equal(cdnAction(t,'request').path,'failure');assert.equal(t.delivered,null);
 assert.equal(cdnAction(t,'unknown').meaningful,false);
});
test('invalidation removes a copy; version URLs only separate when query participates in key',()=>{
 const s=cdnInitial();cdnAction(s,'request');cdnAction(s,'publish');
 cdnAction(s,'version');assert.equal(cdnAction(s,'request').path,'miss');assert.equal(s.delivered,2);
 const t=cdnInitial();cdnAction(t,'request');cdnAction(t,'publish');t.includeQuery=false;cdnAction(t,'version');
 assert.equal(cdnAction(t,'request').path,'hit');assert.equal(t.delivered,1);
 assert.equal(cdnAction(t,'invalidate').meaningful,false);assert.equal(t.cache,null);
 assert.equal(cdnAction(t,'request').path,'miss');assert.equal(t.delivered,2);
});
test('first image request loads origin; next user hits same edge without extending TTL',()=>{
 const s=cdnInitial();
 assert.equal(cdnAction(s,'request').path,'miss');assert.equal(s.originReads,1);assert.equal(s.delivered,1);
 assert.equal(cdnAction(s,'request').path,'hit');assert.equal(s.originReads,1);assert.equal(s.expires,3);
});
test('origin updates stay stale until exact TTL boundary; tick never awards',()=>{
 const s=cdnInitial();cdnAction(s,'request');cdnAction(s,'publish');
 assert.equal(s.origin,2);assert.match(cdnAction(s,'request').message,/STALE/);
 for(let i=0;i<3;i++)assert.equal(cdnAction(s,'tick').meaningful,false);
 assert.equal(cdnAction(s,'request').path,'miss');assert.equal(s.delivered,2);assert.equal(s.originReads,2);
});
