import {test,expect} from '@playwright/test';
test('LAB01 moved glossary remains accessible and results use a grid',async({page})=>{
 await page.setViewportSize({width:320,height:1000});await page.goto('/');
 const term=page.locator('.flow-steps li').first().getByRole('button',{name:'อธิบายคำศัพท์ DNS',exact:true});
 await term.focus();await page.keyboard.press('Enter');await expect(page.locator('#term-hint')).toBeVisible();
 expect(await page.locator('#term-hint').evaluate(el=>{const b=el.getBoundingClientRect();return b.left>=0&&b.right<=innerWidth})).toBe(true);
 await page.keyboard.press('Escape');await expect(term).toBeFocused();
 await expect(page.locator('.flow-intro .term-trigger')).not.toHaveCount(0);
 await page.locator('#flow-details summary').click();await expect(page.locator('#flow-details .term-trigger')).not.toHaveCount(0);
 const dark=page.locator('#flow-comparison .term-trigger').first();await expect(dark).toHaveCSS('color','rgb(188, 232, 252)');await dark.hover();await expect(dark).toHaveCSS('color','rgb(255, 255, 255)');
 await expect(page.locator('#state-view')).toHaveCSS('display','grid');
 await expect(page.locator('button button, label .term-trigger, select .term-trigger, .answers .term-trigger')).toHaveCount(0);
});
for(const width of [320,390,1440])test(`LAB01 follows LAB08 reading order ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/');
 await expect(page.locator('#main')).toHaveClass(/flow-lesson/);
 const comparison=await page.locator('#flow-comparison').boundingBox(),lab=await page.locator('.lab').boundingBox(),quiz=await page.locator('.quiz').boundingBox(),grid=await page.locator('.learning-grid').boundingBox();
 expect(comparison.y+comparison.height).toBeLessThan(lab.y);expect(quiz.y).toBeGreaterThan(lab.y+lab.height);expect(lab.width).toBeGreaterThan(grid.width*.95);
 await expect(page.locator('.experiment ol > li')).toHaveCount(4);
 await expect(page.locator('#flow-details')).not.toHaveAttribute('open','');
 await page.locator('#flow-details summary').click();await expect(page.locator('#flow-details')).toContainText('HTTPS');await page.locator('#flow-details summary').click();
 await expect(page.getByRole('group',{name:'แหล่งคำขอ'})).toBeVisible();
 await page.locator('#flow-client').selectOption('mobile');for(let i=0;i<6;i++)await page.locator('#step').click();await expect(page.locator('#flow-payload')).toContainText('"id": 12');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`../../evidence/lab01-layout/after-${width}.png`,fullPage:true});
 await page.locator('[data-lesson-kind="stateless-web"]').click();await expect(page.locator('#main')).not.toHaveClass(/flow-lesson/);await expect(page.locator('#web-comparison')).toBeVisible();
 await page.locator('[data-lesson-kind="flow"]').click();await expect(page.locator('#flow-comparison')).toHaveCount(1);await expect(page.locator('#flow-client')).toHaveValue('browser');
});
