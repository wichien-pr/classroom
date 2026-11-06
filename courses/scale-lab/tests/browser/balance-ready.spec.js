import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const out='/Users/prommeesee/.hermes/cache/scratch/lab04-ready-evidence';
for(const theme of ['light','dark'])for(const width of [1280,390,320])test(`registered healthy borders ${theme} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:800});await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.locator('[data-lesson="4"]').click();
 for(let topic=0;topic<4;topic++){
  const expected=[['ready','ready','neutral'],['offline','ready','neutral'],['offline','offline','neutral'],['offline','ready','ready']][topic];
  for(let i=0;i<3;i++){
   const node=page.locator(`[data-node="server-${i}"]`),state=expected[i];
   const actual=await node.evaluate(e=>{const s=getComputedStyle(e);return {border:s.borderTopColor,width:s.borderTopWidth,text:[...e.children].map(c=>getComputedStyle(c).color)};});
   expect(actual.width).toBe(state==='neutral'?'1px':'3px');
   if(state==='ready'){
    expect(actual.border).toBe(theme==='dark'?'rgb(125, 227, 198)':'rgb(23, 102, 82)');
    expect(actual.text.every(c=>c!==actual.border)).toBe(true);
    const contrast=await node.evaluate(e=>{
     const lum=color=>{const c=color.match(/\d+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
     const border=lum(getComputedStyle(e).borderTopColor);
     return [e,e.closest('.balance-scene')].map(n=>{const bg=lum(getComputedStyle(n).backgroundColor);return (Math.max(bg,border)+.05)/(Math.min(bg,border)+.05);});
    });
    contrast.forEach(r=>expect(r).toBeGreaterThanOrEqual(3));
    const before=await node.boundingBox();
    await node.evaluate(e=>e.classList.remove('balance-ready'));const after=await node.boundingBox();
    expect(after).toEqual(before);await node.evaluate(e=>e.classList.add('balance-ready'));
   }
   if(state==='offline')expect(actual.border).toBe(theme==='dark'?'rgb(255, 142, 152)':'rgb(180, 35, 50)');
  }
  for(const id of ['client','router'])expect(await page.locator(`[data-node="${id}"]`).evaluate(e=>getComputedStyle(e).borderTopWidth)).toBe('1px');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(topic===3){await mkdir(out,{recursive:true});await page.locator('.balance-map').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${theme}-${width}.png`,fullPage:true});await page.locator('.balance-scene').screenshot({path:`${out}/${theme}-${width}-scene.png`});}
  if(topic<3)await page.locator('#lesson-topic-next').click();
 }
});
