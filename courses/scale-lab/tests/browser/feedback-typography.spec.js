import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
const evidence='/Users/prommeesee/.hermes/cache/scratch/feedback-typography';
mkdirSync(evidence,{recursive:true});
for(const theme of ['light','dark'])for(const width of [1280,390,320])test(`feedback 14px ${theme} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/');
 await page.evaluate(t=>{localStorage.setItem('classroom-theme',t);document.documentElement.dataset.theme=t;},theme);
 const rows=[];const outside=[];
 for(let lab=1;lab<=12;lab++){
  await page.locator(`[data-lesson="${lab}"]`).click();
  outside.push(await page.locator('.answers button,.answers button > span,.quiz h2').evaluateAll(es=>es.map(e=>({text:e.textContent,size:getComputedStyle(e).fontSize}))));
  for(const answer of [0,1]){
   await page.locator(`[data-answer="${answer}"]`).click();
   const feedback=page.locator('.quiz #feedback');await expect(feedback).toContainText(answer===1?'ถูกต้อง —':'ยังไม่ถูก —');
   const sizes=await feedback.evaluate(root=>[root,...root.querySelectorAll('*')].filter(e=>e.textContent.trim()).map(e=>getComputedStyle(e).fontSize));
   expect(sizes.length).toBeGreaterThan(0);
   if(!process.env.FEEDBACK_BASELINE)expect([...new Set(sizes)]).toEqual(['14px']);
   const terms=feedback.locator('.term-trigger');const count=await terms.count();
   // Every current explanation contains technical vocabulary; reject vacuous checks.
   expect(count).toBeGreaterThan(0);
   const term=terms.first();await term.focus();await page.keyboard.press('Enter');
   await expect(page.locator('#term-hint')).toBeVisible();await expect(page.locator('#term-meaning')).not.toBeEmpty();
   expect(await page.locator('#term-hint').evaluate(e=>{const b=e.getBoundingClientRect();return b.left>=0&&b.right<=innerWidth;})).toBe(true);
   await page.keyboard.press('Escape');await expect(term).toBeFocused();await expect(page.locator('#term-hint')).not.toBeVisible();
   expect(await feedback.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   rows.push({lab,answer,theme,width,sizes,glossary:count});
   if(lab===12&&!process.env.FEEDBACK_BASELINE){await feedback.evaluate(e=>scrollTo(0,scrollY+e.getBoundingClientRect().top-180));await page.screenshot({path:`${evidence}/lab12-${theme}-${width}-${answer}.png`});}
  }
 }
 const path=`${evidence}/outside-${theme}-${width}.json`;
 if(process.env.FEEDBACK_BASELINE)writeFileSync(path,JSON.stringify(outside));
 else {
  // Visual A/B order is randomized; compare typography, not shuffled copy.
  const sizes=outside.map(es=>es.map(e=>e.size));
  expect(sizes).toEqual(Array.from({length:12},(_,i)=>['19px',i===0?'16px':'15px',i===0?'12px':'10px',i===0?'16px':'15px',i===0?'12px':'10px']));
  if(process.env.FEEDBACK_COMPARE_BASELINE)expect(sizes).toEqual(JSON.parse(readFileSync(path,'utf8')).map(es=>es.map(e=>e.size)));
 }
 writeFileSync(`${evidence}/${process.env.FEEDBACK_BASELINE?'baseline':'checks'}-${theme}-${width}.json`,JSON.stringify(rows,null,2));
});
