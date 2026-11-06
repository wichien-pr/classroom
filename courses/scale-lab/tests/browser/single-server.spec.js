import {test,expect} from '@playwright/test';
test('request and response routes never overlap',async({page})=>{
 await page.goto('/');const a=await page.locator('.flow-http-routes [data-stage="http-request"]').boundingBox(),b=await page.locator('.flow-http-routes [data-stage="http-response"]').boundingBox();expect(a.x+a.width).toBeLessThan(b.x);
});
for(const width of [320,390,1440])test(`automatic mobile JSON versus browser HTML ${width}`,async({page})=>{
 await page.setViewportSize({width,height:568});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 for(let i=0;i<3;i++)await page.locator('#flow-slide-next').click();
 await expect(page.locator('[data-node="client"]')).toContainText('Mobile app');await expect(page.locator('[data-node="client"]')).not.toContainText('HTML');
 await page.locator('#step').click();await expect(page.locator('#flow-result')).toContainText('200 · JSON');await expect(page.locator('#flow-frame')).toContainText('John Smith');
 await page.locator('#flow-slide-back').click();await expect(page.locator('#flow-result')).toHaveText('ยังไม่ได้ทดลอง');await page.locator('#step').click();await expect(page.locator('#flow-result')).toContainText('200 · HTML');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('model playback projects original DNS and HTTP stages and preserves quiz selection on reset',async({page})=>{
 await page.goto('/');await page.locator('#flow-slide-next').click();await page.locator('#flow-slide-next').click();await page.locator('#step').click();
 for(const stage of ['dns-query','dns-return','http-request','process','http-response','display'])await expect(page.locator('#flow-scene')).toHaveAttribute('data-stage',stage);
 await expect(page.locator('#flow-scene')).toHaveAttribute('data-playback','finished');
 await page.locator('[data-answer="0"]').click();await expect(page.locator('#feedback')).toContainText('ยังไม่ถูก');
 const order=await page.locator('[data-answer]').evaluateAll(es=>es.map(e=>e.dataset.answer));
 await page.locator('#reset').click();await expect(page.locator('#flow-scene')).toHaveAttribute('data-stage','ready');
 expect(await page.locator('[data-answer]').evaluateAll(es=>es.map(e=>e.dataset.answer))).toEqual(order);await expect(page.locator('[data-answer="0"]')).toHaveAttribute('aria-pressed','true');
});
