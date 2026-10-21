import {test,expect} from '@playwright/test';
test('CDN request journey: miss hit stale expiry invalidation version and explicit fallback',async({page})=>{
 await page.goto('/');await page.locator('[data-lesson="7"]').click();
 await page.locator('#decision').click();await expect(page.locator('#outcome')).toContainText('MISS');
 await page.locator('#decision').click();await expect(page.locator('#outcome')).toContainText('HIT');
 await page.locator('#cdn-publish').click();await page.locator('#decision').click();await expect(page.locator('#outcome')).toContainText('STALE');
 for(let i=0;i<3;i++)await page.locator('#cdn-tick').click();await page.locator('#decision').click();await expect(page.locator('#outcome')).toContainText('version 2');
 await page.locator('#cdn-invalidate').click();await page.locator('#decision').click();await expect(page.locator('#outcome')).toContainText('MISS');
 await page.locator('#cdn-publish').click();await page.locator('#cdn-version').click();await page.locator('#decision').click();await expect(page.locator('#outcome')).toContainText('version 3');
 await page.locator('#cdn-up').uncheck();await page.locator('#decision').click();await expect(page.locator('#outcome')).toContainText('FAILURE');
 await page.locator('#cdn-fallback').check();await page.locator('#decision').click();await expect(page.locator('#outcome')).toContainText('FALLBACK');
 await page.locator('#cdn-origin-up').uncheck();await page.locator('#decision').click();await expect(page.locator('#outcome')).toContainText('FAILURE');
});
for(const width of [320,390,1440])test(`CDN accessible figures and no attribution at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/');await page.locator('[data-lesson="7"]').click();
 await expect(page.locator('#cdn-diagram')).toBeVisible();await page.locator('#lesson-details summary').click();await expect(page.locator('#cdn-distance')).toBeVisible();await expect(page.locator('#cdn-system')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(await page.locator('body').innerText()).not.toMatch(/cdn\.pdf|PDF|คู่มือต้นฉบับ|หน้า\s*\d/i);
 await page.locator('#decision').focus();await page.keyboard.press('Enter');await expect(page.locator('#outcome')).toContainText('MISS');
});
