import test from 'node:test';import assert from 'node:assert/strict';
import {preview} from 'vite';import {chromium} from '@playwright/test';import {mkdir} from 'node:fs/promises';
test('compiled LAB03 three-way navigation, scoped figures, priorities, retention and reset at 1280/390/320',async()=>{
 const server=await preview({preview:{host:'127.0.0.1',port:0}}),browser=await chromium.launch();await mkdir('../../evidence/framework-lab03',{recursive:true});
 try{for(const width of [1280,390,320]){
 const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(server.resolvedUrls.local[0]);await page.locator('[data-lesson="framework-deep-dive"]').click({timeout:3000});
 assert.equal(await page.locator('.deep-dive-figure').count(),2);
 await page.locator('#calculate').click();assert.match(await page.locator('#result').innerText(),/ยังขาด/);
 for(const k of ['scope','blueprint','feedback','priority'])await page.locator(`[data-foundation="${k}"]`).check();
 await page.locator('#focus').selectOption('feed');await page.locator('#topic').selectOption('ranking');await page.locator('#calculate').click();assert.match(await page.locator('#result').innerText(),/ไม่ตรงเป้าหมาย/);
 await page.locator('#topic').selectOption('publishing');await page.locator('#calculate').click();assert.match(await page.locator('#result').innerText(),/พร้อมนำแผนไปคุย/);
 for(const id of ['framework-blueprint','framework-scope']){await page.locator(`[data-lesson="${id}"]`).click();assert.equal(await page.locator('.deep-dive-lesson').count(),0);assert.equal(await page.locator('.deep-dive-figure').count(),0);}
 await page.locator('[data-lesson="framework-deep-dive"]').click();assert.match(await page.locator('#result').innerText(),/พร้อมนำแผนไปคุย/);
 await page.locator('[data-answer="1"]').click();assert.match(await page.locator('#feedback').innerText(),/ลองทบทวน/);
 await page.locator('#reset').click();assert.equal(await page.locator('[data-foundation]:checked').count(),0);assert.equal(await page.locator('[data-answer="1"]').getAttribute('aria-pressed'),'true');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 const publishing=await page.locator('.deep-dive-figure').first().innerText();
 for(const label of ['Graph DB','User Cache','User DB','Post Cache','Post DB','Message Queue','Fanout Workers','News Feed Cache','Notification Service','Authentication','Rate limiting'])assert.ok(publishing.includes(label),label);
 for(const label of ['News Feed Service','User Cache','User DB','Post Cache','Post DB','CDN','ส่งผลกลับผู้ใช้'])assert.ok((await page.locator('.deep-dive-figure').last().innerText()).includes(label),label);
 assert.ok(await page.locator('.deep-chain li').evaluateAll(nodes=>nodes.every(n=>parseFloat(getComputedStyle(n).fontSize)>=16)));
 assert.ok(!(await page.locator('#lesson').innerText()).match(/Step3|\.pdf|ผู้สัมภาษณ์/));
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`../../evidence/framework-lab03/standalone-${width}.png`,fullPage:true});
 await page.locator('#complete-lesson').click();assert.equal(await page.locator('#progress-count').innerText(),'1 / 4');await page.reload();await page.locator('[data-lesson="framework-deep-dive"]').click();assert.match(await page.locator('#completion-status').innerText(),/เรียนจบบทนี้แล้ว/);
 assert.deepEqual(errors,[]);await page.close();
 }}finally{await browser.close();await new Promise(r=>server.httpServer.close(r));}
});
