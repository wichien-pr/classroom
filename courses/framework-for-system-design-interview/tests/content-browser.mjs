import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const url=process.env.FRAMEWORK_PREVIEW_URL;
const out=process.env.FRAMEWORK_EVIDENCE;
assert.ok(url && out, 'FRAMEWORK_PREVIEW_URL and FRAMEWORK_EVIDENCE are required');
await mkdir(out,{recursive:true});
const browser=await chromium.launch();const rows=[];const errors=[];
try {
for(const theme of ['light','dark'])for(const width of [320,390,768,1280]){
 const page=await browser.newPage({viewport:{width,height:900}});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
 for(const [i,id] of ['framework-scope','framework-blueprint','framework-deep-dive','framework-wrap-up'].entries()){
  await page.locator(`[data-lesson="${id}"]`).click();
  await page.locator('#calculate').click();assert.match(await page.locator('#result').innerText(),/ขาด|ช่องว่าง|ยืนยัน/);
  if(i===0){for(const b of await page.locator('[data-question]').all())await b.click();await page.locator('#calculate').click();assert.match(await page.locator('#result').innerText(),/Functional requirements/);}
  if(i===1){for(const b of await page.locator('[data-setting]').all())await b.check();await page.locator('#calculate').click();assert.match(await page.locator('#result').innerText(),/มิน.*นิด/);assert.match(await page.locator('#lesson').innerText(),/fanout-on-read/);}
  if(i===2){for(const b of await page.locator('[data-foundation]').all())await b.check();for(const [focus,topic] of [['feed','publishing'],['performance','bottleneck'],['shortener','hash'],['chat','presence'],['overview','overview']]){await page.locator('#focus').selectOption(focus);await page.locator('#topic').selectOption(topic);await page.locator('#calculate').click();assert.match(await page.locator('#result').innerText(),/พร้อมนำแผนไปคุย/);}assert.match(await page.locator('#lesson').innerText(),/queue lag/);}
  if(i===3){for(const b of await page.locator('[data-review]').all())await b.check();await page.locator('#calculate').click();assert.match(await page.locator('#result').innerText(),/ไม่ใช่ความจุที่วัดแล้ว/);await page.locator('#growth').selectOption('investigate');await page.locator('#calculate').click();assert.match(await page.locator('#result').innerText(),/พร้อมนำสรุปไปคุย/);}
  for(const summary of await page.locator('details summary').all()){await summary.focus();await page.keyboard.press('Enter');assert.equal(await summary.evaluate(e=>e.parentElement.open),true);}
  if(i===3)assert.match(await page.locator('#wrap-reflection').innerText(),/ไม่ตรวจอัตโนมัติ ไม่บันทึก/);
  for(const answer of ['0','1']){await page.locator(`[data-answer="${answer}"]`).click();assert.ok((await page.locator('#feedback').innerText()).length>30);}
  const result=await page.locator('#result').innerText();
  await page.locator(`[data-lesson="${i===0?'framework-wrap-up':'framework-scope'}"]`).click();await page.locator(`[data-lesson="${id}"]`).click();assert.equal(await page.locator('#result').innerText(),result);
  for(const summary of await page.locator('details summary').all())if(!await summary.evaluate(e=>e.parentElement.open))await summary.click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${id} ${width} ${theme}`);
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`${out}/${id}-${theme}-${width}.png`,fullPage:true});
  if(i===3&&width===390){await page.locator('#wrap-reflection').screenshot({path:`${out}/reflection-${theme}.png`});}
  await page.locator('#reset').click();assert.equal(await page.locator('[data-answer="1"]').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('input:checked').count(),0);
  rows.push({id,theme,width,scenario:true,quizChoices:2,navigation:true,reset:true,disclosures:true,overflow:false});
 }
 await page.reload();assert.equal(await page.locator('#progress-count').innerText(),'4 / 4');await page.close();
}
assert.equal(rows.length,32);assert.deepEqual(errors,[]);
await writeFile(`${out}/results.json`,JSON.stringify({count:rows.length,errors,rows},null,2));console.log(JSON.stringify({count:rows.length,errors,out}));
}finally{await browser.close();}
