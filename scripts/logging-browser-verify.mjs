// QA-only browser journey; refuses production URLs and uses actual local-double OTP.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {completeRegistration} from './complete-registration.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH=process.env.CLASSROOM_BROWSER_CACHE||new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const {expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const evidence=new URL('../evidence/lab11/integrated/',import.meta.url);
const info=JSON.parse(await readFile(new URL('server.json',evidence)));
assert.equal(info.base,'http://127.0.0.1:8151');assert.match(info.qa,/classroom-registration-/);
process.env.CLASSROOM_QA_MAIL_DIR=info.qa;
const resume=process.argv.includes('--resume'),browser=await chromium.launch({channel:'chromium'}),results=[],errors=[];
try{
 for(const suffix of ['a','b']){
  const ctx=await browser.newContext({viewport:{width:390,height:1100}}),page=await ctx.newPage();
  await ctx.addInitScript(()=>{Math.random=()=>Number(sessionStorage.getItem('qa-random')||0);});
  page.on('pageerror',e=>errors.push(e.message));
  const email=`logging-${suffix}@example.test`,password='lab11 isolated QA password';
  if(!resume){await page.goto(info.base+'/register');await page.locator('[name=name]').fill('Logging QA '+suffix);await page.locator('[name=email]').fill(email);await page.locator('[name=password]').fill(password);await page.locator('button').click();await completeRegistration(page,email);}
  await page.goto(info.base+'/login');await page.locator('[name=email]').fill(email);await page.locator('[name=password]').fill(password);await page.locator('button').click();await page.waitForURL(info.base+'/');
  const assets=[];page.on('response',r=>{if(r.url().includes('/assets/'))assets.push(r.status());});
  await page.goto(info.base+'/courses/scale-lab/');
  const score=async n=>{await expect(page.locator('#participation-score')).toHaveText(String(n));await expect(page.locator('[data-answer="0"]')).toBeEnabled();};
  const progress=()=>page.request.get(info.base+'/api/courses/scale-lab/progress').then(r=>r.json());
  await score(resume?5:0);await page.locator('[data-lesson="11"]').click();
  if(!resume){
   assert.deepEqual((await progress()).criteria['logging-operations'],{manual:false,simulation:false,thinking:false});
   await page.locator('#inspect-logs').click();await score(1);await expect(page.locator('#logging-results')).toContainText('ไม่พบ');
   await page.locator('#log-scope').selectOption('all');await page.locator('#inspect-logs').click();await score(1);await expect(page.locator('#logging-results')).toContainText('DB_TIMEOUT');
   await page.locator('#inspect-metrics').click();await score(2);
   await page.locator('#run-pipeline').click();await score(3);await page.locator('#run-pipeline').click();await score(3);
   await expect(page.locator('#pipeline-status')).toContainText('Tests ไม่ผ่าน');
   let posts=0;const count=r=>{if(r.method()==='POST'&&r.url().endsWith('/participation'))posts++;};page.on('request',count);
   await page.locator('#run-pipeline').click();await score(3);assert.equal(posts,0);page.off('request',count);
   await page.locator('[data-answer="0"]').click();await score(4);assert.deepEqual((await progress()).completed,[]);
   await page.locator('#complete-lesson').click();await expect(page.locator('#progress')).toContainText('1 / 11');
   await page.locator('[data-answer="1"]').click();await score(5);
   await page.evaluate(()=>sessionStorage.setItem('qa-random','0.99'));await page.reload();await score(5);await page.locator('[data-lesson="11"]').click();
   assert.deepEqual(await page.locator('[data-answer]').evaluateAll(es=>es.map(e=>e.dataset.answer)),['0','1']);
  }
  for(const a of [0,1]){await page.locator(`[data-answer="${a}"]`).click();await score(5);}
  for(const action of ['inspect-logs','inspect-metrics']){await page.locator('#'+action).click();await score(5);}
  await page.locator('#code-version').selectOption('fixed');
  for(let i=0;i<3;i++){await page.locator('#run-pipeline').click();await score(5);}
  await expect(page.locator('#pipeline-status')).toHaveText('Deploy จำลองแล้ว');
  let terminalPosts=0;page.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith('/participation'))terminalPosts++;});
  await page.locator('#run-pipeline').click();await score(5);assert.equal(terminalPosts,0);
  const p=await progress();assert.deepEqual(p.completed,['logging-operations']);assert.equal(p.total,11);assert.equal(p.criteria.shard,undefined);
  await page.locator('#reset').click();await expect(page.locator('#pipeline-status')).toHaveText('รอ Build');await expect(page.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');
  if(suffix==='a')for(const width of [320,390,1440]){await page.setViewportSize({width,height:1100});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:new URL(`compiled-${width}.png`,evidence).pathname,fullPage:true});}
  assert.ok(assets.length);assert.ok(assets.every(s=>s===200));
  results.push({account:suffix,score:5,completed:p.completed,criteria:p.criteria['logging-operations'],terminalPosts,assetResponses:assets.length});await ctx.close();
 }
 assert.deepEqual(errors,[]);const report={passed:true,restarted:resume,base:info.base,pid:info.pid,results,errors};
 await writeFile(new URL(resume?'restart.json':'browser.json',evidence),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
