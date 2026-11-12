import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const evidence=process.env.QA_EVIDENCE||'../../evidence/lab12-parallel';
test('capacity pause freezes all sections; reset and exit cancel their animations',async({page})=>{
 await page.goto('/');await page.locator('[data-lesson="12"]').click();await page.locator('#tier-replay').click();
 await expect(page.locator('.tier-scene')).toHaveAttribute('data-phase','capacity');await page.locator('#tier-pause').click();
 const sample=()=>page.evaluate(()=>[...document.querySelectorAll('.tier-capacity')].map(e=>e.getAnimations()[0].currentTime));
 await page.evaluate(()=>Promise.all(document.getAnimations().map(a=>a.ready)));const frozen=await sample();await page.waitForTimeout(200);expect(await sample()).toEqual(frozen);
 await page.evaluate(()=>window.oldTierAnimations=[...document.querySelector('.tier-scene').getAnimations({subtree:true})]);
 await page.locator('#reset').click();expect(await page.evaluate(()=>window.oldTierAnimations.every(a=>a.playState==='idle'))).toBe(true);
 await page.locator('#tier-replay').click();await page.evaluate(()=>window.oldTierAnimations=[...document.querySelector('.tier-scene').getAnimations({subtree:true})]);await page.locator('[data-lesson="11"]').click();
 expect(await page.evaluate(()=>window.oldTierAnimations.every(a=>a.playState==='idle'))).toBe(true);await page.waitForTimeout(1800);await expect(page.locator('.tier-scene')).toHaveCount(0);
});
for(const theme of ['light','dark'])for(const width of [1280,390,320])test(`simultaneous comparison ${theme} ${width}`,async({page})=>{
 await mkdir(evidence,{recursive:true});await page.setViewportSize({width,height:800});await page.goto('/');
 await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.classroomTheme=theme;},theme);
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.locator('[data-lesson="12"]').click();
 await expect(page.locator('.tier-comparison')).toHaveCount(3);
 const checkRemovedBlock=async()=>{
  await expect(page.locator('.tier-single .tier-bridge, .tier-single .tier-shard-preview, .tier-single .tier-next-hint, .tier-single .tier-assumptions')).toHaveCount(0);
  await expect(page.locator('.tier-single')).not.toContainText('ถ้าโตเกินเครื่องเดียว?');
  await expect(page.locator('.tier-single')).not.toContainText('ขอบเขตแบบจำลอง');
  const gap=await page.locator('.tier-single').evaluate(e=>({last:e.lastElementChild.className,bottom:e.getBoundingClientRect().bottom-e.querySelector('.tier-toolbar').getBoundingClientRect().bottom,outer:document.querySelector('#lesson-topic').getBoundingClientRect().bottom-e.getBoundingClientRect().bottom}));
  expect(gap.last).toBe('tier-toolbar');expect(gap.bottom).toBeGreaterThanOrEqual(0);expect(gap.bottom).toBeLessThanOrEqual(20);expect(gap.outer).toBeLessThanOrEqual(32);
 };
 await checkRemovedBlock();
 for(const action of ['#tier-run','#tier-replay']){
  await page.locator(action).click();
  await expect.poll(()=>page.evaluate(()=>[...document.querySelectorAll('.tier-comparison')].map(e=>e.getAnimations({subtree:true}).filter(a=>a.playState==='running').length))).toEqual([1,1,1]);
  const times=()=>page.evaluate(()=>[...document.querySelectorAll('.tier-comparison')].map(e=>e.getAnimations({subtree:true})[0]?.currentTime));
  await page.evaluate(()=>Promise.all([...document.querySelectorAll('.tier-comparison')].flatMap(e=>e.getAnimations({subtree:true})).map(a=>a.ready)));
  const before=await times();await page.waitForTimeout(150);const after=await times();after.forEach((t,i)=>expect(t).toBeGreaterThan(before[i]));
  await page.locator('#tier-pause').click();await page.evaluate(()=>Promise.all(document.getAnimations().map(a=>a.ready)));const frozen=await times();await page.waitForTimeout(150);expect(await times()).toEqual(frozen);
  expect(await page.locator('.tier-capacity').evaluateAll(es=>es.map(e=>e.style.width))).toEqual(['25%','100%','100%']);
  expect(await page.locator('.tier-node').evaluateAll(es=>es.map(e=>e.dataset.down))).toEqual(['false','false','true']);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  const boxes=await page.locator('.tier-comparison').evaluateAll(es=>es.map(e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y};}));
  if(width===1280){expect(boxes[0].y).toBe(boxes[2].y);expect(boxes[2].x).toBeGreaterThan(boxes[0].x);}else expect(boxes[2].y).toBeGreaterThan(boxes[1].y);
  await checkRemovedBlock();
  if(action==='#tier-replay'){
   const box=await page.locator('#lesson-topic').boundingBox();await page.setViewportSize({width,height:Math.ceil(box.height)+220});await page.locator('#lesson-topic').screenshot({path:`${evidence}/${theme}-${width}.png`});await page.setViewportSize({width,height:800});
  }
  await page.locator('#tier-pause').click();await expect(page.locator('.tier-scene')).toHaveAttribute('data-playback','finished',{timeout:15000});await expect(page.locator('#tier-run')).toBeEnabled();await expect(page.locator('.tier-comparison')).toHaveCount(3);
 }
 await page.locator('#tier-replay').click();await page.locator('#reset').click();await expect(page.locator('.tier-scene')).toHaveAttribute('data-playback','idle');await page.waitForTimeout(1800);await expect(page.locator('.tier-scene')).toHaveAttribute('data-playback','idle');
 await page.locator('#tier-replay').click();await page.locator('#lesson-topic-next').click();await expect(page.locator('.tier-comparison')).toHaveCount(0);await expect(page.locator('#lesson-topic-title')).toContainText('2 / 2');
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#tier-replay').click();await expect(page.locator('.tier-scene')).toHaveAttribute('data-playback','finished');expect(await page.locator('.tier-load').allTextContents()).toEqual(['ภาระ 4 / 8','ภาระ 4 / 8','ภาระ 4 / 8','ภาระ 4 / 8']);
 await expect(page.locator('.tier-migration, .tier-move-count')).toHaveCount(0);await expect(page.locator('#lesson-topic-next')).toBeDisabled();
 await page.locator('#reset').click();await page.locator('#tier-replay').click();await expect(page.locator('.tier-scene')).toHaveAttribute('data-playback','finished');expect(await page.locator('.tier-token:not([hidden])').count()).toBe(0);expect(errors).toEqual([]);
});
