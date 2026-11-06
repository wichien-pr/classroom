import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';

function contrast(a,b){
 const lum=c=>c.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
 const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
const style=el=>{const s=getComputedStyle(el);return {fg:s.color,bg:s.backgroundColor,border:s.borderTopColor,borderStyle:s.borderTopStyle,weight:s.fontWeight,size:parseFloat(s.fontSize),cursor:s.cursor,opacity:s.opacity,outline:s.outlineStyle,transform:s.transform};};
for(const theme of ['light','dark'])for(const width of [1280,390,320])test(`LAB01 navigation affordance ${theme} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:800});await page.goto('/');
 await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
 const dir='../../evidence/flow-readability';await mkdir(dir,{recursive:true});
 const next=page.locator('#flow-slide-next'),back=page.locator('#flow-slide-back');
 await page.locator('.sidebar nav button').first().evaluate(e=>e.getAnimations().forEach(a=>a.finish()));
 const sidebarBefore=await page.locator('.sidebar nav button').first().evaluate(style);
 for(let topic=0;topic<4;topic++){
  await expect(back)[topic===0?'toBeDisabled':'toBeEnabled']();await expect(next)[topic===3?'toBeDisabled':'toBeEnabled']();
  for(const button of [back,next]){
   const s=await button.evaluate(style);
   expect(s.size).toBeGreaterThanOrEqual(16);expect(Number(s.weight)).toBeGreaterThanOrEqual(600);
   expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(48);
   expect(contrast(s.fg,s.bg)).toBeGreaterThanOrEqual(4.5);
   if(await button.isEnabled()){
    expect(s.borderStyle).toBe('solid');expect(s.opacity).toBe('1');expect(s.cursor).toBe('pointer');
    if(button===next)expect(contrast(s.bg,await page.locator('.lab').evaluate(e=>getComputedStyle(e).backgroundColor))).toBeGreaterThanOrEqual(3);
    else expect(contrast(s.border,s.bg)).toBeGreaterThanOrEqual(3);
    await button.hover();const hovered=await button.evaluate(style);expect(hovered.bg).not.toBe(s.bg);expect(contrast(hovered.fg,hovered.bg)).toBeGreaterThanOrEqual(4.5);
    await page.mouse.down();expect((await button.evaluate(style)).transform).not.toBe('none');await page.mouse.move(0,0);await page.mouse.up();
    await page.keyboard.press('Tab');await button.focus();expect((await button.evaluate(style)).outline).toBe('solid');
   }else{expect(s.borderStyle).toBe('dashed');expect(s.cursor).toBe('not-allowed');}
  }
  await expect(back).toHaveAccessibleName('ย้อนกลับ');await expect(next).toHaveAccessibleName('ถัดไป');
  await page.locator('#step').click();
  await page.locator('#flow-topic').evaluate(e=>e.scrollIntoView({block:'start'}));
  await page.screenshot({path:`${dir}/${theme}-${width}-topic-${topic+1}.png`});
  await page.locator('.flow-slide-nav').scrollIntoViewIfNeeded();
  await page.screenshot({path:`${dir}/${theme}-${width}-topic-${topic+1}-nav.png`});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(topic<3)await next.click();
 }
 expect(await page.locator('.sidebar nav button').first().evaluate(style)).toEqual(sidebarBefore);
});

for(const theme of ['light','dark'])for(const width of [1280,390,320])test(`LAB01 readable topic text ${theme} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:800});await page.goto('/');
 await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
 for(let topic=0;topic<4;topic++){
  const sizes=await page.locator('#flow-topic').evaluate(el=>{
   const selectors=['#flow-instruction','#flow-scenario','#flow-result','#flow-frame','#step'];
   return selectors.flatMap(s=>[...el.querySelectorAll(s)].filter(e=>e.checkVisibility()).map(e=>({selector:s,size:parseFloat(getComputedStyle(e).fontSize),line:parseFloat(getComputedStyle(e).lineHeight)})));
  });
  for(const item of sizes){expect(item.size,item.selector).toBeGreaterThanOrEqual(16);expect(item.line,item.selector).toBeGreaterThanOrEqual(item.size*1.5);}
  for(const selector of ['.state-grid span','.flow-control-group label','.flow-step-note','.observation h3']){
   for(const e of await page.locator(`#flow-topic ${selector}:visible`).all())expect(await e.evaluate(e=>parseFloat(getComputedStyle(e).fontSize)),selector).toBeGreaterThanOrEqual(14);
  }
  expect(await page.locator('#flow-slide-title').evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(width===1280?22:18);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(topic<3)await page.locator('#flow-slide-next').click();
 }
});
