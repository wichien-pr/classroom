import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const out=process.env.SCALING_FAILURE_EVIDENCE||new URL('../../../../evidence/lab03-failure/',import.meta.url).pathname;
for(const theme of ['light','dark'])for(const width of [1280,390,320])test(`actual down nodes alone are prominent red ${theme} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto(process.env.SCALING_PREVIEW_URL||'/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.locator('[data-lesson="3"]').click();
 for(let topic=0;topic<5;topic++){
  for(const run of [false,true]){
   if(run)await page.locator('#order').click();
   const nodes=await page.locator('.scaling-pool .scaling-node').evaluateAll(es=>es.map(e=>{
    const read=()=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {border:s.borderTopWidth,style:s.borderTopStyle,color:s.borderTopColor,w:r.width,h:r.height,text:[e,...e.querySelectorAll('*')].map(n=>({color:getComputedStyle(n).color,opacity:getComputedStyle(n).opacity})),bg:s.backgroundColor};};
    const actual=read(),down=e.classList.contains('scaling-offline');e.classList.remove('scaling-offline');const healthy=read();if(down)e.classList.add('scaling-offline');return {actual,healthy,down,label:e.textContent};
   }));
   expect(nodes.filter(n=>n.down)).toHaveLength(topic>=2?1:0);
   for(const n of nodes){if(!n.down){expect(n.actual).toEqual(n.healthy);expect(n.actual.border).toBe('1px');continue;}
    expect(n.label).toContain('Web 1');expect(n.label).toContain('ล่ม');expect(n.actual.style).toBe('solid');expect(n.actual.border).toBe('3px');
    const red=theme==='dark'?'rgb(255, 142, 152)':'rgb(180, 35, 50)';expect(n.actual.color).toBe(red);
    for(const text of n.actual.text){expect(text.color).toBe(red);expect(text.opacity).toBe('1');}
    expect(n.actual.w).toBe(n.healthy.w);expect(n.actual.h).toBe(n.healthy.h);
    const luminance=s=>{const v=s.match(/\d+/g).slice(0,3).map(Number).map(c=>{c/=255;return c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4;});return .2126*v[0]+.7152*v[1]+.0722*v[2];};
    const a=luminance(red),b=luminance(n.actual.bg);expect((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toBeGreaterThanOrEqual(4.5);
   }
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  if(topic===2){await mkdir(out,{recursive:true});await page.locator('.scaling-scene').screenshot({path:`${out}/${theme}-${width}-topic-3.png`});}
  if(topic<4)await page.locator('#lesson-topic-next').click();
 }
});
