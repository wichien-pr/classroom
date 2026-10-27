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
const out=new URL('../../../evidence/estimation-traffic/',import.meta.url).pathname;
before(async()=>{
 const dir=await mkdtemp(join(tmpdir(),'estimate-traffic-'));
 for(const mode of ['standalone','account']){
  const outDir=mode==='account'&&process.env.TRAFFIC_DIST||join(dir,mode);
  const base=mode==='account'?'/courses/back-of-the-envelope-estimation/':'/';
  if(!(mode==='account'&&process.env.TRAFFIC_DIST))execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build','--outDir',outDir,'--base',base],{env:{...process.env,VITE_CLASSROOM_URL:mode==='account'?'/':'',VITE_CLASSROOM_PROGRESS_URL:mode==='account'?'/api/courses/back-of-the-envelope-estimation/progress':''},stdio:'pipe'});
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
 await page.goto(urls[mode]);await page.locator('[data-lesson="estimate-traffic"]').click();await page.locator('#calculate:enabled').waitFor();return page;
}
const assumptions = [
 ['ผู้ใช้รายเดือน (MAU)', '300 ล้านคน'],
 ['สัดส่วนผู้ใช้รายวัน', '50% ของผู้ใช้รายเดือน'],
 ['ทวีตเฉลี่ยต่อผู้ใช้รายวัน', '2 ทวีต/คน/วัน'],
 ['ทวีตที่มีสื่อ', '10% ของทวีตทั้งหมด'],
 ['ระยะเก็บข้อมูล', '5 ปี'],
];
const sizes = [['tweet_id','64 bytes'],['ข้อความ','140 bytes'],['สื่อต่อทวีตที่มีสื่อ','1 MB']];
for (const mode of ['standalone','account']) {
 test(`${mode}: complete Twitter worked example before experiment, responsive tables and no style leaks`, async () => {
  const page = await open(mode);
  try {
   const cells = selector => page.locator(selector).evaluateAll(rows => rows.map(row => [...row.children].map(cell => cell.textContent)));
   assert.deepEqual(await cells('.traffic-assumptions tbody tr'), assumptions);
   assert.deepEqual(await cells('.traffic-sizes tbody tr'), sizes);
   assert.equal(await page.locator('.traffic-reference caption').count(),2);
   assert.equal(await page.locator('.traffic-reference th[scope="row"]').count(),8);
   assert.ok(await page.locator('.traffic-reference').evaluate(el => Boolean(el.compareDocumentPosition(document.querySelector('.experiment-panel')) & Node.DOCUMENT_POSITION_FOLLOWING)));
   const text = await page.locator('.traffic-reference').textContent();
   for (const value of ['300 ล้าน × 50% = 150 ล้านคน','150 ล้าน × 2 ÷ 24 ÷ 3,600','3,472.22','3,500','6,944.44','7,000','150 ล้าน × 2 × 10% × 1 MB = 30 TB/วัน','30 TB × 365 × 5 = 54.75 PB ≈ 55 PB','ไม่เปลี่ยนตาม','ฐานสิบ','LAB05']) assert.ok(text.includes(value),value);
   assert.match(await page.locator('.lesson-intro').textContent(),/ไม่ใช่ข้อมูลจริงของ Twitter/);
   assert.doesNotMatch(await page.locator('#lesson').textContent(),/dashboard_|clipboard|\.png/);
   for (const width of [320,390,1440]) {
    await page.setViewportSize({width,height:900});
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.ok(await page.locator('.traffic-reference th,.traffic-reference td,.traffic-worked p').evaluateAll(cells => cells.every(c => c.scrollWidth <= c.clientWidth+1)));
    const panel = page.locator('.traffic-reference');
    const box = await panel.boundingBox();
    assert.ok(Math.abs(box.width-(await page.locator('.concept').boundingBox()).width)<2);
    assert.equal(await panel.locator('tbody tr').first().evaluate(el => getComputedStyle(el).display),width<600?'block':'table-row');
    const term = page.locator('.concept .term-trigger').first();
    await term.focus();await page.keyboard.press('Enter');
    assert.equal(await page.locator('#term-hint').evaluate(el => el.matches(':popover-open')),true);
    const hint = await page.locator('#term-hint').boundingBox();
    assert.ok(hint.x>=0 && hint.x+hint.width<=width+1);
    await page.keyboard.press('Escape');
    assert.equal(await term.evaluate(el => el===document.activeElement),true);
    await page.setViewportSize({width,height:Math.max(1000,Math.ceil(box.height)+120)});
    await panel.evaluate(el => scrollTo(0,scrollY+el.getBoundingClientRect().top-90));
    await panel.screenshot({path:join(out,`${mode}-reference-${width}.png`)});
    await page.evaluate(() => scrollTo(0,0));
    await page.screenshot({path:join(out,`${mode}-lesson-${width}.png`),fullPage:true});
   }
   await page.locator('[data-lesson="estimate-availability"]').click();
   assert.equal(await page.locator('.traffic-reference').count(),0);
   assert.equal(await page.locator('.availability-reference tbody tr').count(),4);
   await page.locator('[data-lesson="estimate-tips"]').click();
   assert.equal(await page.locator('.traffic-reference').count(),0);
   await page.locator('[data-lesson="estimate-traffic"]').click();
   assert.deepEqual(await cells('.traffic-assumptions tbody tr'),assumptions);
  } finally { await page.close(); }
 });
 test(`${mode}: QPS scenarios, snapshots, reset and stable quiz/manual completion`, async () => {
  const page=await open(mode), errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const fmt=n=>`≈ ${new Intl.NumberFormat('en',{maximumSignificantDigits:4}).format(n)}`;
  try {
   for(const [mau,daily,posts,peak] of [[300e6,50,2,2],[300e6,50,2,4],[300e6,25,2,2],[100e6,100,3,3],[0,50,2,2]]) {
    for(const [key,value] of Object.entries({mau,daily,posts,peak})) await page.locator(`#input-${key}`).fill(String(value));
    await page.locator('#calculate').click();await page.locator('#calculate:enabled').waitFor();
    const dau=mau*daily/100,perDay=dau*posts,qps=perDay/86400;
    assert.deepEqual(await page.locator('#result dd').allTextContents(),[dau,perDay,qps,qps*peak].map(fmt));
   }
   const result=await page.locator('#result').textContent();
   await page.locator('#input-mau').fill('123');
   await page.locator('[data-lesson="estimate-tips"]').click();
   await page.locator('[data-lesson="estimate-traffic"]').click();
   assert.equal(await page.locator('#result').textContent(),result);
   assert.equal(await page.locator('#input-mau').inputValue(),'123');
   await page.locator('[data-answer="0"]').click();await page.locator('#calculate:enabled').waitFor();
   assert.match(await page.locator('#feedback').textContent(),/ลองทบทวน/);
   assert.equal(await page.locator('#progress-count').textContent(),'0 / 5');
   await page.locator('#reset').click();
   for(const [key,value] of Object.entries({mau:'300000000',daily:'50',posts:'2',peak:'2'})) assert.equal(await page.locator(`#input-${key}`).inputValue(),value);
   assert.match(await page.locator('#result').textContent(),/ยังไม่ได้คำนวณ/);
   assert.equal(await page.locator('[data-answer="0"]').getAttribute('aria-pressed'),'true');
   await page.locator('#complete-lesson').click();
   await page.waitForFunction(()=>document.querySelector('#progress-count').textContent==='1 / 5');
   assert.deepEqual(errors,[]);
  } finally { await page.close(); }
 });
}
