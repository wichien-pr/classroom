import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const evidence=process.env.TOOLBAR_EVIDENCE;
for(const kind of ['workload','stock'])for(const theme of ['light','dark'])for(const width of [1280,390,320])test(`${kind} divider toolbar ${theme} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:800});await page.goto(process.env.TOOLBAR_PREVIEW_URL||'/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.locator(`[data-lesson-kind=${kind}]`).click();
 const toolbar=page.locator('.workload-actions');
 for(let topic=0;topic<(kind==='workload'?4:5);topic++){
  const style=await toolbar.evaluate(e=>{const s=getComputedStyle(e);return {background:s.backgroundColor,image:s.backgroundImage,top:s.borderTopWidth,topStyle:s.borderTopStyle,sides:[s.borderRightWidth,s.borderBottomWidth,s.borderLeftWidth],radius:s.borderRadius,shadow:s.boxShadow,padding:s.padding,gap:s.gap};});
  expect(style).toMatchObject({background:'rgba(0, 0, 0, 0)',image:'none',top:'1px',topStyle:'solid',sides:['0px','0px','0px'],radius:'0px',shadow:'none',padding:'16px 0px 0px',gap:width>650?'20px':'12px'});
  const buttons=toolbar.locator('button');await expect(buttons).toHaveCount(3);
  const boxes=await buttons.evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};}));
  expect(new Set(boxes.map(b=>b.y)).size).toBe(1);for(const b of boxes){expect(b.w).toBe(48);expect(b.h).toBe(48);expect(b.x).toBeGreaterThanOrEqual(0);expect(b.x+b.w).toBeLessThanOrEqual(width);}
  await expect(toolbar.locator('button').nth(1)).toBeDisabled();
  await toolbar.locator('button').first().click();
  await expect(toolbar.locator('[role=status]')).not.toContainText('ยังไม่ได้ทดลอง');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(evidence&&topic===0){await mkdir(evidence,{recursive:true});await toolbar.evaluate(e=>window.scrollBy(0,e.getBoundingClientRect().top-240));await page.mouse.move(0,0);await page.screenshot({path:`${evidence}/${kind}-${theme}-${width}.png`});}
  if(topic<(kind==='workload'?3:4))await page.locator('#lesson-topic-next').click();
 }
});
