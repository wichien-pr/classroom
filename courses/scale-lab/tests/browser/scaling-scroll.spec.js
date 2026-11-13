import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.SCROLL_EVIDENCE||new URL('../../../../evidence/lab03-scroll/',import.meta.url).pathname;
for(const lab of [2,4])for(const width of [1280,390,320])for(const theme of ['light','dark'])test(`neighbor LAB0${lab} ${width} ${theme}`,async({page})=>{
 await page.setViewportSize({width,height:560});await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.locator(`[data-lesson="${lab}"]`).click();
 const prefix=lab===2?'workload':'balance';
 for(let i=0;i<4;i++){
  await expect(page.locator('#lesson-topic-title')).toContainText(`${i+1} / 4`);await expect(page.locator('.scaling-topic-titles')).toHaveCount(0);
  await page.locator(lab===2?'#estimate':'#route').click();await page.locator(`#${prefix}-pause`).click();await expect(page.locator(`.${prefix}-scene`)).toHaveAttribute('data-playback','paused');if(lab===4){
   // Batch replay is intentionally unavailable until all six routes settle.
   await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#balance-pause').click();await expect(page.locator('#route')).toBeEnabled();
   await page.locator('#balance-replay').click();await expect(page.locator('#route')).toBeEnabled();await page.emulateMedia({reducedMotion:'no-preference'});
  }else await page.locator(`#${prefix}-replay`).click();
  if(i<3){await park(page);await page.locator('#lesson-topic-next').click();expect((await page.locator('.lesson-topic-nav').boundingBox()).y).toBeCloseTo(width===1280?120:114,0);}
 }
 await expect(page.locator('#lesson-topic-next')).toBeDisabled();await page.locator('#reset').click();await expect(page.locator('#lesson-topic-title')).toContainText('1 / 4');
});
async function park(page){await page.evaluate(()=>scrollBy(0,document.querySelector('.lesson-topic-nav').getBoundingClientRect().top-180));await page.waitForTimeout(80);}
async function stable(page,action,settle=350){
 await page.evaluate(()=>{window.frames=[];window.tracking=true;window.geometry=()=>{const n=document.querySelector('.lesson-topic-nav').getBoundingClientRect(),s=document.querySelector('.scaling-scene').getBoundingClientRect();return [scrollY,n.top,n.bottom,s.top];};window.baseline=geometry();const tick=()=>{frames.push(geometry());if(tracking)requestAnimationFrame(tick);};requestAnimationFrame(tick);});
 await action();await page.waitForTimeout(settle);
 const drift=await page.evaluate(()=>{tracking=false;return {max:Math.max(...frames.flatMap(row=>row.map((v,i)=>Math.abs(v-baseline[i])))),baseline,last:frames.at(-1),distinct:[...new Set(frames.map(x=>JSON.stringify(x)))]};});expect(drift.max,JSON.stringify(drift)).toBeLessThanOrEqual(1);
}
for(const width of [1280,390,320])for(const theme of ['light','dark'])test(`LAB03 lifecycle ${width} ${theme}`,async({page})=>{
 await page.setViewportSize({width,height:560});await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.locator('[data-lesson="3"]').click();await page.evaluate(()=>document.fonts.ready);
 const next=page.locator('#lesson-topic-next'),back=page.locator('#lesson-topic-back');
 await park(page);await expect(back).toBeDisabled();
 await stable(page,async()=>{const b=await back.boundingBox();await page.mouse.click(b.x+b.width/2,b.y+b.height/2);});
 for(let topic=0;topic<5;topic++){
  await expect(page.locator('#lesson-topic-title')).toContainText(`${topic+1} / 5`);
  await page.locator('#order').click();await expect(page.locator('.scaling-scene')).toHaveAttribute('data-status',['overloaded','ready','offline','ready','overloaded'][topic]);
  await page.locator('#scaling-pause').click();await expect(page.locator('.scaling-scene')).toHaveAttribute('data-playback','paused');
  await page.locator('#scaling-replay').click();await expect(page.locator('.scaling-scene')).toHaveAttribute('data-playback','running');
  await park(page);
  if(topic<4){
   // Click while the preceding experiment is playing, then rapidly revisit.
   await stable(page,async()=>{await next.click();await back.click();await next.click();},3500);
   await expect(page.locator('.scaling-scene')).toHaveAttribute('data-playback','idle');
   await expect(page.locator('#lesson-topic-title')).toBeFocused();
  }else{
   await expect(next).toBeDisabled();await stable(page,async()=>{const b=await next.boundingBox();await page.mouse.click(b.x+b.width/2,b.y+b.height/2);},3500);
  }
 }
 await park(page);await back.focus();await stable(page,()=>page.keyboard.press('Enter'));await expect(page.locator('#lesson-topic-title')).toBeFocused();
 await page.keyboard.press('Tab');await expect(next).toBeFocused();await stable(page,()=>page.keyboard.press('Space'));await expect(next).toBeDisabled();
 const y=await page.evaluate(()=>scrollY);await page.mouse.wheel(0,200);await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(y+100);await page.waitForTimeout(500);expect(await page.evaluate(()=>scrollY)).toBeGreaterThan(y+100);
 await page.mouse.wheel(0,-200);await expect.poll(()=>page.evaluate(()=>scrollY)).toBeLessThan(y+50);
 // Reset intentionally retains the existing full-remount/header-focus contract.
 await page.locator('#reset').click();await expect(page.locator('#reset')).toBeFocused();await expect(back).toBeDisabled();await expect(page.locator('.scaling-scene')).toHaveAttribute('data-status','unrun');
 await park(page);await stable(page,()=>next.click(),3500);await next.click();await mkdir(out,{recursive:true});await page.screenshot({path:`${out}/lifecycle-${width}-${theme}.png`});
 await expect(page.locator('#lesson-topic .experiment')).toHaveCount(0);await expect(page.locator('.scaling-topic-size')).toHaveCount(5);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
for(const width of [1280,390,320])for(const theme of ['light','dark'])test(`LAB03 viewport ${width} ${theme}`,async({page})=>{
 await page.setViewportSize({width,height:560});await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.locator('[data-lesson="3"]').click();await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(()=>{window.scrollCalls=[];const original=Element.prototype.scrollIntoView;Element.prototype.scrollIntoView=function(...args){window.scrollCalls.push({id:this.id,args,stack:new Error().stack});return original.apply(this,args);};});
 if(process.env.SCROLL_PROBE)await page.evaluate(mode=>{
  if(mode==='no-scroll')Element.prototype.scrollIntoView=function(){};
  if(mode==='no-focus')HTMLElement.prototype.focus=function(){};
  if(mode==='no-anchor')document.documentElement.style.overflowAnchor='none';
 },process.env.SCROLL_PROBE);
 const rows=[];
 for(const direction of ['next','back'])for(let i=0;i<4;i++){
  await page.evaluate(top=>scrollBy(0,document.querySelector('.lesson-topic-nav').getBoundingClientRect().top-top),[90,180,300,120][i]);await page.waitForTimeout(100);
  await page.evaluate(()=>{
   window.samples=[];window.sampling=true;window.measure=()=>{const n=document.querySelector('.lesson-topic-nav').getBoundingClientRect(),s=document.querySelector('.scaling-scene').getBoundingClientRect();return {y:scrollY,nav:n.top,navBottom:n.bottom,scene:s.top,sceneBottom:s.bottom,height:document.documentElement.scrollHeight,focus:document.activeElement.id};};
   window.before=measure();
   window.capture=()=>samples.push({...measure(),phase:'capture'});window.bubble=()=>samples.push({...measure(),phase:'bubble'});
   document.addEventListener('click',capture,true);document.addEventListener('click',bubble);
   window.observer=new MutationObserver(()=>samples.push({...measure(),phase:'mutation'}));observer.observe(document.querySelector('#lesson-topic'),{childList:true,subtree:true});
   const tick=()=>{samples.push({...measure(),phase:'frame'});if(sampling)requestAnimationFrame(tick);};requestAnimationFrame(tick);
  });
  await page.locator('#lesson-topic-'+direction).click();await page.waitForTimeout(400);
  const row=await page.evaluate(()=>{sampling=false;observer.disconnect();document.removeEventListener('click',capture,true);document.removeEventListener('click',bubble);return {before,samples,calls:scrollCalls.splice(0),topic:document.querySelector('#lesson-topic').dataset.topic};});rows.push(row);
  for(const key of ['y','nav','navBottom','scene'])expect.soft(Math.max(...row.samples.map(s=>Math.abs(s[key]-row.before[key]))),`${direction} ${i} ${key} drift`).toBeLessThanOrEqual(1);
 }
 await mkdir(out,{recursive:true});await writeFile(`${out}/${width}-${theme}.json`,JSON.stringify(rows,null,2));await page.screenshot({path:`${out}/${width}-${theme}.png`});
});
