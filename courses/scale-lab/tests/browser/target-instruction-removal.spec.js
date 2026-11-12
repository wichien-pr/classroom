import {test,expect} from '@playwright/test';
import {mkdir,readFile} from 'node:fs/promises';
const evidence=process.env.STRIP_EVIDENCE||'../../evidence/labs01-08-strips';
const targets={flow:4,stock:5,balance:4,replica:8,cache:5,cdn:6,'stateless-web':7};
for(const width of [1280,390,320])for(const theme of ['light','dark'])test(`all target topics ${width} ${theme}`,async({page})=>{
 await mkdir(evidence,{recursive:true});await page.setViewportSize({width,height:900});await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [kind,count] of Object.entries(targets)){
  await page.locator(`[data-lesson-kind="${kind}"]`).click();const flow=kind==='flow',root=flow?'#flow-topic':'#lesson-topic',next=flow?'#flow-slide-next':'#lesson-topic-next',back=flow?'#flow-slide-back':'#lesson-topic-back',title=flow?'#flow-slide-title':'#lesson-topic-title';
  const check=async()=>{
   await expect(page.locator(`${root} .experiment,#flow-instruction`)).toHaveCount(0);
   await expect(page.locator(`${root} #architecture`)).toBeVisible();await expect(page.locator('.quiz')).toBeVisible();
   const g=await page.locator(root).evaluate(e=>{const n=e.querySelector('nav'),r=n.getBoundingClientRect(),s=n.nextElementSibling.getBoundingClientRect();const buttons=[...e.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width>0);return {border:getComputedStyle(n).borderBottomWidth,padding:getComputedStyle(n).paddingBottom,gap:s.top-r.bottom,overflow:document.documentElement.scrollWidth>innerWidth,buttons:buttons.length,unnamed:buttons.filter(b=>!(b.getAttribute('aria-label')||b.textContent).trim()).length};});
   expect(g.border).toBe('0px');expect(g.padding).toBe('0px');expect(g.gap).toBeGreaterThanOrEqual(0);expect(g.gap).toBeLessThanOrEqual(24);expect(g.overflow).toBe(false);expect(g.buttons).toBeGreaterThanOrEqual(5);expect(g.unnamed).toBe(0);
   if(flow)await expect(page.locator('#flow-scenario')).toContainText('api.example.test');
  };
  for(let i=0;i<count;i++){await check();await expect(page.locator(title)).toContainText(`${i+1} / ${count}`);await page.locator(root).evaluate(e=>window.scrollBy(0,e.getBoundingClientRect().top-90));await page.screenshot({path:`${evidence}/${kind}-${theme}-${width}-${i+1}.png`});if(i<count-1)await page.locator(next).click();}
  await expect(page.locator(next)).toBeDisabled();for(let i=count-2;i>=0;i--){await page.locator(back).click();await check();}await expect(page.locator(back)).toBeDisabled();await page.locator('#reset').click();await check();await page.locator('[data-lesson-kind=workload]').click();await expect(page.locator('#lesson-topic .experiment')).toHaveCount(0);await page.locator(`[data-lesson-kind="${kind}"]`).click();await check();
 }
 expect(errors).toEqual([]);
});
const playback=[['flow','step','flow','#flow-scene','.flow-travel.active'],['stock','order','scaling','.scaling-scene','.scaling-particle[data-active=true]'],['balance','route','balance','.balance-scene','.balance-particle[data-active=true]'],['replica','replication-run','replication','.replication-scene','.replication-particle'],['cache','cache-run','cache','.cache-scene','.cache-particle'],['cdn','cdn-run','cdn','.cdn-scene','.cdn-particle'],['stateless-web','web-run','web','.web-scene','.web-particle']];
for(const width of [1280,390])for(const theme of ['light','dark'])test(`real playback all seven ${width} ${theme}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
 for(const [kind,run,prefix,scene,particle] of playback){
  await page.locator(`[data-lesson-kind="${kind}"]`).click();await page.locator(`#${run}`).click();
  const sample=()=>page.locator(particle).first().evaluate(async e=>{const a=e.getAnimations()[0];await a.ready;return {time:a.currentTime,offset:getComputedStyle(e).offsetDistance};});
  await expect.poll(()=>page.locator(particle).first().evaluate(e=>e.getAnimations().length)).toBeGreaterThan(0);const start=await sample();await page.waitForTimeout(180);expect((await sample()).time).toBeGreaterThan(start.time);
  await page.locator(`#${prefix}-pause`).click();const frozen=await sample();await page.waitForTimeout(180);expect(await sample()).toEqual(frozen);
  await page.locator(scene).evaluate(e=>window.scrollBy(0,e.getBoundingClientRect().top-90));await page.screenshot({path:`${evidence}/${kind}-${theme}-${width}-paused.png`});
  await page.locator(`#${prefix}-pause`).click();await expect(page.locator(scene)).toHaveAttribute('data-playback','finished',{timeout:40000});await expect(page.locator(`#${run}`)).toBeEnabled({timeout:40000});
  await page.locator(`#${prefix}-replay`).click();await expect(page.locator(scene)).toHaveAttribute('data-playback','finished',{timeout:40000});
  await expect(page.locator('#flow-instruction,#lesson-topic .experiment')).toHaveCount(0);
 }
});
test('every target topic executes and replays without remounting instructions',async({page},info)=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');const outcomes=[];
 for(const [kind,run,prefix,scene] of playback){await page.locator(`[data-lesson-kind="${kind}"]`).click();for(let i=0;i<targets[kind];i++){
  if(i)await page.locator(kind==='flow'?'#flow-slide-next':'#lesson-topic-next').click();await page.locator(`#${run}`).click();await expect(page.locator(scene)).toHaveAttribute('data-playback','finished',{timeout:10000});await expect(page.locator(`#${run}`)).toBeEnabled();
  const text=await page.locator(scene).innerText();expect(text.trim().length).toBeGreaterThan(20);outcomes.push({kind,topic:i+1,text});await page.locator(`#${prefix}-replay`).click();await expect(page.locator(scene)).toHaveAttribute('data-playback','finished');await expect(page.locator('#flow-instruction,#lesson-topic .experiment')).toHaveCount(0);
 }}await info.attach('all-topic-outcomes',{body:JSON.stringify(outcomes),contentType:'application/json'});
});
test('untargeted LAB09–12 retain exact instruction DOM on every topic',async({page})=>{
 // Bounded pre-edit capture is committed; output evidence is never an input.
 const baseline=JSON.parse(await readFile(new URL('./fixtures/untargeted-instruction-baseline.json',import.meta.url),'utf8'));
 expect(Object.fromEntries(['data-centers','message-queue','logging-operations','database-scaling'].map(kind=>[kind,baseline.filter(r=>r.kind===kind).length]))).toEqual({'data-centers':6,'message-queue':5,'logging-operations':3,'database-scaling':2});
 await page.goto('/');
 for(const kind of ['data-centers','message-queue','logging-operations','database-scaling']){
 await page.locator(`[data-lesson-kind="${kind}"]`).click();for(const [i,row] of baseline.filter(r=>r.kind===kind).entries()){
 if(i)await page.locator('#lesson-topic-next').click();await expect(page.locator('#lesson-topic-title')).toHaveText(row.title);expect(await page.locator('#lesson-topic .experiment').evaluateAll(es=>es[0]?.outerHTML??null)).toBe(row.strip);
 }}
});
