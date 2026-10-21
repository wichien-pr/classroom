import {test,expect} from '@playwright/test';
for(const width of [320,390,1440])test(`LAB08 grouped controls and compact checkboxes ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/');await page.locator('[data-lesson-kind="stateless-web"]').click();
 const box=await page.locator('#web-sticky').boundingBox();expect(box.width).toBeLessThanOrEqual(24);expect(box.height).toBeLessThanOrEqual(24);
 await expect(page.getByRole('group',{name:'เส้นทางคำขอ'})).toBeVisible();
 await expect(page.getByRole('group',{name:'ความพร้อมของระบบ'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('#web-sticky').check();await page.locator('#web-request').click();await expect(page.locator('#outcome')).toContainText('OK');
});

for(const width of [320,390,1440])test(`LAB08 reading order and full-width lesson ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/');await page.locator('[data-lesson-kind="stateless-web"]').click();
 const comparison=await page.locator('#web-comparison').boundingBox(),lab=await page.locator('.lab').boundingBox(),quiz=await page.locator('.quiz').boundingBox();
 expect(comparison.y+comparison.height).toBeLessThan(lab.y);expect(quiz.y).toBeGreaterThan(lab.y+lab.height);
 const grid=await page.locator('.learning-grid').boundingBox();expect(lab.width).toBeGreaterThan(grid.width*0.95);
 await expect(page.locator('#web-details')).not.toHaveAttribute('open','');
 await page.locator('#web-details summary').click();await expect(page.locator('#web-details')).toHaveAttribute('open','');await expect(page.locator('#web-details')).toContainText('Memcached');await page.locator('#web-details summary').click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:`../../evidence/lab08/layout/after-${width}.png`,fullPage:true});
 await page.setViewportSize({width,height:2400});
 await page.locator('.control-area').evaluate(el=>scrollTo(0,scrollY+el.getBoundingClientRect().top-140));
 await page.locator('.control-area').screenshot({path:`../../evidence/lab08/layout/controls-${width}.png`});
 await page.locator('[data-lesson-kind="cdn"]').click();await expect(page.locator('#main')).not.toHaveClass(/web-lesson/);
});

test('LAB08 experiment instructions are ordered steps with separate note',async({page})=>{
 await page.goto('/');await page.locator('[data-lesson-kind="stateless-web"]').click();
 await expect(page.locator('.experiment ol > li')).toHaveCount(6);
 await expect(page.locator('.experiment ol > li').first()).toContainText('Web 2');
 await expect(page.locator('.experiment .web-step-note')).toContainText('ปุ่มส่งคำขอเท่านั้น');
});
