import {test,expect} from '@playwright/test';
test('LAB08 removes only the introductory explanation while preserving reading and simulation',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.locator('[data-lesson="8"]').click();
 await expect(page.getByRole('heading',{name:'Stateless Web ≠ ไม่มีสถานะ',exact:true})).toHaveCount(0);
 for(const text of ['Cookie บอกว่าจะค้น session ใด','สิ่งที่เปลี่ยนคือที่เก็บ session','ไม่ใช่ส่งสำเนา session จาก A ไป B'])await expect(page.getByText(text,{exact:false})).toHaveCount(0);
 await expect(page.locator('#web-comparison,.web-compare-section')).toHaveCount(0);
 await expect(page.locator('.web-scene')).toBeVisible();
 await expect(page.locator('.web-comparison-case')).toHaveCount(2);
 await page.locator('#web-details > summary').click();
 await expect(page.getByRole('heading',{name:'เมื่อ B หา session ไม่พบ',exact:true})).toBeVisible();
 await expect(page.locator('#web-details')).toContainText('ตัวอย่างนี้แยกเฉพาะ session ออกจาก Web ไม่ได้พิสูจน์ว่า state ทั้งหมดของแอปเป็น stateless');
 await expect(page.locator('#web-details')).toContainText('ไม่ได้ทำให้ระบบมี HA อัตโนมัติ');
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#web-run').click();
 await expect(page.locator('#web-run')).toBeEnabled();
 expect(await page.locator('[data-request-result]').evaluateAll(es=>es.map(e=>e.dataset.requestResult))).toEqual(['OK','NO_SESSION','OK','OK']);
 await page.locator('#reset').click();await expect(page.locator('[data-request-result="waiting"]')).toHaveCount(4);
 await expect(page.locator('.quiz')).toBeVisible();expect(errors).toEqual([]);
});
