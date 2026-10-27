import {chromium} from 'playwright';import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';import {lessons} from '../src/lessons.js';
const out=new URL('../../../evidence/estimation/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1100}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(process.env.PREVIEW_URL||'http://127.0.0.1:8143');await page.locator('#calculate').waitFor({timeout:10000});
 await page.locator('#calculate').click();const calculated=await page.locator('#result').textContent();
 await page.locator('#input-amount').fill('123');await page.locator('[data-lesson="estimate-latency"]').click();await page.locator('[data-lesson="estimate-units"]').click();
 assert.equal(await page.locator('#result').textContent(),calculated,'results must retain the exact inputs that produced them');await page.locator('#reset').click();
 const results=[];
 for(const lesson of lessons){
  await page.locator(`[data-lesson="${lesson.id}"]`).click();
  assert.equal(await page.locator('.lesson-steps li').count(),3);
  await page.locator('#calculate').click();assert.ok((await page.locator('#result').textContent()).includes('ขั้นคำนวณ'));
  const input=page.locator('input[type=number]').first();await input.fill('-1');await page.locator('#calculate').click();assert.ok(await page.locator('#input-error').textContent());
  await page.locator('#reset').click();assert.equal(await page.locator('#input-error').textContent(),'');
  await page.locator('#calculate').click();const result=await page.locator('#result').textContent();
  await page.locator('#complete-lesson').click();
  for(const choice of [0,1]){await page.locator(`[data-answer="${choice}"]`).click();assert.ok((await page.locator('#feedback').textContent()).includes(lesson.answers[choice].reason));assert.equal(await page.locator('#result').textContent(),result)}
  assert.equal(await page.locator('#complete-lesson').isDisabled(),true);
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:new URL(`standalone-${lesson.id}.png`,out).pathname,fullPage:true});results.push({lesson:lesson.id,calculate:true,choices:[0,1],invalid:true,reset:true});
 }
 await page.reload();assert.match(await page.locator('#progress-count').textContent(),/5 \/ 5/);
 await page.locator('[data-lesson="estimate-units"]').click();
 const term=page.locator('.term-trigger').first();await term.focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#term-hint').evaluate(e=>e.matches(':popover-open')),true);await page.keyboard.press('Escape');assert.equal(await term.evaluate(e=>e===document.activeElement),true);
 for(const width of [320,390]){await page.setViewportSize({width,height:900});for(const l of lessons){await page.locator(`[data-lesson="${l.id}"]`).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}await page.screenshot({path:new URL(`standalone-${width}.png`,out).pathname,fullPage:true})}
 assert.deepEqual(errors,[]);
 for(const mode of ['corrupt','denied']){const context=await browser.newContext();await context.addInitScript(mode=>{if(mode==='corrupt')localStorage.setItem('back-of-the-envelope-estimation-progress-v1','{broken');else{Storage.prototype.getItem=()=>{throw Error('denied')};Storage.prototype.setItem=()=>{throw Error('denied')}}},mode);const p=await context.newPage();await p.goto(process.env.PREVIEW_URL||'http://127.0.0.1:8143');await p.locator('#calculate').click();assert.match(await p.locator('#progress-count').textContent(),/0 \/ 5/);await p.locator('#complete-lesson').click();assert.match(await p.locator('#progress-count').textContent(),/1 \/ 5/);await context.close()}
 await writeFile(new URL('standalone.json',out),JSON.stringify({results,errors,reload:true,keyboardGlossary:true,corruptStorage:true,deniedStorage:true,calculationSnapshot:true,widths:[320,390,1440]},null,2));console.log('Standalone: 5 lessons, all calculator/quiz/reset/invalid paths; reload, glossary keyboard, 320/390/1440 verified');
}finally{await browser.close()}
