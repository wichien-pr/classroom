import {test,expect} from '@playwright/test';
test('LAB08 independent topics, centered controls, compact player and original outcomes',async({page})=>{
 await page.goto('/');await page.locator('[data-lesson="8"]').click();
 await expect(page.locator('.web-scene')).toBeVisible();
 await page.emulateMedia({reducedMotion:'reduce'});
 const outcomes=['NO_SESSION','OK','OK','OK','OK','STORE_UNAVAILABLE','NO_WEB'];
 for(let i=0;i<7;i++){
  await expect(page.locator('#web-result')).toContainText('ยังไม่ได้ทดลอง');
  await expect(page.locator('#web-replay')).toBeDisabled();
  await page.locator('#web-run').click();await expect(page.locator('#web-run')).toBeEnabled();
  await expect(page.locator('#web-result')).toContainText(outcomes[i]);
  await page.locator('#web-replay').click();await expect(page.locator('#web-run')).toBeEnabled();
  await expect(page.locator('.web-premise')).toContainText('คำขอ 1');
  if(i<6)await page.locator('#lesson-topic-next').click();
 }
 for(const width of [1280,390,320])for(const theme of ['light','dark']){
  await page.setViewportSize({width,height:740});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const b=await page.locator('#web-run').boundingBox(),r=await page.locator('#web-replay').boundingBox(),p=await page.locator('#web-pause').boundingBox();
  expect(b.height).toBeGreaterThanOrEqual(48);expect(b.width).toBeGreaterThanOrEqual(48);expect(r.y).toBe(b.y);expect(p.y).toBe(b.y);
  const nav=await page.locator('.lesson-topic-nav').boundingBox(),h=await page.locator('#lesson-topic-title').boundingBox();expect(Math.abs(nav.x+nav.width/2-h.x-h.width/2)).toBeLessThan(1);
 }
 await expect(page.locator('#lesson-topic-settings')).toHaveCount(0);
 await expect(page.locator('#web-details')).toContainText('Memcached');
});
