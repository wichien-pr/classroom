import {test,expect} from '@playwright/test';
const out=process.env.QUEUE_EVIDENCE;
const counts=[[3,0],[6,0],[5,1],[8,1],[5,4]];
async function measuredMotion(token){
 const start=await token.evaluate(async e=>{const a=e.getAnimations()[0];await a.ready;return {time:a.currentTime,offset:parseFloat(getComputedStyle(e).offsetDistance),duration:a.effect.getTiming().duration};});
 await token.page().waitForTimeout(180);
 const end=await token.evaluate(e=>({time:e.getAnimations()[0].currentTime,offset:parseFloat(getComputedStyle(e).offsetDistance)}));
 expect(start.duration).toBe(1500);expect(end.time-start.time).toBeGreaterThan(100);
 expect(Math.abs((end.offset-start.offset)-(end.time-start.time)/1500*100)).toBeLessThan(.15);
}
async function shot(page,name,width){await page.setViewportSize({width,height:1600});await page.locator('.queue-scene').evaluate(e=>scrollBy(0,e.getBoundingClientRect().top-140));await page.locator('.queue-scene').screenshot({path:`${out}/${name}.png`});}
for(const theme of ['light','dark'])for(const width of [1280,390,320])test(`all five real chip transfers ${theme} ${width}`,async({page})=>{
 const posts=[],errors=[];page.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewportSize({width,height:800});await page.goto('/');await page.locator('[data-lesson="10"]').click();await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
 for(let topic=0;topic<5;topic++){
  await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('#queue-run').click();
  const token=page.locator('.queue-transit');await expect(token.locator('.queue-job')).toHaveCount(topic===4?4:topic<2||topic===3?3:1);
  await measuredMotion(token);
  await page.locator('#queue-pause').click();
  const motion=await token.evaluate(async e=>{const a=e.getAnimations()[0];await a.ready;return {duration:a.effect.getTiming().duration,offset:getComputedStyle(e).offsetDistance};});expect(motion.duration).toBe(1500);
  await page.waitForTimeout(150);expect(await token.evaluate(e=>getComputedStyle(e).offsetDistance)).toBe(motion.offset);
  const g=await token.evaluate(async e=>{
   const a=e.getAnimations()[0],path=document.querySelector('.queue-wire'),src=document.querySelector(`[data-node=${path.dataset.from}]`).getBoundingClientRect(),dest=document.querySelector(`[data-node=${path.dataset.to}]`).getBoundingClientRect(),map=e.parentElement.getBoundingClientRect();
   const saved=a.currentTime,samples=[];
   for(const t of [0,750,1499]){a.currentTime=t;const r=e.getBoundingClientRect(),p=path.getPointAtLength(path.getTotalLength()*t/1500).matrixTransform(path.getScreenCTM());samples.push({inside:r.left>=map.left&&r.right<=map.right,clear:r.top>=src.bottom-1&&r.bottom<=dest.top+1,error:Math.hypot(r.x+r.width/2-p.x,r.y+r.height/2-p.y)});}
   a.currentTime=saved;return {samples,from:path.dataset.from,to:path.dataset.to,ids:[...document.querySelectorAll('.queue-map [data-job]')].map(e=>e.dataset.job)};
  });expect(g.from).toBe(topic<2||topic===3?'producer':'queue');expect(g.to).toBe(topic<2||topic===3?'queue':'worker');expect(new Set(g.ids).size).toBe(g.ids.length);
  for(const s of g.samples){expect(s.inside).toBe(true);expect(s.clear).toBe(true);expect(s.error).toBeLessThan(1);}
  await expect(page.locator('#mq-done')).toHaveText('0');await shot(page,`boxes-transfer-${theme}-${width}-${topic}`,width);
  await page.locator('#queue-pause').click();
  if(topic===2||topic===4){
   await expect(page.locator('#queue-working .queue-job')).toHaveCount(topic===4?4:1);await page.locator('#queue-pause').click();await expect(page.locator('#mq-done')).toHaveText('0');
   expect(await page.locator('#queue-working [data-worker]').evaluateAll(es=>es.map(e=>e.dataset.worker))).toEqual(topic===4?['1','2','3','4']:['1']);
   await shot(page,`boxes-processing-${theme}-${width}-${topic}`,width);await page.locator('#queue-pause').click();
  }
  await expect(page.locator('#queue-run')).toBeEnabled({timeout:25000});await expect(page.locator('#mq-backlog')).toHaveText(String(counts[topic][0]));await expect(page.locator('#mq-done')).toHaveText(String(counts[topic][1]));
  await expect(page.locator('.queue-transit .queue-job,#queue-working .queue-job')).toHaveCount(0);if(topic===1)await expect(page.locator('.queue-wire')).toHaveCount(0);
  await shot(page,`boxes-final-${theme}-${width}-${topic}`,width);
  const final=await page.locator('.queue-map [data-job]').evaluateAll(es=>es.map(e=>e.dataset.job));await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#queue-replay').click();await expect(page.locator('#queue-run')).toBeEnabled();expect(await page.locator('.queue-map [data-job]').evaluateAll(es=>es.map(e=>e.dataset.job))).toEqual(final);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  // Cancel a fresh animated replay; its next snapshot must never leak into the next topic.
  await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('#queue-replay').click();await measuredMotion(token);if(topic<4)await page.locator('#lesson-topic-next').click();else await page.locator('#reset').click();await page.waitForTimeout(50);await expect(page.locator('#queue-result')).toHaveText('ยังไม่ได้ทดลอง');
 }
 expect(posts).toEqual([]);expect(errors).toEqual([]);
});
