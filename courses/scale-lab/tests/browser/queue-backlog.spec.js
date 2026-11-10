import {test,expect} from '@playwright/test';
const out=process.env.QUEUE_EVIDENCE||'../../evidence/lab10-backlog-animation';
async function enter(page){await page.goto('/');await page.locator('[data-lesson="10"]').click();for(let i=0;i<3;i++)await page.locator('#lesson-topic-next').click();}
async function shot(page,name){await page.setViewportSize({width:1280,height:1400});await page.locator('.queue-scene').evaluate(e=>scrollBy(0,e.getBoundingClientRect().top-140));await page.locator('.queue-scene').screenshot({path:`${out}/${name}.png`});}
for(const theme of ['light','dark'])test(`backlog real phases, pause, geometry, replay ${theme}`,async({page})=>{
 const posts=[];page.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});await enter(page);await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
 if(!await page.locator('.queue-backlog').count())await shot(page,'before-compiled');
 await expect(page.locator('.queue-backlog-summary')).toContainText('กด ▶');await expect(page.locator('#queue-waiting .queue-job')).toHaveCount(0);await shot(page,`idle-${theme}`);
 await page.locator('#queue-run').click();await expect(page.locator('.queue-transit .queue-job')).toHaveCount(3);
 const first=await page.locator('.queue-transit').evaluate(e=>getComputedStyle(e).offsetDistance);await page.waitForTimeout(300);expect(await page.locator('.queue-transit').evaluate(e=>getComputedStyle(e).offsetDistance)).not.toBe(first);await page.locator('#queue-pause').click();
 const motion=await page.locator('.queue-transit').evaluate(async e=>{const a=e.getAnimations()[0];await a.ready;return {duration:a.effect.getTiming().duration,time:a.currentTime,offset:getComputedStyle(e).offsetDistance};});expect(motion.duration).toBe(1500);
 await page.waitForTimeout(200);expect(await page.locator('.queue-transit').evaluate(e=>getComputedStyle(e).offsetDistance)).toBe(motion.offset);await expect(page.locator('#mq-backlog')).toHaveText('0');await expect(page.locator('#mq-done')).toHaveText('0');await shot(page,`transfer-${theme}`);
 const geom=await page.locator('.queue-transit').evaluate(e=>{const r=e.getBoundingClientRect(),path=document.querySelector('.queue-wire'),p=path.getPointAtLength(path.getTotalLength()*parseFloat(getComputedStyle(e).offsetDistance)/100).matrixTransform(path.getScreenCTM());return {error:Math.hypot(p.x-r.x-r.width/2,p.y-r.y-r.height/2),left:r.left,right:r.right};});expect(geom.error).toBeLessThan(1);expect(geom.left).toBeGreaterThan(0);expect(geom.right).toBeLessThan(1280);
 await page.locator('#queue-pause').click();await expect(page.locator('#mq-backlog')).toHaveText('3');await expect(page.locator('#queue-balance')).toContainText('0 → 3');
 await expect(page.locator('#mq-backlog')).toHaveText('6',{timeout:6500});await page.locator('#queue-pause').click();await expect(page.locator('#mq-done')).toHaveText('0');await shot(page,`six-waiting-${theme}`);await page.locator('#queue-pause').click();
 await expect(page.locator('#queue-working .queue-job')).toHaveCount(1,{timeout:6500});await page.locator('#queue-pause').click();await expect(page.locator('#queue-working [data-job="1"]')).toBeVisible();await expect(page.locator('#mq-backlog')).toHaveText('5');await expect(page.locator('#mq-done')).toHaveText('0');await page.waitForTimeout(250);await expect(page.locator('#mq-done')).toHaveText('0');await shot(page,`working-${theme}`);await page.locator('#queue-pause').click();
 await expect(page.locator('#queue-run')).toBeEnabled({timeout:12000});await expect(page.locator('#queue-result')).toHaveText('เข้า 9 · เสร็จ 1 · ค้าง 8 งาน');await expect(page.locator('#queue-waiting .queue-job')).toHaveCount(8);await expect(page.locator('#queue-completed [data-job="1"]')).toBeVisible();await shot(page,`final-${theme}`);
 await page.locator('#queue-replay').click();await expect(page.locator('#mq-backlog')).toHaveText('0');await expect(page.locator('#mq-done')).toHaveText('0');await expect(page.locator('#queue-run')).toBeEnabled({timeout:25000});await expect(page.locator('#queue-ingress')).toHaveText('9');expect(posts).toEqual([]);
 await page.locator('#queue-replay').click();await page.locator('#lesson-topic-next').click();await page.waitForTimeout(2500);await expect(page.locator('.queue-backlog')).toHaveCount(0);await expect(page.locator('#queue-result')).toHaveText('ยังไม่ได้ทดลอง');
});
test('moving job chips stay within narrow scenes and cancel without delayed results',async({page})=>{
 for(const theme of ['light','dark'])for(const width of [390,320]){
 await page.setViewportSize({width,height:600});await enter(page);await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.locator('#queue-run').click();await page.waitForTimeout(700);await page.locator('#queue-pause').click();
 const g=await page.locator('.queue-transit').evaluate(async e=>{await Promise.all(e.getAnimations().map(a=>a.ready));const r=e.getBoundingClientRect(),map=e.parentElement.getBoundingClientRect();return {inside:r.left>=map.left&&r.right<=map.right,offset:getComputedStyle(e).offsetDistance};});expect(g.inside).toBe(true);await page.waitForTimeout(200);expect(await page.locator('.queue-transit').evaluate(e=>getComputedStyle(e).offsetDistance)).toBe(g.offset);await expect(page.locator('#mq-done')).toHaveText('0');
 await page.setViewportSize({width,height:1400});await page.locator('.queue-scene').evaluate(e=>scrollBy(0,e.getBoundingClientRect().top-140));await page.locator('.queue-scene').screenshot({path:`${out}/moving-${theme}-${width}.png`});await page.locator('#reset').click();await expect(page.locator('.queue-backlog')).toHaveCount(0);await expect(page.locator('#mq-backlog')).toHaveText('0');
 }
});
test('reduced motion, light/dark narrow geometry and final identity',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const theme of ['light','dark'])for(const width of [390,320]){
 await page.setViewportSize({width,height:600});await enter(page);await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.locator('#queue-run').click();await expect(page.locator('#queue-run')).toBeEnabled();
 expect(await page.locator('#queue-waiting .queue-job').evaluateAll(es=>es.map(e=>e.dataset.job))).toEqual(['2','3','4','5','6','7','8','9']);await expect(page.locator('#mq-done')).toHaveText('1');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const geometry=await page.locator('#queue-waiting').evaluate(e=>{const r=e.getBoundingClientRect();return [...e.children].every(c=>{const b=c.getBoundingClientRect();return b.left>=r.left&&b.right<=r.right;});});expect(geometry).toBe(true);expect(await page.locator('#queue-waiting').evaluate(e=>e.getBoundingClientRect().height)).toBeLessThan(140);
 await page.locator('#queue-run').evaluate(e=>scrollBy(0,e.getBoundingClientRect().top-150));await page.screenshot({path:`${out}/short-${theme}-${width}.png`});await page.setViewportSize({width,height:1800});await page.locator('.queue-scene').evaluate(e=>scrollBy(0,e.getBoundingClientRect().top-140));await page.locator('.queue-scene').screenshot({path:`${out}/mobile-${theme}-${width}.png`});
 }
});
