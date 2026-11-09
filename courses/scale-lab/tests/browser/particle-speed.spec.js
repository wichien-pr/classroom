import {test,expect} from '@playwright/test';
test('LAB1 replay during a route does not skip the next full traversal',async({page})=>{
 await page.goto('/');await page.locator('#step').click();await page.waitForTimeout(400);await page.locator('#flow-replay').click();
 await expect(page.locator('#flow-scene')).toHaveAttribute('data-stage','dns-return',{timeout:4000});
 await page.waitForTimeout(300);await expect(page.locator('#flow-scene')).toHaveAttribute('data-playback','running');
 await expect(page.locator('#flow-scene')).toHaveAttribute('data-stage','dns-return');
 await expect(page.locator('#flow-scene')).toHaveAttribute('data-playback','finished',{timeout:4000});
});
test('LAB2 DB-down keeps its original 2400ms endpoint hold/fade',async({page})=>{
 await page.goto('/');await page.locator('[data-lesson="2"]').click();
 for(let i=0;i<5;i++){if(await page.locator('.workload-scene').getAttribute('data-ready')==='false')break;await page.locator('#lesson-topic-next').click();}
 await expect(page.locator('.workload-scene')).toHaveAttribute('data-ready','false');await page.locator('#estimate').click();
 const timing=await page.locator('.workload-travel[data-route=query]').evaluate(async e=>{const a=e.getAnimations()[0];await a.ready;return {duration:a.effect.getTiming().duration,frames:a.effect.getKeyframes()};});expect(timing.duration).toBe(4100);
 const offsets=timing.frames.map(f=>f.offset*timing.duration);
 for(const boundary of [850,1700,3620,4100])expect(offsets.some(t=>Math.abs(t-boundary)<.01)).toBe(true);
 await expect(page.locator('.workload-scene')).toHaveAttribute('data-playback','finished',{timeout:6000});
});
const labs=[
 [1,'step','flow','#flow-scene','.flow-travel.active'],
 [2,'estimate','workload','.workload-scene','.workload-travel[data-route=http]'],
 [3,'order','scaling','.scaling-scene','.scaling-particle[data-active=true]'],
 [4,'route','balance','.balance-scene','.balance-particle[data-active=true]'],
 [5,'replication-run','replication','.replication-scene','.replication-particle'],
 [6,'cache-run','cache','.cache-scene','.cache-particle'],
 [7,'cdn-run','cdn','.cdn-scene','.cdn-particle'],
 [8,'web-run','web','.web-scene','.web-particle'],
];
const durations={1:800,2:850,3:2000,4:1200,5:2000,6:2000,7:2000,8:2000};
const baseline={1:1100,2:1152,3:3200,4:1600,5:2400,6:2700,7:2700,8:2700};
for(const [lab,run,prefix,scene,particle] of labs){
 const duration=durations[lab],timeline=duration*(lab===2?4:1);
 test(`LAB${lab} compiled ${duration}ms traversal, completion, pause and replay`,async({page},info)=>{
  await page.goto('/');await page.locator(`[data-lesson="${lab}"]`).click();
  await page.evaluate(()=>{window.motion=[];document.addEventListener('animationstart',e=>{if(e.target.matches('.flow-travel,.workload-travel')){const a=e.target.getAnimations()[0];const entry={duration:a.effect.getTiming().duration,finished:false};window.motion.push(entry);a.finished.then(()=>entry.finished=true,()=>{});}});const animate=Element.prototype.animate;Element.prototype.animate=function(...args){const a=animate.apply(this,args);if(this.matches('circle')){const entry={duration:a.effect.getTiming().duration,finished:false};window.motion.push(entry);a.finished.then(()=>entry.finished=true,()=>{});}return a;};});
  const sample=()=>page.locator(particle).first().evaluate(async e=>{const a=e.getAnimations()[0];await a.ready;return {time:a.currentTime,offset:parseFloat(getComputedStyle(e).offsetDistance),duration:a.effect.getTiming().duration};});
  await page.locator('#'+run).click();
  await expect.poll(async()=>page.locator(particle).first().evaluate(e=>e.getAnimations().length)).toBeGreaterThan(0);
  if(lab===4)expect(await page.locator(particle).evaluateAll(es=>es.map(e=>e.getAnimations()[0].effect.getTiming().delay))).toEqual([0,1200]);
  const start=await sample();await page.waitForTimeout(400);const later=await sample();
  expect(later.duration).toBe(timeline);
  expect(later.duration/(lab===2?4:1)).toBeLessThan(baseline[lab]);
  expect((later.offset-start.offset)/(later.time-start.time)).toBeCloseTo(100/duration,3);
  await page.locator(`#${prefix}-pause`).click();const frozen=await sample();await page.waitForTimeout(300);expect(await sample()).toEqual(frozen);
  await page.locator(`#${prefix}-pause`).click();
  await expect(page.locator(scene)).toHaveAttribute('data-playback','finished',{timeout:30000});
  if(lab>=5)await expect(page.locator('#'+run)).toBeEnabled({timeout:30000});
  const completed=await page.evaluate(()=>window.motion);expect(completed.length).toBeGreaterThan(0);expect(completed.every(x=>x.duration===(timeline)&&x.finished)).toBe(true);
  await page.locator(`#${prefix}-replay`).click();const replay=await sample();expect(replay.duration).toBe(timeline);expect(replay.time).toBeLessThan(700);
  await expect(page.locator(scene)).toHaveAttribute('data-playback','finished',{timeout:30000});
  if(lab>=5)await expect(page.locator('#'+run)).toBeEnabled({timeout:30000});
  expect(await page.evaluate(()=>window.motion.every(x=>x.finished))).toBe(true);
  await info.attach('measured-motion',{body:JSON.stringify({lab,start,later,frozen,replay,completed}),contentType:'application/json'});
 });
 test(`LAB${lab} reduced motion remains static`,async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.locator(`[data-lesson="${lab}"]`).click();await page.locator('#'+run).click();
  await expect(page.locator(scene)).toHaveAttribute('data-playback','finished');
  await expect(page.locator(`#${prefix}-pause`)).toBeDisabled();
  expect(await page.locator(particle).evaluateAll(es=>es.flatMap(e=>e.getAnimations()).length)).toBe(0);
 });
}
