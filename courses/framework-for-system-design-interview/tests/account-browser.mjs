import test from 'node:test';import assert from 'node:assert/strict';
import {preview} from 'vite';import {chromium} from '@playwright/test';
import {execFileSync} from 'node:child_process';import {mkdtemp,mkdir,rm} from 'node:fs/promises';import {resolve} from 'node:path';
const id='framework-for-system-design-interview',lesson='framework-scope',base=`/courses/${id}/`,api=`/api/courses/${id}/`;
test('compiled account completion parity: loading, failures, stable retries, qualification and both shuffle orders',async()=>{
 await mkdir('node_modules/.cache',{recursive:true});const output=await mkdtemp(resolve('node_modules/.cache/account-'));
 execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build','--base',base,'--outDir',output],{env:{...process.env,VITE_CLASSROOM_URL:'/',VITE_CLASSROOM_PROGRESS_URL:api+'progress'}});
 const server=await preview({base,build:{outDir:output},preview:{host:'127.0.0.1',port:0}}),browser=await chromium.launch();
 try{for(const random of [.1,.9]){
 const page=await browser.newPage({viewport:{width:random<.5?1280:320,height:900}});await page.addInitScript(v=>Math.random=()=>v,random);
 let criteria={manual:false,simulation:false,thinking:false},score=0,loadFail=true,manualFail=true,awardFail=true,release,releaseLoad,held=false;const writes=[];const awards=[];
 const data=()=>({csrf_token:'qa',course_id:id,total:1,criteria:{[lesson]:criteria},completed:Object.values(criteria).every(Boolean)?[lesson]:[]});
 await page.route('**'+api+'progress',async route=>{if(route.request().method()==='GET'){if(loadFail){await new Promise(r=>releaseLoad=r);loadFail=false;return route.fulfill({status:503,body:'{}'})}return route.fulfill({json:data()})}
 writes.push(route.request().postDataJSON());if(manualFail){manualFail=false;return route.fulfill({status:503,body:'{}'})}
 if(!held){held=true;await new Promise(r=>release=r)}criteria.manual=true;await route.fulfill({json:data()});});
 await page.route('**'+api+'participation',async route=>{if(route.request().method()==='GET')return route.fulfill({json:{score,csrf_token:'qa'}});
 const payload=route.request().postDataJSON();awards.push(payload);if(awardFail){awardFail=false;return route.fulfill({status:503,body:'{}'})}
 if(payload.action==='review-scope')criteria.simulation=true;else criteria.thinking=true;score++;return route.fulfill({json:{score,csrf_token:'qa',reason:'awarded'}});});
 await page.goto(server.resolvedUrls.local[0]);await page.locator('#completion-status').filter({hasText:'กำลังโหลดความคืบหน้าบัญชี'}).waitFor();assert.equal(await page.locator('#complete-lesson').isDisabled(),true);while(!releaseLoad)await new Promise(r=>setTimeout(r,10));releaseLoad();await page.locator('#completion-status').filter({hasText:'โหลดความคืบหน้าไม่ได้'}).waitFor();assert.equal(await page.locator('#calculate').isDisabled(),true);
 await page.locator('#retry-completion-load').click();await page.locator('#completion-status').filter({hasText:'ยังขาด:'}).waitFor();
 await page.locator('#complete-lesson').click();await page.locator('#complete-lesson').filter({hasText:'ลองบันทึกอีกครั้ง'}).waitFor();await page.locator('#complete-lesson').click();
 await page.locator('#completion-status').filter({hasText:'กำลังบันทึกบท'}).waitFor();assert.equal(await page.locator('#calculate').isDisabled(),true);release();
 await page.locator('#completion-status').filter({hasText:'ยังขาด:'}).waitFor();assert.deepEqual(writes,[{lesson_id:lesson,manual:true},{lesson_id:lesson,manual:true}]);
 await page.locator('#calculate').click();await page.locator('#retry').waitFor();await page.locator('#retry').click();await page.locator('#calculate:enabled').waitFor();assert.deepEqual(awards[0],awards[1]);
 assert.equal(await page.locator('[data-answer]').first().getAttribute('data-answer'),random<.5?'0':'1');await page.locator('[data-answer="0"]').click();await page.locator('#completion-status').filter({hasText:'เรียนจบบทนี้แล้ว'}).waitFor();assert.equal(awards.at(-1).action,'quiz-answer-a');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:`../../evidence/framework-lab01/account-${random<.5?'1280':'320'}.png`,fullPage:true});await page.close();
 }}finally{await browser.close();await new Promise(r=>server.httpServer.close(r));await rm(output,{recursive:true,force:true});}
});
