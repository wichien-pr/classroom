import test from 'node:test';import assert from 'node:assert/strict';
import {preview} from 'vite';import {chromium} from '@playwright/test';import {mkdir} from 'node:fs/promises';
test('compiled LAB02 navigation, diagrams, use case, reset and separate completion',async()=>{
 const server=await preview({preview:{host:'127.0.0.1',port:0}}),browser=await chromium.launch();await mkdir('../../evidence/framework-lab02',{recursive:true});
 try{for(const width of [1280,390,320]){
 const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(server.resolvedUrls.local[0]);await page.locator('[data-lesson="framework-blueprint"]').click({timeout:3000});
 await page.locator('h1').filter({hasText:'เสนอภาพรวม'}).waitFor();assert.equal(await page.locator('.blueprint-figure').count(),2);
 await page.locator('#calculate').click();assert.match(await page.locator('#result').innerText(),/ยังมีช่องว่าง/);
 for(const key of ['publish','fanout','newest','feedback'])await page.locator(`[data-setting="${key}"]`).check();
 await page.locator('#calculate').click();assert.match(await page.locator('#result').innerText(),/พร้อมนำไปคุย/);assert.match(await page.locator('#result').innerText(),/มิน · 10:05.*นิด · 10:00/s);
 await page.locator('[data-lesson="framework-scope"]').click();assert.equal(await page.locator('.blueprint-figure').count(),0);assert.ok(!(await page.locator('#lesson').innerText()).includes('ผู้สัมภาษณ์'));await page.locator('#calculate').click();assert.match(await page.locator('#result').innerText(),/ยังมีช่องว่าง/);
 await page.locator('[data-lesson="framework-blueprint"]').click();assert.match(await page.locator('#result').innerText(),/พร้อมนำไปคุย/);
 await page.locator('[data-answer="1"]').click();assert.match(await page.locator('#feedback').innerText(),/ลองทบทวน/);await page.locator('#reset').click();assert.equal(await page.locator('[data-answer="1"]').getAttribute('aria-pressed'),'true');
 await page.locator('#complete-lesson').click();assert.equal(await page.locator('#progress-count').innerText(),'1 / 2');await page.reload();await page.locator('[data-lesson="framework-blueprint"]').click();assert.match(await page.locator('#completion-status').innerText(),/เรียนจบบทนี้แล้ว/);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`../../evidence/framework-lab02/standalone-${width}.png`,fullPage:true});
 assert.deepEqual(errors,[]);await page.close();
 }}finally{await browser.close();await new Promise(r=>server.httpServer.close(r));}
});
