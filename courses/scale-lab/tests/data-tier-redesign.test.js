import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {singleTierScene} from '../src/data-tier-single.js';
import {tierFrames} from '../src/data-tier-flow.js';
test('three comparison graphics retain shared bar scale without routing prose',()=>{
 for(const frame of tierFrames(0)){
  const html=singleTierScene(frame);
  assert.equal((html.match(/class="tier-node"/g)||[]).length,3);
  assert.equal((html.match(/data-demand=/g)||[]).length,48);
  assert.equal((html.match(/data-unit=/g)||[]).length,72);
  assert.ok(html.includes(`width:${frame.result.capacity/32*100}%`));
  assert.ok(html.includes(`data-down="${!frame.config.up}"`));
  assert.match(html,/ข้อมูลทั้งหมด 16 แถว/);assert.doesNotMatch(html,/tier-routing/);
 }
});
test('page one has a dedicated visual story, not the routing dashboard',()=>{
 const source=readFileSync(new URL('../src/data-tier-presentation.js',import.meta.url),'utf8');
 assert.match(source,/if\(frame.index===0\)return singleTierScene\(frame\)/);
 const view=readFileSync(new URL('../src/data-tier-single.js',import.meta.url),'utf8');
 assert.match(view,/tier-single/);assert.match(view,/r\.capacity/);assert.match(view,/r\.total/);
 assert.doesNotMatch(view,/tier-shard-preview/);assert.doesNotMatch(view,/tier-routing/);
});
