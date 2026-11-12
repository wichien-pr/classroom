import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';

for(const width of [1280,390,320])for(const theme of ['dark','light']){
 test(`LAB01 thinking type and wrapping ${theme} ${width}`,async({page})=>{
  await page.setViewportSize({width,height:800});
  await page.goto('/');
  await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
  await page.locator('[data-answer="1"]').click();
  await expect(page.locator('#feedback')).toContainText('ถูกต้อง —');
  const sizes=await page.locator('.flow-lesson .quiz').evaluate(q=>{
   const measure=e=>({size:getComputedStyle(e).fontSize,line:getComputedStyle(e).lineHeight,clip:e.scrollWidth>e.clientWidth+1});
   return {choices:[...q.querySelectorAll('[data-answer]')].map(measure),feedback:measure(q.querySelector('#feedback')),badges:[...q.querySelectorAll('[data-answer] span')].map(measure),terms:[...q.querySelectorAll('#feedback .term-trigger')].map(measure)};
  });
  for(const c of sizes.choices)expect(c).toMatchObject({size:'16px',line:'25.6px',clip:false});
  expect(sizes.feedback).toMatchObject({size:'14px',line:'22.4px',clip:false});
  expect(sizes.badges).toHaveLength(2);
  expect(sizes.terms.length).toBeGreaterThan(0);
  for(const b of sizes.badges)expect(parseFloat(b.size)).toBeGreaterThanOrEqual(12);
  for(const t of sizes.terms)expect(t.size).toBe('14px');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const evidence=process.env.FLOW_THINKING_EVIDENCE||'../../evidence/flow-thinking';
  await mkdir(evidence,{recursive:true});
  await page.locator('.quiz').scrollIntoViewIfNeeded();
  await page.screenshot({path:`${evidence}/${theme}-${width}.png`});
  await page.locator('[data-lesson="2"]').click();
  expect(await page.locator('[data-answer]').first().evaluate(e=>getComputedStyle(e).fontSize)).toBe('15px');
  await page.locator('[data-lesson="1"]').click();
  await expect(page.locator('[data-answer="1"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#feedback')).toContainText('ถูกต้อง —');
 });
}
