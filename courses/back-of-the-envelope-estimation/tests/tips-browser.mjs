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
const out=new URL('../../../evidence/estimation-tips/',import.meta.url).pathname;
before(async()=>{
 const dir=await mkdtemp(join(tmpdir(),'estimate-tips-'));
 for(const mode of ['standalone','account']){
  const outDir=mode==='account'&&process.env.TIPS_DIST||join(dir,mode);
  const base=mode==='account'?'/courses/back-of-the-envelope-estimation/':'/';
  if(!(mode==='account'&&process.env.TIPS_DIST))execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build','--outDir',outDir,'--base',base],{env:{...process.env,VITE_CLASSROOM_URL:mode==='account'?'/':'',VITE_CLASSROOM_PROGRESS_URL:mode==='account'?'/api/courses/back-of-the-envelope-estimation/progress':''},stdio:'pipe'});
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
  await r.fulfill({json:{csrf_token:'qa-only',completed:lessons.filter(l=>Object.values(criteria[l.id]).every(Boolean)).map(l=>l.id),total:5,criteria}});
 });
 await page.route('**/api/courses/*/participation',async r=>{
  if(r.request().method()==='POST'){const b=r.request().postDataJSON();criteria[b.lesson_id][b.simulation_id==='check-your-thinking'?'thinking':'simulation']=true;awards.add(`${b.lesson_id}/${b.action}`)}
  await r.fulfill({json:{csrf_token:'qa-only',score:awards.size,total:15}});
 });
 await page.goto(urls[mode]);await page.locator('[data-lesson="estimate-tips"]').click();await page.locator('#calculate:enabled').waitFor();return page;
}
for (const mode of ['standalone','account']) {
 test(`${mode}: LAB05 Tips has four principles, correct sequence, readable mobile and glossary`, async () => {
  const page=await open(mode);
  try {
   assert.deepEqual(await page.locator('[data-tip]').evaluateAll(es=>es.map(e=>e.dataset.tip)),['rounding','assumptions','units','practice']);
   assert.equal(await page.locator('[data-lesson="estimate-storage"]').count(),0);
   assert.equal(await page.locator('[data-lesson="estimate-rounding"]').count(),0);
   assert.equal(await page.locator('[data-tip="practice"] ul li').count(),5);
   const text=await page.locator('.tips-reference').textContent();
   for(const word of ['99,987 ÷ 9.1','100,000 ÷ 10','5 KB','5 MB','QPS','Peak QPS','Cache','จำนวน server'])assert.ok(text.includes(word));
   assert.doesNotMatch(text,/dashboard_|clipboard/);
   const panel=page.locator('.tips-reference');
   assert.ok(await panel.evaluate(e=>Boolean(e.compareDocumentPosition(document.querySelector('.experiment-panel'))&Node.DOCUMENT_POSITION_FOLLOWING)));
   for(const width of [320,390,1440]) {
    await page.setViewportSize({width,height:900});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.ok(await panel.locator('p,li,h3').evaluateAll(es=>es.every(e=>e.scrollWidth<=e.clientWidth+1)));
    assert.ok(Math.abs((await panel.boundingBox()).width-(await page.locator('.concept').boundingBox()).width)<2);
    const term=page.locator('.tips-reference .term-trigger').first();
    await term.focus();await page.keyboard.press('Enter');
    assert.equal(await page.locator('#term-hint').evaluate(e=>e.matches(':popover-open')),true);
    const hint=await page.locator('#term-hint').boundingBox();assert.ok(hint.x>=0&&hint.x+hint.width<=width+1);
    await page.keyboard.press('Escape');assert.equal(await term.evaluate(e=>e===document.activeElement),true);
    const box=await panel.boundingBox();await page.setViewportSize({width,height:Math.max(1000,Math.ceil(box.height)+120)});
    await panel.evaluate(e=>scrollTo(0,scrollY+e.getBoundingClientRect().top-90));
    await panel.screenshot({path:join(out,`${mode}-reference-${width}.png`)});
    await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:join(out,`${mode}-lesson-${width}.png`),fullPage:true});
   }
   await page.locator('[data-lesson="estimate-traffic"]').click();assert.equal(await page.locator('.tips-reference').count(),0);
   assert.match(await page.locator('h1').textContent(),/Twitter/);
   await page.locator('[data-lesson="estimate-tips"]').click();assert.equal(await page.locator('[data-tip]').count(),4);
  } finally {await page.close();}
 });
 test(`${mode}: rounding experiment, invalid values, snapshot, reset, quiz and separate completion`, async () => {
  const page=await open(mode), errors=[];page.on('pageerror',e=>errors.push(e.message));
  const fmt=n=>`≈ ${new Intl.NumberFormat('en',{maximumSignificantDigits:4}).format(n)}`;
  try {
   for(const divisor of [10,9]) {
    await page.locator('#input-roughD').fill(String(divisor));await page.locator('#calculate').click();await page.locator('#calculate:enabled').waitFor();
    const exact=99987/9.1,approx=100000/divisor;
    assert.deepEqual(await page.locator('#result dd').allTextContents(),[exact,approx,(approx-exact)/exact*100].map(fmt));
   }
   const result=await page.locator('#result').textContent();await page.locator('#input-numerator').fill('123');
   await page.locator('[data-lesson="estimate-traffic"]').click();await page.locator('[data-lesson="estimate-tips"]').click();
   assert.equal(await page.locator('#result').textContent(),result);
   await page.locator('#input-denominator').fill('0');await page.locator('#calculate').click();assert.ok(await page.locator('#input-error').textContent());
   await page.locator('#reset').click();assert.equal(await page.locator('#input-numerator').inputValue(),'99987');assert.equal(await page.locator('#input-denominator').inputValue(),'9.1');assert.match(await page.locator('#result').textContent(),/ยังไม่ได้คำนวณ/);
   await page.locator('[data-answer="0"]').click();await page.locator('#calculate:enabled').waitFor();assert.match(await page.locator('#feedback').textContent(),/ลองทบทวน/);
   assert.equal(await page.locator('#progress-count').textContent(),'0 / 5');
   await page.locator('#complete-lesson').click();await page.waitForFunction(()=>document.querySelector('#progress-count').textContent==='1 / 5');
   await page.locator('[data-lesson="estimate-traffic"]').click();assert.equal(await page.locator('#complete-lesson').isEnabled(),true);
   assert.deepEqual(errors,[]);
  } finally {await page.close();}
 });
}
test('standalone retains retired storage record across completing Tips and reload without credit transfer',async()=>{
 const page=await browser.newPage();
 try {
  await page.goto(urls.standalone);
  await page.evaluate(()=>localStorage.setItem('back-of-the-envelope-estimation-progress-v1',JSON.stringify(['estimate-storage'])));
  await page.reload();await page.locator('[data-lesson="estimate-tips"]').click();
  assert.equal(await page.locator('#progress-count').textContent(),'0 / 5');
  await page.locator('#complete-lesson').click();
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('back-of-the-envelope-estimation-progress-v1'))),['estimate-storage','estimate-tips']);
  await page.reload();assert.equal(await page.locator('#progress-count').textContent(),'1 / 5');
 } finally {await page.close();}
});

test('standalone all five active lessons calculate, accept both quiz choices and persist independently',async()=>{
 const page=await browser.newPage();
 try {
  await page.goto(urls.standalone);
  for(const lesson of lessons){
   await page.locator(`[data-lesson="${lesson.id}"]`).click();
   await page.locator('#calculate').click();assert.ok(await page.locator('#result dd').count());
   for(const choice of [0,1]){
    await page.locator(`[data-answer="${choice}"]`).click();
    assert.ok((await page.locator('#feedback').textContent()).includes(lesson.answers[choice].reason));
   }
  }
  assert.equal(await page.locator('#progress-count').textContent(),'5 / 5');
  await page.reload();assert.equal(await page.locator('#progress-count').textContent(),'5 / 5');
 }finally{await page.close();}
});
