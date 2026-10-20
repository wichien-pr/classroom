// QA ONLY: compiled isolated assets, real OTP through launcher mail double; no provider calls.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {completeRegistration} from './complete-registration.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const {expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const root=new URL('../',import.meta.url),evidence=new URL('evidence/lab06/',root);
const info=JSON.parse(await readFile(new URL('server.json',evidence)));
assert.match(info.base,/^http:\/\/127\.0\.0\.1:\d+$/);assert.ok(!['8080','8081'].includes(new URL(info.base).port));
process.env.CLASSROOM_QA_MAIL_DIR=info.qa;
const manifest=JSON.parse(await readFile(new URL('courses/scale-lab/course.json',root)));
const definitions=Object.entries(manifest.participation).flatMap(([lesson,groups])=>Object.entries(groups).flatMap(([sim,actions])=>actions.map(action=>[lesson,sim,action].join('/'))));
const resume=process.argv.includes('--resume'),browser=await chromium.launch({channel:'chromium'});
const context=await browser.newContext(),page=await context.newPage(),errors=[],events=[];
await context.addInitScript(()=>{Math.random=()=>Number(sessionStorage.getItem('qa-random')||0);});
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.url().includes('/courses/scale-lab/assets/')&&r.status()>=400)errors.push('asset '+r.status());});
page.on('request',r=>{if(r.url().endsWith('/participation')&&r.method()==='POST')events.push(r.postDataJSON());});
const email='lab06@example.test',password='qa-only-lab06-password',otherEmail='lab06-other@example.test';
async function signup(p,mail){await p.goto(info.base+'/register');await p.locator('[name=name]').fill('Lab06 QA');await p.locator('[name=email]').fill(mail);await p.locator('[name=password]').fill(password);await p.getByRole('button',{name:'สมัครสมาชิก',exact:true}).click();await completeRegistration(p,mail);}
async function login(p=page,mail=email){await p.goto(info.base+'/login');await p.locator('[name=email]').fill(mail);await p.locator('[name=password]').fill(password);await p.locator('button').click();await p.waitForURL(info.base+'/');await p.goto(info.base+'/courses/scale-lab/');}
async function ready(){await expect(page.locator('#participation-status')).toContainText(/คะแนนที่บันทึก|ปุ่มนี้นับคะแนนแล้ว/);await expect(page.locator('#progress-status')).toContainText('บันทึกความคืบหน้าในบัญชีแล้ว');await expect(page.locator('[data-answer="0"]')).toBeEnabled();}
async function score(n){await expect(page.locator('#participation-score')).toHaveText(String(n));await ready();}
const progress=async()=> (await page.request.get(info.base+'/api/courses/scale-lab/progress')).json();
const nav=async kind=>{await page.locator(`[data-lesson="${manifest.lessons.indexOf(kind)+1}"]`).click();await ready();};
try{
 await page.goto(info.base+'/courses/scale-lab/');assert.equal(page.url(),info.base+'/login');
 if(!resume)await signup(page,email);await login();await nav('cache');
 await expect(page.locator('.lesson-heading .eyebrow')).toContainText('LAB 06');await expect(page.locator('[data-lesson]')).toHaveCount(11);
 let coverage=[];
 if(!resume){
  await score(0);await page.locator('#complete-lesson').click();await ready();assert.deepEqual((await progress()).completed,[]);
  let count=events.length;await page.locator('#invalidate').click();await page.locator('#price').fill('100');await page.locator('#update').click();assert.equal(events.length,count);
  await page.locator('#price').fill('0');await page.locator('#update').click();assert.equal(events.length,count);await page.locator('#price').fill('220');
  await page.locator('#read-cache').click();await score(1);await expect(page.locator('#outcome')).toContainText('MISS');
  await page.locator('#read-cache').click();await score(1);await expect(page.locator('#outcome')).toContainText('HIT');
  await page.locator('#update').click();await score(2);await page.locator('#read-cache').click();await score(2);await expect(page.locator('#outcome')).toContainText('STALE');
  await page.locator('#invalidate').click();await score(3);await page.locator('#read-cache').click();await score(3);await expect(page.locator('#outcome')).toContainText('220 / DB 220');
  await expect(page.locator('[data-answer]').first()).toHaveAttribute('data-answer','1');await page.locator('[data-answer="0"]').click();await score(4);await expect(page.locator('#feedback')).toContainText('ยังไม่ถูก');await expect(page.locator('#progress')).toContainText('1 / 11');
  await page.evaluate(()=>sessionStorage.setItem('qa-random','0.99'));await page.reload();await nav('cache');await score(4);await expect(page.locator('[data-answer]').first()).toHaveAttribute('data-answer','0');
  await page.locator('[data-answer="0"]').click();await score(4);await expect(page.locator('#participation-status')).toContainText('ปุ่มนี้นับคะแนนแล้ว');
  await page.locator('[data-answer="1"]').click();await score(5);
  // Every active durable definition really exercised through the compiled controls.
  let expected=5;
  for(const kind of manifest.lessons){if(kind==='cache')continue;await nav(kind);
   for(const action of manifest.participation[kind][kind]){await page.locator(`[data-action="${action}"]`).click();await score(++expected);}
   for(const choice of [0,1]){await page.locator(`[data-answer="${choice}"]`).click();await score(++expected);}
   assert.ok(!(await progress()).completed.includes(kind),'quiz never marks manual');await page.locator('#complete-lesson').click();await ready();assert.ok((await progress()).completed.includes(kind));
  }
  assert.equal(expected,definitions.length);
  coverage=[...new Set(events.map(e=>[e.lesson_id,e.simulation_id,e.action].join('/')))];assert.deepEqual(coverage.sort(),definitions.sort());
 }else{
  const prior=JSON.parse(await readFile(new URL('browser.json',evidence)));assert.notEqual(prior.serverPid,info.pid);
  // Re-exercise every definition on the restarted compiled build: no new awards.
  for(const kind of manifest.lessons){await nav(kind);
   for(const action of manifest.participation[kind][kind]){await page.locator(`[data-action="${action}"]`).click();await score(definitions.length);}
   for(const choice of [0,1]){await page.locator(`[data-answer="${choice}"]`).click();await score(definitions.length);}
  }
  coverage=[...new Set(events.map(e=>[e.lesson_id,e.simulation_id,e.action].join('/')))];assert.deepEqual(coverage.sort(),definitions.sort());
 }
 await score(definitions.length);await nav('cache');
 const before=await progress();assert.deepEqual(before.completed,manifest.lessons);assert.equal(before.total,11);assert.equal(before.criteria.session,undefined);assert.deepEqual(before.criteria.cache,{manual:true,simulation:true,thinking:true});
 let count=events.length;for(const id of ['cache-tick','cache-outage','cache-restart'])await page.locator('#'+id).click();assert.equal(events.length,count);
 await page.locator('#read-cache').click();await score(definitions.length);for(let i=0;i<3;i++)await page.locator('#cache-tick').click();await page.locator('#read-cache').click();await score(definitions.length);await expect(page.locator('#outcome')).toContainText('MISS');
 await page.locator('#cache-outage').click();await page.locator('#read-cache').click();await score(definitions.length);await expect(page.locator('#outcome')).toContainText('BYPASS');
 await page.locator('#cache-restart').click();await page.locator('#read-cache').click();await score(definitions.length);
 // Real committed request whose response is lost: retry must retain the payload and UUID.
 let dropped,retried;
 await page.route('**/api/courses/scale-lab/participation',async route=>{if(route.request().method()==='POST'&&!dropped){dropped=route.request().postDataJSON();await route.fetch();await route.abort();}else{if(route.request().method()==='POST')retried=route.request().postDataJSON();await route.continue();}});
 await page.locator('#read-cache').click();await expect(page.locator('#participation-status')).toContainText('บันทึกไม่ได้');await page.locator('#retry-participation').click();await score(definitions.length);assert.deepEqual(retried,dropped);await page.unroute('**/api/courses/scale-lab/participation');
 const snap=await (await page.request.get(info.base+'/api/courses/scale-lab/participation')).json();
 const duplicates=await Promise.all(Array.from({length:4},()=>page.request.post(info.base+'/api/courses/scale-lab/participation',{data:{lesson_id:'cache',simulation_id:'cache',action:'read-cache',event_id:crypto.randomUUID()},headers:{'X-CSRF-Token':snap.csrf_token}})));
 for(const response of duplicates){assert.equal(response.status(),200);const body=await response.json();assert.equal(body.awarded,false);assert.equal(body.score,definitions.length);}
 for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.doesNotMatch(await page.locator('body').innerText(),/Cache\.pdf|PDF|คู่มือต้นฉบับ|หน้า\s*\d/);
  await page.locator('#architecture').evaluate(el=>window.scrollTo(0,scrollY+el.getBoundingClientRect().top-150));await page.screenshot({path:new URL(`integrated-${width}.png`,evidence).pathname});
  await page.setViewportSize({width,height:2600});await page.locator('#architecture').evaluate(el=>window.scrollTo(0,scrollY+el.getBoundingClientRect().top-150));await page.locator('#architecture').screenshot({path:new URL(`diagram-${width}.png`,evidence).pathname});
  await page.locator('.cache-failure').evaluate(el=>window.scrollTo(0,scrollY+el.getBoundingClientRect().top-150));await page.locator('.cache-failure').screenshot({path:new URL(`failure-${width}.png`,evidence).pathname});
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:new URL(`full-${width}.png`,evidence).pathname,fullPage:true});
 }
 for(const path of ['Cache.pdf','assessment.json'])assert.equal((await page.request.get(info.base+'/courses/scale-lab/'+path)).status(),404);
 await page.getByRole('link',{name:'ออกจากคลาส · กลับหน้าแรก'}).click();await expect(page).toHaveURL(info.base+'/');await page.getByRole('button',{name:'ออกจากระบบ',exact:true}).click();await login();await nav('cache');await score(definitions.length);assert.deepEqual((await progress()).completed,before.completed);
 const other=await browser.newContext(),second=await other.newPage();if(!resume)await signup(second,otherEmail);await login(second,otherEmail);await expect(second.locator('#participation-score')).toHaveText('0');await expect(second.locator('#progress')).toContainText('0 / 11');await other.close();
 assert.deepEqual(errors,[]);
 const report={passed:true,resume,serverPid:info.pid,activeLessons:manifest.lessons.length,definitionCount:definitions.length,score:definitions.length,coverage,qualifiedLessons:before.completed,cacheNoOpsExcluded:true,quizSemanticDedupAcrossOppositeOrder:true,realLostResponseRetry:true,concurrentDedup:true,twoAccounts:true,viewports:[320,390,1440],noAttribution:true,errors,providerTraffic:false};
 await writeFile(new URL(resume?'restart.json':'browser.json',evidence),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
