import {test,expect} from '@playwright/test';
import fs from 'node:fs';
test('photo queue separates outages, scales workers and resets without losing thinking selection',async({page})=>{
 await page.goto('/');await page.locator('[data-lesson="10"]').click();
 await expect(page.locator('#main h1')).toContainText('Message queue');
 await expect(page.locator('#main')).toHaveClass(/sequence-lesson/);
 await expect(page.locator('.lesson-steps li')).toHaveCount(6);
 await page.locator('#mq-consumer').uncheck();await page.locator('#enqueue-jobs').click();
 await expect(page.locator('#mq-backlog')).toHaveText('3');
 await page.locator('#process-jobs').click();await expect(page.locator('#mq-backlog')).toHaveText('3');
 await page.locator('#mq-producer').uncheck();await page.locator('#mq-consumer').check();
 await page.locator('#process-jobs').click();await expect(page.locator('#mq-backlog')).toHaveText('2');
 await page.locator('#mq-workers').selectOption('4');await page.locator('#process-jobs').click();
 await expect(page.locator('#mq-backlog')).toHaveText('0');
 await page.locator('[data-answer="1"]').click();await page.locator('#reset').click();
 await expect(page.locator('#mq-done')).toHaveText('0');
 await expect(page.locator('[data-answer="1"]')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#main')).not.toContainText('.pdf');
});
test('queue glossary supports keyboard and keeps controls clean',async({page})=>{
 await page.setViewportSize({width:320,height:1000});await page.goto('/');await page.locator('[data-lesson="10"]').click();
 const term=page.locator('.lesson-intro .term-trigger').filter({hasText:/Producer/i}).first();
 await expect(term).toBeVisible();await term.focus();await page.keyboard.press('Enter');
 await expect(page.locator('#term-hint')).toBeVisible();await page.keyboard.press('Escape');await expect(term).toBeFocused();
 expect(await page.locator('.controls .term-trigger').count()).toBe(0);
 await page.locator('[data-lesson="9"]').click();await page.locator('[data-lesson="10"]').click();await expect(term).toBeVisible();
});
for(const width of [320,390,1440])test(`queue readable full-width layout ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/');await page.locator('[data-lesson="10"]').click();
 await expect(page.locator('#mq-diagram')).toBeVisible();
 expect(await page.locator('.mq-arrow').first().evaluate(e=>getComputedStyle(e,'::after').content)).toBe(width>900?'"→"':'"↓"');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const contrast=await page.locator('#mq-diagram').evaluate(root=>{
  const lum=c=>{const rgb=c.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
  return [...root.querySelectorAll('p,strong,li,figcaption')].map(e=>{let bg=e;while(getComputedStyle(bg).backgroundColor==='rgba(0, 0, 0, 0)')bg=bg.parentElement;const a=lum(getComputedStyle(e).color),b=lum(getComputedStyle(bg).backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);});
 });expect(Math.min(...contrast)).toBeGreaterThanOrEqual(4.5);
 expect(await page.locator('#mq-diagram').evaluate(e=>Math.min(...[...e.querySelectorAll('strong,p,li')].map(x=>parseFloat(getComputedStyle(x).fontSize))))).toBeGreaterThanOrEqual(14);
 fs.mkdirSync('evidence/lab10',{recursive:true});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`evidence/lab10/layout-${width}.png`,fullPage:true});
 await page.locator('#mq-diagram').screenshot({path:`evidence/lab10/diagram-${width}.png`});
});
