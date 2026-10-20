import {test,expect} from '@playwright/test';
test('LAB 03 compares power and pool, direct outage and routed spare',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.locator('[data-lesson="3"]').click();
 await expect(page.locator('h1')).toContainText('Vertical scaling');
 await page.locator('#order').click();await expect(page.locator('#outcome')).toContainText('โหลดเกิน');
 await page.locator('#scale-power').fill('3');await page.locator('#order').click();await expect(page.locator('#outcome')).toContainText('รับโหลดได้');
 await page.locator('#scale-down').check();await page.locator('#order').click();await expect(page.locator('#outcome')).toContainText('เข้าใช้งานไม่ได้');
 await page.locator('#scale-servers').fill('3');await page.locator('#order').click();await expect(page.locator('#outcome')).toContainText('เข้าใช้งานไม่ได้');
 await page.locator('#scale-balanced').check();await page.locator('#order').click();await expect(page.locator('#outcome')).toContainText('รับโหลดได้');
 await expect(page.locator('#state-view')).toContainText('6 หน่วย');
 await page.locator('#scale-power').fill('5');await page.locator('#order').click();await expect(page.locator('#outcome')).toContainText('กรุณากรอก');
 await expect(page.locator('#state-view')).toContainText('6 หน่วย');
 await page.locator('[data-answer="0"]').click();await expect(page.locator('#feedback')).toContainText('ยังไม่ถูก');
 await page.locator('#reset').click();await expect(page.locator('#scale-power')).toHaveValue('1');await expect(page.locator('#scale-down')).not.toBeChecked();
 for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:1000});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('#architecture').scrollIntoViewIfNeeded();
  await page.locator('#architecture').screenshot({path:`evidence/lab03-diagram-${width}.png`});
 }
 await page.locator('#order').focus();await page.keyboard.press('Enter');await expect(page.locator('#outcome')).toContainText('โหลดเกิน');
 expect(errors).toEqual([]);
});
