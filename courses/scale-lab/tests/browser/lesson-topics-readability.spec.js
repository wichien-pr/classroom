import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {lessonTopics} from '../../src/lesson-topics.js';
const contrast=(a,b)=>{const lum=s=>s.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
for(const width of [1280,390,320])for(const theme of ['light','dark'])test(`all remaining topics readable ${width} ${theme}`,async({page})=>{
 test.setTimeout(180000);await page.setViewportSize({width,height:width===320?568:800});await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
 const dir='../../evidence/lesson-topics';await mkdir(dir,{recursive:true});
 for(const [kind,topics] of Object.entries(lessonTopics)){
  await page.locator(`[data-lesson-kind="${kind}"]`).click();
  await page.locator('#lesson-topic [data-action]:visible').first().click();
  for(let i=0;i<topics.length;i++){
   const sizes=await page.locator('#lesson-topic').evaluate(el=>{
    const sels=['#lesson-topic-title','.experiment li:not([hidden])',el.dataset.kind==='workload'?'#workload-result':'#outcome','#lesson-topic-back','#lesson-topic-next'];
    return sels.map(s=>{const e=el.querySelector(s),c=getComputedStyle(e);let p=e,bg;do{bg=getComputedStyle(p).backgroundColor;p=p.parentElement;}while(bg==='rgba(0, 0, 0, 0)'&&p);return {selector:s,size:parseFloat(c.fontSize),fg:c.color,bg,clipped:e.scrollWidth>e.clientWidth+1,height:e.getBoundingClientRect().height};});
   });
   for(const s of sizes){expect(s.size,kind+s.selector).toBeGreaterThanOrEqual(16);expect(s.clipped,kind+s.selector).toBe(false);expect(contrast(s.fg,s.bg),kind+s.selector).toBeGreaterThanOrEqual(4.5);if(s.selector.includes('back')||s.selector.includes('next'))expect(s.height).toBeGreaterThanOrEqual(48);}
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),kind).toBe(true);
   const coLocated=await page.evaluate(kind=>{if(kind==='workload'){const a=document.querySelector('#estimate').getBoundingClientRect(),r=document.querySelector('#workload-result').getBoundingClientRect();return a.top-r.bottom;}const c=document.querySelector('.control-area').getBoundingClientRect(),o=document.querySelector('.observation').getBoundingClientRect();return o.top-c.bottom;},kind);expect(coLocated).toBeLessThan(40);
   if(i===0){await page.locator('#lesson-topic').evaluate(e=>e.scrollIntoView({block:'start'}));await page.screenshot({path:`${dir}/${kind}-${theme}-${width}-top.png`});await page.locator('.control-area').scrollIntoViewIfNeeded();await page.screenshot({path:`${dir}/${kind}-${theme}-${width}-action.png`});}
   if(i<topics.length-1)await page.locator('#lesson-topic-next').click();
  }
 }
});
