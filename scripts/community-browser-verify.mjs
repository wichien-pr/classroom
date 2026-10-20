import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const {expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const evidence=new URL('../evidence/',import.meta.url).pathname;
const qa=JSON.parse(await readFile(evidence+(process.env.QA_INFO||'community-qa-server.json')));
assert.equal(qa.url,process.env.QA_URL||'http://127.0.0.1:8100');
const browser=await chromium.launch({channel:'chromium'}), context=await browser.newContext({viewport:{width:1440,height:1100}}),page=await context.newPage();
const errors=[],checks=[],network=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('response',r=>{if(r.url().includes('/community'))network.push({path:new URL(r.url()).pathname,status:r.status(),method:r.request().method()})});
async function login(p,email){await p.goto(qa.url+'/login');await p.locator('[name=email]').fill(email);await p.locator('[name=password]').fill('QA-community-password-2026');await p.locator('form button').click();await p.waitForURL(qa.url+'/');}
const check=s=>checks.push(s),shot=n=>page.screenshot({path:evidence+'community-'+n+'.png',fullPage:true});
async function csrf(p){return p.locator('input[name=csrf_token]').first().inputValue()}
try{
 await page.goto(qa.url+'/community');assert.equal(page.url(),qa.url+'/login');check('guest redirected');
 await login(page,'community-a@example.test');await page.getByRole('link',{name:'Community',exact:true}).click();
 await page.getByText('✎ เขียนโพสต์ · แบ่งปันสิ่งที่คุณเรียนรู้',{exact:true}).focus();await page.keyboard.press('Enter');await expect(page.locator('[name=title]')).toBeVisible();check('keyboard opens composer');
 const title='QA คำถามเรื่องการออกแบบระบบ '+Date.now();
 await page.locator('[name=title]').fill(title);await page.locator('select[name=category]').selectOption('questions');await page.locator('#block-editor .editor-text').first().fill('อยากแลกเปลี่ยนสิ่งที่เรียนรู้\n<script>window.communityXSS=true</script>');
 await page.getByRole('button',{name:'เผยแพร่โพสต์',exact:true}).click();await page.waitForURL('**/community/posts/*');const url=page.url();
 await expect(page.locator('.post-text').first()).toContainText('<script>');assert.equal(await page.evaluate(()=>window.communityXSS),undefined);await page.reload();await expect(page.locator('.post-title')).toHaveText(title);check('create escaped multiline post and reload persistence');
 await page.getByRole('link',{name:'แก้ไขโพสต์',exact:true}).click();await page.locator('[name=title]').fill(title+' แก้ไข');await page.getByRole('button',{name:'บันทึกโพสต์',exact:true}).click();await expect(page.locator('.post-title')).toContainText('แก้ไข');check('owner edits post');
 const otherContext=await browser.newContext(),other=await otherContext.newPage();await login(other,'community-b@example.test');await other.goto(url);
 assert.equal(await other.getByRole('link',{name:'แก้ไขโพสต์',exact:true}).count(),0);
 const denied=await other.request.post(url+'/edit',{multipart:{csrf_token:await csrf(other),title:'stolen',body:'bad',category:'general'}});assert.equal(denied.status(),403);check('other account cannot edit even as moderator');
 await other.getByRole('button',{name:'ถูกใจ',exact:true}).focus();await other.keyboard.press('Enter');await expect(other.getByRole('button',{name:'ยกเลิกถูกใจ',exact:true})).toHaveText('1');await expect(other.getByRole('button',{name:'ยกเลิกถูกใจ',exact:true})).toHaveAttribute('aria-pressed','true');await other.reload();await expect(other.getByRole('button',{name:'ยกเลิกถูกใจ',exact:true})).toHaveText('1');await other.screenshot({path:evidence+'community-card-selected.png',fullPage:true});
 await other.getByRole('button',{name:'ยกเลิกถูกใจ',exact:true}).focus();await other.keyboard.press('Space');await expect(other.getByRole('button',{name:'ถูกใจ',exact:true})).toHaveText('0');await other.reload();await expect(other.getByRole('button',{name:'ถูกใจ',exact:true})).toHaveAttribute('aria-pressed','false');check('explicit like/unlike keyboard Enter/Space and reload');
 await other.getByLabel('ร่วมแสดงความคิดเห็น').fill('QA คำตอบจากสมาชิกอีกคน');await other.getByRole('button',{name:'ส่งความคิดเห็น',exact:true}).click();await expect(other.locator('.comment .post-text')).toHaveText('QA คำตอบจากสมาชิกอีกคน');
 await other.getByText('แก้ไขความคิดเห็น',{exact:true}).click();await other.getByLabel('แก้ไขข้อความ').fill('QA แก้ไขความคิดเห็นแล้ว');await other.getByRole('button',{name:'บันทึกความคิดเห็น',exact:true}).click();
 await page.reload();await expect(page.locator('.comment .post-text')).toHaveText('QA แก้ไขความคิดเห็นแล้ว');assert.equal(await page.getByText('แก้ไขความคิดเห็น',{exact:true}).count(),0);check('comment create edit and ownership');
 await other.getByRole('button',{name:'ปักหมุดโพสต์',exact:true}).click();await page.reload();await expect(page.locator('.post-card')).toContainText('ปักหมุด');assert.equal(await page.getByRole('button',{name:'เลิกปักหมุด',exact:true}).count(),0);check('explicit configured moderator pin');
 await expect(page.locator('.last-comment a')).toHaveAttribute('href','/members/2');await expect(page.locator('.last-comment')).toContainText('เมื่อสักครู่');
 const cardStyle=await page.locator('.post-card').evaluate(e=>({border:getComputedStyle(e).borderTopColor,bg:getComputedStyle(e).backgroundColor}));assert.equal(cardStyle.border,'rgb(232, 187, 83)');assert.equal(cardStyle.bg,'rgb(255, 255, 255)');
 for(const control of await page.locator('.post-footer .reaction').all()){const box=await control.boundingBox();assert.ok(box.width>=44&&box.height>=44)}
 await page.getByRole('link',{name:'1 ความคิดเห็น',exact:true}).click();assert.equal(new URL(page.url()).hash,'#comments');check('real last commenter, golden pin, 44px reactions and comment anchor');await shot('detail-desktop');
 for(const width of [390,320]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await shot('detail-mobile-'+width)}check('detail 320 and 390 no overflow');
 await page.setViewportSize({width:1440,height:1100});await page.goto(qa.url+'/community');await page.getByRole('link',{name:'คำถาม',exact:true}).click();await expect(page.locator('.post-title')).toHaveCount(1);await expect(page.getByLabel('ค้นหาโพสต์')).toHaveCount(0);await page.goto(qa.url+'/community?category=questions&q='+encodeURIComponent('แก้ไข'));await expect(page.locator('.post-title')).toContainText('แก้ไข');check('category and text search');
 await page.goto(qa.url+'/community?category=tips&sort=activity');await expect(page.locator('.post-card')).toHaveCount(10);await page.getByRole('link',{name:'ถัดไป →',exact:true}).click();await expect(page.locator('.post-card')).toHaveCount(2);assert.ok(page.url().includes('category=tips'));check('stable pagination maintains filters');
 await page.goto(qa.url+'/community');await shot('feed-desktop');
 for(const width of [390,320]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await shot('feed-mobile-'+width)}check('feed 320 and 390 no overflow');
 await page.setViewportSize({width:1440,height:1100});await page.goto(url);
 const invalid=await page.request.post(url+'/comments',{multipart:{csrf_token:await csrf(page),body:''}});assert.equal(invalid.status(),400);assert.match(await invalid.text(),/1–1,000/);
 const forbidden=await page.request.post(url+'/pin',{form:{csrf_token:await csrf(page),state:'1'}});assert.equal(forbidden.status(),403);
 const cross=await page.request.post(url+'/like',{form:{csrf_token:await csrf(page),state:'1'},headers:{Origin:'https://evil.example'}});assert.equal(cross.status(),403);check('invalid input and pin/origin bypass rejected');
 await other.goto(url);await other.getByText('ลบความคิดเห็น…',{exact:true}).click();await other.getByRole('button',{name:'ยืนยันลบความคิดเห็น',exact:true}).click();await expect(other.locator('.comment')).toHaveCount(0);check('comment delete confirmation');
 await page.goto(qa.url+'/community');await page.getByText('✎ เขียนโพสต์ · แบ่งปันสิ่งที่คุณเรียนรู้',{exact:true}).click();await page.locator('[name=title]').fill('QA delete me '+Date.now());await page.locator('#block-editor .editor-text').first().fill('temporary');await page.locator('#composer select[name=category]').selectOption('general');await page.getByRole('button',{name:'เผยแพร่โพสต์',exact:true}).click();await page.waitForURL('**/community/posts/*');const deleted=page.url();await page.getByText('ลบโพสต์…',{exact:true}).click();await page.getByRole('button',{name:'ยืนยันลบโพสต์',exact:true}).click();assert.equal((await page.request.get(deleted)).status(),404);check('post delete confirmation and 404');
 await page.goto(url);await page.reload();await expect(page.locator('.post-title')).toContainText('แก้ไข');await context.storageState({path:evidence+'community-browser-session.json'});
 await writeFile(evidence+'community-restart-target.json',JSON.stringify({url,title:title+' แก้ไข'},null,2));
 assert.deepEqual(errors,[]);const result={passed:true,checksPassed:checks.length,checks,errors,network,qaUrl:qa.url};await writeFile(evidence+'community-browser.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));await otherContext.close();
}finally{await browser.close()}
