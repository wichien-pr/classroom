import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {preview} from 'vite';
import {chromium} from 'playwright';
let browser,servers=[],urls={};
import {lessons} from '../src/lessons.js';
const out=new URL('../../../evidence/estimation-latency/',import.meta.url).pathname;
before(async()=>{
 const dir=await mkdtemp(join(tmpdir(),'estimate-latency-'));
 for(const mode of ['standalone','account']){
  const outDir=mode==='account'&&process.env.LATENCY_DIST||join(dir,mode);
  const base=mode==='account'?'/courses/back-of-the-envelope-estimation/':'/';
  if(!(mode==='account'&&process.env.LATENCY_DIST))execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build','--outDir',outDir,'--base',base],{env:{...process.env,VITE_CLASSROOM_URL:mode==='account'?'/':'',VITE_CLASSROOM_PROGRESS_URL:mode==='account'?'/api/courses/back-of-the-envelope-estimation/progress':''},stdio:'pipe'});
  const server=await preview({base,build:{outDir},preview:{host:'127.0.0.1',port:0,strictPort:true}});servers.push(server);urls[mode]=`http://127.0.0.1:${server.httpServer.address().port}${base}`;
 }
 browser=await chromium.launch({channel:'chrome',headless:true});await mkdir(out,{recursive:true});
});
after(async()=>{await browser?.close();for(const server of servers)await new Promise(r=>server.httpServer.close(r))});
async function open(mode){
 const page=await browser.newPage();
 const criteria=Object.fromEntries(lessons.map(l=>[l.id,{manual:false,simulation:false,thinking:false}]));
 const awards=new Set();
 await page.route('**/api/courses/*/progress',async r=>{
  if(r.request().method()==='POST')criteria[r.request().postDataJSON().lesson_id].manual=true;
  await r.fulfill({json:{csrf_token:'qa-only',completed:lessons.filter(l=>Object.values(criteria[l.id]).every(Boolean)).map(l=>l.id),total:6,criteria}});
 });
 await page.route('**/api/courses/*/participation',async r=>{
  if(r.request().method()==='POST'){const b=r.request().postDataJSON();criteria[b.lesson_id][b.simulation_id==='check-your-thinking'?'thinking':'simulation']=true;awards.add(`${b.lesson_id}/${b.action}`)}
  await r.fulfill({json:{csrf_token:'qa-only',score:awards.size,total:18}});
 });
 await page.goto(urls[mode]);await page.locator('[data-lesson="estimate-latency"]').click();await page.locator('#calculate:enabled').waitFor();return page;
}
for(const mode of ['standalone','account']){

test(`${mode}: LAB02 renders full historical reference, units and qualified lessons from the PDF`,async()=>{
 const page=await open(mode);try{
  assert.equal(await page.locator('.latency-reference tbody tr').count(),13);
  assert.deepEqual(await page.locator('.latency-reference tbody tr').evaluateAll(rs=>rs.map(r=>Number(r.dataset.ns))),[.5,5,7,100,100,10000,20000,250000,500000,10000000,10000000,30000000,150000000]);
  assert.match(await page.locator('.latency-reference caption').textContent(),/2010/);
  for(const word of ['nanosecond','microsecond','millisecond','1,000,000 ns'])assert.ok((await page.locator('.latency-units').textContent()).includes(word));
  assert.equal(await page.locator('.latency-insights li').count(),5);
  await page.locator('.latency-era summary').click();
  assert.match(await page.locator('.latency-era').textContent(),/2020/);
  assert.match(await page.locator('.latency-era').textContent(),/ไม่ได้นำ/);
  for(const width of [320,390,1440]){
   await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert.ok(await page.locator('.latency-reference td').evaluateAll(cs=>cs.every(c=>c.scrollWidth<=c.clientWidth+1)));
   const panel=page.locator('.latency-reference'),box=await panel.boundingBox();
   await page.setViewportSize({width,height:Math.max(1000,Math.ceil(box.height)+120)});
   await panel.evaluate(el=>scrollTo(0,scrollY+el.getBoundingClientRect().top-90));
   await panel.screenshot({path:join(out,`${mode}-reference-${width}.png`)});
   await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:join(out,`${mode}-lesson-${width}.png`),fullPage:true});
  }
  await page.locator('[data-lesson="estimate-units"]').click();assert.equal(await page.locator('.latency-reference').count(),0);assert.equal(await page.locator('.units-reference tbody tr').count(),5);
  await page.locator('[data-lesson="estimate-latency"]').click();assert.equal(await page.locator('.latency-reference tbody tr').count(),13);
 }finally{await page.close()}
});
test(`${mode}: every historical comparison calculates correctly and retains snapshot on remount`,async()=>{
 const page=await open(mode);const errors=[];page.on('pageerror',e=>errors.push(e.message));try{
  const fmt=n=>new Intl.NumberFormat('en',{maximumSignificantDigits:4}).format(n);
  const values=await page.locator('#input-second option').evaluateAll(os=>os.map(o=>o.value));
  assert.equal(values.length,11);
  for(const value of values){
   await page.locator('#input-second').selectOption(value);await page.locator('#calculate').click();await page.locator('#calculate:enabled').waitFor();
   assert.deepEqual(await page.locator('#result dd').allTextContents(),[Number(value)/100,Number(value)/1e6,Number(value)/1e6*10].map(v=>`≈ ${fmt(v)}`));
  }
  const result=await page.locator('#result').textContent();await page.locator('#input-count').fill('100');
  await page.locator('[data-lesson="estimate-availability"]').click();await page.locator('[data-lesson="estimate-latency"]').click();
  assert.equal(await page.locator('#result').textContent(),result);
  await page.locator('#reset').click();assert.equal(await page.locator('#input-first').inputValue(),'100');assert.equal(await page.locator('#input-second').inputValue(),'150000000');
  const term=page.locator('.lesson-intro .term-trigger').first();await term.focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#term-hint').evaluate(e=>e.matches(':popover-open')),true);await page.keyboard.press('Escape');
  assert.equal(await term.evaluate(e=>e===document.activeElement),true);
  await page.locator('#complete-lesson').click();await page.locator('#calculate:enabled').waitFor();await page.locator('[data-answer]').first().click();await page.waitForFunction(()=>document.querySelector('#progress-count').textContent==='1 / 6');assert.deepEqual(errors,[]);
 }finally{await page.close()}
});
}
