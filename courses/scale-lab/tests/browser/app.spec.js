import {test,expect} from '@playwright/test';
test('learning console request flow, navigation, quiz and reset',async({page})=>{
 await page.goto('/'); await expect(page.getByText('ไม่ใช่ benchmark จริง',{exact:false}).first()).toBeVisible();
 await expect(page.locator('[data-lesson]')).toHaveCount(12);
 await page.locator('#step').click();await expect(page.locator('#flow-result')).toContainText('DNS');
 await page.locator('#reset').click();await expect(page.locator('#flow-result')).toContainText('ยังไม่ได้ทดลอง');
 await page.locator('[data-answer="0"]').click();await expect(page.locator('#feedback')).toContainText('ยังไม่ถูก');
 await page.locator('[data-answer="1"]').click();await expect(page.locator('#feedback')).toContainText('ถูกต้อง');
 await expect(page.locator('#progress')).toContainText('0 / 12');await page.locator('#complete-lesson').click();await page.reload();await expect(page.locator('#progress')).toContainText('1 / 12');
});
