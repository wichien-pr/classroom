import {test,expect} from '@playwright/test';
test('learning console request flow, navigation, quiz and reset',async({page})=>{
 await page.goto('/'); await expect(page.getByText('ไม่ใช่ benchmark จริง',{exact:false}).first()).toBeVisible();
 await expect(page.locator('[data-lesson]')).toHaveCount(11);
 await page.getByRole('button',{name:'เดิน request 1 ขั้น'}).click();await expect(page.locator('#event-log')).toContainText('DNS');
 await page.getByRole('button',{name:'เริ่มการทดลองใหม่'}).click();await expect(page.locator('#event-log')).toContainText('พร้อมทดลอง');
 await page.locator('[data-answer="0"]').click();await expect(page.locator('#feedback')).toContainText('ยังไม่ถูก');
 await page.locator('[data-answer="1"]').click();await expect(page.locator('#feedback')).toContainText('ถูกต้อง');
 await page.reload();await expect(page.locator('#progress')).toContainText('1 / 11');
});
