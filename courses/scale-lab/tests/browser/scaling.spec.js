import {test,expect} from '@playwright/test';
test('LAB 03 compares power and pool, direct outage and routed spare',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.locator('[data-lesson="3"]').click();
 await expect(page.locator('h1')).toContainText('Vertical scaling');
 for(const result of ['โหลดเกิน','รับโหลดได้','เข้าใช้งานไม่ได้','รับโหลดได้']){
  await page.locator('#order').click();await expect(page.locator('#scaling-result')).toContainText(result);
  await page.locator('#lesson-topic-next').click();
 }
 await page.locator('#order').click();await expect(page.locator('#scaling-result')).toContainText('โหลด 20 / กำลัง 6 หน่วย');
 await page.locator('[data-answer="0"]').click();await expect(page.locator('#feedback')).toContainText('ยังไม่ถูก');
 await page.locator('#reset').click();await expect(page.locator('#lesson-topic-title')).toContainText('1 / 5');await expect(page.locator('#scaling-result')).toContainText('ยังไม่ได้ทดลอง');
 for(const width of [320,390,1440]){await page.setViewportSize({width,height:800});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.locator('#order').focus();await page.keyboard.press('Enter');await expect(page.locator('#scaling-result')).toContainText('โหลดเกิน');expect(errors).toEqual([]);
});
