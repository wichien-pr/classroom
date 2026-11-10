import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const evidence=process.env.LOGGING_QA_EVIDENCE||'../../evidence/lab11-current';
test('LAB11 preserves quiz/reset and unrelated lessons',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.locator('[data-lesson="11"]').click();await page.emulateMedia({reducedMotion:'reduce'});
 await expect(page.locator('#main')).toHaveClass(/sequence-lesson/);await page.locator('#logging-run').click();await expect(page.locator('[data-stage=test]')).toHaveAttribute('data-status','failed');
 await page.locator('[data-answer="1"]').click();await page.locator('#reset').click();await expect(page.locator('#logging-result')).toHaveText('ยังไม่ได้ทดลอง');await expect(page.locator('[data-answer="1"]')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#main')).not.toContainText('.pdf');await expect(page.locator('#next')).toHaveCount(0);await page.locator('[data-lesson="1"]').click();await expect(page.locator('[data-lesson="1"]')).toHaveAttribute('aria-current','page');expect(errors).toEqual([]);
});
for(const width of [320,390,1440])test(`LAB11 readable and accessible ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1100});await page.goto('/');await page.locator('[data-lesson="11"]').click();
 await expect(page.locator('.lesson-steps li')).toHaveCount(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(await page.locator('.logging-scene').evaluate(e=>Math.min(...[...e.querySelectorAll('p,strong,li')].map(x=>parseFloat(getComputedStyle(x).fontSize))))).toBeGreaterThanOrEqual(14);
 expect(await page.locator('.logging-scene').evaluate(root=>{const lum=c=>{const v=c.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;});return v[0]*.2126+v[1]*.7152+v[2]*.0722;};return Math.min(...[...root.querySelectorAll('p,strong,li,figcaption')].map(e=>{let bg=e;while(getComputedStyle(bg).backgroundColor==='rgba(0, 0, 0, 0)')bg=bg.parentElement;const a=lum(getComputedStyle(e).color),b=lum(getComputedStyle(bg).backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);}));})).toBeGreaterThanOrEqual(4.5);
 const term=page.locator('.lesson-intro .term-trigger').filter({hasText:/Logging/i}).first();await term.focus();await page.keyboard.press('Enter');await expect(page.locator('#term-hint')).toBeVisible();await page.keyboard.press('Escape');await expect(term).toBeFocused();
 expect(await page.locator('.controls .term-trigger').count()).toBe(0);
 fs.mkdirSync(evidence,{recursive:true});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`${evidence}/layout-${width}.png`,fullPage:true});
 await page.setViewportSize({width,height:2000});await page.locator('.logging-scene').scrollIntoViewIfNeeded();await page.locator('.logging-scene').screenshot({path:`${evidence}/diagram-${width}.png`});
});
