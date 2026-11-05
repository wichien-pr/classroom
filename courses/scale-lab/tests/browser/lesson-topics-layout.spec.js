import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const titles=['แยกทรัพยากร Web และ Data','ทรัพยากรร่วมในเครื่องเดียว','Web เพิ่ม แต่ Database ล่ม','เลือกฐานข้อมูลตามงาน'];
for(const theme of ['light','dark'])for(const width of [1280,390,320])test(`LAB02 balanced workspace ${theme} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:800});await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.locator('[data-lesson-kind=workload]').click();
 await mkdir('../../evidence/lab02-layout',{recursive:true});
 for(let i=0;i<4;i++){
  await expect(page.locator('#lesson-topic-title')).toHaveText(`${i+1} / 4 · ${titles[i]}`);
  const geometry=await page.locator('#lesson-topic').evaluate(el=>{
   const rect=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
   const nav=el.querySelector('nav'),title=el.querySelector('h3'),buttons=[...nav.querySelectorAll('button')];
   return {box:rect(el),nav:rect(nav),title:rect(title),buttons:buttons.map(rect),padding:parseFloat(getComputedStyle(el).paddingLeft),font:parseFloat(getComputedStyle(title).fontSize),overflow:document.documentElement.scrollWidth>innerWidth,order:rect(nav).bottom<=rect(el.querySelector('.experiment')).y,clipped:[title,...buttons].some(n=>n.scrollWidth>n.clientWidth+1)};
  });
  expect(geometry.padding).toBeGreaterThanOrEqual(14);expect(geometry.overflow).toBe(false);expect(geometry.clipped).toBe(false);expect(geometry.order).toBe(true);expect(geometry.font).toBeGreaterThanOrEqual(16);
  expect(Math.abs(geometry.title.x+geometry.title.width/2-geometry.nav.x-geometry.nav.width/2)).toBeLessThan(1);
  for(const b of geometry.buttons)expect(b.height).toBeGreaterThanOrEqual(48);
  if(width===1280)expect(Math.abs(geometry.buttons[0].y-geometry.title.y)).toBeLessThan(20);
  await page.locator('#lesson-topic').evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:`../../evidence/lab02-layout/${theme}-${width}-${i+1}-top.png`});
  if(i<3)await page.locator('#lesson-topic-next').click();
 }
});
test('LAB02 has a single top navigation with its live heading between Back and Next',async({page})=>{
 await page.goto('/');await page.locator('[data-lesson-kind=workload]').click();
 await expect(page.locator('#lesson-topic > :first-child')).toHaveClass('lesson-topic-nav');
 expect(await page.locator('.lesson-topic-nav > *').evaluateAll(nodes=>nodes.map(n=>n.id))).toEqual(['lesson-topic-back','lesson-topic-title','lesson-topic-next']);
 await expect(page.locator('#lesson-topic-title')).toHaveCount(1);
 await expect(page.locator('#lesson-topic-back')).toHaveText('« Back');await expect(page.locator('#lesson-topic-next')).toHaveText('Next »');
 for(let i=0;i<4;i++){
  await expect(page.locator('#lesson-topic-title')).toHaveText(`${i+1} / 4 · ${titles[i]}`);
  if(i===0)await expect(page.locator('#lesson-topic-back')).toBeDisabled();
  if(i<3){await page.locator('#lesson-topic-next').focus();await page.keyboard.press('Enter');await expect(page.locator('#lesson-topic-title')).toBeFocused();}
 }
 await expect(page.locator('#lesson-topic-next')).toBeDisabled();
 await page.locator('#lesson-topic-back').click();await expect(page.locator('#lesson-topic-title')).toHaveText(`3 / 4 · ${titles[2]}`);
 await page.locator('#reset').click();await expect(page.locator('#lesson-topic-title')).toHaveText(`1 / 4 · ${titles[0]}`);
 await page.locator('[data-lesson-kind=stock]').click();await expect(page.locator('#lesson-topic > :first-child')).toHaveClass('experiment');
});
