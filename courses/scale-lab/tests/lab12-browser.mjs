import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const out=new URL('../evidence/lab12/',import.meta.url);mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.LAB12_URL||'http://127.0.0.1:8132');await page.locator('[data-lesson="12"]').click();
 const run=()=>page.locator('#evaluate-data-tier').click(),text=()=>page.locator('#architecture').innerText();
 await run();assert.match(await text(),/เกินกำลัง/);
 await page.locator('#tier-power').fill('4');await run();assert.match(await text(),/กำลังเพียงพอ/);
 await page.locator('#tier-up').uncheck();await run();assert.match(await text(),/ฐานข้อมูลไม่พร้อม/);
 await page.locator('#tier-up').check();await page.locator('#tier-power').fill('1');await page.locator('#tier-mode').selectOption('horizontal');await run();assert.match(await text(),/0, 4, 8, 12/);
 await page.locator('#tier-traffic').selectOption('hotspot');await run();assert.match(await text(),/ภาระ 14 \/ กำลัง 8/);
 await page.locator('#tier-traffic').selectOption('uniform');await page.locator('#tier-shards').selectOption('8');await run();assert.match(await text(),/ปลายทางเปลี่ยน 8 จาก 16/);
 for(const width of [1440,390,320]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:new URL(`width-${width}.png`,out).pathname,fullPage:true});}
 await page.locator('#reset').click();assert.match(await text(),/กำหนดรูปแบบ/);
 await page.locator('[data-answer="1"]').click();assert.match(await page.locator('#feedback').innerText(),/ถูกต้อง/);
 await page.reload();await page.locator('[data-lesson="12"]').click();assert.match(await page.locator('#completion-status').innerText(),/เรียนจบ/);
 assert.deepEqual(errors,[]);writeFileSync(new URL('browser.json',out),JSON.stringify({passed:true,widths:[1440,390,320],checks:['capacity','outage','modulo4','hotspot','resharding','reset','quiz','local-persistence'],pageErrors:errors},null,2));console.log('LAB12 compiled browser checks passed');
}finally{await browser.close();}
