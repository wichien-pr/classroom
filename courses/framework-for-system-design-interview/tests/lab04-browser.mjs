import test from 'node:test';import assert from 'node:assert/strict';
import {preview} from 'vite';import {chromium} from '@playwright/test';import {mkdir} from 'node:fs/promises';
test('compiled wrap-up: coverage, review, navigation, reset and persistence at desktop/mobile',async()=>{
 const server=await preview({preview:{host:'127.0.0.1',port:0}}),browser=await chromium.launch();await mkdir('../../evidence/lab04',{recursive:true});
 try{for(const width of [1280,390,320]){
 const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(server.resolvedUrls.local[0]);await page.locator('[data-lesson="framework-wrap-up"]').click({timeout:3000});
 const text=await page.locator('#lesson').innerText();for(const word of ['คอขวด','server failure','network loss','metrics','error logs','rollout','1 ล้าน','10 ล้าน','สมมติฐาน','ลูกค้า','คำใบ้','เตรียมตัว'])assert.ok(text.includes(word),word);
 assert.doesNotMatch(text,/Step4|\.pdf|ผู้สัมภาษณ์/);assert.equal(await page.locator('.lesson-steps ol li').count(),4);
 await page.locator('#calculate').click();assert.match(await page.locator('#result').innerText(),/ยังขาด/);
 for(const el of await page.locator('[data-review]').all())await el.check();
 await page.locator('#calculate').click();assert.match(await page.locator('#result').innerText(),/ไม่ใช่ความจุที่วัดแล้ว/);
 await page.locator('#growth').selectOption('investigate');await page.locator('#calculate').click();assert.match(await page.locator('#result').innerText(),/พร้อมนำสรุปไปคุย/);
 for(const id of ['framework-deep-dive','framework-blueprint','framework-scope']){await page.locator(`[data-lesson="${id}"]`).click();assert.equal(await page.locator('.wrap-up-lesson').count(),0);}
 await page.locator('[data-lesson="framework-wrap-up"]').click();assert.match(await page.locator('#result').innerText(),/พร้อมนำสรุปไปคุย/);
 await page.locator('[data-answer="1"]').click();await page.locator('#reset').click();assert.equal(await page.locator('[data-review]:checked').count(),0);assert.equal(await page.locator('#growth').inputValue(),'guarantee');assert.equal(await page.locator('[data-answer="1"]').getAttribute('aria-pressed'),'true');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`../../evidence/lab04/standalone-${width}.png`,fullPage:true});
 await page.locator('#complete-lesson').click();assert.equal(await page.locator('#progress-count').innerText(),'1 / 4');await page.reload();await page.locator('[data-lesson="framework-wrap-up"]').click();assert.match(await page.locator('#completion-status').innerText(),/เรียนจบบทนี้แล้ว/);
 assert.deepEqual(errors,[]);await page.close();
 }}finally{await browser.close();await new Promise(r=>server.httpServer.close(r));}
});
