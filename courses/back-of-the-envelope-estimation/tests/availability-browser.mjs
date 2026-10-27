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
const out=new URL('../../../evidence/estimation-availability/',import.meta.url).pathname;
before(async()=>{
 const dir=await mkdtemp(join(tmpdir(),'estimate-availability-'));
 for(const mode of ['standalone','account']){
  const outDir=mode==='account'&&process.env.AVAILABILITY_DIST||join(dir,mode);
  const base=mode==='account'?'/courses/back-of-the-envelope-estimation/':'/';
  if(!(mode==='account'&&process.env.AVAILABILITY_DIST))execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build','--outDir',outDir,'--base',base],{env:{...process.env,VITE_CLASSROOM_URL:mode==='account'?'/':'',VITE_CLASSROOM_PROGRESS_URL:mode==='account'?'/api/courses/back-of-the-envelope-estimation/progress':''},stdio:'pipe'});
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
 await page.goto(urls[mode]);await page.locator('[data-lesson="estimate-availability"]').click();await page.locator('#calculate:enabled').waitFor();return page;
}
const expectedRows = [
 ['99%', '14.40 นาที', '1.68 ชั่วโมง', '7.31 ชั่วโมง', '3.65 วัน'],
 ['99.99%', '8.64 วินาที', '1.01 นาที', '4.38 นาที', '52.60 นาที'],
 ['99.999%', '864.00 มิลลิวินาที', '6.05 วินาที', '26.30 วินาที', '5.26 นาที'],
 ['99.9999%', '86.40 มิลลิวินาที', '604.80 มิลลิวินาที', '2.63 วินาที', '31.56 วินาที'],
];
for (const mode of ['standalone', 'account']) {
 test(`${mode}: availability reference has every cell before experiment and responsive row cards`, async () => {
  const page = await open(mode);
  try {
   assert.deepEqual(await page.locator('.availability-reference tbody tr').evaluateAll(rows => rows.map(row => [...row.children].map(cell => cell.textContent))), expectedRows);
   assert.equal(await page.locator('.availability-reference th[scope="col"]').count(), 5);
   assert.equal(await page.locator('.availability-reference th[scope="row"]').count(), 4);
   assert.ok(await page.locator('.availability-reference').evaluate(el => Boolean(el.compareDocumentPosition(document.querySelector('.experiment-panel')) & Node.DOCUMENT_POSITION_FOLLOWING)));
   assert.doesNotMatch(await page.locator('#lesson').textContent(), /dashboard_|clipboard|Table 3/);
   for (const width of [320,390,1440]) {
    await page.setViewportSize({width,height:900});
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.ok(await page.locator('.availability-reference th,.availability-reference td').evaluateAll(cells => cells.every(c => c.scrollWidth <= c.clientWidth + 1)));
    const panel = page.locator('.availability-reference');
    assert.equal(await panel.locator('tbody tr').first().evaluate(el => getComputedStyle(el).display), width < 600 ? 'block' : 'table-row');
    const box = await panel.boundingBox();
    const contentBox = await page.locator('.concept').boundingBox();
    assert.ok(Math.abs(box.width - contentBox.width) < 2);
    await page.setViewportSize({width,height:Math.max(1000,Math.ceil(box.height)+120)});
    await panel.evaluate(el => scrollTo(0,scrollY+el.getBoundingClientRect().top-90));
    await panel.screenshot({path:join(out,`${mode}-reference-${width}.png`)});
    await page.evaluate(() => scrollTo(0,0));
    await page.screenshot({path:join(out,`${mode}-lesson-${width}.png`),fullPage:true});
   }
   await page.locator('[data-lesson="estimate-latency"]').click();
   assert.equal(await page.locator('.availability-reference').count(),0);
   assert.equal(await page.locator('.latency-reference tbody tr').count(),13);
   await page.locator('[data-lesson="estimate-availability"]').click();
   assert.equal(await page.locator('.availability-reference tbody tr').count(),4);
  } finally { await page.close(); }
 });
 test(`${mode}: four percentages on both calendar windows, snapshot, reset, glossary and completion`, async () => {
  const page = await open(mode);
  const errors = []; page.on('pageerror',error => errors.push(error.message));
  const fmt = n => `≈ ${new Intl.NumberFormat('en',{maximumSignificantDigits:4}).format(n)}`;
  try {
   for (const days of [365,30]) for (const percent of [99,99.99,99.999,99.9999]) {
    await page.locator('#input-percent').fill(String(percent));
    await page.locator('#input-days').selectOption(String(days));
    await page.locator('#calculate').click();
    await page.locator('#calculate:enabled').waitFor();
    const seconds = days * 86400 * (100-percent)/100;
    assert.deepEqual(await page.locator('#result dd').allTextContents(),[seconds,seconds/60,seconds/3600].map(fmt));
   }
   const result = await page.locator('#result').textContent();
   await page.locator('#input-percent').fill('99');
   await page.locator('[data-lesson="estimate-tips"]').click();
   await page.locator('[data-lesson="estimate-availability"]').click();
   assert.equal(await page.locator('#result').textContent(), result);
   await page.locator('#reset').click();
   assert.equal(await page.locator('#input-percent').inputValue(),'99.99');
   assert.equal(await page.locator('#input-days').inputValue(),'365');
   assert.match(await page.locator('#result').textContent(),/ยังไม่ได้คำนวณ/);
   const term = page.locator('.lesson-intro .term-trigger').first();
   await term.focus(); await page.keyboard.press('Enter');
   assert.equal(await page.locator('#term-hint').evaluate(el => el.matches(':popover-open')),true);
   await page.keyboard.press('Escape');
   assert.equal(await term.evaluate(el => el === document.activeElement),true);
   await page.locator('#complete-lesson').click();
   await page.locator('#calculate:enabled').waitFor();
   if(mode === 'account') assert.equal(await page.locator('#progress-count').textContent(),'0 / 5');
   await page.locator('[data-answer="1"]').click();
   await page.waitForFunction(() => document.querySelector('#progress-count').textContent === '1 / 5');
   assert.match(await page.locator('#feedback').textContent(),/ลองทบทวน/);
   assert.deepEqual(errors,[]);
  } finally { await page.close(); }
 });
}
