import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {preview} from 'vite';
import {chromium} from 'playwright';
import {expect} from '@playwright/test';
import {lessons} from '../src/lessons.js';
const id=lessons[0].id, second=lessons[1].id;
const missing='ยังขาด: กดเรียนจบ · ทดลองหลักอย่างน้อย 1 ครั้ง · ตอบ Check your thinking A หรือ B อย่างน้อย 1 ครั้ง (ไม่ต้องถูก) · ทำตามลำดับใดก็ได้ ครบทุกบทจึงนับคลาสสำหรับ Level';
const evidence=new URL('../../../evidence/estimation-completion/',import.meta.url).pathname;
let browser, servers=[], urls={};
before(async()=>{
 const dir=await mkdtemp(join(tmpdir(),'estimate-completion-'));
 await mkdir(evidence,{recursive:true});
 for(const mode of ['account','standalone']){
  const outDir=mode==='account'&&process.env.COMPLETION_ACCOUNT_DIST||join(dir,mode);
  const base=mode==='account'?'/courses/back-of-the-envelope-estimation/':'/';
  if(!(mode==='account'&&process.env.COMPLETION_ACCOUNT_DIST))execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build','--outDir',outDir,'--base',base],{env:{...process.env,VITE_CLASSROOM_URL:mode==='account'?'/':'',VITE_CLASSROOM_PROGRESS_URL:mode==='account'?'/api/courses/back-of-the-envelope-estimation/progress':''},stdio:'pipe'});
  const server=await preview({base,build:{outDir},preview:{host:'127.0.0.1',port:0,strictPort:true}});
  servers.push(server);urls[mode]=`http://127.0.0.1:${server.httpServer.address().port}${base}`;
 }
 browser=await chromium.launch({channel:'chrome',headless:true});
});
after(async()=>{await browser?.close();for(const s of servers)await new Promise(r=>s.httpServer.close(r))});
async function fixture(options={}){
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 const page=await context.newPage(), errors=[];page.on('pageerror',e=>errors.push(e.message));
 const criteria=Object.fromEntries(lessons.map(l=>[l.id,{manual:false,simulation:false,thinking:false}]));
 Object.assign(criteria[id],options.criteria);
 const calls=[],events=[],awards=new Set();let failParticipation=options.failParticipation,failLoad=options.failLoad,failSave=options.failSave,release,releaseLoad;
 const snapshot=()=>({csrf_token:'qa-only',completed:lessons.filter(l=>Object.values(criteria[l.id]).every(Boolean)).map(l=>l.id),total:lessons.length,criteria});
 await page.route('**/api/courses/*/progress',async route=>{
  if(route.request().method()==='POST'){
   const body=route.request().postDataJSON();calls.push(body);
   if(options.holdSave)await new Promise(r=>release=r);
   if(failSave){failSave=false;await route.fulfill({status:503,body:'failed'});return}
   criteria[body.lesson_id].manual=true;
  }else {
   if(options.holdLoad)await new Promise(r=>releaseLoad=r);
   if(failLoad){failLoad=false;await route.fulfill({status:503,body:'failed'});return}
  }
  await route.fulfill({json:snapshot()});
 });
 await page.route('**/api/courses/*/participation',async route=>{
  if(route.request().method()==='POST'){
   const body=route.request().postDataJSON();events.push(body);
   criteria[body.lesson_id][body.simulation_id==='check-your-thinking'?'thinking':'simulation']=true;
   awards.add(`${body.lesson_id}/${body.action}`);
   if(failParticipation){failParticipation=false;await route.fulfill({status:503,body:'lost response after commit'});return}
  }
  await route.fulfill({json:{csrf_token:'qa-only',score:awards.size,total:15}});
 });
 await page.goto(urls.account);
 return {page,criteria,calls,events,holdLoad:()=>{options.holdLoad=true},release:()=>release(),releaseLoad:()=>{options.holdLoad=false;releaseLoad()},close:async()=>{assert.deepEqual(errors,[]);await context.close()}};
}
async function capture(page,state){
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:1000});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${state}: overflow at ${width}`);
  const strip=page.locator('.lesson-completion');
  await strip.scrollIntoViewIfNeeded();
  await strip.screenshot({path:join(evidence,`${state}-${width}.png`)});
  if(state==='initial')await page.screenshot({path:join(evidence,`context-${width}.png`)});
 }
 await page.setViewportSize({width:1440,height:1000});
}
async function text(page,selector,value){await page.waitForFunction(({selector,value})=>document.querySelector(selector)?.textContent===value,{selector,value});assert.equal(await page.locator(selector).textContent(),value)}
test('participation retry retains event identity across navigation and qualifies only its original lesson',async()=>{
 const f=await fixture({failParticipation:true});try{
  await f.page.locator('#complete-lesson:enabled').waitFor();await f.page.locator('#complete-lesson').click();
  await text(f.page,'#complete-lesson','✓ กดเรียนจบแล้ว');
  await f.page.locator('#calculate').click();await f.page.locator('#retry').waitFor();
  await f.page.locator(`[data-lesson="${second}"]`).click();await f.page.locator('#retry').click();
  await f.page.locator('#calculate:enabled').waitFor();
  assert.deepEqual(f.events[1],f.events[0]);assert.equal(f.events[0].lesson_id,id);
  assert.equal(await f.page.locator('#completion-status').textContent(),missing);
  await f.page.locator(`[data-lesson="${id}"]`).click();
  assert.equal(await f.page.locator('#completion-status').textContent(),missing.replace('กดเรียนจบ · ทดลองหลักอย่างน้อย 1 ครั้ง · ',''));
  await f.page.locator('[data-answer="0"]').click();
  await text(f.page,'#completion-status','เรียนจบบทนี้แล้ว · บันทึกในบัญชีแล้ว');
  assert.equal(await f.page.locator('#progress-count').textContent(),'1 / 5');
  assert.equal(f.calls.length,1);await f.page.reload();
  await text(f.page,'#complete-lesson','✓ เรียนจบแล้ว');
 }finally{await f.close()}
});
test('each remaining criterion is named independently',async()=>{
 for(const key of ['manual','simulation','thinking']){
  const f=await fixture({criteria:{manual:true,simulation:true,thinking:true,[key]:false}});try{
   await f.page.locator('#calculate:enabled').waitFor();
   const label={manual:'กดเรียนจบ',simulation:'ทดลองหลักอย่างน้อย 1 ครั้ง',thinking:'ตอบ Check your thinking A หรือ B อย่างน้อย 1 ครั้ง (ไม่ต้องถูก)'}[key];
   assert.equal(await f.page.locator('#completion-status').textContent(),`ยังขาด: ${label} · ทำตามลำดับใดก็ได้ ครบทุกบทจึงนับคลาสสำหรับ Level`);
  }finally{await f.close()}
 }
});
test('standalone completion and unavailable storage never claim account persistence',async()=>{
 for(const denied of [false,true]){
  const context=await browser.newContext();const page=await context.newPage();const requests=[];
  await page.route('**/api/**',r=>{requests.push(r.request().url());return r.abort()});
  if(denied)await context.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('denied')};Storage.prototype.setItem=()=>{throw Error('denied')}});
  try{
   await page.goto(urls.standalone);
   assert.equal(await page.locator('#completion-status').textContent(),denied?'บันทึกไม่ได้ — สถานะอยู่ในหน่วยความจำเท่านั้น เมื่อปิดหน้าอาจสูญหาย':'อ่านและทดลองแล้ว กดเพื่อบันทึกว่าเรียนจบ (ไม่ใช่คะแนนแบบทดสอบ)');
   await page.locator('#complete-lesson').click();
   assert.equal(await page.locator('#completion-status').textContent(),denied?'บันทึกไม่ได้ — สถานะอยู่ในหน่วยความจำเท่านั้น เมื่อปิดหน้าอาจสูญหาย':'เรียนจบบทนี้แล้ว · บันทึกในเบราว์เซอร์นี้');
   assert.equal(await page.locator('#complete-lesson').textContent(),'✓ เรียนจบแล้ว');
   assert.equal(await page.locator('#complete-lesson').isDisabled(),true);
   await capture(page,denied?'storage-error':'standalone-complete');
   await page.reload();assert.equal(await page.locator('#progress-count').textContent(),denied?'0 / 5':'1 / 5');
   assert.deepEqual(requests,[]);
  }finally{await context.close()}
 }
});
test('loading and failed loading expose an adjacent explicit retry',async()=>{
 const f=await fixture({holdLoad:true,failLoad:true});try{
  assert.equal(await f.page.locator('#completion-status').textContent(),'กำลังโหลดความคืบหน้าบัญชี…');
  assert.equal(await f.page.locator('#complete-lesson').isDisabled(),true);
  await capture(f.page,'loading');f.releaseLoad();
  await text(f.page,'#completion-status','โหลดความคืบหน้าไม่ได้ — ลองใหม่ หรือเข้าสู่ระบบอีกครั้ง');
  assert.equal(await f.page.locator('#retry-completion-load').textContent(),'ลองโหลดอีกครั้ง');
  await capture(f.page,'load-error');f.holdLoad();await f.page.locator('#retry-completion-load').click();
  await text(f.page,'#completion-status','กำลังโหลดความคืบหน้าบัญชี…');
  f.releaseLoad();await text(f.page,'#completion-status',missing);
  assert.equal(await f.page.locator('#complete-lesson').isEnabled(),true);
  assert.equal(await f.page.locator('#retry-completion-load').isVisible(),false);
  assert.deepEqual(f.calls,[]);
 }finally{await f.close()}
});
test('pending manual save stays attached to its lesson through navigation and retry',async()=>{
 const f=await fixture({holdSave:true,failSave:true});try{
  await f.page.locator('#calculate:enabled').waitFor();
  await f.page.locator('#complete-lesson').evaluate(b=>{b.click();b.click()});
  assert.equal(await f.page.locator('#complete-lesson').textContent(),'กำลังบันทึก…');
  assert.equal(await f.page.locator('#complete-lesson').isDisabled(),true);
  await capture(f.page,'pending-original');assert.equal(f.calls.length,1);
  await f.page.locator(`[data-lesson="${second}"]`).click();
  assert.equal(await f.page.locator('#completion-status').textContent(),'กำลังบันทึกบท 1 ในบัญชี… โปรดรอสักครู่');
  assert.equal(await f.page.locator('#complete-lesson').isDisabled(),true);
  await capture(f.page,'pending');f.release();await f.page.locator('#retry').waitFor();
  await f.page.locator(`[data-lesson="${id}"]`).click();
  assert.equal(await f.page.locator('#complete-lesson').textContent(),'ลองบันทึกอีกครั้ง');
  assert.equal(await f.page.locator('#completion-status').textContent(),'บันทึกไม่ได้ — ยังไม่ยืนยันว่าเรียนจบ กดลองบันทึกอีกครั้ง หรือเข้าสู่ระบบอีกครั้ง');
  await capture(f.page,'save-error');await f.page.locator('#complete-lesson').click();
  await f.page.waitForFunction(()=>document.querySelector('#complete-lesson').disabled);
  await expect.poll(()=>f.calls.length).toBe(2);f.release();
  await text(f.page,'#complete-lesson','✓ กดเรียนจบแล้ว');
  assert.deepEqual(f.calls,[{lesson_id:id,manual:true},{lesson_id:id,manual:true}]);
  assert.equal(await f.page.locator('#progress-count').textContent(),'0 / 5');
 }finally{await f.close()}
});
test('marked and complete states match Scale Lab wording',async()=>{
 for(const complete of [false,true]){
  const f=await fixture({criteria:{manual:true,simulation:complete,thinking:complete}});try{
   await f.page.locator('#calculate:enabled').waitFor();
   assert.equal(await f.page.locator('#complete-lesson').textContent(),complete?'✓ เรียนจบแล้ว':'✓ กดเรียนจบแล้ว');
   assert.equal(await f.page.locator('#complete-lesson').isDisabled(),true);
   await capture(f.page,complete?'complete':'marked');
   assert.equal(await f.page.locator('#completion-status').textContent(),complete?'เรียนจบบทนี้แล้ว · บันทึกในบัญชีแล้ว':missing.replace('กดเรียนจบ · ',''));
  }finally{await f.close()}
 }
});
test('initial completion strip spells out every missing requirement',async()=>{
 const f=await fixture();try{
  await f.page.locator('#calculate:enabled').waitFor();
  assert.equal(await f.page.locator('#completion-status').textContent(),missing);
  await capture(f.page,'initial');
  assert.equal(await f.page.locator('#complete-lesson').textContent(),'ทำเครื่องหมายว่าเรียนจบ');
 }finally{await f.close()}
});
