import {test,expect} from '@playwright/test';
for(const width of [1280,390,320])test(`LAB02 dotted model routes ${width}`,async({page})=>{
 await page.setViewportSize({width,height:800});await page.goto('/');await page.locator('[data-lesson-kind=workload]').click();
 for(let topic=0;topic<4;topic++){
  await expect(page.locator('.workload-wire')).toHaveCount(2);
  const wires=await page.locator('.workload-wire').evaluateAll(es=>es.map(e=>({dash:getComputedStyle(e).strokeDasharray,cap:getComputedStyle(e).strokeLinecap,d:e.getAttribute('d'),marker:getComputedStyle(e).markerEnd})));
  for(const w of wires){expect(w.dash).toBe('0px, 7px');expect(w.cap).toBe('round');expect(w.marker).toBe('none');expect(w.d).toMatch(/^M /);}
  await page.locator('#estimate').click();const dot=page.locator('.workload-travel[data-route=http]');
  const a=await dot.evaluate(e=>getComputedStyle(e).offsetDistance);await page.waitForTimeout(150);expect(await dot.evaluate(e=>getComputedStyle(e).offsetDistance)).not.toBe(a);
  await page.locator('#workload-pause').click();await page.locator('.workload-scene').evaluate(async e=>await Promise.all(e.getAnimations({subtree:true}).map(a=>a.ready)));
  const aligned=await dot.evaluate(e=>{const path=e.parentElement.querySelector('.workload-wire[data-route=http]'),p=path.getPointAtLength(path.getTotalLength()*parseFloat(getComputedStyle(e).offsetDistance)/100),origin=e.parentElement.getBoundingClientRect(),r=e.getBoundingClientRect();return {x:Math.abs(r.x+r.width/2-origin.x-p.x),y:Math.abs(r.y+r.height/2-origin.y-p.y),width:r.width,height:r.height};});
  expect(aligned.x).toBeLessThan(1);expect(aligned.y).toBeLessThan(1);expect(aligned.width).toBeCloseTo(8,0);expect(aligned.height).toBeCloseTo(8,0);
  const position=await dot.evaluate(e=>getComputedStyle(e).offsetDistance);await page.waitForTimeout(150);expect(await dot.evaluate(e=>getComputedStyle(e).offsetDistance)).toBe(position);
  await page.locator('#workload-replay').click();await page.waitForTimeout(100);expect(parseFloat(await dot.evaluate(e=>getComputedStyle(e).offsetDistance))).toBeLessThan(30);
  await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('.workload-scene')).toHaveAttribute('data-playback','finished');await expect(page.locator('#workload-pause')).toBeDisabled();await page.emulateMedia({reducedMotion:'no-preference'});
  if(topic<3)await page.locator('#lesson-topic-next').click();
 }
});
