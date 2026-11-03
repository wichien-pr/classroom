import test from 'node:test';
import assert from 'node:assert/strict';
import {preview} from 'vite';
import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
test('compiled LAB01 asks, reviews, resets, shuffles and completes at desktop and narrow widths',async()=>{
 const server=await preview({preview:{host:'127.0.0.1',port:0}});
 const browser=await chromium.launch();
 await mkdir('../../evidence/framework-lab01',{recursive:true});
 try{for(const width of [1280,390,320]){
  const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>Math.random=()=>0.9);
  await page.goto(server.resolvedUrls.local[0]);
  await page.locator('h1').filter({hasText:'ทำความเข้าใจโจทย์'}).waitFor({timeout:4000});
  await page.locator('#calculate').click();await page.locator('#result').filter({hasText:'ยังมีช่องว่าง'}).waitFor();
  for(const id of ['platform','features','order','friends','scale','media'])await page.locator(`[data-question="${id}"]`).click();
  await page.locator('#calculate').click();await page.locator('#result').filter({hasText:'พร้อมสรุปขอบเขต'}).waitFor();
  for(const id of ['growth','stack'])await page.locator(`[data-question="${id}"]`).click();
  assert.equal(await page.locator('.interviewer strong').filter({hasText:'ลูกค้า / สถานะข้อมูล'}).count(),8);
  assert.ok((await page.locator('#reply-growth').innerText()).includes('ถ้าลูกค้าให้กำหนดเอง'));
  assert.ok(!(await page.locator('#lesson').innerText()).includes('ผู้สัมภาษณ์'));
  assert.equal(await page.locator('[data-answer]').first().getAttribute('data-answer'),'1');
  await page.locator('[data-answer="0"]').click();await page.locator('#feedback').filter({hasText:'ลองทบทวน'}).waitFor();
  await page.locator('#reset').click();assert.equal(await page.locator('[data-answer="0"]').getAttribute('aria-pressed'),'true');
  await page.locator('#complete-lesson').click();await page.reload();await page.locator('#completion-status').filter({hasText:'เรียนจบบทนี้แล้ว'}).waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:`../../evidence/framework-lab01/standalone-${width}.png`,fullPage:true});
  assert.deepEqual(errors,[]);await page.close();
 }}finally{await browser.close();await new Promise(r=>server.httpServer.close(r));}
});
