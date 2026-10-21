import {test,expect} from '@playwright/test';
const kinds=["workload","stock","balance","replica","cache","cdn"];
test('main actions precede supplementary controls and CDN labels stay together',async({page})=>{
 await page.setViewportSize({width:320,height:1000});await page.goto('/');
 for(const [kind,main,extra] of [['cache','#read-cache','.cache-extras'],['replica','#write','.replication-controls:last-of-type']]){
  await page.locator(`[data-lesson-kind="${kind}"]`).click();
  expect(await page.locator(main).evaluate((el,selector)=>!!(el.compareDocumentPosition(document.querySelector(selector))&Node.DOCUMENT_POSITION_FOLLOWING),extra)).toBe(true);
 }
 await page.locator('[data-lesson-kind="cdn"]').click();await expect(page.locator('label:has(#cdn-fallback)')).toHaveCSS('flex-wrap','nowrap');
});
for(const kind of kinds)for(const width of [320,390,1440])test(`${kind} full-width lesson ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/');await page.locator(`[data-lesson-kind="${kind}"]`).click();
 await expect(page.locator('#main')).toHaveClass(/sequence-lesson/);
 const grid=await page.locator('.learning-grid').boundingBox(),comparison=await page.locator('.lesson-comparison').boundingBox(),lab=await page.locator('.lab').boundingBox(),quiz=await page.locator('.quiz').boundingBox();
 expect(comparison.y+comparison.height).toBeLessThan(lab.y);expect(quiz.y).toBeGreaterThan(lab.y+lab.height);expect(lab.width).toBeGreaterThan(grid.width*.95);
 expect(await page.locator('.experiment ol > li').count()).toBeGreaterThanOrEqual(4);
 await expect(page.locator('#lesson-details')).not.toHaveAttribute('open','');await page.locator('#lesson-details summary').click();await expect(page.locator('#lesson-details .lesson-notes')).toBeVisible();expect(await page.locator('body').innerText()).not.toMatch(/คู่มือต้นฉบับ|หน้า\s*\d|LAB 06 เป็น session/);expect(await page.locator('.lesson-notes :is(.cdn-figure,.cache-failure,.replication-diagram) .term-trigger').evaluateAll(es=>es.every(e=>getComputedStyle(e).color!=='rgb(188, 232, 252)'))).toBe(true);await page.locator('#lesson-details summary').click();
 await expect(page.locator('.controls fieldset')).not.toHaveCount(0);
 if(await page.locator('.controls > fieldset').count()===1){const group=await page.locator('.controls > fieldset').boundingBox(),controls=await page.locator('.controls').boundingBox();expect(group.width).toBeGreaterThan(controls.width*.95);}
 for(const checkbox of await page.locator('.controls input[type=checkbox]').all()){const b=await checkbox.boundingBox();expect(b.width).toBeLessThanOrEqual(24);expect(b.height).toBeLessThanOrEqual(24);}
 const term=page.locator('.lesson-comparison .term-trigger').first();await term.focus();await page.keyboard.press('Enter');await expect(page.locator('#term-hint')).toBeVisible();expect(await page.locator('#term-hint').evaluate(el=>{const b=el.getBoundingClientRect();return b.left>=0&&b.right<=innerWidth})).toBe(true);await page.keyboard.press('Escape');await expect(term).toBeFocused();await page.mouse.move(0,0);await expect(term).toHaveCSS('color','rgb(188, 232, 252)');
 await expect(page.locator('.lesson-intro .term-trigger')).not.toHaveCount(0);await expect(page.locator('label .term-trigger,.answers .term-trigger,button button')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`../../evidence/lab02-07-layout/${kind}-${width}.png`,fullPage:true});
 await page.setViewportSize({width,height:2400});await page.locator('.control-area').evaluate(el=>scrollTo(0,scrollY+el.getBoundingClientRect().top-140));await page.locator('.control-area').screenshot({path:`../../evidence/lab02-07-layout/${kind}-controls-${width}.png`});
 await page.locator('[data-lesson-kind="flow"]').click();await expect(page.locator('#main')).not.toHaveClass(/sequence-lesson/);
 await page.locator(`[data-lesson-kind="${kind}"]`).click();await expect(page.locator('.lesson-comparison')).toHaveCount(1);
});
