import assert from 'node:assert/strict';
import {readFile,writeFile,rename} from 'node:fs/promises';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const info=JSON.parse(await readFile(new URL('../evidence/leaderboards-qa-server.json',import.meta.url),'utf8'));
assert.ok(info.courses_root.includes('/evidence/leaderboards-qa-'));
const bank=info.courses_root+'/qa-0/assessment.json';
const browser=await chromium.launch({channel:'chromium'}), page=await browser.newPage({viewport:{width:390,height:844}});
let moved=false;
try{
 await page.goto(info.base+'/login');await page.locator('[name=email]').fill('qalevel8@example.test');await page.locator('[name=password]').fill(info.password);await page.locator('button').click();await page.waitForURL(info.base+'/');
 await rename(bank,bank+'.qa-backup');moved=true;
 await page.goto(info.base+'/exam');await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('qa-0'));
 assert.match(await page.locator('#status').innerText(),/แจ้งผู้ดูแล/);assert.equal(await page.locator('#exam-form').isVisible(),false);
 await page.screenshot({path:new URL('../evidence/exam-unavailable.png',import.meta.url).pathname,fullPage:true});
 await rename(bank+'.qa-backup',bank);moved=false;
 await page.locator('#retry').click();await page.locator('fieldset').first().waitFor();assert.equal(await page.locator('fieldset').count(),13);assert.equal(await page.locator('#retry').isVisible(),false);
 let submitted=false;page.on('request',r=>{if(r.url().endsWith('/submit'))submitted=true});await page.locator('#submit').click();assert.equal(submitted,false);assert.equal(await page.locator('input:invalid').count()>0,true);
 // Controlled network outage tests UI error/retry, not an invented backend result.
 await page.route('**/api/exam',r=>r.abort());await page.reload();await page.waitForFunction(()=>!document.querySelector('#retry').hidden);
 await page.unroute('**/api/exam');await page.locator('#retry').click();await page.locator('fieldset').first().waitFor();
 const report={passed:true,realMissingBankActionable:true,missingBankRetry:true,answerAllRequired:true,networkFailureRetry:true};
 await writeFile(new URL('../evidence/exam-errors-browser.json',import.meta.url),JSON.stringify(report,null,2));console.log(report);
}finally{if(moved)await rename(bank+'.qa-backup',bank);await browser.close()}
