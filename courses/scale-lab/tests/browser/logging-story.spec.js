import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const evidence=process.env.LOGGING_QA_EVIDENCE||'../../evidence/lab11-merge-version-steps';
const keys=['blocked','deployed','observe'];
for(const theme of ['light','dark'])for(const width of [320,1280])test(`viewport captures ${theme} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:800});await page.addInitScript(t=>localStorage.setItem('classroom-theme',t),theme);
 await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.locator('[data-lesson="11"]').click();await page.emulateMedia({reducedMotion:'reduce'});
 await expect(page.locator('#lesson-topic .experiment')).toHaveCount(0);
 await page.locator('#lesson-topic-next').click();await page.locator('#lesson-topic-back').click();await expect(page.locator('.logging-scene')).toHaveAttribute('data-playback','finished');
 await page.locator('#lesson-topic-title').scrollIntoViewIfNeeded();await page.evaluate(()=>scrollBy(0,-150));
 await mkdir(evidence,{recursive:true});await page.screenshot({path:`${evidence}/viewport-${theme}-${width}.png`});
 await page.locator('#logging-run').scrollIntoViewIfNeeded();await page.screenshot({path:`${evidence}/controls-${theme}-${width}.png`});
});
for(const theme of ['light','dark'])for(const width of [1280,390,320])test(`selected-page controls ${theme} ${width}`,async({page})=>{
 test.setTimeout(180000);
 await page.setViewportSize({width,height:800});await page.addInitScript(t=>localStorage.setItem('classroom-theme',t),theme);
 await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.locator('[data-lesson="11"]').click();
 const posts=[];page.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});
 // Every real-time animation must settle on its page, including primary and replay.
 for(let i=0;i<3;i++){
  if(i){await page.locator('#lesson-topic-next').click();await expect(page.locator('.logging-scene')).toHaveAttribute('data-playback','finished');await expect(page.locator('.logging-scene')).toHaveAttribute('data-stage',keys[i]);await page.waitForTimeout(200);await expect(page.locator('#lesson-topic-title')).toContainText(`${i+1} / 3`);}
  await page.locator('#logging-run').click();await expect(page.locator('#logging-run')).toBeEnabled();
  await expect(page.locator('.logging-scene')).toHaveAttribute('data-playback','finished');
  await page.waitForTimeout(100);
  await expect(page.locator('.logging-scene')).toHaveAttribute('data-stage',keys[i]);
  await expect(page.locator('#logging-run')).toHaveAccessibleName('ทดลองขั้นนี้ · บันทึกกิจกรรม');
  await page.locator('#logging-replay').click();await expect(page.locator('.logging-scene')).toHaveAttribute('data-playback','finished');
  await expect(page.locator('.logging-scene')).toHaveAttribute('data-stage',keys[i]);
  if(i===0||i===1){
   await mkdir(evidence,{recursive:true});await page.setViewportSize({width,height:1800});
   await page.locator('#lesson-topic').evaluate(e=>scrollTo(0,e.getBoundingClientRect().top+scrollY-160));
   await page.locator('#lesson-topic').screenshot({path:`${evidence}/page-${i+1}-${theme}-${width}.png`});
   await page.setViewportSize({width,height:800});
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.waitForTimeout(3300);await expect(page.locator('.logging-scene')).toHaveAttribute('data-stage','observe');
 await expect(page.locator('#lesson-topic-next')).toBeDisabled();await expect(page.locator('.logging-metric-panel')).toHaveCount(3);
 await mkdir(evidence,{recursive:true});await page.setViewportSize({width,height:3800});await page.locator('#lesson-topic').evaluate(e=>scrollTo(0,e.getBoundingClientRect().top+scrollY-160));await page.locator('#lesson-topic').screenshot({path:`${evidence}/final-${theme}-${width}.png`});await page.setViewportSize({width,height:800});
 for(let i=1;i>=0;i--){
  await page.locator('#lesson-topic-back').click();await expect(page.locator('.logging-scene')).toHaveAttribute('data-playback','running');
  await expect(page.locator('.logging-scene')).toHaveAttribute('data-playback','finished');
  await expect(page.locator('.logging-scene')).toHaveAttribute('data-stage',keys[i]);
 }
 await page.waitForTimeout(1700);await expect(page.locator('.logging-scene')).toHaveAttribute('data-stage','blocked');
 await expect(page.locator('#lesson-topic-back')).toBeDisabled();await expect(page.locator('#complete-lesson')).toBeDisabled();expect(posts).toEqual([]);
 await page.locator('#reset').click();await expect(page.locator('.logging-scene')).toHaveAttribute('data-stage','idle');
 await expect(page.locator('#logging-replay')).toBeDisabled();
});
test('rapid navigation, pause, selected replay and reset cancel old work',async({page})=>{
 await page.goto('/');await page.locator('[data-lesson="11"]').click();
 await page.locator('#lesson-topic-next').click();await page.locator('#lesson-topic-back').click();
 await page.locator('#logging-run').click();await page.locator('#logging-pause').click();
 const token=page.locator('.logging-transit');await expect(token).toHaveText('v.1');
 const offset=await token.evaluate(async e=>{await Promise.all(e.getAnimations().map(a=>a.ready));return getComputedStyle(e).offsetDistance;});
 expect(await token.evaluate(e=>e.getAnimations()[0].effect.getTiming().duration)).toBe(1500);
 await page.waitForTimeout(200);expect(await token.evaluate(e=>getComputedStyle(e).offsetDistance)).toBe(offset);
 await mkdir(evidence,{recursive:true});await page.locator('#lesson-topic').screenshot({path:evidence+'/paused.png'});
 await page.locator('#logging-pause').click();await expect(page.locator('.logging-scene')).toHaveAttribute('data-playback','finished');
 await page.waitForTimeout(1700);await expect(page.locator('.logging-scene')).toHaveAttribute('data-stage','blocked');
 await page.locator('#logging-replay').click();await page.locator('#lesson-topic-next').click();await page.waitForTimeout(11000);await expect(page.locator('.logging-scene')).toHaveAttribute('data-stage','deployed');
 await page.locator('#logging-run').click();await page.locator('#reset').click();await page.waitForTimeout(3300);await expect(page.locator('.logging-scene')).toHaveAttribute('data-stage','idle');
 await expect(page.locator('#complete-lesson')).toBeDisabled();
});
