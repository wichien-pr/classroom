import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const {expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const evidence=new URL('../evidence/',import.meta.url).pathname,base='http://127.0.0.1:8100';
const target=JSON.parse(await readFile(evidence+'community-restart-target.json'));
const browser=await chromium.launch({channel:'chromium'});
try{
 const ctx=await browser.newContext({storageState:evidence+'community-browser-session.json'}),page=await ctx.newPage();
 await page.goto(target.url);await page.getByLabel('ร่วมแสดงความคิดเห็น').fill('QA moderation comment '+Date.now());await page.getByRole('button',{name:'ส่งความคิดเห็น',exact:true}).click();
 await page.getByText('แก้ไขความคิดเห็น',{exact:true}).click();await page.getByLabel('แก้ไขข้อความ').evaluate(e=>e.removeAttribute('maxlength'));await page.getByLabel('แก้ไขข้อความ').fill('x'.repeat(1001));await page.getByRole('button',{name:'บันทึกความคิดเห็น',exact:true}).click();await expect(page.getByRole('alert')).toBeVisible();assert.equal((await page.getByLabel('แก้ไขข้อความ').inputValue()).length,1001);assert.equal(await page.getByLabel('ร่วมแสดงความคิดเห็น').inputValue(),'');await page.screenshot({path:evidence+'community-invalid-comment-edit.png',fullPage:true});
 const mod=await browser.newPage();await mod.goto(base+'/login');await mod.locator('[name=email]').fill('community-b@example.test');await mod.locator('[name=password]').fill('QA-community-password-2026');await mod.locator('form button').click();await mod.waitForURL(base+'/');await mod.goto(target.url);
 await mod.getByRole('button',{name:'เลิกปักหมุด',exact:true}).click();await expect(mod.getByRole('button',{name:'ปักหมุดโพสต์',exact:true})).toBeVisible();await mod.getByRole('button',{name:'ปักหมุดโพสต์',exact:true}).click();await mod.getByText('ลบความคิดเห็น…',{exact:true}).click();await mod.getByRole('button',{name:'ยืนยันลบความคิดเห็น',exact:true}).click();await expect(mod.locator('.comment')).toHaveCount(0);
 await page.goto(base+'/community');const csrf=await page.locator('[name=csrf_token]').first().inputValue();const created=await page.request.post(base+'/community/posts',{multipart:{csrf_token:csrf,title:'QA moderation delete '+Date.now(),body:'temporary only',category:'general'}});assert.equal(created.status(),200);const url=created.url();await mod.goto(url);await mod.getByText('ลบโพสต์…',{exact:true}).click();await mod.getByRole('button',{name:'ยืนยันลบโพสต์',exact:true}).click();assert.equal((await page.request.get(url)).status(),404);
 const result={passed:true,invalidCommentEditRetainedCorrectForm:true,moderatorUnpinRepin:true,moderatorDeleteOtherComment:true,moderatorDeleteOtherPost:true};await writeFile(evidence+'community-moderation-browser.json',JSON.stringify(result,null,2));console.log(result);
}finally{await browser.close()}
