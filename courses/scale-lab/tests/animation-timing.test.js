import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const moduleURL=new URL('../src/animation-timing.js',import.meta.url);
test('central presentation timing config covers all twelve lessons, slowing only LAB01',async()=>{
 assert.ok(existsSync(moduleURL),'shared animation timing configuration must exist');
 const {animationTiming:t}=await import(moduleURL);
 assert.deepEqual(Object.keys(t),Array.from({length:12},(_,i)=>`lab${String(i+1).padStart(2,'0')}`));
 assert.deepEqual(Object.values(t).slice(0,11).map(v=>v.routeMs),[1500,850,2000,1200,2000,2000,2000,2000,2000,1500,1500]);
 assert.deepEqual(t.lab12,{comparisonRouteMs:1500,comparisonCapacityMs:900,placementMs:1200,requestBatchMs:1000,shardingSummaryMs:1600});
});
test('all twelve renderer route consumers use shared timing',()=>{
 const files=['flow-view','workload-view','scaling-view','balance-view','replication-presentation','cache-presentation','cdn-presentation','web-presentation','dc-presentation','queue-presentation','logging-presentation','data-tier-presentation'];
 for(const [i,file] of files.entries()){
  const source=readFileSync(new URL(`../src/${file}.js`,import.meta.url),'utf8');
  assert.match(source,/from '\.\/animation-timing.js'/,file);
  assert.match(source,new RegExp(`animationTiming.lab${String(i+1).padStart(2,'0')}`),file);
  assert.doesNotMatch(source,/offsetDistance[^\]]+\],(?:\{duration:\d+|(?:1500|1200|1000)\))/,file);
 }
 for(const file of ['flow-view','workload-view']){
  const css=readFileSync(new URL(`../src/${file}.css`,import.meta.url),'utf8');
  assert.doesNotMatch(css,/travel[^\n]+(?:animation:[^;}\n]+\s[.\d]+s|animation-duration:[.\d]+s)/);
 }
});

test('LAB02 configurable blocked routes preserve independent hold and fade',async()=>{
 const m=await import(moduleURL);assert.equal(typeof m.workloadBlockedFrames,'function');
 for(const routeMs of [850,1500,10]){
  const {duration,http,query}=m.workloadBlockedFrames({...m.animationTiming.lab02,routeMs});
  assert.equal(duration,2*routeMs+1920+480);
  assert.equal(query.find(f=>f.offsetDistance==='100%').offset*duration,2*routeMs);
  assert.equal(http.find(f=>f.offsetDistance==='100%').offset*duration,routeMs);
  assert.equal(query.at(-2).offset*duration,2*routeMs+1920);
 }
});
test('invalid presentation values fail fast with their key instead of creating infinite animations',async()=>{
 const m=await import(moduleURL);assert.equal(typeof m.validateAnimationTiming,'function');
 for(const value of [0,-1,NaN,Infinity,'1500',null])assert.throws(()=>m.validateAnimationTiming({lab01:{routeMs:value}}),/lab01.routeMs/);
 assert.doesNotThrow(()=>m.validateAnimationTiming(m.animationTiming));
});

test('every configured stage has a renderer consumer and local non-route holds remain independent',async()=>{
 const {animationTiming}=await import(moduleURL);
 const files=['flow-view','workload-view','scaling-view','balance-view','replication-presentation','cache-presentation','cdn-presentation','web-presentation','dc-presentation','queue-presentation','logging-presentation','data-tier-presentation'];
 for(const [i,file] of files.entries()){
  const source=readFileSync(new URL(`../src/${file}.js`,import.meta.url),'utf8');
  const lab=`lab${String(i+1).padStart(2,'0')}`;
  for(const key of Object.keys(animationTiming[lab]))assert.ok(source.includes(`animationTiming.${lab}.${key}`),`${lab}.${key} consumer`);
 }
 const read=f=>readFileSync(new URL(`../src/${f}`,import.meta.url),'utf8');
 assert.match(read('balance-view.js'),/delay:p.dataset.to==='router'\?0:animationTiming.lab04.routeMs/);
 assert.match(read('flow-view.js'),/setTimeout\(advance,1100\)/);
 assert.match(read('scaling-view.js'),/duration:3200/);
 for(const f of ['replication','cache','cdn'])assert.match(read(`${f}-presentation.js`),/duration:900/);
 assert.match(read('dc-presentation.js'),/duration:1400/);
 assert.match(read('queue-presentation.js'),/frame.action==='process-jobs'\?1300:1000/);
 assert.match(read('logging-presentation.js'),/translateY\(0\)'\}\],1500/);
 assert.doesNotMatch(read('data-tier-presentation.js'),/wait\([^\n]*,\d+\)/);
});
