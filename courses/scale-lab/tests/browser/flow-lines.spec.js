import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
test('record actual connector playback and response frame',async({browser,baseURL})=>{
 const dir=process.env.PARTICLE_REGRESSION ? '../../evidence/particle-speed-correction/flow' : '../../evidence/flow-dotted';await mkdir(dir,{recursive:true});
 const context=await browser.newContext({viewport:{width:1280,height:1100},recordVideo:{dir,size:{width:1280,height:1100}}});
 const page=await context.newPage();
 try{
  await page.goto(baseURL);await page.locator('#flow-slide-next').click();await page.locator('#flow-slide-next').click();
  await page.locator('#flow-scene').evaluate(e=>e.scrollIntoView({block:'center'}));
  await page.locator('#step').evaluate(e=>e.click());
  await expect(page.locator('#flow-scene')).toHaveAttribute('data-stage','http-response',{timeout:8000});
  await page.locator('#flow-pause').evaluate(e=>e.click());
  await page.locator('#flow-scene').screenshot({path:`${dir}/http-response-paused.png`});
  await page.waitForTimeout(300);await page.locator('#flow-pause').evaluate(e=>e.click());
  await expect(page.locator('#flow-scene')).toHaveAttribute('data-playback','finished');
 }finally{await context.close();await page.video().saveAs(`${dir}/directional-playback.webm`);}
});
test('model stages drive real directed paths, round blue particles follow static paths, freeze and resume',async({page})=>{
 await page.goto('/');
 await expect(page.locator('#flow-scene .flow-wire')).toHaveCount(4);
 const geometry=await page.locator('.flow-wire').evaluateAll(es=>es.map(e=>{
  const scene=e.closest('#flow-scene'),m=e.getScreenCTM(),point=n=>{const p=e.getPointAtLength(n);return new DOMPoint(p.x,p.y).matrixTransform(m);};
  const distance=(p,node)=>{const r=scene.querySelector(node==='web'?'.flow-server .flow-machine':`[data-node=${node}]`).getBoundingClientRect();return Math.hypot(Math.max(r.left-p.x,0,p.x-r.right),Math.max(r.top-p.y,0,p.y-r.bottom));};
  return {length:e.getTotalLength(),from:e.dataset.from,to:e.dataset.to,marker:getComputedStyle(e).markerEnd,startGap:distance(point(0),e.dataset.from),endGap:distance(point(e.getTotalLength()),e.dataset.to)};
 }));
 expect(geometry.every(e=>e.startGap<3&&e.endGap<3)).toBe(true);
 expect(geometry.every(e=>e.length>30&&e.marker==='none')).toBe(true);
 await expect(page.locator('#flow-scene marker')).toHaveCount(0);
 expect(await page.locator('#flow-scene svg path').evaluateAll(es=>es.every(e=>getComputedStyle(e).markerStart==='none'&&getComputedStyle(e).markerMid==='none'&&getComputedStyle(e).markerEnd==='none'))).toBe(true);
 expect(geometry.map(e=>[e.from,e.to])).toEqual([['client','dns'],['dns','client'],['client','web'],['web','client']]);
 await page.locator('#flow-slide-next').click();await page.locator('#flow-slide-next').click();await page.locator('#step').click();
 const active=page.locator('.flow-travel.active');await expect(active).toHaveCount(1);
 expect(await active.evaluate(e=>e.tagName)).toBe('circle');
 expect(await active.evaluate(e=>e.r.baseVal.value)).toBeGreaterThan(0);
 expect(await active.evaluate(e=>getComputedStyle(e).fill)).not.toBe(await page.locator('.flow-wire.active').evaluate(e=>getComputedStyle(e).stroke));
 expect(await page.locator('.flow-wire').evaluateAll(es=>es.every(e=>getComputedStyle(e).strokeDasharray==='0px, 7px'&&getComputedStyle(e).strokeLinecap==='round'&&e.getAnimations().length===0))).toBe(true);
 const offset=()=>active.evaluate(e=>getComputedStyle(e).offsetDistance);
 const first=await offset();await page.waitForTimeout(180);expect(await offset()).not.toBe(first);
 await page.locator('#flow-pause').click();
 // CSS pause commits on the next rendering tick; await its ready promise
 // instead of assuming a loaded browser renders within a fixed 50 ms.
 await active.evaluate(e=>Promise.all(e.getAnimations().map(a=>a.ready)));
 const paused=await offset();await page.waitForTimeout(220);expect(await offset()).toBe(paused);
 await page.locator('#flow-pause').click();await page.waitForTimeout(160);expect(await offset()).not.toBe(paused);
 for(const stage of ['dns-return','http-request','process','http-response','display']){
  await expect(page.locator('#flow-scene')).toHaveAttribute('data-stage',stage,{timeout:3500});
  await expect(active).toHaveCount(['process','display'].includes(stage)?0:1);
  if(!['process','display'].includes(stage))await expect(active).toHaveAttribute('data-stage',stage);
 }
 await expect(page.locator('#flow-scene')).toHaveAttribute('data-playback','finished');
 await page.locator('#flow-replay').click();await expect(active).toHaveAttribute('data-stage','dns-query');
 await page.locator('#flow-pause').click();
 await active.evaluate(async e=>{const a=e.getAnimations()[0];await a.ready;a.currentTime=750;});
 await page.locator('#flow-replay').click();await page.locator('#flow-pause').click();
 await active.evaluate(e=>Promise.all(e.getAnimations().map(a=>a.ready)));
 expect(parseFloat(await offset())).toBeLessThan(30);
 await page.locator('#reset').click();await expect(active).toHaveCount(0);
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#step').click();
 await expect(page.locator('#flow-scene')).toHaveAttribute('data-stage','dns-return');
 expect(await active.evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
 expect(await active.evaluate(e=>getComputedStyle(e).visibility)).toBe('hidden');
 expect(await page.locator('.flow-wire.active').evaluate(e=>getComputedStyle(e).strokeDasharray)).toBe('0px, 7px');
});
for(const theme of ['dark','light'])for(const width of [1280,390,320])test(`connector matrix ${theme} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
 const out=process.env.PARTICLE_REGRESSION ? '../../evidence/particle-speed-correction/flow' : '../../evidence/flow-dotted';await mkdir(out,{recursive:true});
 for(let topic=0;topic<4;topic++){
  await page.locator('#step').click();await page.locator('#flow-pause').click();
  expect(await page.locator('.flow-wire').evaluateAll(es=>es.every(e=>e.getTotalLength()>30))).toBe(true);
  await expect(page.locator('.flow-wire')).toHaveCount(4);
  expect(await page.locator('.flow-wire').evaluateAll(es=>es.every(e=>{const s=getComputedStyle(e);return s.strokeDasharray==='0px, 7px'&&s.strokeLinecap==='round'&&s.strokeWidth==='2px'&&e.getAnimations().length===0;}))).toBe(true);
  expect(await page.locator('.flow-travel.active').evaluate(e=>getComputedStyle(e).fill)).not.toBe(await page.locator('.flow-wire.active').evaluate(e=>getComputedStyle(e).stroke));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const labels=await page.locator('#flow-scene span,#flow-scene strong').evaluateAll(es=>es.map(e=>parseFloat(getComputedStyle(e).fontSize)));expect(Math.min(...labels)).toBeGreaterThanOrEqual(16);
  const layout=await page.locator('#flow-scene').evaluate(scene=>{
   const nodes=[...scene.querySelectorAll('.flow-machine')].map(e=>e.getBoundingClientRect());
   const paths=[...scene.querySelectorAll('.flow-wire')].map(e=>({stage:e.dataset.stage,d:e.getAttribute('d'),marker:getComputedStyle(e).markerEnd,points:Array.from({length:Math.ceil(e.getTotalLength())+1},(_,n)=>{const p=e.getPointAtLength(n);return new DOMPoint(p.x,p.y).matrixTransform(e.getScreenCTM());})}));
   const crossings=[];
   for(let i=0;i<paths.length;i++)for(let j=i+1;j<paths.length;j++)if(paths[i].points.some(a=>paths[j].points.some(b=>Math.hypot(a.x-b.x,a.y-b.y)<5)))crossings.push([paths[i].stage,paths[j].stage]);
   const nodeHits=paths.filter(p=>p.points.slice(4,-4).some(q=>nodes.some(r=>q.x>r.left+1&&q.x<r.right-1&&q.y>r.top+1&&q.y<r.bottom-1))).map(p=>p.stage);
   return {widths:nodes.map(r=>r.width),orthogonal:paths.every(p=>/^[MHV\d .-]+$/.test(p.d)),markers:paths.map(p=>p.marker),crossings,nodeHits};
  });
  expect(Math.max(...layout.widths)).toBeLessThanOrEqual(222);
  expect(layout.orthogonal).toBe(true);expect(layout.markers).toEqual(['none','none','none','none']);
  expect(layout.crossings).toEqual([]);expect(layout.nodeHits).toEqual([]);
  // Test the drawn centreline against every actual text box, not only viewBox bounds.
  const collisions=await page.locator('#flow-scene').evaluate(scene=>{
   const texts=[...scene.querySelectorAll('span,strong')].flatMap(e=>{const r=document.createRange();r.selectNodeContents(e);return [...r.getClientRects()];});
   return [...scene.querySelectorAll('.flow-wire')].filter(path=>{const m=path.getScreenCTM();for(let n=0;n<=path.getTotalLength();n+=2){const p=path.getPointAtLength(n),q=new DOMPoint(p.x,p.y).matrixTransform(m);if(texts.some(r=>q.x>r.left-4&&q.x<r.right+4&&q.y>r.top-4&&q.y<r.bottom+4))return true;}return false;}).map(e=>e.dataset.stage);
  });expect(collisions).toEqual([]);
  // Sample every directed route at two animation times. Actual circle centres
  // must coincide with getPointAtLength, including the physical reverse routes.
  const particles=await page.locator('#flow-scene').evaluate(async scene=>{
   const samples=[];
   for(const dot of scene.querySelectorAll('.flow-travel')){
    dot.classList.add('active');
    const animation=dot.getAnimations()[0];await animation.ready;
    const path=scene.querySelector(`.flow-wire[data-stage="${dot.dataset.stage}"]`);
    for(const fraction of [.2,.65]){
     animation.currentTime=800*fraction;
     const r=dot.getBoundingClientRect(),p=path.getPointAtLength(path.getTotalLength()*fraction),q=new DOMPoint(p.x,p.y).matrixTransform(path.getScreenCTM());
     samples.push({stage:dot.dataset.stage,fraction,error:Math.hypot(r.x+r.width/2-q.x,r.y+r.height/2-q.y),width:r.width,height:r.height});
    }
    if(dot.dataset.stage!==scene.dataset.stage)dot.classList.remove('active');
   }return samples;
  });
  expect(particles).toHaveLength(8);
  expect(particles.filter(p=>p.error>=.1||Math.abs(p.width-8)>.01||Math.abs(p.height-8)>.01)).toEqual([]);
  expect(await page.locator('.flow-travel').evaluateAll(es=>es.filter(e=>getComputedStyle(e).visibility==='visible').length)).toBe(1);
  await page.locator('#flow-scene').evaluate(e=>{window.scrollBy(0,e.getBoundingClientRect().top-100);});
  await page.screenshot({path:`${out}/${theme}-${width}-topic${topic+1}-viewport.png`});
  await page.setViewportSize({width,height:1400});await page.locator('#flow-scene').scrollIntoViewIfNeeded();await page.locator('#flow-scene').screenshot({path:`${out}/${theme}-${width}-topic${topic+1}.png`});await page.setViewportSize({width,height:900});
  if(topic===3)await expect(page.locator('.flow-http-routes')).toContainText('JSON');
  if(topic<3)await page.locator('#flow-slide-next').click();
 }
});
