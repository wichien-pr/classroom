import {test,expect} from '@playwright/test';
const open=async page=>{await page.goto('/');await page.getByRole('button',{name:/Stateless web tier/}).click();};
test('routing and shared state are separate dependencies',async({page})=>{
 await open(page);await page.locator('#web-request').click();await expect(page.locator('#outcome')).toContainText('NO_SESSION');
 await page.locator('#web-sticky').check();await page.locator('#web-request').click();await expect(page.locator('#outcome')).toContainText('OK');
 await page.locator('#web-up-0').uncheck();await page.locator('#web-request').click();await expect(page.locator('#outcome')).toContainText('NO_SESSION');
 await page.locator('#web-mode').selectOption('shared');await page.locator('#web-request').click();await expect(page.locator('#outcome')).toContainText('OK');
 await page.locator('#web-up-2').check();await page.locator('#web-target').selectOption('2');await page.locator('#web-sticky').uncheck();await page.locator('#web-request').click();await expect(page.locator('#outcome')).toContainText('Web 3');
 await page.locator('#web-store').uncheck();await page.locator('#web-request').click();await expect(page.locator('#outcome')).toContainText('STORE_UNAVAILABLE');
});
for(const width of [320,390,1440])test(`stateless figures readable ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await open(page);
 await expect(page.locator('#web-diagram')).toBeVisible();await expect(page.locator('#web-comparison')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(await page.locator('body').innerText()).not.toMatch(/PDF|คู่มือต้นฉบับ|หน้า\s*\d/i);
 const styles=await page.locator('.web-box').first().evaluate(el=>({color:getComputedStyle(el).color,background:getComputedStyle(el).backgroundColor,font:parseFloat(getComputedStyle(el).fontSize)}));
 expect(styles.color).toBe('rgb(233, 240, 249)');expect(styles.background).toBe('rgb(23, 39, 59)');expect(styles.font).toBeGreaterThanOrEqual(14);
 await page.locator('#web-request').focus();await page.keyboard.press('Enter');await expect(page.locator('#outcome')).toContainText('NO_SESSION');
});
