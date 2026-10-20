import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const {expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const evidence=new URL('../evidence/',import.meta.url).pathname;
const target=JSON.parse(await readFile(evidence+'community-restart-target.json'));
const browser=await chromium.launch({channel:'chromium'});
try{
 const context=await browser.newContext({storageState:evidence+'community-browser-session.json',viewport:{width:320,height:844}}),page=await context.newPage();
 await page.goto('http://127.0.0.1:8100/account/profile/edit');await page.locator('#display-name').fill('A'.repeat(80));await page.getByRole('button',{name:'บันทึกโปรไฟล์',exact:true}).click();
 await page.goto(target.url);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'long author name must not overflow 320px');
 await page.screenshot({path:evidence+'community-long-name-mobile.png',fullPage:true});
 await page.goto('http://127.0.0.1:8100/account/profile/edit');await page.locator('#display-name').fill('QA Community Learner');await page.getByRole('button',{name:'บันทึกโปรไฟล์',exact:true}).click();
 await page.goto('http://127.0.0.1:8100/community');await page.getByText('✎ เขียนโพสต์ · แบ่งปันสิ่งที่คุณเรียนรู้',{exact:true}).click();await page.locator('[name=title]').fill('QA ข้อความภาษาไทยสูงสุด');await page.locator('textarea[name=body]').fill('ก'.repeat(2000));await page.locator('#composer select[name=category]').selectOption('general');await page.getByRole('button',{name:'เผยแพร่โพสต์',exact:true}).click();
 await expect(page.locator('.post-text').first()).toHaveText('ก'.repeat(2000));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.getByRole('link',{name:'แก้ไขโพสต์',exact:true}).click();await page.locator('[name=title]').fill(' ');await page.getByRole('button',{name:'บันทึกโพสต์',exact:true}).click();await expect(page.getByRole('alert')).toBeVisible();assert.equal((await page.locator('textarea[name=body]').inputValue()).length,2000);await page.screenshot({path:evidence+'community-invalid-draft.png',fullPage:true});
 const result={passed:true,longAuthorMobile320:true,maxThaiBody2000:true,invalidDraftRetained:true};await writeFile(evidence+'community-edge-browser.json',JSON.stringify(result,null,2));console.log(result);
}finally{await browser.close()}
