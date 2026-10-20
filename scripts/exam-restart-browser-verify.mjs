import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const browser=await chromium.launch({channel:'chromium'}),page=await browser.newPage();
try{
 await page.goto('http://127.0.0.1:8095/login');await page.locator('[name=email]').fill('qaeligible@example.test');await page.locator('[name=password]').fill('QA-only-password-2026');await page.locator('button').click();await page.waitForURL('http://127.0.0.1:8095/');
 await page.goto('http://127.0.0.1:8095/exam');await page.waitForFunction(()=>document.querySelector('#result').textContent.includes('Level 9'));
 const state=await(await page.request.get('http://127.0.0.1:8095/api/exam')).json();assert.equal(state.attempt.passed,true);assert.equal(state.attempt.correct,19);assert.equal(state.attempt.total,20);
 await page.goto('http://127.0.0.1:8095/leaderboards');assert.match(await page.locator('.profile').innerText(),/Level 9/);
 const report={passed:true,afterActualServerRestart:true,relogin:true,correct:19,total:20,level:9};await writeFile(new URL('../evidence/exam-restart-browser.json',import.meta.url),JSON.stringify(report,null,2));console.log(report);
}finally{await browser.close()}
