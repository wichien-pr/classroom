import {test,expect} from '@playwright/test';
import {mkdirSync,appendFileSync} from 'node:fs';
const evidence=process.env.READ_MORE_EVIDENCE;
for(const theme of ['light','dark'])for(const width of [1280,390,320])test(`read-more 14px ${theme} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/');
 await page.evaluate(t=>{localStorage.setItem('classroom-theme',t);document.documentElement.dataset.theme=t;},theme);
 for(let lab=1;lab<=12;lab++){
  await page.locator(`[data-lesson="${lab}"]`).click();
  const reading=page.locator('details').filter({has:page.locator(':scope > summary', {hasText:'อ่านเพิ่มเติม'})});
  await expect(reading).toHaveCount(1);await expect(reading).not.toHaveAttribute('open','');
  await expect(reading.locator(':scope > summary')).toHaveCSS('font-size','14px');
  const outside=await page.locator('.lab button,.quiz button,.quiz h2').evaluateAll(es=>es.map(e=>[e.id,e.textContent,getComputedStyle(e).fontSize]));expect(outside.length).toBeGreaterThan(0);
  await reading.locator(':scope > summary').click();await expect(reading).toHaveAttribute('open','');
  await reading.locator('details').evaluateAll(es=>es.forEach(e=>e.open=true));
  const sizes=await reading.evaluate(root=>[root,...root.querySelectorAll('*')].filter(e=>[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())).map(e=>({tag:e.tagName,text:e.textContent.slice(0,60),size:getComputedStyle(e).fontSize})));
  expect(sizes.length).toBeGreaterThan(1);expect(sizes.filter(e=>e.size!=='14px')).toEqual([]);
  const terms=reading.locator('.term-trigger');expect(await terms.count()).toBeGreaterThan(0);
  const term=terms.first();await term.focus();await page.keyboard.press('Enter');await expect(page.locator('#term-hint')).toBeVisible();await expect(page.locator('#term-meaning')).not.toBeEmpty();
  expect(await page.locator('#term-hint').evaluate(e=>{const b=e.getBoundingClientRect();return b.left>=0&&b.right<=innerWidth;})).toBe(true);
  await page.keyboard.press('Escape');await expect(term).toBeFocused();await expect(page.locator('#term-hint')).not.toBeVisible();
  expect(await reading.evaluate(root=>[...root.querySelectorAll('p,li,h2,h3,small,pre,figcaption')].filter(e=>e.getClientRects().length).every(e=>e.scrollWidth<=e.clientWidth+1))).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await page.locator('.lab button,.quiz button,.quiz h2').evaluateAll(es=>es.map(e=>[e.id,e.textContent,getComputedStyle(e).fontSize]))).toEqual(outside);
  if(evidence){mkdirSync(evidence,{recursive:true});appendFileSync(`${evidence}/checks.jsonl`,JSON.stringify({lab,theme,width,id:await reading.getAttribute('id'),textNodes:sizes.length,glossary:await terms.count(),sizes:[...new Set(sizes.map(e=>e.size))]})+'\n');
   if([1,6,8,12].includes(lab)&&width!==390){await reading.evaluate(e=>scrollTo(0,scrollY+e.getBoundingClientRect().top-120));await page.screenshot({path:`${evidence}/lab${lab}-${theme}-${width}.png`});}}
  await reading.locator(':scope > summary').click();await expect(reading).not.toHaveAttribute('open','');
 }
});
