import {test,expect} from '@playwright/test';
test('Lab01 uses requested language examples without visible PDF attribution',async({page})=>{
 await page.goto('/');
 await expect(page.locator('body')).not.toContainText('ตาม Single-server-setup.pdf หน้า 1–3');
 await expect(page.locator('body')).toContainText('Java/Python/Go/Rust หรืออื่นๆ');
 await expect(page.locator('#flow-scene')).toContainText('Java / Python / Go / Rust หรืออื่นๆ');
 for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:1000});
  const labels=page.locator('.flow-server span,.flow-server strong');expect(await labels.count()).toBeGreaterThan(0);
  expect(await labels.evaluateAll(es=>es.every(el=>{const b=el.getBoundingClientRect(),host=el.closest('.flow-server').getBoundingClientRect();return b.x>=host.x&&b.right<=host.right;}))).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
