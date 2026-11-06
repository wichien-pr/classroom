import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
test('automatic topics execute once, playback is independent, navigation clears evidence',async({page})=>{
 await page.goto('/');
 await expect(page.locator('#flow-client')).toHaveCount(0);
 await expect(page.locator('#step')).toHaveAccessibleName('ทดลอง');
 await expect(page.locator('.flow-full-view,#flow-topic .observation,#flow-topic #state-view')).toHaveCount(0);
 for(let topic=0;topic<4;topic++){
  await expect(page.locator('#flow-scene')).toHaveAttribute('data-playback','idle');
  await expect(page.locator('#flow-result')).toContainText('ยังไม่ได้ทดลอง');
  await page.locator('#step').click();
  await expect(page.locator('#flow-scene')).toHaveAttribute('data-playback','running');
  await page.locator('#flow-pause').click();
  await expect(page.locator('#flow-scene')).toHaveAttribute('data-playback','paused');
  const result=await page.locator('#flow-result').textContent();
  await page.locator('#flow-replay').click();
  await expect(page.locator('#flow-result')).toHaveText(result);
  if(topic<3)await page.locator('#flow-slide-next').click();
 }
 await expect(page.locator('#flow-result')).toContainText('JSON');
 await page.locator('#reset').click();
 await expect(page.locator('#flow-topic')).toHaveAttribute('data-topic','0');
 await expect(page.locator('#flow-scene')).toHaveAttribute('data-playback','idle');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.locator('#step').focus();await page.keyboard.press('Enter');
 await expect(page.locator('#flow-scene')).toHaveAttribute('data-playback','finished');
 await expect(page.locator('#flow-scene')).toHaveAttribute('data-stage','dns-return');
});
test('pause freezes snapshots, resume completes, navigation/reset/re-entry cancel playback',async({page})=>{
 await page.goto('/');await page.locator('#flow-slide-next').click();await page.locator('#flow-slide-next').click();await page.locator('#step').click();
 await page.locator('#flow-pause').click();const stage=await page.locator('#flow-scene').getAttribute('data-stage');
 await page.waitForTimeout(1300);await expect(page.locator('#flow-scene')).toHaveAttribute('data-stage',stage);
 await page.locator('#flow-pause').click();await expect(page.locator('#flow-scene')).toHaveAttribute('data-playback','finished',{timeout:10000});
 await page.locator('#flow-replay').click();await page.locator('#reset').click();await page.waitForTimeout(1300);await expect(page.locator('#flow-scene')).toHaveAttribute('data-stage','ready');
 await page.locator('#step').click();await page.locator('[data-lesson-kind="workload"]').click();await page.locator('[data-lesson-kind="flow"]').click();await page.waitForTimeout(1300);await expect(page.locator('#flow-scene')).toHaveAttribute('data-stage','ready');
 await page.locator('#step').click();await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('#flow-scene')).toHaveAttribute('data-stage','dns-return');await expect(page.locator('#flow-scene')).toHaveAttribute('data-playback','finished');
});
for(const theme of ['dark','light'])for(const width of [1280,390,320])test(`readable centered guided flow ${theme} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:width===1280?800:568});await page.goto('/');
 await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
 for(let i=0;i<4;i++){
  const nav=await page.locator('.flow-slide-nav').boundingBox(),title=await page.locator('#flow-slide-title').boundingBox();
  expect(Math.abs(nav.x+nav.width/2-title.x-title.width/2)).toBeLessThan(1);
  const back=await page.locator('#flow-slide-back').boundingBox(),next=await page.locator('#flow-slide-next').boundingBox();
  expect(back.x+back.width).toBeLessThanOrEqual(title.x);expect(title.x+title.width).toBeLessThanOrEqual(next.x);
  if(i<3)await page.locator('#flow-slide-next').click();
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#step').click();
 const contrast=await page.locator('#step').evaluate(e=>{const s=getComputedStyle(e);const lum=c=>{const v=c.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;});return v[0]*.2126+v[1]*.7152+v[2]*.0722;};const a=lum(s.color),b=lum(s.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);});expect(contrast).toBeGreaterThanOrEqual(4.5);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const labels=await page.locator('#flow-scene strong,#flow-scene span').evaluateAll(es=>es.map(e=>parseFloat(getComputedStyle(e).fontSize)));
 expect(labels.length).toBeGreaterThan(5);expect(Math.min(...labels)).toBeGreaterThanOrEqual(16);
 const dir='../../evidence/flow-presets';await mkdir(dir,{recursive:true});
 for(const [name,selector] of [['nav','#flow-topic'],['diagram','#flow-scene'],['action','#step']]){
  await page.locator(selector).evaluate(e=>e.scrollIntoView({block:'start'}));
  if(name==='action'){
   const a=await page.locator('#step').boundingBox(),r=await page.locator('#flow-result').boundingBox(),chrome=await page.locator('.simulation').boundingBox();
   expect(a.y).toBeGreaterThanOrEqual(chrome.y+chrome.height);expect(r.y+r.height).toBeLessThanOrEqual(width===1280?800:568);
  }
  await page.screenshot({path:`${dir}/${theme}-${width}-${name}.png`});
 }
});
