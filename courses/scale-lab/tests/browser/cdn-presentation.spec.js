import {test,expect} from '@playwright/test';
for(const width of [1280,390,320])for(const theme of ['light','dark'])test(`slow full routes finish before the next snapshot, live and replay ${theme} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:800});
 test.setTimeout(45000);
 const posts=[];page.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});
 await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.locator('[data-lesson="7"]').click();
 // Observe actual WAAPI completion, not just a declared CSS duration.
 await page.evaluate(()=>{
  window.cdnMotion=[];const animate=Element.prototype.animate;
  Element.prototype.animate=function(...args){const a=animate.apply(this,args);
   if(this.matches('.cdn-particle')){
    const entry={route:this.dataset.route,duration:a.effect.getTiming().duration,finished:false,first:100,last:0,error:0};window.cdnMotion.push(entry);
    const sample=()=>{
     if(!this.isConnected||a.playState==='idle')return;
     const css=getComputedStyle(this),progress=parseFloat(css.offsetDistance);
     if(parseFloat(css.opacity)>0){
      entry.first=Math.min(entry.first,progress);entry.last=Math.max(entry.last,progress);
      const svg=this.closest('svg'),base=svg.getBoundingClientRect(),r=this.getBoundingClientRect(),p=svg.querySelectorAll('path')[Number(this.dataset.route)],q=p.getPointAtLength(p.getTotalLength()*progress/100);
      entry.error=Math.max(entry.error,Math.hypot(r.x+r.width/2-base.x-q.x,r.y+r.height/2-base.y-q.y));
     }
     if(a.playState!=='finished')requestAnimationFrame(sample);
    };requestAnimationFrame(sample);a.finished.then(()=>{entry.finished=true;entry.endTime=a.currentTime;},()=>{});
   }
   return a;
  };
 });
 await page.locator('#cdn-run').click();
 const sample=()=>page.locator('.cdn-particle').first().evaluate(e=>{const a=e.getAnimations()[0];return {time:a.currentTime,progress:parseFloat(getComputedStyle(e).offsetDistance),duration:a.effect.getTiming().duration};});
 // Wait for WAAPI's pending start before measuring its timeline (mobile scroll can delay it).
 await page.locator('.cdn-particle').first().evaluate(async e=>{await e.getAnimations()[0].ready;});
 const start=await sample();await expect.poll(async()=>(await sample()).time-start.time,{intervals:[50]}).toBeGreaterThan(400);const later=await sample();
 expect(later.duration).toBe(2000);
 expect(later.progress-start.progress).toBeGreaterThan(10);
 expect(later.progress-start.progress).toBeLessThan(30); // old 900ms cadence travels ~50% here
 expect((later.progress-start.progress)/(later.time-start.time)).toBeCloseTo(100/2000,2);
 await page.waitForTimeout(500);await expect(page.locator('#cdn-route')).toContainText('1 / 4');
 await page.locator('#cdn-pause').click();await page.evaluate(async()=>Promise.all(document.getAnimations().map(a=>a.ready)));
 const frozen=await sample();await page.waitForTimeout(350);expect(await sample()).toEqual(frozen);
 await page.locator('#cdn-pause').click();
 await expect(page.locator('#cdn-stage')).toContainText('2 / 2',{timeout:12000});
 expect(await page.evaluate(()=>window.cdnMotion.slice(0,4).map(e=>e.finished))).toEqual([true,true,true,true]);
 await expect(page.locator('#cdn-run')).toBeEnabled({timeout:7000});
 expect(await page.evaluate(()=>window.cdnMotion.map(e=>[e.duration,e.finished]))).toEqual(Array.from({length:6},()=>[2000,true]));
 // rAF can miss the final 100ms under load; the finished timeline must still reach exactly 2000ms.
 for(const motion of await page.evaluate(()=>window.cdnMotion)){expect(motion.first).toBeLessThan(5);expect(motion.last).toBeGreaterThan(90);expect(motion.endTime).toBe(2000);expect(motion.error).toBeLessThan(1);}
 await expect(page.locator('.cdn-premise')).toContainText('Origin reads 1 · HIT 1 / MISS 1');
 await page.locator('#cdn-replay').click();await page.waitForTimeout(1000);
 await expect(page.locator('#cdn-route')).toContainText('1 / 4');expect((await sample()).duration).toBe(2000);
 await page.locator('#reset').click();await page.waitForTimeout(3000);
 await expect(page.locator('#cdn-result')).toContainText('ยังไม่ได้ทดลอง');expect(posts).toEqual([]);
});
test('pause holds future actions; replay starts at MISS; navigation cancels',async({page})=>{
 await page.goto('/');await page.locator('[data-lesson="7"]').click();await page.locator('#cdn-run').click();
 await expect(page.locator('#cdn-run')).toBeDisabled();await page.locator('#cdn-pause').click();
 await page.waitForTimeout(4200);await expect(page.locator('#cdn-stage')).toContainText('1 / 2');await expect(page.locator('.cdn-premise')).toContainText('HIT 0');
 await page.locator('#cdn-pause').click();await expect(page.locator('#cdn-run')).toBeEnabled({timeout:20000});
 await page.locator('#cdn-replay').click();await expect(page.locator('#cdn-stage')).toContainText('1 / 2');await expect(page.locator('.cdn-premise')).toContainText('HIT 0');
 await page.locator('#lesson-topic-next').click();await page.waitForTimeout(4000);await expect(page.locator('#cdn-result')).toContainText('ยังไม่ได้ทดลอง');
});
test('single primary runs all six independent CDN topics',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.locator('[data-lesson="7"]').click();
 const results=['HIT','STALE','MISS','MISS','STALE','FAILURE'];
 for(let i=0;i<6;i++){
  await expect(page.locator('.cdn-experiments button')).toHaveCount(1);
  await expect(page.locator('#cdn-replay')).toBeDisabled();
  await page.locator('#cdn-run').click();await expect(page.locator('#cdn-run')).toBeEnabled();
  await expect(page.locator('#cdn-result')).toContainText(results[i]);await expect(page.locator('#cdn-stage')).toContainText('ครบ');
  if(i<5)await page.locator('#lesson-topic-next').click();
 }
 await expect(page.locator('#complete-lesson')).toBeDisabled();await page.locator('[data-answer="0"]').click();await expect(page.locator('#complete-lesson')).toBeEnabled();
 await page.locator('#reset').click();await expect(page.locator('#cdn-result')).toContainText('ยังไม่ได้ทดลอง');
});
