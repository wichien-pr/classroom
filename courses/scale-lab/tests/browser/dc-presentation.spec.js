import {test,expect} from '@playwright/test';
for(const theme of ['light','dark'])test(`short mobile keyboard controls and result ${theme}`,async({page})=>{
 await page.setViewportSize({width:320,height:600});await page.goto(process.env.LAB09_PREVIEW_URL||'/');await page.locator('[data-lesson="9"]').click();await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.emulateMedia({reducedMotion:'reduce'});
 await page.keyboard.press('Tab');
 for(const id of ['#lesson-topic-next','#reset','#dc-run']){
  const b=page.locator(id);await b.evaluate(e=>window.scrollBy(0,e.getBoundingClientRect().top-140));await b.focus();
  const m=await b.evaluate(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e,'::after'),icon=e.querySelector('svg').getBoundingClientRect();return {outline:getComputedStyle(e).outlineStyle,visible:s.visibility,left:r.left+parseFloat(s.left),width:parseFloat(s.width)+parseFloat(s.paddingLeft)+parseFloat(s.paddingRight),iconInside:icon.left>=r.left&&icon.right<=r.right&&icon.top>=r.top&&icon.bottom<=r.bottom};});
  expect(m.outline).not.toBe('none');expect(m.iconInside).toBe(true);expect(m.visible).toBe('visible');expect(m.left).toBeGreaterThanOrEqual(0);expect(m.left+m.width).toBeLessThanOrEqual(320);
 }
 await page.keyboard.press('Enter');await expect(page.locator('#dc-run')).toBeEnabled();await expect(page.locator('#dc-run')).toBeFocused();
 const gap=await page.evaluate(()=>document.querySelector('#dc-result').getBoundingClientRect().top-document.querySelector('#dc-run').getBoundingClientRect().bottom);expect(gap).toBeLessThan(170);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('LAB09 independent presets and compact guided workspace preserve all outcomes',async({page})=>{
 await page.goto(process.env.LAB09_PREVIEW_URL||'/');await page.locator('[data-lesson="9"]').click();await page.emulateMedia({reducedMotion:'reduce'});
 await expect(page.locator('.dc-scene')).toBeVisible();await expect(page.locator('#lesson-topic-settings')).toHaveCount(0);
 for(let i=0;i<6;i++){
  await expect(page.locator('#dc-result')).toContainText('ยังไม่ได้ทดลอง');await page.locator('#dc-run').click();await expect(page.locator('#dc-run')).toBeEnabled();
  await expect(page.locator('#dc-result')).toContainText(['60 / West 40','ล่ม 40','DNS เดิม','60 → 100','ขาดข้อมูล 40','เกินกำลัง 40'][i]);
  await expect(page.locator('.dc-details, #dc-route')).toHaveCount(0);
  expect((await page.locator('#dc-result').innerText()).length).toBeLessThan(150);
  if(i<5)await page.locator('#lesson-topic-next').click();
 }
 await page.locator('#reset').click();await expect(page.locator('#lesson-topic-title')).toContainText('1 / 6');await expect(page.locator('#dc-result')).toContainText('ยังไม่ได้ทดลอง');
});
