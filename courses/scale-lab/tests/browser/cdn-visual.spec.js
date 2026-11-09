import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
for(const width of [1280,390,320])for(const theme of ['light','dark'])test(`LAB07 settled states and replay ${theme} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:800});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.locator('[data-lesson="7"]').click();
 for(let topic=0;topic<6;topic++){
  await page.locator('#cdn-run').click();await expect(page.locator('#cdn-run')).toBeEnabled();
  await expect(page.locator('.cdn-scene')).toHaveAttribute('data-playback','finished');expect(await page.locator('.cdn-scene').evaluate(e=>e.getAnimations({subtree:true}).length)).toBe(0);
  if(topic===1||topic===4){await expect(page.locator('[data-node="edge"]')).toContainText('STALE');await expect(page.locator('[data-node="edge"]')).not.toHaveClass(/cdn-ready|cdn-offline/);}
  if(topic===5){await expect(page.locator('.cdn-offline')).toHaveCount(2);for(const d of await page.locator('.cdn-offline').evaluateAll(es=>es.map(e=>({b:getComputedStyle(e).borderWidth,c:getComputedStyle(e).color,children:[...e.children].map(c=>getComputedStyle(c).color)})))){expect(d.b).toBe('3px');expect(d.children.every(c=>c===d.c)).toBe(true);}}
  const result=await page.locator('#cdn-result').innerText();await page.locator('#cdn-replay').click();await expect(page.locator('#cdn-run')).toBeEnabled();await expect(page.locator('#cdn-result')).toHaveText(result);await expect(page.locator('#cdn-pause')).toBeDisabled();
  await page.locator('.cdn-scene').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/settled-${theme}-${width}-topic-${topic+1}.png`});
  if(topic<5)await page.locator('#lesson-topic-next').click();
 }
});
const out=new URL('../../../../evidence/lab07-presentation/',import.meta.url).pathname;
for(const width of [1280,390,320])for(const theme of ['light','dark'])test(`LAB07 geometry motion tooltips ${theme} ${width}`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewportSize({width,height:800});await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.locator('[data-lesson="7"]').click();
 for(let topic=0;topic<6;topic++){
  const action='cdn-run';
  const primaryBox=await page.locator('#cdn-run').boundingBox(),replayBox=await page.locator('#cdn-replay').boundingBox();expect(primaryBox.y).toBe(replayBox.y);
  const header=await page.locator('.lesson-topic-nav').boundingBox(),title=await page.locator('#lesson-topic-title').boundingBox();expect(Math.abs(header.x+header.width/2-title.x-title.width/2)).toBeLessThan(1);
  for(const id of [action,'lesson-topic-next','lesson-topic-back','reset']){const b=page.locator('#'+id),r=await b.boundingBox();expect(r.width).toBe(48);expect(r.height).toBe(48);await expect(b).toHaveAttribute('title',await b.getAttribute('aria-label'));}
  await page.locator('#'+action).click();await expect(page.locator('#cdn-stage')).toContainText(`${1} /` ,{timeout:16000});const circles=page.locator('.cdn-particle');await expect(circles).toHaveCount(topic===5?0:4);
  if(await circles.count()){
  const first=circles.first();await expect.poll(()=>first.evaluate(e=>parseFloat(getComputedStyle(e).offsetDistance))).toBeGreaterThan(0);
  const before=await first.evaluate(e=>getComputedStyle(e).offsetDistance);await page.waitForTimeout(80);expect(await first.evaluate(e=>getComputedStyle(e).offsetDistance)).not.toBe(before);
  await page.locator('#cdn-pause').click();await page.evaluate(async()=>Promise.all(document.getAnimations().map(a=>a.ready)));
  const frozen=await circles.evaluateAll(es=>es.map(e=>getComputedStyle(e).offsetDistance));await page.waitForTimeout(80);expect(await circles.evaluateAll(es=>es.map(e=>getComputedStyle(e).offsetDistance))).toEqual(frozen);
  const coordinates=await circles.evaluateAll(es=>es.filter(e=>parseFloat(getComputedStyle(e).opacity)>0).map(e=>{const base=e.closest('svg').getBoundingClientRect(),b=e.getBoundingClientRect(),p=e.closest('svg').querySelectorAll("path")[Number(e.dataset.route)],q=p.getPointAtLength(p.getTotalLength()*parseFloat(getComputedStyle(e).offsetDistance)/100);return Math.hypot(b.x+b.width/2-base.x-q.x,b.y+b.height/2-base.y-q.y);}));
  expect(coordinates.length).toBeGreaterThan(0);coordinates.forEach(d=>expect(d).toBeLessThan(1));
  }
  if(topic===5){await page.locator('#cdn-pause').click();await page.evaluate(async()=>Promise.all(document.getAnimations().map(a=>a.ready)));}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(theme==='light')expect(await page.locator('.cdn-scene').evaluate(e=>getComputedStyle(e).backgroundColor)).toBe('rgb(243, 247, 250)');
  await expect(page.locator('.cdn-ready')).toHaveCount(topic===5?1:2);
  const toolbar=await page.locator('.cdn-scene .workload-actions').evaluate(e=>{const s=getComputedStyle(e);return [s.backgroundColor,s.borderTopWidth,s.borderLeftWidth,s.borderBottomWidth,s.borderRadius]});expect(toolbar).toEqual(['rgba(0, 0, 0, 0)','1px','0px','0px','0px']);
  await expect(page.locator('.cdn-offline')).toHaveCount(topic===5?1:0);
  const down=await page.locator('.cdn-offline').evaluateAll(es=>es.map(e=>({border:getComputedStyle(e).borderWidth,color:getComputedStyle(e).color,colors:[...e.children].map(c=>getComputedStyle(c).color)})));
  for(const d of down){expect(d.border).toBe('3px');expect(d.colors.every(c=>c===d.color)).toBe(true);}
  const geometry=await page.locator('.cdn-map').evaluate(map=>{
   const origin=map.getBoundingClientRect(),boxes=[...map.querySelectorAll('.cdn-node')].map(n=>{const b=n.getBoundingClientRect();return {x:b.x-origin.x,y:b.y-origin.y,w:b.width,h:b.height};});
   return [...map.querySelectorAll('path')].map(p=>{const css=getComputedStyle(p);let collisions=0;for(let i=1;i<99;i++){const q=p.getPointAtLength(p.getTotalLength()*i/100);for(const b of boxes)if(q.x>b.x+1&&q.x<b.x+b.w-1&&q.y>b.y+1&&q.y<b.y+b.h-1)collisions++;}return {collisions,cap:css.strokeLinecap,dash:css.strokeDasharray,d:p.getAttribute('d')};});
  });
  for(const wire of geometry){expect(wire.collisions).toBe(0);expect(wire.cap).toBe('round');expect(wire.dash).toBe('0px, 7px');expect(wire.d).not.toMatch(/[CQ]/);}
  await page.keyboard.press('Tab');
  for(const id of [action,'cdn-replay','cdn-pause','lesson-topic-next','reset']){
   const b=page.locator('#'+id);if(await b.isDisabled())continue;await b.focus();const tip=await b.evaluate(e=>{const s=getComputedStyle(e,'::after'),r=e.getBoundingClientRect();return {visible:s.visibility,left:r.left+parseFloat(s.left),right:r.left+parseFloat(s.left)+parseFloat(s.width)+parseFloat(s.paddingLeft)+parseFloat(s.paddingRight),outline:getComputedStyle(e).outlineStyle};});
   expect(tip.visible).toBe('visible');expect(tip.left).toBeGreaterThanOrEqual(0);expect(tip.right).toBeLessThanOrEqual(width);expect(tip.outline).not.toBe('none');
  }
  await mkdir(out,{recursive:true});await page.locator('#lesson-topic').evaluate(e=>window.scrollBy(0,e.getBoundingClientRect().top-100));await page.screenshot({path:`${out}/${theme}-${width}-topic-${topic+1}-header.png`});await page.locator('.workload-actions').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${theme}-${width}-topic-${topic+1}-result.png`});
  if(topic<5)await page.locator('#lesson-topic-next').click();
 }
 await page.locator('#reset').click();await expect(page.locator('#lesson-topic-title')).toContainText('1 / 6');await expect(page.locator('#cdn-replay')).toBeDisabled();expect(errors).toEqual([]);
});
