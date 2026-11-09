import {test,expect} from '@playwright/test';
test('slow full routes finish before the next snapshot, live and replay',async({page})=>{
 test.setTimeout(45000);
 const posts=[];page.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});
 await page.goto('/');await page.locator('[data-lesson="6"]').click();
 // Observe actual WAAPI completion, not just a declared CSS duration.
 await page.evaluate(()=>{
  window.cacheMotion=[];const animate=Element.prototype.animate;
  Element.prototype.animate=function(...args){const a=animate.apply(this,args);
   if(this.matches('.cache-particle')){const entry={route:this.dataset.route,duration:a.effect.getTiming().duration,finished:false};window.cacheMotion.push(entry);a.finished.then(()=>entry.finished=true,()=>{});}
   return a;
  };
 });
 await page.locator('#cache-run').click();
 const sample=()=>page.locator('.cache-particle').first().evaluate(e=>{const a=e.getAnimations()[0];return {time:a.currentTime,progress:parseFloat(getComputedStyle(e).offsetDistance),duration:a.effect.getTiming().duration};});
 const start=await sample();await page.waitForTimeout(450);const later=await sample();
 expect(later.duration).toBe(2000);
 expect(later.progress-start.progress).toBeGreaterThan(10);
 expect(later.progress-start.progress).toBeLessThan(30); // old 900ms cadence travels ~50% here
 expect((later.progress-start.progress)/(later.time-start.time)).toBeCloseTo(100/2000,2);
 await page.waitForTimeout(500);await expect(page.locator('#cache-route')).toContainText('1 / 4');
 await page.locator('#cache-pause').click();await page.evaluate(async()=>Promise.all(document.getAnimations().map(a=>a.ready)));
 const frozen=await sample();await page.waitForTimeout(350);expect(await sample()).toEqual(frozen);
 await page.locator('#cache-pause').click();
 await expect(page.locator('#cache-stage')).toContainText('2 / 2',{timeout:12000});
 expect(await page.evaluate(()=>window.cacheMotion.slice(0,4).map(e=>e.finished))).toEqual([true,true,true,true]);
 await expect(page.locator('#cache-run')).toBeEnabled({timeout:7000});
 expect(await page.evaluate(()=>window.cacheMotion.map(e=>[e.duration,e.finished]))).toEqual(Array.from({length:6},()=>[2000,true]));
 await expect(page.locator('.cache-premise')).toContainText('DB reads 1 · HIT 1 / MISS 1 · เวลาจำลอง 0 / TTL 3');
 await page.locator('#cache-replay').click();await page.waitForTimeout(1000);
 await expect(page.locator('#cache-route')).toContainText('1 / 4');expect((await sample()).duration).toBe(2000);
 await page.locator('#reset').click();await page.waitForTimeout(3000);
 await expect(page.locator('#cache-result')).toContainText('ยังไม่ได้ทดลอง');expect(posts).toEqual([]);
});
test('pause holds future actions; replay starts at MISS; navigation cancels',async({page})=>{
 await page.goto('/');await page.locator('[data-lesson="6"]').click();await page.locator('#cache-run').click();
 await expect(page.locator('#cache-run')).toBeDisabled();await page.locator('#cache-pause').click();
 await page.waitForTimeout(4200);await expect(page.locator('#cache-stage')).toContainText('1 / 2');await expect(page.locator('.cache-premise')).toContainText('HIT 0');
 await page.locator('#cache-pause').click();await expect(page.locator('#cache-run')).toBeEnabled({timeout:20000});
 await page.locator('#cache-replay').click();await expect(page.locator('#cache-stage')).toContainText('1 / 2');await expect(page.locator('.cache-premise')).toContainText('HIT 0');
 await page.locator('#lesson-topic-next').click();await page.waitForTimeout(4000);await expect(page.locator('#cache-result')).toContainText('ยังไม่ได้ทดลอง');
});
test('one primary experiment completes each independent cache topic',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.locator('[data-lesson="6"]').click();
 const results=['HIT','STALE','MISS','MISS','MISS'];
 for(let i=0;i<5;i++){
  await expect(page.locator('.cache-experiments button')).toHaveCount(1);
  await expect(page.locator('#cache-replay')).toBeDisabled();
  await page.locator('#cache-run').click();await expect(page.locator('#cache-run')).toBeEnabled();
  await expect(page.locator('#cache-result')).toContainText(results[i]);await expect(page.locator('#cache-stage')).toContainText('ครบ');
  if(i<4)await page.locator('#lesson-topic-next').click();
 }
 await page.locator('[data-answer="0"]').click();await expect(page.locator('#complete-lesson')).toBeEnabled();
 await page.locator('#reset').click();await expect(page.locator('#cache-result')).toContainText('ยังไม่ได้ทดลอง');
});
