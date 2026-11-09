import {test,expect} from '@playwright/test';
for(const theme of ['light','dark'])for(const width of [1280,390,320])test(`LAB01 compact toolbar ${theme} ${width}`,async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width,height:800});await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
 for(let topic=0;topic<4;topic++){
  await expect(page.locator('#flow-scene > .flow-actions')).toHaveCount(1);
  await expect(page.locator('#flow-scene #flow-result')).toHaveText('ยังไม่ได้ทดลอง');
  await expect(page.locator('#flow-scene .flow-playback-note')).toHaveCount(0);
  await page.evaluate(()=>window.retainedToolbar=document.querySelector('.flow-actions'));
  await page.locator('#step').click();
  expect(await page.evaluate(()=>window.retainedToolbar===document.querySelector('#flow-scene > .flow-actions'))).toBe(true);await page.locator('#flow-pause').click();
  const buttons=await Promise.all(['#step','#flow-replay','#flow-pause'].map(s=>page.locator(s).boundingBox()));
  for(const b of buttons){expect(b.width).toBe(48);expect(b.height).toBe(48);expect(b.y).toBeCloseTo(buttons[0].y,0);}
  expect(buttons[1].x-buttons[0].x-48).toBe(8);expect(buttons[2].x-buttons[1].x-48).toBe(8);
  const result=await page.locator('#flow-result').boundingBox();
  if(width===1280){expect(result.x).toBeGreaterThan(buttons[2].x+48);expect(Math.abs(result.y-buttons[0].y)).toBeLessThan(20);}
  else expect(result.y).toBeGreaterThanOrEqual(buttons[0].y+48);
  expect(await page.locator('#flow-result').evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBe(17);
  await page.keyboard.press('Tab'); // Switch to keyboard modality for :focus-visible.
  for(const id of ['step','flow-replay','flow-pause']){
   await page.locator('#'+id).focus();
   const tip=await page.locator('#'+id).evaluate(e=>{const s=getComputedStyle(e,'::after'),b=e.getBoundingClientRect();return {visible:s.visibility,left:b.left+parseFloat(s.left),right:b.left+parseFloat(s.left)+parseFloat(s.width)+parseFloat(s.paddingLeft)+parseFloat(s.paddingRight)};});
   expect(tip.visible).toBe('visible');expect(tip.left).toBeGreaterThanOrEqual(0);expect(tip.right).toBeLessThanOrEqual(width);
   expect(await page.locator('#'+id).evaluate(e=>{
    const s=getComputedStyle(e,'::after'),b=e.getBoundingClientRect(),bottom=b.bottom-parseFloat(s.bottom),top=bottom-parseFloat(s.height)-parseFloat(s.paddingTop)-parseFloat(s.paddingBottom);
    for(let p=e.parentElement;p;p=p.parentElement){const c=getComputedStyle(p),r=p.getBoundingClientRect();if(/hidden|clip|auto|scroll/.test(c.overflowY)&& (top<r.top||bottom>r.bottom))return false;}
    return true;
   })).toBe(true);
  }
  const containment=await page.locator('.flow-actions').evaluate(e=>{
   const frame=e.closest('#flow-scene').getBoundingClientRect(),bar=e.getBoundingClientRect();
   return {inside:bar.left>=frame.left&&bar.right<=frame.right&&bar.bottom<=frame.bottom,after:!!(document.querySelector('#flow-frame').compareDocumentPosition(e)&Node.DOCUMENT_POSITION_FOLLOWING),color:getComputedStyle(document.querySelector('#flow-result')).color};
  });
  expect(containment.inside).toBe(true);expect(containment.after).toBe(true);expect(containment.color).toBe(theme==='dark'?'rgb(236, 243, 255)':'rgb(25, 59, 80)');
  expect(await page.locator('#flow-scene .flow-slide-nav').count()).toBe(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('#step').evaluate(e=>window.scrollBy(0,e.getBoundingClientRect().top-180));
  await page.mouse.move(0,0);await page.locator('#flow-pause').blur();
  await page.screenshot({path:testInfo.outputPath(`toolbar-${theme}-${width}-topic${topic}.png`)});
  if(topic<3)await page.locator('#flow-slide-next').click();
 }
 expect(errors).toEqual([]);
});
