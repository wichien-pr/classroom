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
const out=new URL('../../../evidence/estimation-remove-lab06/',import.meta.url).pathname;
before(async()=>{
 const dir=await mkdtemp(join(tmpdir(),'estimate-five-'));
 for(const mode of ['standalone','account']){
  const outDir=mode==='account'&&process.env.FIVE_DIST||join(dir,mode);
  const base=mode==='account'?'/courses/back-of-the-envelope-estimation/':'/';
  if(!(mode==='account'&&process.env.FIVE_DIST))execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build','--outDir',outDir,'--base',base],{env:{...process.env,VITE_CLASSROOM_URL:mode==='account'?'/':'',VITE_CLASSROOM_PROGRESS_URL:mode==='account'?'/api/courses/back-of-the-envelope-estimation/progress':''},stdio:'pipe'});
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
  await r.fulfill({json:{csrf_token:'qa-only',completed:lessons.filter(l=>Object.values(criteria[l.id]).every(Boolean)).map(l=>l.id),total:lessons.length,criteria}});
 });
 await page.route('**/api/courses/*/participation',async r=>{
  if(r.request().method()==='POST'){const b=r.request().postDataJSON();criteria[b.lesson_id][b.simulation_id==='check-your-thinking'?'thinking':'simulation']=true;awards.add(`${b.lesson_id}/${b.action}`)}
  await r.fulfill({json:{csrf_token:'qa-only',score:awards.size,total:lessons.length*3}});
 });
 await page.goto(urls[mode]);await page.locator('[data-lesson="estimate-tips"]').click();await page.locator('#calculate:enabled').waitFor();return page;
}
for(const mode of ['standalone','account']) {
 test(`${mode}: five lessons, final Tips navigation, independent completion and responsive layout`,async()=>{
  const page=await open(mode);
  try {
   assert.equal(await page.locator('[data-lesson]').count(),5);
   assert.equal(await page.locator('[data-lesson="estimate-rounding"]').count(),0);
   assert.match(await page.locator('.course-top').textContent(),/5 INTERACTIVE LABS/);
   assert.equal(await page.locator('#next').isDisabled(),true);
   assert.doesNotMatch(await page.locator('.tips-reference').textContent(),/LAB06/);
   await page.locator('#previous').click();assert.match(await page.locator('h1').textContent(),/Twitter/);
   await page.locator('#next').click();assert.match(await page.locator('h1').textContent(),/Tips/);
   for(const lesson of lessons){
    await page.locator(`[data-lesson="${lesson.id}"]`).click();
    await page.locator('#calculate').click();await page.locator('#calculate:enabled').waitFor();
    assert.ok(await page.locator('#result dd').count());
    const wrong=lesson.answers.findIndex(answer=>!answer.correct);
    await page.locator(`[data-answer="${wrong}"]`).click();await page.locator('#calculate:enabled').waitFor();
    await page.locator('#complete-lesson').click();await page.locator('#calculate:enabled').waitFor();
   }
   assert.equal(await page.locator('#progress-count').textContent(),'5 / 5');
   for(const width of [320,390,1440]){
    await page.setViewportSize({width,height:900});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:join(out,`${mode}-${width}.png`),fullPage:true});
   }
  }finally{await page.close();}
 });
}
test('retired local records survive a new completion and reload but do not count toward five',async()=>{
 const page=await browser.newPage();
 try {
  await page.goto(urls.standalone);
  await page.evaluate(()=>localStorage.setItem('back-of-the-envelope-estimation-progress-v1',JSON.stringify(['estimate-storage','estimate-rounding'])));
  await page.reload();assert.equal(await page.locator('#progress-count').textContent(),'0 / 5');
  await page.locator('[data-lesson="estimate-tips"]').click();await page.locator('#complete-lesson').click();
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('back-of-the-envelope-estimation-progress-v1'))),['estimate-storage','estimate-rounding','estimate-tips']);
  await page.reload();assert.equal(await page.locator('#progress-count').textContent(),'1 / 5');
 }finally{await page.close();}
});
