import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const out=new URL('../../../../evidence/lab03-presentation/',import.meta.url).pathname;
for(const width of [1280,390,320])for(const theme of ['light','dark'])test(`LAB03 layout, routing and motion ${theme} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:800});await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.locator('[data-lesson="3"]').click();
 for(let topic=0;topic<5;topic++){
  const header=await page.locator('.lesson-topic-nav').boundingBox(),title=await page.locator('#lesson-topic-title').boundingBox();expect(Math.abs(header.x+header.width/2-title.x-title.width/2)).toBeLessThan(1);
  for(const id of ['order','lesson-topic-next','lesson-topic-back','reset']){const b=page.locator('#'+id);const rect=await b.boundingBox();expect(rect.width).toBe(48);expect(rect.height).toBe(48);await expect(b).toHaveAttribute('title',await b.getAttribute('aria-label'));}
  await page.locator('#order').click();
  const circles=page.locator('.scaling-particle[data-active=true]');await expect(circles).toHaveCount([1,1,0,3,3][topic]);
  if(topic!==2){
   const first=circles.first();await expect.poll(()=>first.evaluate(e=>parseFloat(getComputedStyle(e).offsetDistance))).toBeGreaterThan(0);
   const before=await first.evaluate(e=>getComputedStyle(e).offsetDistance);await page.waitForTimeout(80);expect(await first.evaluate(e=>getComputedStyle(e).offsetDistance)).not.toBe(before);
  }
  await page.locator('#scaling-pause').click();await page.evaluate(async()=>Promise.all(document.getAnimations().map(a=>a.ready)));
  const frozen=await circles.evaluateAll(es=>es.map(e=>getComputedStyle(e).offsetDistance));await page.waitForTimeout(70);expect(await circles.evaluateAll(es=>es.map(e=>getComputedStyle(e).offsetDistance))).toEqual(frozen);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await page.locator('#scaling-result').evaluate(e=>getComputedStyle(e).fontSize)).toBe('17px');
  const geometry=await page.locator('.scaling-map').evaluate(map=>{
   const origin=map.getBoundingClientRect();const boxes=[...map.querySelectorAll('.scaling-node')].map(n=>{const b=n.getBoundingClientRect();return {id:n.dataset.node,x:b.x-origin.x,y:b.y-origin.y,w:b.width,h:b.height};});
   return [...map.querySelectorAll('path')].map(p=>{const css=getComputedStyle(p);let collisions=[];for(let i=1;i<99;i++){const q=p.getPointAtLength(p.getTotalLength()*i/100);for(const b of boxes)if(q.x>b.x+1&&q.x<b.x+b.w-1&&q.y>b.y+1&&q.y<b.y+b.h-1)collisions.push(b.id);}return {collisions,cap:css.strokeLinecap,dash:css.strokeDasharray,d:p.getAttribute('d')};});
  });
  for(const wire of geometry){expect(wire.collisions).toEqual([]);expect(wire.cap).toBe('round');expect(wire.dash).toBe('0px, 7px');expect(wire.d).not.toMatch(/[CQ]/);}
  await page.keyboard.press('Tab');
  for(const id of ['order','scaling-replay','scaling-pause','lesson-topic-next','reset']){
   const b=page.locator('#'+id);if(await b.isDisabled())continue;await b.focus();
   const tip=await b.evaluate(e=>{const s=getComputedStyle(e,'::after'),r=e.getBoundingClientRect();return {visible:s.visibility,left:r.left+parseFloat(s.left),right:r.left+parseFloat(s.left)+parseFloat(s.width)+parseFloat(s.paddingLeft)+parseFloat(s.paddingRight),outline:getComputedStyle(e).outlineStyle};});
   expect(tip.visible).toBe('visible');expect(tip.left).toBeGreaterThanOrEqual(0);expect(tip.right).toBeLessThanOrEqual(width);expect(tip.outline).not.toBe('none');
  }
  const coordinates=await circles.evaluateAll(es=>es.map(e=>{const map=e.closest('svg').getBoundingClientRect(),b=e.getBoundingClientRect(),p=e.closest('svg').querySelector(`path[data-to="${e.dataset.to}"]`),point=p.getPointAtLength(p.getTotalLength()*parseFloat(getComputedStyle(e).offsetDistance)/100);return Math.hypot(b.x+b.width/2-map.x-point.x,b.y+b.height/2-map.y-point.y);}));
  coordinates.forEach(d=>expect(d).toBeLessThan(1));
  await page.locator('#order').focus();await expect(page.locator('#order')).toBeFocused();
  await mkdir(out,{recursive:true});await page.locator('.scaling-scene').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${theme}-${width}-topic-${topic+1}.png`});
  if(topic<4)await page.locator('#lesson-topic-next').click();
 }
 await page.locator('#reset').click();await expect(page.locator('#lesson-topic-title')).toContainText('1 / 5');await expect(page.locator('.scaling-scene')).toHaveAttribute('data-status','unrun');
});
test('LAB03 reduced motion retains static truthful routes without animation',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.locator('[data-lesson="3"]').click();
 for(let i=0;i<3;i++)await page.locator('#lesson-topic-next').click();await page.locator('#order').click();
 await expect(page.locator('.scaling-scene')).toHaveAttribute('data-playback','finished');await expect(page.locator('.scaling-particle[data-active=true]')).toHaveCount(3);
 expect(await page.locator('.scaling-scene').evaluate(e=>e.getAnimations({subtree:true}).length)).toBe(0);
 await page.locator('#scaling-replay').click();await expect(page.locator('#scaling-pause')).toBeDisabled();
});
test('LAB03 independent preset topics and unscored playback',async({page})=>{
 await page.goto('/');await page.locator('[data-lesson="3"]').click();
 await expect(page.locator('#lesson-topic-title')).toContainText('1 / 5');
 await expect(page.locator('#lesson-topic input, #lesson-topic select, #lesson-topic-settings')).toHaveCount(0);
 for(const [i,status] of ['overloaded','ready','offline','ready','overloaded'].entries()){
  await expect(page.locator('.scaling-scene')).toHaveAttribute('data-playback','idle');
  await expect(page.locator('#scaling-replay')).toBeDisabled();
  await page.locator('#order').click();await expect(page.locator('.scaling-scene')).toHaveAttribute('data-status',status);
  const result=await page.locator('#scaling-result').innerText();
  await page.locator('#scaling-pause').click();await expect(page.locator('.scaling-scene')).toHaveAttribute('data-playback','paused');
  await page.locator('#scaling-replay').click();await expect(page.locator('#scaling-result')).toHaveText(result);
  await expect(page.locator('#complete-lesson')).toBeDisabled();
  if(i<4)await page.locator('#lesson-topic-next').click();
 }
 await page.locator('[data-answer="0"]').click();await expect(page.locator('#complete-lesson')).toBeEnabled();
});
