import {test,expect} from '@playwright/test';

for(const width of [1280,390,320])for(const theme of ['light','dark'])test(`CDN responsive reading order ${theme} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:800});await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.locator('[data-lesson="7"]').click();
 // Observe every rendered path, including intermediate MISS and fallback frames.
 await page.evaluate(()=>{
  window.cdnGeometry=[];const set=SVGElement.prototype.setAttribute;
  SVGElement.prototype.setAttribute=function(name,value){
   set.call(this,name,value);
   if(name!=='d'||!this.matches('.cdn-wire'))return;
   const map=this.closest('.cdn-map'),base=map.getBoundingClientRect();
   const boxes=[...map.querySelectorAll('.cdn-node')].map(e=>{const r=e.getBoundingClientRect();return {id:e.dataset.node,x:r.x-base.x,y:r.y-base.y,w:r.width,h:r.height};});
   const samples=Array.from({length:201},(_,i)=>{const p=this.getPointAtLength(this.getTotalLength()*i/200);return {x:p.x,y:p.y};});
   const collisions=samples.filter(p=>boxes.some(b=>p.x>b.x+1&&p.x<b.x+b.w-1&&p.y>b.y+1&&p.y<b.y+b.h-1)).length;
   const outside=samples.filter(p=>p.x<0||p.x>base.width||p.y<0||p.y>base.height).length;
   const from=boxes.find(b=>b.id===this.dataset.from),to=boxes.find(b=>b.id===this.dataset.to);
   const distance=(p,b)=>Math.hypot(Math.max(b.x-p.x,0,p.x-b.x-b.w),Math.max(b.y-p.y,0,p.y-b.y-b.h));
   const paths=[...map.querySelectorAll('path')];
   let clearance=null;
   if(paths.every(p=>p.hasAttribute('d'))&&paths.length===2){
    const other=paths.find(p=>p!==this);clearance=Math.min(...samples.flatMap(p=>Array.from({length:201},(_,i)=>{const q=other.getPointAtLength(other.getTotalLength()*i/200);return Math.hypot(p.x-q.x,p.y-q.y);}))) ;
   }
   window.cdnGeometry.push({from:from.id,to:to.id,collisions,outside,clearance,start:distance(samples[0],from),end:distance(samples.at(-1),to),length:this.getTotalLength(),gap:Math.hypot(Math.max(from.x-to.x-to.w,to.x-from.x-from.w,0),Math.max(from.y-to.y-to.h,to.y-from.y-from.h,0))});
  };
 });
 for(let topic=0;topic<6;topic++){
  await page.evaluate(()=>window.cdnGeometry=[]);
  await page.locator('#cdn-run').click();await expect(page.locator('#cdn-run')).toBeEnabled();
  const routes=await page.evaluate(()=>window.cdnGeometry);
  expect(routes.length).toBeGreaterThan(0);
  for(const route of routes){
   expect(route.collisions).toBe(0);expect(route.outside).toBe(0);expect(route.start).toBeLessThan(1);expect(route.end).toBeLessThan(1);
   if(route.clearance!==null)expect(route.clearance).toBeGreaterThanOrEqual(15);
   if(route.from==='edge'||route.to==='edge')expect(route.length).toBeLessThanOrEqual(route.gap+1);
  }
  if(topic===5)expect(new Set(routes.map(r=>`${r.from}-${r.to}`))).toEqual(new Set(['client-origin','origin-client']));
  const boxes=await page.locator('.cdn-node').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};}));
  const [client,edge,origin]=boxes;
  if(width===1280){
   expect(client.x+client.w).toBeLessThan(edge.x);expect(edge.x+edge.w).toBeLessThan(origin.x);
   expect(Math.abs(client.y+client.h/2-edge.y-edge.h/2)).toBeLessThan(1);
   expect(Math.min(...boxes.map(b=>b.w))).toBeGreaterThanOrEqual(180);
   expect((await page.locator('.cdn-map').boundingBox()).height).toBeLessThan(300);
  }else{
   expect(client.y+client.h).toBeLessThan(edge.y);expect(edge.y+edge.h).toBeLessThan(origin.y);
   expect(Math.abs(client.x-origin.x)).toBeLessThan(1);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(topic<5)await page.locator('#lesson-topic-next').click();
 }
});
