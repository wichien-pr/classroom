import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const browser=await chromium.launch({channel:'chromium'});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const base='http://127.0.0.1:8095', errors=[], evidence=new URL('../evidence/',import.meta.url).pathname;
page.on('pageerror',e=>errors.push(String(e)));
page.on('dialog',d=>d.accept());
async function login(email){await page.goto(base+'/login');await page.locator('[name=email]').fill(email);await page.locator('[name=password]').fill('QA-only-password-2026');await page.getByRole('button',{name:'เข้าสู่ระบบ',exact:true}).click();await page.waitForURL(base+'/')}
async function snapshot(name){await page.screenshot({path:evidence+name+'.png',fullPage:true})}
try{
 await page.goto(base+'/leaderboards');assert.equal(page.url(),base+'/login');
 await login('qazero@example.test');await page.getByRole('link',{name:'Leaderboards',exact:true}).click();
 assert.match(await page.locator('.profile').innerText(),/Level 1/);assert.match(await page.locator('.profile').innerText(),/0 คลาส/);
 await snapshot('leaderboards-zero');
 const data=await (await page.request.get(base+'/api/leaderboards')).json();
 for(const [name,level] of [['QA Zero',1],['QA Level2',2],['QA Level3',3],['QA Level4',4],['QA Level5',5],['QA Level6',6],['QA Level7',7],['QA Level8',8]])assert.equal(data.members.find(u=>u.name===name).level,level);
 assert.ok(data.members.every(u=>!('email' in u)));
 await page.goto(base+'/exam');await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('13 คลาส'));
 await page.getByRole('button',{name:'ออกจากระบบ'}).click();await login('qaeligible@example.test');
 await page.goto(base+'/leaderboards');await page.getByRole('link',{name:'เปิดข้อสอบ Level 9'}).click();await page.locator('fieldset').first().waitFor();
 assert.equal(await page.locator('fieldset').count(),20);
 const initial=await (await page.request.get(base+'/api/exam')).json();assert.equal(initial.attempt.courses.length,20);
 assert.ok(!JSON.stringify(initial).includes('"answer":'));
 await page.reload();await page.locator('fieldset').first().waitFor();assert.equal((await (await page.request.get(base+'/api/exam')).json()).attempt.id,initial.attempt.id);
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await snapshot('exam-mobile');
 for(const input of await page.locator('input[value=b]').all())await input.check();
 await page.getByRole('button',{name:'ยืนยันส่งคำตอบ'}).click();await page.waitForFunction(()=>document.querySelector('#result').textContent.includes('ยังไม่ผ่าน'));
 await snapshot('exam-failed');await page.getByRole('button',{name:'เริ่มสอบใหม่'}).click();await page.locator('fieldset').first().waitFor();
 assert.notEqual((await (await page.request.get(base+'/api/exam')).json()).attempt.id,initial.attempt.id);
 for(const input of await page.locator('input[value=a]').all())await input.check();
 await page.locator('fieldset').first().locator('input[value=b]').check();
 await page.getByRole('button',{name:'ยืนยันส่งคำตอบ'}).click();await page.waitForFunction(()=>document.querySelector('#result').textContent.includes('ปลดล็อก Level 9'));
 assert.equal(await page.locator('#retry').isVisible(),false);assert.equal(await page.locator('#new-attempt').isVisible(),false);
 assert.match(await page.locator('#result').innerText(),/19 \/ 20/);await snapshot('exam-passed');
 await page.goto(base+'/leaderboards');assert.match(await page.locator('.profile').innerText(),/Level 9/);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await snapshot('leaderboards-mobile');
 await page.setViewportSize({width:1440,height:1000});await page.reload();await page.locator('.ranking').waitFor();await snapshot('leaderboards-desktop');
 assert.deepEqual(errors,[]);
 const report={passed:true,guestProtection:true,zeroCompletion:true,allLevelFixtures:true,noEmails:true,allCourseCoverage:20,reloadSameAttempt:true,failedRetry:true,exact95Pass:true,level9:true,mobileNoOverflow:true,errors};
 await writeFile(evidence+'leaderboards-browser.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close()}
