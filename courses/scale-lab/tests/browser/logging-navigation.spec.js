import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const out=process.env.LOGGING_QA_EVIDENCE||'../../evidence/lab11-merge-version-steps/navigation';
test('rapid navigation cancels, pause/resume, replay and reset',async({page})=>{
 await page.goto('/');await page.locator('[data-lesson="11"]').click();
 await page.locator('#lesson-topic-next').click();await page.locator('#lesson-topic-back').click();
 await expect(page.locator('.logging-scene')).toHaveAttribute('data-stage','blocked');
 await expect(page.locator('[data-stage=test]')).toHaveAttribute('data-status','waiting');
 await page.locator('#logging-pause').click();
 const offset=await page.locator('.logging-transit').evaluate(async e=>{await Promise.all(e.getAnimations().map(a=>a.ready));return getComputedStyle(e).offsetDistance;});
 await page.waitForTimeout(200);expect(await page.locator('.logging-transit').evaluate(e=>getComputedStyle(e).offsetDistance)).toBe(offset);
 expect(await page.locator('.logging-transit').evaluate(e=>e.getAnimations()[0].effect.getTiming().duration)).toBe(1500);
 await mkdir(out,{recursive:true});await page.locator('#lesson-topic').screenshot({path:out+'/paused.png'});
 await page.locator('#logging-pause').click();await expect(page.locator('.logging-scene')).toHaveAttribute('data-playback','finished');
 await expect(page.locator('[data-stage=test]')).toHaveAttribute('data-status','failed');
 await page.locator('#logging-replay').click();await expect(page.locator('.logging-scene')).toHaveAttribute('data-playback','running');
 await page.locator('#lesson-topic-next').click();await page.waitForTimeout(11000);await expect(page.locator('.logging-scene')).toHaveAttribute('data-stage','deployed');
 await page.locator('#reset').click();await page.waitForTimeout(1700);await expect(page.locator('.logging-scene')).toHaveAttribute('data-stage','idle');await expect(page.locator('#logging-replay')).toBeDisabled();await expect(page.locator('#lesson-topic-back')).toBeDisabled();
});
for(const theme of ['light','dark'])for(const width of [320,390,1280])test(`navigation geometry keyboard ${theme} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:800});await page.addInitScript(t=>localStorage.setItem('classroom-theme',t),theme);await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await expect(page.locator('html')).toHaveAttribute('data-theme',theme);await page.locator('[data-lesson="11"]').click();
 await expect(page.locator('#lesson-topic-title')).toHaveText('1 / 3 · Tests ไม่ผ่าน · หยุด');
 await expect(page.locator('[data-stage=test]')).toHaveAttribute('data-status','failed');
 await expect(page.locator('.logging-gate')).toContainText('ปิดทางปล่อย');
 await page.emulateMedia({reducedMotion:'reduce'});
 for(let i=0;i<3;i++){
  await expect(page.locator('#lesson-topic-title')).toContainText(`${i+1} / 3`);
  const rect=await page.locator('.lesson-topic-nav').evaluate(e=>{const box=x=>{const r=x.getBoundingClientRect();return {x:r.x,width:r.width,height:r.height};};return {nav:box(e),title:box(e.querySelector('h3')),buttons:[...e.querySelectorAll('button')].map(box)};});
  expect(Math.abs(rect.nav.x+rect.nav.width/2-rect.title.x-rect.title.width/2)).toBeLessThan(1);
  for(const b of rect.buttons){expect(b.width).toBe(48);expect(b.height).toBe(48);}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(i<2){await page.locator('#lesson-topic-next').focus();await page.keyboard.press('Enter');}
 }
 await expect(page.locator('#lesson-topic-next')).toBeDisabled();await expect(page.locator('.logging-scene')).toHaveAttribute('data-stage','observe');
 await expect(page.locator('.logging-progress progress')).toHaveAttribute('value','5');
 await mkdir(out,{recursive:true});await page.locator('#lesson-topic').screenshot({path:`${out}/final-${theme}-${width}.png`});
 await page.locator('#lesson-topic-back').focus();await page.keyboard.press('Enter');await expect(page.locator('.logging-scene')).toHaveAttribute('data-stage','deployed');
 await page.locator('#reset').click();await expect(page.locator('#lesson-topic-title')).toHaveText('1 / 3 · Tests ไม่ผ่าน · หยุด');await expect(page.locator('#lesson-topic-back')).toBeDisabled();await expect(page.locator('#lesson-topic-next')).toBeEnabled();await expect(page.locator('.logging-progress progress')).toHaveAttribute('value','1');await expect(page.locator('[data-stage=test]')).toHaveAttribute('data-status','failed');
});

test('Next and Back automatically play only the selected snapshot',async({page})=>{
 const posts=[];page.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});
 await page.goto('/');await page.locator('[data-lesson="11"]').click();
 await expect(page.locator('#lesson-topic-back')).toBeDisabled();
 await page.locator('#lesson-topic-next').click();
 await expect(page.locator('.logging-scene')).toHaveAttribute('data-stage','fix');
 await expect(page.locator('.logging-scene')).toHaveAttribute('data-playback','running');
 await expect(page.locator('.logging-scene')).toHaveAttribute('data-playback','finished');
 await page.waitForTimeout(1700);await expect(page.locator('.logging-scene')).toHaveAttribute('data-stage','deployed');
 await page.locator('#lesson-topic-back').click();
 await expect(page.locator('.logging-scene')).toHaveAttribute('data-stage','blocked');
 await expect(page.locator('.logging-scene')).toHaveAttribute('data-playback','running');
 expect(posts).toEqual([]);
});
