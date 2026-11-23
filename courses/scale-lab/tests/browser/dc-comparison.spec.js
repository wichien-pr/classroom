import {test,expect} from '@playwright/test';
test('single comparison outcomes, replay, reset, themes and widths',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.dcSaves=[];const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='scale-lab-eligibility-v1')window.dcSaves.push(JSON.parse(v));return original.call(this,k,v);};});
 await page.goto('/');await page.locator('[data-lesson="9"]').click();
 await expect(page.locator('#lesson-topic-back')).toBeDisabled();await expect(page.locator('#lesson-topic-next')).toBeDisabled();
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#dc-run').click();await expect(page.locator('#dc-run')).toBeEnabled();
 await expect(page.locator('[data-dc-case="0"]')).toContainText('100 / 60');await expect(page.locator('[data-dc-case="1"]')).toContainText('40 / 60');
 expect(await page.evaluate(()=>window.dcSaves)).toEqual(Array.from({length:2},()=>[['data-centers','data-centers','dc-request']]));
 await page.locator('#dc-replay').click();await expect(page.locator('#dc-run')).toBeEnabled();expect(await page.evaluate(()=>window.dcSaves.length)).toBe(2);
 for(const width of [1280,390,320])for(const theme of ['light','dark']){
 await page.setViewportSize({width,height:1000});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:testInfo.outputPath(`${theme}-${width}.png`),fullPage:true});
 }
 await page.getByText('อ่านเพิ่มเติม · หลักการและข้อจำกัดของแบบจำลอง',{exact:true}).click();await expect(page.locator('#dc-details summary')).toHaveCount(0);await expect(page.locator('#dc-details')).toContainText('ไม่ได้รับประกัน failover');await expect(page.locator('.quiz')).toBeVisible();
 await page.locator('#reset').click();await expect(page.locator('#dc-result')).toContainText('ยังไม่ได้ทดลอง');await expect(page.locator('#dc-replay')).toBeDisabled();expect(errors).toEqual([]);
});
test('real timing pause, resume and reset cancel saves',async({page},testInfo)=>{
 await page.goto('/');await page.locator('[data-lesson="9"]').click();await page.locator('#dc-run').click();await page.locator('#dc-pause').click();await expect(page.locator('.dc-scene')).toHaveAttribute('data-playback','paused');await page.waitForTimeout(2200);await expect(page.locator('#dc-run')).toBeDisabled();
 await page.locator('#dc-pause').click();await expect(page.locator('.dc-scene')).toHaveAttribute('data-playback','running');await page.locator('#reset').click();await page.waitForTimeout(2200);await expect(page.locator('#dc-result')).toContainText('ยังไม่ได้ทดลอง');
 await page.locator('#dc-run').click();await expect(page.locator('#dc-run')).toBeEnabled({timeout:10000});await expect(page.locator('#dc-result')).toContainText('เกินกำลัง 40');
});
