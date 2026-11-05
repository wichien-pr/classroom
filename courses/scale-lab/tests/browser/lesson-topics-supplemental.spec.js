import {test,expect} from '@playwright/test';
for(const width of [1280,390,320])for(const theme of ['light','dark'])test(`LAB02 omits supplemental block ${width} ${theme}`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width,height:800});await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.locator('[data-lesson-kind=workload]').click();
 for(let i=0;i<4;i++){
  await expect(page.locator('.lab .observation,.lab #outcome,.lab .event-area,.lab #event-log,.lab .lesson-topic-history,.lab #workload-help,.lab .lesson-step-note,.lab .lesson-topic-note')).toHaveCount(0);
  await expect(page.locator('#workload-result')).toContainText('กดทดลอง');
  await page.locator('#estimate').click();
  await expect(page.locator('#workload-result')).toContainText(i===2?'อ่านข้อมูลไม่ได้':i===1?'ร่วมกัน':'แยกกันได้');
  if(i===3)for(const verdict of ['ทบทวนตัวเลือก','เหมาะเป็นจุดเริ่มต้น']){await page.locator('#estimate').click();await expect(page.locator('#workload-result')).toContainText(verdict);}
  const ax=await page.locator('.lab').ariaSnapshot();expect(ax).not.toMatch(/ผลล่าสุด|เหตุผลและข้อควรระวัง|วิธีใช้และการข้ามหัวข้อ|บันทึกเหตุการณ์และข้อจำกัด|บันทึกเหตุการณ์/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const gap=await page.evaluate(()=>{const lab=document.querySelector('.lab').getBoundingClientRect(),scene=document.querySelector('.workload-scene').getBoundingClientRect();return lab.bottom-scene.bottom;});expect(gap).toBeLessThan(50);
  if(i<3)await page.locator('#lesson-topic-next').click();
 }
 await expect(page.locator('.quiz [data-answer]')).toHaveCount(2);
 await page.locator('#estimate').evaluate(e=>window.scrollBy(0,e.getBoundingClientRect().top-180));await page.screenshot({path:`../../evidence/lab02-supplemental/${theme}-${width}-action.png`});
 await page.locator('#reset').click();await expect(page.locator('#workload-result')).toContainText('กดทดลอง');
 await page.locator('[data-lesson-kind=stock]').click();await expect(page.locator('#outcome')).toBeVisible();await expect(page.locator('.lesson-topic-history #event-log')).toHaveCount(1);
 expect(errors).toEqual([]);
});
