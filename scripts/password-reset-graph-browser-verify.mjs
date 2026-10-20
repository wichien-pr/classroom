import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const {expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const root=new URL('../',import.meta.url), evidence=new URL('evidence/password-reset-graph/',root);
const info=JSON.parse(await readFile(new URL('server.json',evidence))), base=info.base;
const browser=await chromium.launch({channel:'chromium'}), owner=await browser.newContext(), recovery=await browser.newContext();
const page=await owner.newPage(), reset=await recovery.newPage(), steps=[], errors=[], paths=[];
for(const p of [page,reset]) { p.on('pageerror',()=>errors.push('pageerror')); p.on('request',r=>paths.push(new URL(r.url()).pathname+new URL(r.url()).search)); }
const email='reset-browser@example.test', oldPassword='old-password-QA-123', newPassword='new-password-QA-456';
async function login(p,password) { await p.goto(base+'/login'); await p.locator('[name=email]').fill(email);await p.locator('[name=password]').fill(password);await p.locator('button').click(); }
async function requestMail() {await reset.goto(base+'/forgot-password');await reset.locator('[name=email]').fill(email);await reset.locator('button').click();await expect(reset.locator('[role=status]')).toContainText('หากอีเมลนี้');}
async function mail(n) {let data; await expect.poll(async()=>{try{data=JSON.parse(await readFile(info.qa+`/mail-${n}.json`));return true;}catch{return false;}}).toBe(true);assert.equal(data.to,email);return data.link;}
async function submit(password,confirmation=password) {await reset.locator('[name=password]').fill(password);await reset.locator('[name=confirmation]').fill(confirmation);await reset.locator('button').click();}
async function progress(){return page.request.get(base+'/api/courses/scale-lab/progress').then(r=>r.json());}
try {
 await page.goto(base+'/register');await page.locator('[name=name]').fill('Recovery QA');await page.locator('[name=email]').fill(email);await page.locator('[name=password]').fill(oldPassword);await page.locator('button').click();await page.waitForURL('**/login');await login(page,oldPassword);await page.waitForURL(base+'/');
 await page.goto(base+'/courses/scale-lab/');await page.locator('#complete-lesson').click();await page.locator('[data-action=step]').click();await page.locator('[data-answer="0"]').click();await expect(page.locator('#progress')).toContainText('1 / 11');const before=await progress();steps.push('register/login and isolated compiled course qualified lesson');
 await reset.goto(base+'/login');await reset.locator('a[href="/forgot-password"]').click();await expect(reset.locator('h1')).toContainText('ลืมรหัสผ่าน');await requestMail();const link=await mail(1);steps.push('local Graph double accepted sendMail payload; reset link parsed (not provider delivery)');
 const response=await reset.goto(link);assert.equal(response.headers()['cache-control'],'no-store');assert.equal(response.headers()['referrer-policy'],'no-referrer');await expect(reset).toHaveURL(base+'/reset-password');
 // Fragment scrubbed; GET does not consume, and reopening works.
 await reset.goto(link);await expect(reset.locator('[name=token]')).not.toHaveValue('');
 await submit(newPassword,'mismatch-password');await expect(reset.locator('[role=alert]')).toContainText('ยืนยันให้ตรงกัน');
 await submit(newPassword);await expect(reset.locator('[role=status]')).toContainText('ตั้งรหัสผ่านใหม่สำเร็จ');steps.push('GET non-consuming; confirmation retry; successful reset without auto login');
 await reset.goto(base+'/');await expect(reset).toHaveURL(base+'/login');await page.goto(base+'/');await expect(page).toHaveURL(base+'/login');steps.push('existing authenticated session revoked');
 await login(page,oldPassword);await expect(page.locator('[role=alert]')).toContainText('ไม่ถูกต้อง');await login(page,newPassword);await page.waitForURL(base+'/');await page.goto(base+'/courses/scale-lab/');await expect(page.locator('#progress')).toContainText('1 / 11');assert.deepEqual((await progress()).completed,before.completed);assert.deepEqual((await progress()).criteria,before.criteria);steps.push('old password denied/new accepted; qualification persisted');
 await reset.goto(link);await submit('replay-password-123');await expect(reset.locator('[role=alert]')).toContainText('ลิงก์ไม่ถูกต้อง');steps.push('one-time replay rejected');
 await requestMail();const expired=await mail(2);execFileSync(new URL('appworks/.venv/bin/python',root).pathname,['-c','import sqlite3,sys; db=sqlite3.connect(sys.argv[1]); db.execute("UPDATE password_resets SET expires=0"); db.commit()',info.database]);await reset.goto(expired);await submit('expiry-password-123');await expect(reset.locator('[role=alert]')).toContainText('หมดอายุ');steps.push('expired link from Graph double rejected');
 for(const width of [320,390]) {await reset.setViewportSize({width,height:844});await reset.goto(base+'/forgot-password');assert.ok(await reset.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await reset.screenshot({path:new URL(`forgot-${width}.png`,evidence).pathname});await reset.goto(base+'/reset-password#invalid');await submit('invalid-password-123');await expect(reset.locator('[role=alert]')).toContainText('ลิงก์ไม่ถูกต้อง');assert.ok(await reset.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await reset.screenshot({path:new URL(`reset-${width}.png`,evidence).pathname});}steps.push('invalid links and 320/390px mobile forms');
 assert.ok(paths.every(p=>!p.includes('#')&&!p.includes('token=')));assert.deepEqual(errors,[]);
 const boundary=JSON.parse(await readFile(new URL('graph-boundary.json',evidence)));assert.deepEqual(boundary,{tokenRequests:2,sendMailRequests:2,externalNetwork:false});
 const report={graphBoundary:boundary,providerDeliveryVerified:false,passed:true,base,steps,mailReceiptCount:2,mailArtifacts:'private QA directory; raw messages/links intentionally excluded',tokenTransport:'URL fragment scrubbed immediately; POST body only',browserErrors:errors};await writeFile(new URL('browser.json',evidence),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
