import {test,expect} from '@playwright/test';
test('LAB08 fresh comparison, retained results, replay, reset and readable themes',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.webSaves=[];const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='scale-lab-eligibility-v1')window.webSaves.push(JSON.parse(value));return original.call(this,key,value);};});
 await page.goto('/');await page.locator('[data-lesson="8"]').click();
 await expect(page.locator('.web-scene')).toBeVisible();
 await expect(page.locator('#lesson-topic-back')).toBeDisabled();await expect(page.locator('#lesson-topic-next')).toBeDisabled();
 await expect(page.locator('.web-status-pool')).toHaveCount(0);
 await expect(page.locator('[data-request-result="waiting"]')).toHaveCount(4);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.locator('#web-run').click();await expect(page.locator('#web-run')).toBeEnabled();
 expect(await page.locator('[data-request-result]').evaluateAll(es=>es.map(e=>e.dataset.requestResult))).toEqual(['OK','NO_SESSION','OK','OK']);
 await expect(page.locator('#web-result')).toContainText('Web B รู้ว่าเป็นเมย์');
 expect(await page.evaluate(()=>window.webSaves)).toEqual(Array.from({length:4},()=>[['stateless-web','stateless-web','web-request']]));
 await page.locator('#web-replay').click();await expect(page.locator('#web-run')).toBeEnabled();
 expect(await page.evaluate(()=>window.webSaves.length)).toBe(4);
 expect(await page.locator('[data-request-result]').evaluateAll(es=>es.map(e=>e.dataset.requestResult))).toEqual(['OK','NO_SESSION','OK','OK']);
 for(const width of [1280,390,320])for(const theme of ['light','dark']){
  await page.setViewportSize({width,height:1000});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const runBox=await page.locator('#web-run').boundingBox(), replayBox=await page.locator('#web-replay').boundingBox(), feedbackBox=await page.locator('.web-scene .workload-feedback').boundingBox();
  expect(replayBox.y).toBe(runBox.y);expect(feedbackBox.y).toBeGreaterThanOrEqual(runBox.y+runBox.height);
  for(const id of ['#web-run','#web-replay','#web-pause'])expect((await page.locator(id).boundingBox()).height).toBeGreaterThanOrEqual(44);
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:testInfo.outputPath(`${theme}-${width}.png`),fullPage:true});
  expect(await page.locator('.web-comparison-case strong').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(16);
 }
 await page.locator('#web-details summary').click();await expect(page.locator('#web-details')).toContainText('store ล่ม');
 await expect(page.locator('.quiz')).toBeVisible();
 await page.locator('#reset').click();await expect(page.locator('#web-result')).toContainText('ยังไม่ได้ทดลอง');await expect(page.locator('#web-replay')).toBeDisabled();
 await expect(page.locator('[data-request-result="waiting"]')).toHaveCount(4);
 await page.locator('[data-lesson="7"]').click();await page.locator('[data-lesson="8"]').click();await expect(page.locator('#web-result')).toContainText('ยังไม่ได้ทดลอง');
 expect(errors).toEqual([]);
});
test('LAB08 real-time pause, resume and reset cancel later requests',async({page},testInfo)=>{
 await page.goto('/');await page.locator('[data-lesson="8"]').click();await page.locator('#web-run').click();
 await expect(page.locator('#web-pause')).toBeEnabled();await page.locator('#web-pause').click();
 await expect(page.locator('.web-scene')).toHaveAttribute('data-playback','paused');
 await page.waitForTimeout(2200);await expect(page.locator('.web-scene')).toHaveAttribute('data-condition','0');
 await page.locator('#web-pause').click();await expect(page.locator('.web-scene')).toHaveAttribute('data-playback','running');
 await page.locator('#reset').click();await page.waitForTimeout(2200);await expect(page.locator('#web-result')).toContainText('ยังไม่ได้ทดลอง');
 await page.locator('#web-run').click();await expect(page.locator('#web-run')).toBeEnabled({timeout:35000});
 expect(await page.locator('[data-request-result]').evaluateAll(es=>es.map(e=>e.dataset.requestResult))).toEqual(['OK','NO_SESSION','OK','OK']);
});
