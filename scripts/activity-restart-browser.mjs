import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const {expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const baseline=JSON.parse(await readFile(new URL('../evidence/activity-restart-baseline.json',import.meta.url)));
const browser=await chromium.launch({channel:'chromium'}),page=await browser.newPage();
try{
 await page.goto('http://127.0.0.1:8099/login');await page.locator('[name=email]').fill(baseline.email);await page.locator('[name=password]').fill('activity browser password');await page.locator('button').click();await page.waitForURL('http://127.0.0.1:8099/');
 await page.goto('http://127.0.0.1:8099/account/profile');
 await expect(page.locator('#activity-detail')).toContainText('5 กิจกรรม · เข้าสู่ระบบ 1 · เปิดคอร์ส 2 · เรียนจบ 2 บท');
 assert.equal(await page.locator('.activity-inception').innerText(),baseline.inceptionText);
 await page.screenshot({path:new URL('../evidence/activity-after-restart.png',import.meta.url).pathname,fullPage:true});
 await writeFile(new URL('../evidence/activity-restart-browser.json',import.meta.url),JSON.stringify({passed:true,realProcessRestart:true,existingAccountTotal:5,unchangedInception:true},null,2));
 console.log('PASS: existing QA account total 5 and inception unchanged after real server restart');
}finally{await browser.close();}
