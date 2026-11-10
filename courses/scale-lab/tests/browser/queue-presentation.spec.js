import {test,expect} from '@playwright/test';
const out=process.env.QUEUE_EVIDENCE||'../../evidence/lab10-presentation';
const counts=[[3,0],[6,0],[5,1],[8,1],[5,4]];
for(const theme of ['light','dark'])test(`short phone keyboard and feedback ${theme}`,async({page})=>{
 await page.setViewportSize({width:320,height:600});await page.goto('/');await page.locator('[data-lesson="10"]').click();await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.emulateMedia({reducedMotion:'reduce'});await page.keyboard.press('Tab');
 for(const id of ['#lesson-topic-next','#reset','#queue-run']){
  const b=page.locator(id);await b.evaluate(e=>scrollBy(0,e.getBoundingClientRect().top-140));await b.focus();
  const m=await b.evaluate(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e,'::after');return {outline:getComputedStyle(e).outlineStyle,visible:s.visibility,left:r.left+parseFloat(s.left),width:parseFloat(s.width)+parseFloat(s.paddingLeft)+parseFloat(s.paddingRight)};});expect(m.outline).not.toBe('none');expect(m.visible).toBe('visible');expect(m.left).toBeGreaterThanOrEqual(0);expect(m.left+m.width).toBeLessThanOrEqual(320);
 }
 await page.keyboard.press('Enter');await expect(page.locator('#queue-run')).toBeEnabled();await expect(page.locator('#queue-run')).toBeFocused();
 const gap=await page.evaluate(()=>document.querySelector('#queue-result').getBoundingClientRect().top-document.querySelector('#queue-run').getBoundingClientRect().bottom);expect(gap).toBeLessThan(100);
 await page.locator('#queue-run').evaluate(e=>scrollBy(0,e.getBoundingClientRect().top-150));await page.screenshot({path:`${out}/short-phone-${theme}.png`});
});
for(const theme of ['light','dark'])test(`five guided topics, visible jobs, controls and mobile ${theme}`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('/');await page.locator('[data-lesson="10"]').click();await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.emulateMedia({reducedMotion:'reduce'});
 for(const width of [1280,390,320]){
  await page.setViewportSize({width,height:800});await page.locator('#reset').click();
  for(let i=0;i<5;i++){
   await expect(page.locator('#queue-result')).toHaveText('ยังไม่ได้ทดลอง');await expect(page.locator('#lesson-topic-title')).toContainText(`${i+1} / 5`);
   await page.locator('#queue-run').click();await expect(page.locator('#queue-run')).toBeEnabled();
   await expect(page.locator('#mq-backlog')).toHaveText(String(counts[i][0]));await expect(page.locator('#mq-done')).toHaveText(String(counts[i][1]));
   await expect(page.locator('#queue-waiting .queue-job')).toHaveCount(counts[i][0]);await expect(page.locator('#queue-completed .queue-job')).toHaveCount(counts[i][1]);
   await page.locator('#queue-replay').click();await expect(page.locator('#queue-run')).toBeEnabled();await expect(page.locator('#mq-done')).toHaveText(String(counts[i][1]));
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   for(const id of ['queue-run','queue-replay','queue-pause','lesson-topic-next','lesson-topic-back']){const r=await page.locator('#'+id).boundingBox();expect(r.width).toBeGreaterThanOrEqual(48);expect(r.height).toBeGreaterThanOrEqual(48);}
   const metrics=await page.evaluate(()=>{const scene=document.querySelector('.queue-scene'),run=document.querySelector('#queue-run').getBoundingClientRect(),replay=document.querySelector('#queue-replay').getBoundingClientRect();return {background:getComputedStyle(scene).backgroundColor,row:Math.abs(run.y-replay.y),size:parseFloat(getComputedStyle(document.querySelector('#queue-result')).fontSize)};});
   expect(metrics.row).toBeLessThan(2);expect(metrics.size).toBeGreaterThanOrEqual(16);if(theme==='light')expect(metrics.background).toBe('rgb(243, 247, 250)');
   if(i===1||i===4){
    // An enlarged evidence viewport prevents sticky chrome clipping the scene.
    await page.setViewportSize({width,height:1500});await page.locator('.queue-scene').evaluate(e=>scrollBy(0,e.getBoundingClientRect().top-150));
    await page.locator('.queue-scene').screenshot({path:`${out}/scene-${theme}-${width}-${i}.png`});await page.setViewportSize({width,height:800});
   }
   if(i<4)await page.locator('#lesson-topic-next').click();
  }
  await expect(page.locator('#lesson-topic-next')).toBeDisabled();
  await expect(page.locator('#lesson-topic-title')).toHaveText('5 / 5 · เพิ่ม Workers ลดงานค้าง');
  await expect(page.getByText('ระบายคิวและเริ่มใหม่',{exact:false})).toHaveCount(0);
  await page.locator('#reset').click();await expect(page.locator('#lesson-topic-title')).toContainText('1 / 5');await expect(page.locator('#lesson-topic-back')).toBeDisabled();await expect(page.locator('#mq-backlog')).toHaveText('0');
 }
 await expect(page.locator('#lesson-topic-settings,#participation-score')).toHaveCount(0);expect(errors).toEqual([]);
});
test('route is awaited for 1500ms; pause, replay and cancellation never advance early',async({page})=>{
 await page.goto('/');await page.locator('[data-lesson="10"]').click();await page.locator('#queue-run').click();
 await page.waitForFunction(()=>document.querySelector('.queue-transit')?.getAnimations().length);
 const duration=await page.locator('.queue-transit').evaluate(async e=>{const a=e.getAnimations()[0];await a.ready;return a.effect.getTiming().duration;});expect(duration).toBe(1500);
 await page.locator('#queue-pause').click();const before=await page.locator('.queue-transit').evaluate(async e=>{await Promise.all(e.getAnimations().map(a=>a.ready));return getComputedStyle(e).offsetDistance;});await page.waitForTimeout(350);expect(await page.locator('.queue-transit').evaluate(e=>getComputedStyle(e).offsetDistance)).toBe(before);
 const geometry=await page.locator('.queue-map').evaluate(map=>{const path=map.querySelector('path'),particle=map.querySelector('.queue-transit'),length=path.getTotalLength(),pct=parseFloat(getComputedStyle(particle).offsetDistance)/100,p=path.getPointAtLength(length*pct),m=path.getScreenCTM(),expected=new DOMPoint(p.x,p.y).matrixTransform(m),r=particle.getBoundingClientRect(),a=map.querySelector('[data-node=producer]').getBoundingClientRect(),b=map.querySelector('[data-node=queue]').getBoundingClientRect(),start=path.getPointAtLength(0).matrixTransform(m),end=path.getPointAtLength(length).matrixTransform(m);return {error:Math.hypot(r.x+r.width/2-expected.x,r.y+r.height/2-expected.y),startGap:Math.abs(start.y-r.height/2-a.bottom),endGap:Math.abs(end.y+r.height/2-b.top),dash:getComputedStyle(path).strokeDasharray,cap:getComputedStyle(path).strokeLinecap};});expect(geometry.error).toBeLessThan(1);expect(geometry.startGap).toBeLessThan(1);expect(geometry.endGap).toBeLessThan(1);expect(geometry.dash).toBe('0px, 7px');expect(geometry.cap).toBe('round');
 await expect(page.locator('#mq-backlog')).toHaveText('0');await page.locator('.queue-scene').screenshot({path:`${out}/paused.png`});
 await page.locator('#queue-pause').click();await expect(page.locator('#queue-run')).toBeEnabled();await expect(page.locator('#mq-backlog')).toHaveText('3');
 await page.locator('#queue-replay').click();await expect(page.locator('#mq-backlog')).toHaveText('0');await expect(page.locator('#queue-run')).toBeEnabled();await expect(page.locator('#mq-backlog')).toHaveText('3');
 await page.locator('#lesson-topic-next').click();await page.locator('#queue-run').click();await page.locator('#lesson-topic-next').click();await page.waitForTimeout(3000);await expect(page.locator('#queue-result')).toHaveText('ยังไม่ได้ทดลอง');await expect(page.locator('#mq-backlog')).toHaveText('6');
});
