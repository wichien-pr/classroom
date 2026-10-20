import {test} from 'node:test';
import assert from 'node:assert/strict';
// Dynamic import permits an explicit assertion when the lesson model is absent.
const c=await import('../src/cache.js').catch(()=>({}));
test('cache-aside reads fill once, stale hits persist until TTL boundary, clock is manual',()=>{
 assert.equal(typeof c.cacheInitial,'function');const s=c.cacheInitial();
 assert.match(c.cacheAction(s,'read-cache').message,/MISS/);assert.equal(s.reads,1);
 assert.match(c.cacheAction(s,'read-cache').message,/HIT/);assert.equal(s.reads,1);
 c.cacheAction(s,'update',220);assert.match(c.cacheAction(s,'read-cache').message,/STALE/);
 c.cacheAction(s,'tick');c.cacheAction(s,'tick');assert.equal(s.cache,100);
 c.cacheAction(s,'tick');assert.equal(s.cache,null);
 assert.match(c.cacheAction(s,'read-cache').message,/220 \/ DB 220/);assert.equal(s.reads,2);
});

test('invalid/no-op updates and invalidation do not score; outage bypass and restart keep durable DB',()=>{
 const s=c.cacheInitial();
 assert.equal(c.cacheAction(s,'update',NaN).meaningful,false);assert.equal(s.db,100);
 assert.equal(c.cacheAction(s,'update',100).meaningful,false);
 assert.equal(c.cacheAction(s,'invalidate').meaningful,false);
 c.cacheAction(s,'read-cache');assert.equal(c.cacheAction(s,'invalidate').meaningful,true);assert.equal(s.cache,null);
 c.cacheAction(s,'read-cache');assert.equal(c.cacheAction(s,'outage').meaningful,false);assert.equal(s.up,false);assert.equal(s.cache,null);
 assert.match(c.cacheAction(s,'read-cache').message,/BYPASS/);assert.equal(s.cache,null);assert.equal(s.reads,3);
 c.cacheAction(s,'restart');assert.equal(s.up,true);assert.equal(s.db,100);assert.equal(s.cache,null);
 assert.equal(c.cacheAction(s,'unknown').meaningful,false);
});
