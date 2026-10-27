import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {preview} from 'vite';
import {chromium} from 'playwright';
let browser,server,url;
const evidence=new URL('../../../evidence/estimation-units/',import.meta.url).pathname;
before(async()=>{
 const outDir=await mkdtemp(join(tmpdir(),'estimate-units-'));
 execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build','--outDir',outDir],{env:{...process.env,VITE_CLASSROOM_URL:'',VITE_CLASSROOM_PROGRESS_URL:''},stdio:'pipe'});
 server=await preview({build:{outDir},preview:{host:'127.0.0.1',port:0,strictPort:true}});
 url=`http://127.0.0.1:${server.httpServer.address().port}/`;
 browser=await chromium.launch({channel:'chrome',headless:true});await mkdir(evidence,{recursive:true});
});
after(async()=>{await browser?.close();if(server)await new Promise(r=>server.httpServer.close(r))});
test('Power of two reference presents all five source rows, separates exact units and survives navigation',async()=>{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(url);await page.locator('#calculate').waitFor();
  assert.equal(await page.locator('.units-reference tbody tr').count(),5);
  assert.deepEqual(await page.locator('.units-reference tbody tr').evaluateAll(rows=>rows.map(r=>r.dataset.power)),['10','20','30','40','50']);
  const table=await page.locator('.units-reference table').textContent();
  for(const word of ['Thousand','Million','Billion','Trillion','Quadrillion','Kilobyte','Megabyte','Gigabyte','Terabyte','Petabyte','≈ 1 KB','≈ 1 MB','≈ 1 GB','≈ 1 TB','≈ 1 PB'])assert.ok(table.includes(word),word);
  const note=await page.locator('#units-precision').textContent();
  for(const word of ['1,024 bytes','1,000 bytes','KiB','MiB','GiB','TiB','PiB'])assert.ok(note.includes(word),word);
  assert.equal(await page.locator('#progress-count').textContent(),'0 / 5');
  await page.locator('[data-lesson="estimate-latency"]').click();assert.equal(await page.locator('.units-reference').count(),0);
  await page.locator('[data-lesson="estimate-units"]').click();assert.equal(await page.locator('.units-reference tbody tr').count(),5);
  for(const width of [320,390,1440]){
   await page.setViewportSize({width,height:900});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert.ok(await page.locator('.units-reference td').evaluateAll(cells=>cells.every(c=>c.scrollWidth<=c.clientWidth+1)));
   const panel=page.locator('.units-reference'),box=await panel.boundingBox();
   await page.setViewportSize({width,height:Math.max(1000,Math.ceil(box.height)+180)});
   await panel.screenshot({path:join(evidence,`power-of-two-${width}.png`)});
   await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:join(evidence,`lesson-${width}.png`),fullPage:true});
  }
  assert.deepEqual(errors,[]);
 }finally{await page.close()}
});
test('source-reference addition keeps exact calculator outputs, reset and local completion',async()=>{
 const page=await browser.newPage();try{
  await page.goto(url);
  for(const power of [10,20,30,40,50]){
   await page.locator('#input-power').selectOption(String(power));await page.locator('#calculate').click();
   assert.ok((await page.locator('#result').textContent()).includes((2**power).toLocaleString('en')));
  }
  await page.locator('#reset').click();assert.equal(await page.locator('#input-power').inputValue(),'20');
  await page.locator('#complete-lesson').click();assert.equal(await page.locator('#progress-count').textContent(),'1 / 5');
 }finally{await page.close()}
});
