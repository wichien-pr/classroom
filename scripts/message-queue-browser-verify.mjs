// Isolated QA only: real OTP + compiled course + Flask/SQLite. No production endpoints.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {completeRegistration} from './complete-registration.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const {expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const evidence=new URL('../evidence/lab10/integrated/',import.meta.url);
const info=JSON.parse(await readFile(new URL('server.json',evidence)));
assert.equal(info.base,'http://127.0.0.1:8150');assert.match(info.qa,/classroom-registration-/);
process.env.CLASSROOM_QA_MAIL_DIR=info.qa;
const resume=process.argv.includes('--resume'),base=info.base;
const browser=await chromium.launch({channel:'chromium'});
const results=[],errors=[],assets=[];
try{
 for(const suffix of ['a','b']){
  const context=await browser.newContext({viewport:{width:390,height:1000}}),page=await context.newPage();
  await context.addInitScript(()=>{Math.random=()=>Number(sessionStorage.getItem('qa-random')||0);});
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.url().includes('/assets/'))assets.push(r.status());});
  const email=`message-queue-${suffix}@example.test`,password='lab10 isolated QA password';
  if(!resume){
   await page.goto(base+'/register');await page.locator('[name=name]').fill('Message queue QA '+suffix);await page.locator('[name=email]').fill(email);await page.locator('[name=password]').fill(password);await page.locator('button').click();await completeRegistration(page,email);
  }
  await page.goto(base+'/login');await page.locator('[name=email]').fill(email);await page.locator('[name=password]').fill(password);await page.locator('button').click();await page.waitForURL(base+'/');
  await page.goto(base+'/courses/scale-lab/');
  const score=async n=>{await expect(page.locator('#participation-score')).toHaveText(String(n));await expect(page.locator('[data-answer="0"]')).toBeEnabled();};
  const progress=()=>page.request.get(base+'/api/courses/scale-lab/progress').then(r=>r.json());
  await score(resume?4:0);await page.locator('[data-lesson="10"]').click();
  if(!resume){
   assert.equal((await progress()).criteria['message-queue'].manual,false);
   await page.locator('#process-jobs').click();await score(0);
   await page.locator('#mq-consumer').uncheck();await page.locator('#enqueue-jobs').click();await score(1);
   await page.locator('#process-jobs').click();await score(1);
   await page.locator('#enqueue-jobs').click();await score(1);await expect(page.locator('#participation-status')).toContainText('กดซ้ำไม่เพิ่มคะแนน');
   await page.locator('#mq-producer').uncheck();await page.locator('#enqueue-jobs').click();await score(1);
   await page.locator('#mq-consumer').check();await page.locator('#process-jobs').click();await score(2);
   await expect(page.locator('#mq-backlog')).toHaveText('5');
   await page.locator('[data-answer="0"]').click();await score(3);assert.deepEqual((await progress()).completed,[]);
   await page.locator('#complete-lesson').click();await expect(page.locator('#progress')).toContainText('1 / 11');
   await page.locator('[data-answer="1"]').click();await score(4);
   await page.evaluate(()=>sessionStorage.setItem('qa-random','0.99'));await page.reload();await score(4);await page.locator('[data-lesson="10"]').click();
   assert.deepEqual(await page.locator('[data-answer]').evaluateAll(es=>es.map(e=>e.dataset.answer)),['0','1']);
   for(const choice of [0,1]){await page.locator(`[data-answer="${choice}"]`).click();await score(4);}
  }
  await page.locator('#enqueue-jobs').click();await score(4);
  await page.locator('#reset').click();
  let posts=0;const onRequest=r=>{if(r.method()==='POST'&&r.url().endsWith('/participation'))posts++;};page.on('request',onRequest);
  await page.locator('#process-jobs').click();await score(4);assert.equal(posts,0);
  for(let i=0;i<10;i++){await page.locator('#enqueue-jobs').click();await score(4);}
  await expect(page.locator('#mq-backlog')).toHaveText('30');const before=posts;
  await page.locator('#enqueue-jobs').click();await score(4);assert.equal(posts,before);
  await page.locator('#mq-workers').selectOption('4');await page.locator('#process-jobs').click();await score(4);await expect(page.locator('#mq-backlog')).toHaveText('26');
  page.off('request',onRequest);
  await page.locator('#reset').click();await score(4);await expect(page.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');
  const p=await progress();assert.deepEqual(p.completed,['message-queue']);assert.equal(p.total,11);assert.equal(p.criteria.region,undefined);
  await page.locator('[data-lesson="9"]').click();await expect(page.locator('h1')).toContainText('Data centers');await page.locator('[data-lesson="10"]').click();
  if(suffix==='a')for(const width of [320,390,1440]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:new URL(`compiled-${width}.png`,evidence).pathname,fullPage:true});}
  results.push({account:suffix,score:4,completed:p.completed,criteria:p.criteria['message-queue']});
  await context.close();
 }
 assert.deepEqual(errors,[]);assert.ok(assets.length);assert.ok(assets.every(s=>s===200));
 const report={passed:true,restarted:resume,base,serverPid:info.pid,results,errors,assetResponses:assets.length};
 await writeFile(new URL(resume?'restart.json':'browser.json',evidence),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
