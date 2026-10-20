import {test,expect} from '@playwright/test';
test('Lab01 uses requested language examples without visible PDF attribution',async({page})=>{
 await page.goto('/');
 await expect(page.locator('body')).not.toContainText('ตาม Single-server-setup.pdf หน้า 1–3');
 await expect(page.locator('body')).toContainText('Java/Python/Go/Rust หรืออื่นๆ');
 await expect(page.locator('#architecture svg')).toContainText('Java/Python/Go/Rust หรืออื่นๆ');
 for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:1000});
  expect(await page.locator('[data-host="single"] text').evaluateAll(es=>es.every(el=>{const b=el.getBBox();return b.x>=20&&b.x+b.width<=380;}))).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
