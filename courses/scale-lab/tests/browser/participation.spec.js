import {test,expect} from '@playwright/test';

test('standalone simulation makes no participation API calls and claims no saved account score',async({page})=>{
 const api=[];page.on('request',r=>{if(r.url().includes('/api/'))api.push(r.url());});
 await page.goto('/');await expect(page.locator('#participation-status')).toContainText('Standalone');
 await page.locator('#step').click();await expect(page.locator('#outcome')).toContainText('DNS');
 await page.locator('[data-answer="0"]').click();
 await expect(page.locator('#feedback')).toContainText('ยังไม่ถูก');
 await expect(page.locator('#progress')).toContainText('0 / 11');
 await page.locator('[data-answer="1"]').click();
 await expect(page.locator('#progress')).toContainText('1 / 11');
 await page.locator('[data-answer="1"]').click();
 await page.locator('[data-answer="0"]').click();
 await page.reload();await expect(page.locator('#progress')).toContainText('1 / 11');
 await expect(page.locator('#participation-score')).toHaveText('—');expect(api).toEqual([]);
});
