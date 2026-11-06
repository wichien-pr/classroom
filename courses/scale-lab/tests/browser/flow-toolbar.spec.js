import {test,expect} from '@playwright/test';
for(const theme of ['light','dark'])for(const width of [1280,390,320])test(`LAB01 compact toolbar ${theme} ${width}`,async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width,height:800});await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
 for(let topic=0;topic<4;topic++){
  await page.locator('#step').click();await page.locator('#flow-pause').click();
  const buttons=await Promise.all(['#step','#flow-replay','#flow-pause'].map(s=>page.locator(s).boundingBox()));
  for(const b of buttons){expect(b.width).toBe(48);expect(b.height).toBe(48);expect(b.y).toBeCloseTo(buttons[0].y,0);}
  expect(buttons[1].x-buttons[0].x-48).toBe(8);expect(buttons[2].x-buttons[1].x-48).toBe(8);
  const result=await page.locator('#flow-result').boundingBox();
  if(width===1280){expect(result.x).toBeGreaterThan(buttons[2].x+48);expect(Math.abs(result.y-buttons[0].y)).toBeLessThan(20);}
  else expect(result.y).toBeGreaterThanOrEqual(buttons[0].y+48);
  expect(await page.locator('#flow-result').evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBe(17);
  expect(await page.locator('.flow-playback-note').evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBe(14);
  await page.keyboard.press('Tab'); // Switch to keyboard modality for :focus-visible.
  for(const id of ['step','flow-replay','flow-pause']){
   await page.locator('#'+id).focus();
   const tip=await page.locator('#'+id).evaluate(e=>{const s=getComputedStyle(e,'::after'),b=e.getBoundingClientRect();return {visible:s.visibility,left:b.left+parseFloat(s.left),right:b.left+parseFloat(s.left)+parseFloat(s.width)+parseFloat(s.paddingLeft)+parseFloat(s.paddingRight)};});
   expect(tip.visible).toBe('visible');expect(tip.left).toBeGreaterThanOrEqual(0);expect(tip.right).toBeLessThanOrEqual(width);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('#step').evaluate(e=>window.scrollBy(0,e.getBoundingClientRect().top-180));
  await page.mouse.move(0,0);await page.locator('#flow-pause').blur();
  await page.screenshot({path:testInfo.outputPath(`toolbar-${theme}-${width}-topic${topic}.png`)});
  if(topic<3)await page.locator('#flow-slide-next').click();
 }
 expect(errors).toEqual([]);
});
