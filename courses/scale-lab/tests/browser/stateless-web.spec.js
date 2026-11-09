import {test,expect} from '@playwright/test';
const open=async page=>{await page.goto('/');await page.getByRole('button',{name:/Stateless web tier/}).click();await page.emulateMedia({reducedMotion:'reduce'});};
test('routing and shared state remain separate dependencies in independent presets',async({page})=>{
 await open(page);const results=['NO_SESSION','OK','OK','OK','OK','STORE_UNAVAILABLE','NO_WEB'];
 for(let i=0;i<results.length;i++){
  await page.locator('#web-run').click();await expect(page.locator('#web-run')).toBeEnabled();await expect(page.locator('#web-result')).toContainText(results[i]);
  if(i===4)await expect(page.locator('#web-result')).toContainText('Web 3');
  if(i<results.length-1)await page.locator('#lesson-topic-next').click();
 }
});
for(const width of [320,390,1440])test(`stateless figures readable ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await open(page);
 await expect(page.locator('.web-scene')).toBeVisible();await expect(page.locator('#web-comparison')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(await page.locator('body').innerText()).not.toMatch(/PDF|คู่มือต้นฉบับ|หน้า\s*\d/i);
 const styles=await page.locator('.web-box').first().evaluate(el=>({color:getComputedStyle(el).color,background:getComputedStyle(el).backgroundColor,font:parseFloat(getComputedStyle(el).fontSize)}));
 expect(styles.color).toBe('rgb(233, 240, 249)');expect(styles.background).toBe('rgb(23, 39, 59)');expect(styles.font).toBeGreaterThanOrEqual(14);
 await page.locator('#web-run').focus();await page.keyboard.press('Enter');await expect(page.locator('#web-result')).toContainText('NO_SESSION');
});
