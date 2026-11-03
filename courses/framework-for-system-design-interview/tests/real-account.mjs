import {chromium} from '@playwright/test';import assert from 'node:assert/strict';import {readFile,writeFile} from 'node:fs/promises';
const evidence=new URL('../../../evidence/framework-lab01/',import.meta.url),info=JSON.parse(await readFile(new URL('server.json',evidence),'utf8'));
const browser=await chromium.launch(),id='framework-for-system-design-interview',path=`/courses/${id}/`,api=`/api/courses/${id}/`;
const report={widths:[],accounts:2,errors:[],qualification:false,stableChoiceReplay:false};
async function login(page,n){await page.goto(info.url+'/login');await page.locator('[name=email]').fill(`framework${n}@example.test`);await page.locator('[name=password]').fill('disposable-qa-password');await page.locator('button[type=submit]').click();await page.waitForURL(info.url+'/');await page.locator(`a[href="${path}"]`).click();await page.locator('#calculate:enabled').waitFor();}
try{
 const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.addInitScript(()=>Math.random=()=>.9);
 await login(page,1);await page.locator('#complete-lesson').click();await page.locator('#completion-status').filter({hasText:'ยังขาด:'}).waitFor();
 assert.deepEqual((await (await context.request.get(info.url+api+'progress')).json()).completed,[]);
 await page.locator('[data-question=features]').click();await page.locator('[data-question=order]').click();await page.locator('#calculate').click();await page.locator('#calculate:enabled').waitFor();
 await page.locator('[data-answer="0"]').click();await page.locator('#completion-status').filter({hasText:'เรียนจบบทนี้แล้ว'}).waitFor();
 assert.equal((await (await context.request.get(info.url+api+'participation')).json()).score,2);report.qualification=true;
 await page.addInitScript(()=>Math.random=()=>.1);await page.reload();await page.locator('#calculate:enabled').waitFor();await page.locator('[data-answer="0"]').click();await page.locator('#account-status').filter({hasText:'ปุ่มนี้นับคะแนนแล้ว'}).waitFor();assert.equal((await (await context.request.get(info.url+api+'participation')).json()).score,2);report.stableChoiceReplay=true;
 for(const width of [1280,390,320]){await page.setViewportSize({width,height:900});await page.evaluate(()=>scrollTo(0,0));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:new URL(`real-account-${width}.png`,evidence).pathname,fullPage:true});report.widths.push(width);}
 await page.getByRole('link',{name:'ออกจากคลาส · กลับหน้าแรก'}).click();await page.waitForURL(info.url+'/');assert.equal((await (await context.request.get(info.url+'/api/leaderboards')).json()).members.find(m=>m.name==='Framework QA 1').level,2);
 const other=await browser.newContext(),p2=await other.newPage();await login(p2,2);assert.equal((await (await other.request.get(info.url+api+'participation')).json()).score,0);assert.deepEqual((await (await other.request.get(info.url+api+'progress')).json()).completed,[]);
 for(const privatePath of ['assessment.json','src/main.js','Step1.pdf'])assert.equal((await other.request.get(info.url+path+privatePath)).status(),404);
 await p2.locator('#calculate').click();await p2.locator('#calculate:enabled').waitFor();await p2.locator('[data-answer="1"]').click();await p2.locator('#calculate:enabled').waitFor();assert.deepEqual((await (await other.request.get(info.url+api+'progress')).json()).completed,[]);await p2.locator('#complete-lesson').click();await p2.locator('#completion-status').filter({hasText:'เรียนจบบทนี้แล้ว'}).waitFor();
 await other.close();await context.close();assert.deepEqual(report.errors,[]);await writeFile(new URL('real-account-report.json',evidence),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close()}
