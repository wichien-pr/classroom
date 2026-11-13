import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {scalingPreset} from '../../src/scaling-presets.js';
import {evaluateScaling} from '../../src/scaling.js';
const out=process.env.CAPACITY_EVIDENCE||new URL('../../../../evidence/lab03-capacity/',import.meta.url).pathname;
for(const width of [1280,390,320])for(const theme of ['light','dark'])test(`all capacity topics ${width} ${theme}`,async({page})=>{
 await page.setViewportSize({width,height:1800});await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.locator('[data-lesson="3"]').click();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await mkdir(out,{recursive:true});
 for(let i=0;i<5;i++){
  const c=scalingPreset(i),r=evaluateScaling(c),scale=Math.max(c.traffic,r.capacity);
  const scene=page.locator('.scaling-scene');await expect(page.locator('#lesson-topic-title')).toContainText(`${i+1} / 5`);
  await expect(scene).toHaveAttribute('data-status','unrun');await expect(page.locator('.scaling-capacity')).toContainText('รอผลการทดลอง');
  await page.locator('#order').click();await expect(scene).toHaveAttribute('data-status',r.status);
  await expect(page.locator('.scaling-capacity')).toContainText(`กำลังที่เข้าถึงได้ ${r.capacity} หน่วย`);
  await expect(page.locator('.scaling-excess')).toContainText(`เกินกำลัง ${Math.max(0,c.traffic-r.capacity)} หน่วย`);
  if(i>=2)await expect(page.locator('.scaling-capacity')).toHaveAttribute('aria-label','เปรียบเทียบโหลดกับกำลัง Web tier');
  for(const p of await page.locator('.scaling-particle[data-active=true]').all())expect(await p.evaluate(e=>e.getAnimations()[0].effect.getTiming().duration)).toBe(2000);
  await expect.poll(()=>page.locator('.scaling-load-fill').evaluate(e=>e.getAnimations()[0].currentTime),{intervals:[20]}).toBeGreaterThan(2150);
  await page.locator('#scaling-pause').click();await scene.evaluate(async e=>Promise.all(e.getAnimations({subtree:true}).map(a=>a.ready)));
  const times=()=>scene.evaluate(e=>e.getAnimations({subtree:true}).map(a=>a.currentTime));const frozen=await times();await page.waitForTimeout(100);expect(await times()).toEqual(frozen);
  const fraction=await page.locator('.scaling-load-fill').evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).a);expect(fraction).toBeGreaterThan(0);expect(fraction).toBeLessThan(1);
  await page.mouse.move(0,0);await scene.evaluate(e=>{document.activeElement.blur();scrollBy(0,e.getBoundingClientRect().top-130);});await scene.screenshot({path:`${out}/${width}-${theme}-topic${i+1}-intermediate.png`});
  await page.locator('#scaling-pause').click();await expect(scene).toHaveAttribute('data-playback','finished');
  const bars=await scene.evaluate(e=>{const w=s=>e.querySelector(s).getBoundingClientRect().width;return [w('.scaling-load-track'),w('.scaling-load-fill'),w('.scaling-capacity-track i'),w('.scaling-excess-bar')];});
  expect(bars[1]/bars[0]).toBeCloseTo(c.traffic/scale,2);expect(bars[2]/bars[0]).toBeCloseTo(r.capacity/scale,2);expect(bars[3]/bars[0]).toBeCloseTo(Math.max(0,c.traffic-r.capacity)/scale,2);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.mouse.move(0,0);await scene.evaluate(e=>{document.activeElement.blur();scrollBy(0,e.getBoundingClientRect().top-130);});await scene.screenshot({path:`${out}/${width}-${theme}-topic${i+1}-final.png`});
  await page.locator('#scaling-replay').click();await expect(scene).toHaveAttribute('data-playback','running');
  await page.emulateMedia({reducedMotion:'reduce'});await expect(scene).toHaveAttribute('data-playback','finished');await page.locator('#scaling-replay').click();await expect(page.locator('#scaling-pause')).toBeDisabled();
  await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('#scaling-replay').click();
  if(i<4){await page.locator('#lesson-topic-next').click();await page.waitForTimeout(3900);await expect(scene).toHaveAttribute('data-playback','idle');}
 }
 await expect(page.locator('#lesson-topic-next')).toBeDisabled();expect(errors).toEqual([]);
});
