import {test,expect} from '@playwright/test';
import fs from 'node:fs';
test('LAB11 compares evidence and gates deployment without changing other lessons',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.locator('[data-lesson="11"]').click();
 await expect(page.locator('#main')).toHaveClass(/sequence-lesson/);
 await page.locator('#inspect-logs').click();await expect(page.locator('#logging-results')).toContainText('ไม่พบ');
 await page.locator('#log-scope').selectOption('all');await page.locator('#inspect-logs').click();await expect(page.locator('#logging-results')).toContainText('DB_TIMEOUT');await expect(page.locator('#logging-results')).toContainText('PHOTO_JOB_FAILED');
 for(const [group,text] of [['host','CPU'],['tier','900 ms'],['business','1,200']]){await page.locator('#metric-group').selectOption(group);await page.locator('#inspect-metrics').click();await expect(page.locator('#metric-results')).toContainText(text);}
 await page.locator('#run-pipeline').click();await page.locator('#run-pipeline').click();await expect(page.locator('#pipeline-status')).toHaveText('Tests ไม่ผ่าน · หยุดก่อน deploy');
 await page.locator('#run-pipeline').click();await expect(page.locator('#pipeline-status')).toHaveText('Tests ไม่ผ่าน · หยุดก่อน deploy');
 await page.locator('#code-version').selectOption('fixed');for(let i=0;i<3;i++)await page.locator('#run-pipeline').click();await expect(page.locator('#pipeline-status')).toHaveText('Deploy จำลองแล้ว');
 await page.locator('[data-answer="1"]').click();await page.locator('#reset').click();await expect(page.locator('#pipeline-status')).toHaveText('รอ Build');await expect(page.locator('[data-answer="1"]')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#main')).not.toContainText('.pdf');await page.locator('#next').click();await expect(page.locator('[data-lesson="1"]')).toHaveAttribute('aria-current','page');expect(errors).toEqual([]);
});
for(const width of [320,390,1440])test(`LAB11 readable and accessible ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1100});await page.goto('/');await page.locator('[data-lesson="11"]').click();
 await expect(page.locator('.lesson-steps li')).toHaveCount(6);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(await page.locator('#logging-diagram').evaluate(e=>Math.min(...[...e.querySelectorAll('p,strong,li')].map(x=>parseFloat(getComputedStyle(x).fontSize))))).toBeGreaterThanOrEqual(14);
 expect(await page.locator('#logging-diagram').evaluate(root=>{const lum=c=>{const v=c.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;});return v[0]*.2126+v[1]*.7152+v[2]*.0722;};return Math.min(...[...root.querySelectorAll('p,strong,li,figcaption')].map(e=>{let bg=e;while(getComputedStyle(bg).backgroundColor==='rgba(0, 0, 0, 0)')bg=bg.parentElement;const a=lum(getComputedStyle(e).color),b=lum(getComputedStyle(bg).backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);}));})).toBeGreaterThanOrEqual(4.5);
 const term=page.locator('.lesson-intro .term-trigger').filter({hasText:/Logging/i}).first();await term.focus();await page.keyboard.press('Enter');await expect(page.locator('#term-hint')).toBeVisible();await page.keyboard.press('Escape');await expect(term).toBeFocused();
 expect(await page.locator('.controls .term-trigger').count()).toBe(0);
 fs.mkdirSync('evidence/lab11',{recursive:true});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`evidence/lab11/layout-${width}.png`,fullPage:true});
 await page.setViewportSize({width,height:2000});await page.locator('#logging-diagram').scrollIntoViewIfNeeded();await page.locator('#logging-diagram').screenshot({path:`evidence/lab11/diagram-${width}.png`});
});
