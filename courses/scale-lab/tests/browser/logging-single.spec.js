import {test,expect} from '@playwright/test';
test('permitted Deploy token travels its actual connector',async({page},testInfo)=>{
 await page.goto('/');await page.locator('[data-lesson="11"]').click();await page.locator('#logging-candidate').selectOption('fixed');await page.locator('#logging-run').click();
 for(const [key,label] of [['deployed','v.2']]){
 await page.waitForFunction(k=>document.querySelector('.logging-scene')?.dataset.stage===k&&document.querySelector('.logging-transit')?.getAnimations().length,key);
 await page.locator('#logging-pause').click();await expect(page.locator('.logging-transit')).toHaveText(label);
 const g=await page.locator('.logging-transit').evaluate(async t=>{await t.getAnimations()[0].ready;const p=t.parentElement.querySelector('path'),r=t.getBoundingClientRect(),m=p.getScreenCTM(),pos=p.getPointAtLength(p.getTotalLength()*parseFloat(getComputedStyle(t).offsetDistance)/100).matrixTransform(m);return {error:Math.hypot(pos.x-r.x-r.width/2,pos.y-r.y-r.height/2),duration:t.getAnimations()[0].effect.getTiming().duration};});expect(g.error).toBeLessThan(1);expect(g.duration).toBe(1500);
 if(key==='deployed')await expect(page.locator('[data-stage=test]')).toHaveAttribute('data-status','passed');else await expect(page.locator('.logging-event')).toHaveCount(0);
 await page.locator('#logging-pause').click();
 }
 await expect(page.locator('#logging-run')).toBeEnabled({timeout:15000});await expect(page.locator('.logging-event')).toHaveCount(0);
});
for(const theme of ['light','dark'])for(const width of [1280,390,320])test(`${theme} ${width}: candidates, moving tokens, pause, replay, reset`,async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewportSize({width,height:900});await page.goto('/');await page.locator('[data-lesson="11"]').click();await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
 await expect(page.locator('#lesson-topic-next')).toBeEnabled();await expect(page.locator('#lesson-topic-back')).toBeDisabled();await expect(page.locator('#lesson-topic-title')).toHaveText('1 / 2 · ก่อนปล่อย · Build / Test / Deploy');
 for(const [candidate,label] of [['broken','v.1'],['fixed','v.2']]){
 await page.locator('#logging-candidate').selectOption(candidate);await expect(page.locator('.logging-code strong')).toHaveText(label);await page.locator('#logging-run').click();
 await page.waitForFunction(()=>document.querySelector('.logging-transit')?.getAnimations().length);
 await page.locator('#logging-pause').click();
 const token=page.locator('.logging-transit');await expect(token).toHaveText(label);
 const before=await token.evaluate(async t=>{const a=t.getAnimations()[0];await a.ready;return {duration:a.effect.getTiming().duration,position:getComputedStyle(t).offsetDistance};});expect(before.duration).toBe(1500);
 await page.waitForTimeout(180);expect(await token.evaluate(t=>getComputedStyle(t).offsetDistance)).toBe(before.position);
 const geometry=await token.evaluate(t=>{const r=t.getBoundingClientRect(),p=t.parentElement.querySelector('path'),pos=p.getPointAtLength(p.getTotalLength()*parseFloat(getComputedStyle(t).offsetDistance)/100).matrixTransform(p.getScreenCTM());return Math.hypot(pos.x-r.x-r.width/2,pos.y-r.y-r.height/2);});expect(geometry).toBeLessThan(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.setViewportSize({width,height:2200});await page.locator('.logging-scene').scrollIntoViewIfNeeded();await page.locator('.logging-scene').screenshot({path:testInfo.outputPath(`${theme}-${width}-${candidate}-paused.png`)});await page.setViewportSize({width,height:900});
 await page.locator('#logging-pause').click();await expect.poll(()=>token.evaluate(t=>getComputedStyle(t).offsetDistance)).not.toBe(before.position);
 await expect(page.locator('#logging-run')).toBeEnabled({timeout:20000});
 if(theme==='dark')expect(await page.locator('#logging-replay').evaluate(e=>getComputedStyle(e).backgroundColor)).not.toBe('rgb(255, 255, 255)');
 await expect(page.locator('.logging-event')).toHaveCount(0);await expect(page.locator('[data-metric],.logging-evidence')).toHaveCount(0);await expect(page.locator('[data-stage=deploy]')).toHaveAttribute('data-status',candidate==='fixed'?'passed':'waiting');await expect(page.locator('[data-stage=test]')).toHaveAttribute('data-status',candidate==='fixed'?'passed':'failed');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.setViewportSize({width,height:2200});await page.locator('.logging-scene').scrollIntoViewIfNeeded();await page.locator('.logging-scene').screenshot({path:testInfo.outputPath(`${theme}-${width}-${candidate}-result.png`)});await page.setViewportSize({width,height:900});
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#logging-replay').click();await expect(page.locator('#logging-run')).toBeEnabled();await expect(page.locator('.logging-event')).toHaveCount(0);
 await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('#logging-replay').click();await page.locator('#reset').click();await page.waitForTimeout(1800);await expect(page.locator('#logging-result')).toHaveText('ยังไม่ได้ทดลอง');await expect(page.locator('#logging-candidate')).toHaveValue('broken');await expect(page.locator('#logging-replay')).toBeDisabled();expect(errors).toEqual([]);
});
