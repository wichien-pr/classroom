import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const out=new URL('../../../../evidence/lab05-presentation/',import.meta.url).pathname;
for(const width of [1280,390,320])for(const theme of ['light','dark'])test(`LAB05 geometry motion tooltips ${theme} ${width}`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewportSize({width,height:800});await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.locator('[data-lesson="5"]').click();
 for(let topic=0;topic<8;topic++){
  const action='replication-run';
  const primaryBox=await page.locator('#replication-run').boundingBox(),replayBox=await page.locator('#replication-replay').boundingBox();expect(primaryBox.y).toBe(replayBox.y);
  const header=await page.locator('.lesson-topic-nav').boundingBox(),title=await page.locator('#lesson-topic-title').boundingBox();expect(Math.abs(header.x+header.width/2-title.x-title.width/2)).toBeLessThan(1);
  for(const id of [action,'lesson-topic-next','lesson-topic-back','reset']){const b=page.locator('#'+id),r=await b.boundingBox();expect(r.width).toBe(48);expect(r.height).toBe(48);await expect(b).toHaveAttribute('title',await b.getAttribute('aria-label'));}
  await page.locator('#'+action).click();await expect(page.locator('#replication-stage')).toContainText(`${[1,2,1,1,1,1,1,5][topic]} /` ,{timeout:16000});const circles=page.locator('.replication-particle');await expect(circles).toHaveCount([1,2,1,1,0,0,0,1][topic]);
  if(await circles.count()){
  const first=circles.first();await expect.poll(()=>first.evaluate(e=>parseFloat(getComputedStyle(e).offsetDistance))).toBeGreaterThan(0);
  const before=await first.evaluate(e=>getComputedStyle(e).offsetDistance);await page.waitForTimeout(80);expect(await first.evaluate(e=>getComputedStyle(e).offsetDistance)).not.toBe(before);
  await page.locator('#replication-pause').click();await page.evaluate(async()=>Promise.all(document.getAnimations().map(a=>a.ready)));
  const frozen=await circles.evaluateAll(es=>es.map(e=>getComputedStyle(e).offsetDistance));await page.waitForTimeout(80);expect(await circles.evaluateAll(es=>es.map(e=>getComputedStyle(e).offsetDistance))).toEqual(frozen);
  const coordinates=await circles.evaluateAll(es=>es.filter(e=>parseFloat(getComputedStyle(e).opacity)>0).map(e=>{const base=e.closest('svg').getBoundingClientRect(),b=e.getBoundingClientRect(),p=e.closest('svg').querySelectorAll("path")[Number(e.dataset.route)],q=p.getPointAtLength(p.getTotalLength()*parseFloat(getComputedStyle(e).offsetDistance)/100);return Math.hypot(b.x+b.width/2-base.x-q.x,b.y+b.height/2-base.y-q.y);}));
  expect(coordinates.length).toBeGreaterThan(0);coordinates.forEach(d=>expect(d).toBeLessThan(1));
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(theme==='light')expect(await page.locator('.replication-scene').evaluate(e=>getComputedStyle(e).backgroundColor)).toBe('rgb(243, 247, 250)');
  await expect(page.locator('.replication-ready')).toHaveCount([1,3,1,1,0,1,1,2][topic]);
  const toolbar=await page.locator('.replication-scene .workload-actions').evaluate(e=>{const s=getComputedStyle(e);return [s.backgroundColor,s.borderTopWidth,s.borderLeftWidth,s.borderBottomWidth,s.borderRadius]});expect(toolbar).toEqual(['rgba(0, 0, 0, 0)','1px','0px','0px','0px']);
  await expect(page.locator('.replication-offline')).toHaveCount([0,0,1,2,1,1,1,1][topic]);
  const down=await page.locator('.replication-offline').evaluateAll(es=>es.map(e=>({border:getComputedStyle(e).borderWidth,color:getComputedStyle(e).color,colors:[...e.children].map(c=>getComputedStyle(c).color)})));
  for(const d of down){expect(d.border).toBe('3px');expect(d.colors.every(c=>c===d.color)).toBe(true);}
  const geometry=await page.locator('.replication-map').evaluate(map=>{
   const origin=map.getBoundingClientRect(),boxes=[...map.querySelectorAll('.replication-node')].map(n=>{const b=n.getBoundingClientRect();return {x:b.x-origin.x,y:b.y-origin.y,w:b.width,h:b.height};});
   return [...map.querySelectorAll('path')].map(p=>{const css=getComputedStyle(p);let collisions=0;for(let i=1;i<99;i++){const q=p.getPointAtLength(p.getTotalLength()*i/100);for(const b of boxes)if(q.x>b.x+1&&q.x<b.x+b.w-1&&q.y>b.y+1&&q.y<b.y+b.h-1)collisions++;}return {collisions,cap:css.strokeLinecap,dash:css.strokeDasharray,d:p.getAttribute('d')};});
  });
  for(const wire of geometry){expect(wire.collisions).toBe(0);expect(wire.cap).toBe('round');expect(wire.dash).toBe('0px, 7px');expect(wire.d).not.toMatch(/[CQ]/);}
  await page.keyboard.press('Tab');
  for(const id of [action,'replication-replay','replication-pause','lesson-topic-next','reset']){
   const b=page.locator('#'+id);if(await b.isDisabled())continue;await b.focus();const tip=await b.evaluate(e=>{const s=getComputedStyle(e,'::after'),r=e.getBoundingClientRect();return {visible:s.visibility,left:r.left+parseFloat(s.left),right:r.left+parseFloat(s.left)+parseFloat(s.width)+parseFloat(s.paddingLeft)+parseFloat(s.paddingRight),outline:getComputedStyle(e).outlineStyle};});
   expect(tip.visible).toBe('visible');expect(tip.left).toBeGreaterThanOrEqual(0);expect(tip.right).toBeLessThanOrEqual(width);expect(tip.outline).not.toBe('none');
  }
  await mkdir(out,{recursive:true});await page.locator('#lesson-topic').evaluate(e=>window.scrollBy(0,e.getBoundingClientRect().top-100));await page.screenshot({path:`${out}/${theme}-${width}-topic-${topic+1}-header.png`});await page.locator('.workload-actions').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${theme}-${width}-topic-${topic+1}-result.png`});
  if(topic<7)await page.locator('#lesson-topic-next').click();
 }
 await page.locator('#reset').click();await expect(page.locator('#lesson-topic-title')).toContainText('1 / 8');await expect(page.locator('#replication-replay')).toBeDisabled();expect(errors).toEqual([]);
});
test('LAB05 reduced motion static truthful routes',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.locator('[data-lesson="5"]').click();
 for(let i=0;i<8;i++){await page.locator('#replication-run').click();await expect(page.locator('#replication-run')).toBeEnabled();await expect(page.locator('.replication-scene')).toHaveAttribute('data-playback','finished');expect(await page.locator('.replication-scene').evaluate(e=>e.getAnimations({subtree:true}).length)).toBe(0);await page.locator('#replication-replay').click();await expect(page.locator('#replication-pause')).toBeDisabled();if(i<7)await page.locator('#lesson-topic-next').click();}
});
