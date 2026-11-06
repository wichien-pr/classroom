import {test,expect} from '@playwright/test';
for(const theme of ['light','dark'])for(const width of [1280,390,320])test(`LAB02 icons ${theme} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:800});await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.locator('[data-lesson-kind=workload]').click();
 for(let topic=0;topic<4;topic++){
  for(const id of ['estimate','workload-replay','workload-pause','lesson-topic-back','lesson-topic-next','reset']){
   const b=page.locator('#'+id);await expect(b.locator('svg[aria-hidden=true]')).toHaveCount(1);expect(await b.getAttribute('aria-label')).toBeTruthy();expect(await b.getAttribute('title')).toBe(await b.getAttribute('aria-label'));const r=await b.boundingBox();expect(r.width).toBe(48);expect(r.height).toBe(48);
  }
  const centers=await page.evaluate(()=>['.lesson-topic-nav','#lesson-topic-title'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return r.x+r.width/2}));expect(Math.abs(centers[0]-centers[1])).toBeLessThan(1);
  await page.locator('#estimate').focus();await page.keyboard.press('Enter');await expect(page.locator('#estimate')).toBeFocused();await page.locator('#workload-pause').click();await expect(page.locator('#workload-pause')).toHaveAccessibleName('เล่นภาพต่อ');await expect(page.locator('#workload-pause svg')).toHaveAttribute('data-icon','play');
  await page.keyboard.press('Tab');
  for(const id of ['estimate','workload-replay','workload-pause','lesson-topic-next','reset']){
   const b=page.locator('#'+id);if(await b.isDisabled())continue;await b.focus();
   const tip=await b.evaluate(e=>{const s=getComputedStyle(e,'::after'),r=e.getBoundingClientRect();return {visible:s.visibility,left:r.left+parseFloat(s.left),right:r.left+parseFloat(s.left)+parseFloat(s.width)+parseFloat(s.paddingLeft)+parseFloat(s.paddingRight),outline:getComputedStyle(e).outlineStyle}});
   expect(tip.visible).toBe('visible');expect(tip.left).toBeGreaterThanOrEqual(0);expect(tip.right).toBeLessThanOrEqual(width);expect(tip.outline).not.toBe('none');
  }
  const controls=await page.locator('.workload-playback button').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().y));expect(new Set(controls).size).toBe(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(topic<3)await page.locator('#lesson-topic-next').click();
 }
});
