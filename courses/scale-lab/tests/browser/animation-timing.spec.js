import {test,expect} from '@playwright/test';
const evidence=process.env.ANIMATION_TIMING_EVIDENCE||'../../evidence/animation-timing-config';
const sample=loc=>loc.evaluate(async e=>{const a=e.getAnimations()[0];await a.ready;return {time:a.currentTime,duration:a.effect.getTiming().duration,offset:parseFloat(getComputedStyle(e).offsetDistance)};});
for(const theme of ['light','dark'])for(const width of [1280,390])test(`LAB01 measured experiment/replay pause cancel ${theme} ${width}`,async({page},info)=>{
 await page.setViewportSize({width,height:800});await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
 await page.locator('#step').click();const dot=page.locator('.flow-travel.active');
 const start=await sample(dot);await page.waitForTimeout(250);const later=await sample(dot);
 expect(start.duration).toBe(1500);expect(later.offset).toBeGreaterThan(start.offset);expect((later.offset-start.offset)/(later.time-start.time)).toBeCloseTo(100/1500,3);
 await page.locator('#flow-pause').click();const frozen=await sample(dot);await page.waitForTimeout(200);expect(await sample(dot)).toEqual(frozen);
 await page.locator('#flow-scene').evaluate(e=>scrollTo(0,e.getBoundingClientRect().top+scrollY-150));await page.screenshot({path:`${evidence}/lab01-${theme}-${width}.png`});
 await page.locator('#flow-pause').click();await expect(page.locator('#flow-scene')).toHaveAttribute('data-playback','finished',{timeout:15000});
 await page.locator('#flow-replay').click();const replay=await sample(dot);expect(replay.duration).toBe(1500);expect(replay.time).toBeLessThan(500);
 await page.locator('#flow-replay').click();await expect(page.locator('#flow-scene')).toHaveAttribute('data-stage','dns-return',{timeout:5000});await page.waitForTimeout(500);await expect(page.locator('#flow-scene')).toHaveAttribute('data-stage','dns-return');
 await page.locator('[data-lesson="2"]').click();await page.waitForTimeout(1700);await page.locator('[data-lesson="1"]').click();await expect(page.locator('#flow-scene')).toHaveAttribute('data-playback','idle');
 await info.attach('measurement',{body:JSON.stringify({start,later,frozen,replay}),contentType:'application/json'});
});
for(const [lab,prefix,ms] of [[9,'dc',2000],[10,'queue',1500],[11,'logging',1500]])test(`LAB${lab} retained route duration pause replay and reduced motion`,async({page},info)=>{
 await page.goto('/');await page.locator(`[data-lesson="${lab}"]`).click();await page.locator(`#${prefix}-run`).click();
 const token=page.locator(lab===9?'.dc-particle':`.${prefix}-transit`).first();const start=await sample(token);expect(start.duration).toBe(ms);
 await page.waitForTimeout(200);const later=await sample(token);expect(later.offset).toBeGreaterThan(start.offset);
 await page.locator(`#${prefix}-pause`).click();const frozen=await sample(token);await page.waitForTimeout(200);expect(await sample(token)).toEqual(frozen);
 await page.locator(`#${prefix}-pause`).click();await expect(page.locator(`#${prefix}-run`)).toBeEnabled({timeout:30000});
 await page.locator(`#${prefix}-replay`).click();expect((await sample(token)).duration).toBe(ms);
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('[data-lesson="1"]').click();await page.locator(`[data-lesson="${lab}"]`).click();await page.locator(`#${prefix}-run`).click();
 await expect(page.locator(`.${prefix}-scene`)).toHaveAttribute('data-playback','finished',{timeout:15000});
 expect(await token.evaluateAll(es=>es.flatMap(e=>e.getAnimations()).length)).toBe(0);
 await info.attach('measurement',{body:JSON.stringify({start,later,frozen}),contentType:'application/json'});
});
test('LAB12 simultaneous comparison and all placement/request batches retain named timings',async({page},info)=>{
 await page.goto('/');await page.locator('[data-lesson="12"]').click();
 await page.evaluate(()=>{window.timings=[];const animate=Element.prototype.animate;Element.prototype.animate=function(frames,options){const a=animate.call(this,frames,options);const item={className:this.className,duration:options.duration,finished:false};window.timings.push(item);a.finished.then(()=>item.finished=true,()=>{});return a;};});
 await page.locator('#tier-run').click();await expect.poll(()=>page.locator('.tier-token:not([hidden])').count()).toBe(2);
 await page.locator('#tier-pause').click();const tokens=page.locator('.tier-token:not([hidden])');const first=await sample(tokens.first());const second=await sample(tokens.nth(1));expect(first.duration).toBe(1500);expect(second.duration).toBe(1500);await page.waitForTimeout(200);expect(await sample(tokens.first())).toEqual(first);expect(await sample(tokens.nth(1))).toEqual(second);
 await page.locator('#tier-pause').click();await expect(page.locator('#tier-run')).toBeEnabled({timeout:15000});
 await page.locator('#lesson-topic-next').click();await expect(page.locator('.tier-scene')).toHaveAttribute('data-playback','finished',{timeout:15000});
 const measured=await page.evaluate(()=>window.timings);expect(measured.every(x=>x.finished)).toBe(true);
 expect(measured.filter(x=>x.className==='tier-token').map(x=>x.duration)).toEqual([1500,1500,...Array(4).fill(1200),...Array(16).fill(1000)]);
 expect(measured.filter(x=>x.className==='tier-capacity').map(x=>x.duration)).toEqual([900,900,900]);expect(measured.at(-1).duration).toBe(1600);
 await page.locator('#tier-replay').click();await expect(page.locator('.tier-scene')).toHaveAttribute('data-playback','finished',{timeout:15000});
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#tier-replay').click();await expect(page.locator('.tier-scene')).toHaveAttribute('data-playback','finished');expect(await page.locator('.tier-token').evaluateAll(es=>es.flatMap(e=>e.getAnimations()).length)).toBe(0);
 await info.attach('all-stage-timings',{body:JSON.stringify(measured),contentType:'application/json'});
});

test('LAB01 all four topics await every DNS and HTTP connector on experiment and replay',async({page},info)=>{
 await page.goto('/');
 await page.evaluate(()=>{window.traversals=[];document.addEventListener('animationstart',e=>{if(!e.target.matches('.flow-travel'))return;const a=e.target.getAnimations()[0],entry={stage:e.target.dataset.stage,duration:a.effect.getTiming().duration,finished:false,end:null};window.traversals.push(entry);a.finished.then(()=>{entry.finished=true;entry.end=a.currentTime;},()=>{});});});
 const topics=[];
 for(let topic=0;topic<4;topic++){
  await page.evaluate(()=>window.traversals=[]);await page.locator('#step').click();await expect(page.locator('#flow-scene')).toHaveAttribute('data-playback','finished',{timeout:20000});
  const experiment=await page.evaluate(()=>window.traversals);expect(experiment.length).toBeGreaterThan(0);expect(experiment.every(t=>t.finished&&t.duration===1500),JSON.stringify(experiment)).toBe(true);
  await page.evaluate(()=>window.traversals=[]);await page.locator('#flow-replay').click();await expect(page.locator('#flow-scene')).toHaveAttribute('data-playback','finished',{timeout:20000});
  const replay=await page.evaluate(()=>window.traversals);expect(replay).toEqual(experiment);topics.push({topic,experiment,replay});
  if(topic<3)await page.locator('#flow-slide-next').click();
 }
 expect(new Set(topics.flatMap(t=>t.experiment.map(x=>x.stage)))).toEqual(new Set(['dns-query','dns-return','http-request','http-response']));
 await info.attach('all-flow-topics',{body:JSON.stringify(topics),contentType:'application/json'});
});
