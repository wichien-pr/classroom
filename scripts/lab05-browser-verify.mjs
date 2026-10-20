// QA ONLY: compiled build, real Flask and local Graph mail double, never production.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {completeRegistration} from './complete-registration.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const {expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const evidence=new URL('../evidence/lab05/',import.meta.url);
const info=JSON.parse(await readFile(new URL('server.json',evidence)));
assert.equal(info.base,'http://127.0.0.1:8126');
process.env.CLASSROOM_QA_MAIL_DIR=info.qa;
const browser=await chromium.launch({channel:'chromium'}),context=await browser.newContext(),page=await context.newPage();
const email='lab05@example.test',password='qa-only-lab05-password',errors=[],posts=[];
await context.addInitScript(()=>{Math.random=()=>Number(sessionStorage.getItem('qa-random')||0);});
page.on('pageerror',e=>errors.push(e.message));
page.on('response',res=>{if(res.url().includes('/courses/scale-lab/assets/')&&res.status()>=400)errors.push('asset '+res.status());});
page.on('request',req=>{if(req.url().endsWith('/participation')&&req.method()==='POST')posts.push(req.postDataJSON());});
const resume=process.argv.includes('--resume');
async function login(p=page,mail=email){await p.goto(info.base+'/login');await p.locator('[name=email]').fill(mail);await p.locator('[name=password]').fill(password);await p.locator('button').click();await p.waitForURL(info.base+'/');}
async function signup(p,mail){await p.goto(info.base+'/register');await p.locator('[name=name]').fill('Lab05 QA');await p.locator('[name=email]').fill(mail);await p.locator('[name=password]').fill(password);await p.getByRole('button',{name:'สมัครสมาชิก',exact:true}).click();await completeRegistration(p,mail);}
async function score(n){await expect(page.locator('#participation-score')).toHaveText(String(n));await expect(page.locator('#write')).toBeEnabled();}
async function snapshot(){return (await page.request.get(info.base+'/api/courses/scale-lab/progress')).json();}
try {
 await page.goto(info.base+'/courses/scale-lab/');assert.equal(page.url(),info.base+'/login');
 if(!resume)await signup(page,email);
 await login();await page.goto(info.base+'/courses/scale-lab/');await page.locator('[data-lesson="5"]').click();
 await expect(page.locator('h1')).toContainText('Database replication');
 await expect(page.locator('.lesson-heading .eyebrow')).toContainText('LAB 05');
 if(!resume){
  await score(0);const n=posts.length;await page.locator('#sync').click();assert.equal(posts.length,n);await score(0);
  await page.locator('#write').click();await score(1);await page.locator('#write').click();await expect(page.locator('#participation-status')).toContainText('ปุ่มนี้นับคะแนนแล้ว');await score(1);
  await page.locator('#read-replica').click();await score(2);await expect(page.locator('#outcome')).toContainText('STALE');
  await page.locator('#read-primary').click();await score(3);await expect(page.locator('#outcome')).toContainText('version 2');
  await page.locator('#sync').click();await score(4);const count=posts.length;await page.locator('#sync').click();assert.equal(posts.length,count);
  await expect(page.locator('[data-answer]').first()).toHaveAttribute('data-answer','1');
  await page.locator('[data-answer="0"]').click();await score(5);await expect(page.locator('#feedback')).toContainText('ยังไม่ถูก');
  await expect(page.locator('#progress')).toContainText('0 / 11');await page.locator('#complete-lesson').click();await expect(page.locator('#progress')).toContainText('1 / 11');
  await page.evaluate(()=>sessionStorage.setItem('qa-random','0.99'));await page.reload();await page.locator('[data-lesson="5"]').click();await score(5);
  await expect(page.locator('[data-answer]').first()).toHaveAttribute('data-answer','0');await page.locator('[data-answer="0"]').click();await expect(page.locator('#participation-status')).toContainText('ปุ่มนี้นับคะแนนแล้ว');await score(5);
  await page.locator('[data-answer="1"]').click();await score(6);await expect(page.locator('#feedback')).toContainText('ถูกต้อง');
  await page.locator('[data-lesson="6"]').click();await expect(page.locator('h1')).toContainText('Cache');
  await page.locator('#read-cache').click();await expect(page.locator('#participation-score')).toHaveText('7');
  await page.locator('[data-answer="0"]').click();await expect(page.locator('#participation-score')).toHaveText('8');
  await page.locator('#complete-lesson').click();await expect(page.locator('#progress')).toContainText('2 / 11');
  await page.locator('[data-lesson="5"]').click();await score(8);
 }else{
  const prior=JSON.parse(await readFile(new URL('browser.json',evidence)));assert.notEqual(prior.serverPid,info.pid);
  await score(8);
 }
 const result=await snapshot();assert.deepEqual(result.completed,['replica','cache']);
 for(const k of ['replica','cache'])assert.deepEqual(result.criteria[k],{manual:true,simulation:true,thinking:true});
 await page.reload();await page.locator('[data-lesson="5"]').click();await score(8);await expect(page.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');
 // Real outage routing and a guarded, explicitly lossy promotion.
 await page.locator('#write').click();await score(8);await page.locator('#db-up-1').uncheck();await page.locator('#read-replica').click();await score(8);await expect(page.locator('#outcome')).toContainText('Replica 2');
 await page.locator('#db-up-2').uncheck();await page.locator('#read-replica').click();await score(8);await expect(page.locator('#outcome')).toContainText('fallback');
 await page.locator('#db-up-0').uncheck();await page.locator('#write').click();await score(8);await expect(page.locator('#outcome')).toContainText('503');
 await page.locator('#db-up-1').check();const count=posts.length;await page.locator('#promote').click();await expect(page.locator('#outcome')).toContainText('ยัง promote ไม่ได้');
 await page.locator('#fenced').check();await page.locator('#accept-loss').check();await page.locator('#promote').click();await expect(page.locator('#outcome')).toContainText('สูญเสีย 1');assert.equal(posts.length,count);
 await expect(page.locator('#db-up-0')).toBeDisabled();await page.locator('#write').click();await score(8);await expect(page.locator('#outcome')).toContainText('Replica 1');
 await page.locator('#reset').click();await expect(page.locator('[data-db="0"]')).toContainText('version 0');
 for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('#architecture').evaluate(el=>window.scrollTo(0,window.scrollY+el.getBoundingClientRect().top-150));
  await page.screenshot({path:new URL(`integrated-${width}.png`,evidence).pathname});
  // A tall viewport keeps the full original diagram clear of sticky navigation.
  await page.setViewportSize({width,height:2600});await page.locator('#architecture').evaluate(el=>window.scrollTo(0,window.scrollY+el.getBoundingClientRect().top-150));
  await page.locator('#architecture').screenshot({path:new URL(`diagram-${width}.png`,evidence).pathname});
  await page.locator('.replication-fanout').evaluate(el=>window.scrollTo(0,window.scrollY+el.getBoundingClientRect().top-150));
  await page.locator('.replication-fanout').screenshot({path:new URL(`fanout-${width}.png`,evidence).pathname});
  await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:new URL(`full-${width}.png`,evidence).pathname,fullPage:true});
 }
 for(const path of ['/courses/scale-lab/assessment.json','/courses/scale-lab/Database-Replication.pdf'])assert.equal((await page.request.get(info.base+path)).status(),404);
 await page.getByRole('link',{name:'ออกจากคลาส · กลับหน้าแรก'}).click();await expect(page).toHaveURL(info.base+'/');
 await page.getByRole('button',{name:'ออกจากระบบ',exact:true}).click();await login();await page.goto(info.base+'/courses/scale-lab/');await page.locator('[data-lesson="5"]').click();await score(8);await expect(page.locator('#progress')).toContainText('2 / 11');
 await page.locator('#write').click();await expect(page.locator('#participation-status')).toContainText('ปุ่มนี้นับคะแนนแล้ว');await score(8);
 const other=await browser.newContext(),second=await other.newPage();if(!resume)await signup(second,'lab05-other@example.test');await login(second,'lab05-other@example.test');await second.goto(info.base+'/courses/scale-lab/');await expect(second.locator('#participation-score')).toHaveText('0');await expect(second.locator('#progress')).toContainText('0 / 11');await other.close();
 assert.deepEqual(errors,[]);
 const report={passed:true,resume,serverPid:info.pid,score:8,qualifiedLessons:result.completed,noOpSyncAndPromotionExcluded:true,quizSemanticDedupAcrossOppositeOrder:true,twoAccounts:true,errors,viewports:[320,390,1440],providerTraffic:false};
 await writeFile(new URL(resume?'restart.json':'browser.json',evidence),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
