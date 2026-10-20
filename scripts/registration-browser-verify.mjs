import assert from 'node:assert/strict';
import {readFile,writeFile,unlink} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const {expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const root=new URL('../',import.meta.url),evidence=new URL('evidence/registration/',root);
const info=JSON.parse(await readFile(new URL('server.json',evidence))),base=info.base;
const browser=await chromium.launch({channel:'chromium'}),owner=await browser.newContext(),other=await browser.newContext();
const page=await owner.newPage(),second=await other.newPage(),steps=[],errors=[],urls=[];
for(const p of [page,second]){p.on('pageerror',()=>errors.push('pageerror'));p.on('request',r=>urls.push(r.url()));}
const password='browser-password-123',email='browser@example.test';
function sql(statement){return JSON.parse(execFileSync(new URL('appworks/.venv/bin/python',root).pathname,['-c','import sqlite3,sys,json; db=sqlite3.connect(sys.argv[1]); result=db.execute(sys.argv[2]).fetchall(); db.commit(); print(json.dumps(result))',info.database,statement],{encoding:'utf8'}));}
async function mail(n,to){let data;await expect.poll(async()=>{try{data=JSON.parse(await readFile(info.qa+`/mail-${n}.json`));return true}catch{return false}}).toBe(true);assert.equal(data.to,to);return data;}
async function register(p,to){await p.goto(base+'/register');await p.locator('[name=name]').fill('OTP browser QA');await p.locator('[name=email]').fill(to);await p.locator('[name=password]').fill(password);await p.getByRole('button',{name:'สมัครสมาชิก',exact:true}).click();}
async function verify(p,code){await p.locator('#code').fill(code);await p.getByRole('button',{name:'ยืนยันอีเมล',exact:true}).click();}
async function login(p,to=email,pw=password){await p.goto(base+'/login');await p.locator('[name=email]').fill(to);await p.locator('[name=password]').fill(pw);await p.locator('button').click();}
async function progress(){return page.request.get(base+'/api/courses/scale-lab/progress').then(r=>r.json());}
try{
 await register(page,email);await page.waitForURL('**/register/verify');const first=(await mail(1,email)).code;
 assert.match(first,/^[0-9]{6}$/);assert.equal(sql("SELECT count(*) FROM users WHERE email='browser@example.test'")[0][0],0);
 let response=await page.reload();assert.equal(response.headers()['cache-control'],'no-store');assert.equal(response.headers()['referrer-policy'],'no-referrer');await expect(page.locator('#resend')).toBeDisabled();steps.push('six-digit Graph HTTP receipt, reload/privacy/cooldown and no pending user row');
 await login(second);await expect(second.locator('[role=alert]')).toBeVisible();await second.goto(base+'/forgot-password');await second.locator('[name=email]').fill(email);await second.locator('button').click();await expect(second.locator('[role=status]')).toBeVisible();assert.equal(sql('SELECT count(*) FROM password_resets')[0][0],0);steps.push('pending login and password-reset bypass denied');
 await page.locator('#code').fill('12');await page.getByRole('button',{name:'ยืนยันอีเมล',exact:true}).click();assert.ok(await page.locator('#code').evaluate(el=>!el.validity.valid));
 await verify(page,first==='000000'?'111111':'000000');await expect(page.locator('[role=alert]')).toBeVisible();
 sql('UPDATE pending_registrations SET expires=0');await verify(page,first);await expect(page.locator('[role=alert]')).toContainText('หมดอายุ');steps.push('browser malformed/wrong/expired code rejected');
 sql('UPDATE pending_registrations SET sent_at=sent_at-61');await page.reload();await page.locator('#resend').click();await page.waitForURL('**/register/verify');const fresh=(await mail(2,email)).code;
 await verify(page,first);await expect(page.locator('[role=alert]')).toBeVisible();
 for(const width of [320,390]){await page.setViewportSize({width,height:844});await page.locator('#code').fill('');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:new URL(`verify-${width}.png`,evidence).pathname});}steps.push('resend invalidates previous code; mobile 320/390px verification/error layout');
 const form=await page.locator('form[action="/register/verify"]').evaluate(el=>Object.fromEntries(new FormData(el)));form.code=fresh;
 const concurrent=await Promise.all([page.request.post(base+'/register/verify',{form,maxRedirects:0}),page.request.post(base+'/register/verify',{form,maxRedirects:0})]);assert.equal(concurrent.filter(r=>r.headers().location==='/login').length,1);assert.equal(sql("SELECT count(*) FROM users WHERE email='browser@example.test'")[0][0],1);
 await page.goto(base+'/');await expect(page).toHaveURL(base+'/login');await login(page);await page.waitForURL(base+'/');steps.push('concurrent one-time verification creates exactly one account; explicit login required');
 await page.goto(base+'/courses/scale-lab/');await page.locator('#complete-lesson').click();await page.locator('[data-action=step]').click();await page.locator('[data-answer="0"]').click();await expect(page.locator('#progress')).toContainText('1 / 11');const before=await progress();steps.push('verified member enters isolated compiled course and qualifies a lesson');
 await second.goto(base+'/forgot-password');await second.locator('[name=email]').fill(email);await second.locator('button').click();await expect(second.locator('[role=status]')).toBeVisible();const reset=(await mail(3,email)).link;
 await second.goto(reset);await second.locator('[name=password]').fill('reset-password-456');await second.locator('[name=confirmation]').fill('reset-password-456');await second.locator('button').click();await expect(second.locator('[role=status]')).toContainText('สำเร็จ');await page.goto(base+'/');await expect(page).toHaveURL(base+'/login');
 await login(page,email,'reset-password-456');await page.waitForURL(base+'/');assert.deepEqual((await progress()).completed,before.completed);assert.deepEqual((await progress()).criteria,before.criteria);await page.goto(base+'/account/profile');await expect(page.locator('body')).toContainText('OTP browser QA');await page.goto(base+'/community');assert.equal(new URL(page.url()).pathname,'/community');steps.push('existing Graph reset/session revocation/profile/community and qualification preserved');
 await login(second,'legacy@example.test','legacy-password-123');await second.waitForURL(base+'/');assert.equal(sql("SELECT email_verified_at FROM users WHERE email='legacy@example.test'")[0][0],null);steps.push('pre-feature legacy account logs in with NULL historical verification timestamp');
 const guest=await browser.newContext(),pending=await guest.newPage();await register(pending,'second@example.test');await pending.waitForURL('**/register/verify');const secondCode=(await mail(4,'second@example.test')).code;
 await verify(pending,fresh);await expect(pending.locator('[role=alert]')).toBeVisible();for(let n=0;n<4;n++){await verify(pending,secondCode==='000000'?'111111':'000000');await expect(pending.locator('[role=alert]')).toBeVisible();}await verify(pending,secondCode);await expect(pending.locator('[role=alert]')).toBeVisible();assert.equal(sql("SELECT count(*) FROM users WHERE email='second@example.test'")[0][0],0);steps.push('other-browser code denied; five wrong attempts invalidate correct code');
 await pending.getByRole('button',{name:'แก้ไขอีเมล / เริ่มใหม่'}).click();await pending.waitForURL('**/register');
 await writeFile(info.qa+'/reject-mail','1');try{await register(pending,'failure@example.test');await expect(pending.locator('[role=alert]')).toContainText('ส่งอีเมลไม่สำเร็จ');}finally{await unlink(info.qa+'/reject-mail');}assert.equal(sql("SELECT count(*) FROM pending_registrations WHERE email='failure@example.test'")[0][0],0);steps.push('actual HTTP Graph failure has no false delivery success or valid pending code');
 for(const width of [320,390]){await pending.setViewportSize({width,height:844});await pending.goto(base+'/register');assert.ok(await pending.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await pending.screenshot({path:new URL(`register-${width}.png`,evidence).pathname});}steps.push('mobile registration 320/390px with no horizontal overflow');
 await register(pending,'restart@example.test');await pending.waitForURL('**/register/verify');await mail(5,'restart@example.test');await guest.storageState({path:info.qa+'/restart-state.json'});steps.push('pending browser state saved privately for real process restart');
 assert.ok(urls.every(u=>!/[?&](code|token|challenge)=/.test(u)));assert.deepEqual(errors,[]);
 const boundary=JSON.parse(await readFile(new URL('graph-boundary.json',evidence)));assert.equal(boundary.sendMailRequests,5);assert.equal(boundary.rejectedRequests,1);assert.equal(boundary.externalNetwork,false);
 const report={passed:true,base,steps,checks:steps.length,graphBoundary:boundary,browserErrors:errors,providerDeliveryVerified:false,privateMailArtifacts:'isolated temporary directory only'};await writeFile(new URL('browser.json',evidence),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close()}
