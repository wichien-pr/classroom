import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const out=process.env.LAB09_EVIDENCE||new URL('../../../../evidence/lab09-remove-details/',import.meta.url).pathname;
test('all topic geometry, dotted routes, themes, 48px controls and readable results',async({page})=>{
 test.setTimeout(90000);await mkdir(out,{recursive:true});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.env.LAB09_PREVIEW_URL||'/');await page.locator('[data-lesson="9"]').click();await page.emulateMedia({reducedMotion:'reduce'});
 for(const width of [1280,390,320])for(const theme of ['light','dark']){
  await page.setViewportSize({width,height:740});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.locator('#reset').click();
  for(let topic=0;topic<6;topic++){
   await page.locator('#dc-run').click();await expect(page.locator('#dc-run')).toBeEnabled();
   // Glossary enrichment changes node height; allow ResizeObserver's next paint.
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const metrics=await page.locator('.dc-scene').evaluate(scene=>{
    const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};},map=scene.querySelector('.dc-map'),base=rect(map),nodes=[...map.querySelectorAll('.dc-node')].map(rect),issues=[];
    for(const path of scene.querySelectorAll('.dc-wire')){
     const cs=getComputedStyle(path);if(cs.strokeDasharray!=='0px, 7px'||cs.strokeLinecap!=='round')issues.push('track');
     for(let i=1;i<50;i++){const p=path.getPointAtLength(path.getTotalLength()*i/50),x=p.x+base.x,y=p.y+base.y;
      if(p.x<0||p.x>base.w||p.y<0||p.y>base.h)issues.push('bounds');
      if(nodes.some(r=>x>r.x+1&&x<r.x+r.w-1&&y>r.y+1&&y<r.y+r.h-1))issues.push('node intersection');
     }
    }
    const nav=document.querySelector('.lesson-topic-nav'),h=document.querySelector('#lesson-topic-title'),n=rect(nav),title=rect(h);
    const buttons=['#dc-run','#dc-replay','#dc-pause','#lesson-topic-back','#lesson-topic-next','#reset'].map(s=>rect(document.querySelector(s)));
    const lum=color=>{const c=color.match(/[\d.]+/g).slice(0,3).map(v=>{v=Number(v)/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
    const terms=[...scene.querySelectorAll('.term-trigger')].map(e=>{const a=lum(getComputedStyle(e).color),b=lum(getComputedStyle(e.closest('.dc-node')||scene).backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);});
    return {terms,issues,center:Math.abs(n.x+n.w/2-title.x-title.w/2),buttons,overflow:document.documentElement.scrollWidth>innerWidth,bg:getComputedStyle(scene).backgroundColor,resultSize:parseFloat(getComputedStyle(scene.querySelector('#dc-result')).fontSize),nodes:scene.querySelectorAll('[data-node]').length,down:[...scene.querySelectorAll('.dc-offline')].map(e=>({border:getComputedStyle(e).borderTopWidth,opacity:getComputedStyle(e).opacity,bg:getComputedStyle(e).backgroundColor,readyBg:getComputedStyle(scene.querySelector('.dc-ready')).backgroundColor})),toolbar:rect(scene.querySelector('.workload-actions')),result:rect(scene.querySelector('#dc-result'))};
   });
   for(const contrast of metrics.terms)expect(contrast).toBeGreaterThanOrEqual(4.5);
   expect(metrics.issues).toEqual([]);expect(metrics.center).toBeLessThan(1);expect(metrics.overflow).toBe(false);expect(metrics.nodes).toBe(4);expect(metrics.resultSize).toBeGreaterThanOrEqual(16);
   for(const b of metrics.buttons){expect(b.w).toBeGreaterThanOrEqual(48);expect(b.h).toBeGreaterThanOrEqual(48);}expect(metrics.buttons[0].y).toBe(metrics.buttons[1].y);expect(metrics.buttons[1].y).toBe(metrics.buttons[2].y);
   for(const d of metrics.down){expect(d.border).toBe('3px');expect(d.opacity).toBe('1');if(theme==='dark')expect(d.bg).toBe(d.readyBg);}
   if(theme==='light')expect(metrics.bg).toBe('rgb(243, 247, 250)');
   if([0,2,5].includes(topic)){
    const height=Math.ceil((await page.locator('.dc-scene').boundingBox()).height)+220;await page.setViewportSize({width,height});await page.locator('.dc-scene').evaluate(e=>window.scrollBy(0,e.getBoundingClientRect().top-100));
    await page.locator('.dc-scene').screenshot({path:out+`scene-${width}-${theme}-${topic}.png`});await page.setViewportSize({width,height:740});
    await page.locator('.workload-actions').evaluate(e=>window.scrollBy(0,e.getBoundingClientRect().top-120));await page.screenshot({path:out+`result-${width}-${theme}-${topic}.png`});
   }
   if(topic<5)await page.locator('#lesson-topic-next').click();
  }
 }
 expect(errors).toEqual([]);
});
test('compiled motion follows path at 2000ms, pause freezes, replay does not request, navigation cancels',async({page})=>{
 test.setTimeout(90000);await page.goto(process.env.LAB09_PREVIEW_URL||'/');await page.locator('[data-lesson="9"]').click();
 const posts=[];page.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});
 for(const [width,theme] of [[1280,'light'],[320,'dark']]){
  await page.setViewportSize({width,height:740});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.locator('#reset').click();
  await page.evaluate(()=>{window.dcMotion=[];const original=Element.prototype.animate;if(!window.dcOriginal)window.dcOriginal=original;Element.prototype.animate=function(...args){const a=window.dcOriginal.apply(this,args);if(this.matches('.dc-particle')){const r={duration:a.effect.getTiming().duration,finished:false};window.dcMotion.push(r);a.finished.then(()=>r.finished=true,()=>{});}return a;};});
  await page.locator('#dc-run').click();
  await page.locator('.dc-particle').first().evaluate(async e=>{await e.getAnimations()[0].ready;});await page.waitForTimeout(450);
  const position=()=>page.locator('.dc-particle').first().evaluate(e=>{const s=getComputedStyle(e),path=e.parentElement.querySelector('path'),r=e.getBoundingClientRect(),svg=e.parentElement.getBoundingClientRect(),p=path.getPointAtLength(path.getTotalLength()*parseFloat(s.offsetDistance)/100);return {offset:parseFloat(s.offsetDistance),error:Math.hypot(r.x+r.width/2-svg.x-p.x,r.y+r.height/2-svg.y-p.y)};});
  const moving=await position();expect(moving.offset).toBeGreaterThan(5);expect(moving.offset).toBeLessThan(85);expect(moving.error).toBeLessThan(1);
  await page.locator('#dc-pause').click();await page.locator('.dc-particle').first().evaluate(async e=>{await e.getAnimations()[0].ready;});const paused=await position();await page.waitForTimeout(300);expect(await position()).toEqual(paused);
  await page.locator('.workload-actions').screenshot({path:out+`paused-${width}-${theme}.png`});await page.locator('#dc-pause').click();
  await expect(page.locator('#dc-run')).toBeEnabled({timeout:22000});expect(await page.evaluate(()=>window.dcMotion)).toEqual(Array.from({length:2},()=>({duration:2000,finished:true})));
  await expect(page.locator('.dc-details, #dc-route')).toHaveCount(0);await expect(page.locator('#dc-result')).toContainText('60 / West 40');
  await page.locator('#dc-replay').click();await page.waitForTimeout(400);expect((await position()).offset).toBeLessThan(60);await expect(page.locator('#dc-run')).toBeEnabled({timeout:22000});await expect(page.locator('.dc-details, #dc-route')).toHaveCount(0);await expect(page.locator('#dc-result')).toContainText('60 / West 40');
  await page.locator('#dc-replay').click();await page.locator('#lesson-topic-next').click();await expect(page.locator('#dc-result')).toContainText('ยังไม่ได้ทดลอง');expect(await page.locator('.dc-particle').count()).toBe(0);
 }
 expect(posts).toEqual([]);
});
