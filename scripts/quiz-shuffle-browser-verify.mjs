// Real compiled QA only: genuine OTP signup + Flask/SQLite, no API interception.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {completeRegistration} from './complete-registration.mjs';
import {lessons} from '../courses/scale-lab/src/lessons.js';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const {expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const evidence=new URL('../evidence/quiz-shuffle/',import.meta.url);
const info=JSON.parse(await readFile(new URL('server.json',evidence)));
process.env.CLASSROOM_QA_MAIL_DIR=info.qa;
const manifest=JSON.parse(await readFile(new URL('../courses/scale-lab/course.json',import.meta.url)));
const browser=await chromium.launch({channel:'chromium'});
const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
await context.addInitScript(()=>{Math.random=()=>Number(sessionStorage.getItem('qa-random')||0);});
const errors=[],posts=[],assets=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('response',async r=>{
 if(r.url().includes('/assets/'))assets.push({url:new URL(r.url()).pathname,status:r.status()});
 if(r.request().method()==='POST' && r.url().endsWith('/participation'))posts.push({request:r.request().postDataJSON(),response:await r.json()});
});
const base=info.base,email=`shuffle-${Date.now()}@example.test`,password='shuffle QA password';
const snapshot=()=>page.request.get(base+'/api/courses/scale-lab/progress').then(r=>r.json());
const score=async n=>{await expect(page.locator('#participation-score')).toHaveText(String(n));await expect(page.locator('[data-answer="0"]')).toBeEnabled();};
const order=()=>page.locator('[data-answer]').evaluateAll(nodes=>nodes.map(n=>n.dataset.answer));
async function login(){await page.goto(base+'/login');await page.locator('[name=email]').fill(email);await page.locator('[name=password]').fill(password);await page.locator('button').click();await page.waitForURL(base+'/');await page.goto(base+'/courses/scale-lab/');}
try{
 await page.goto(base+'/register');await page.locator('[name=name]').fill('Shuffle QA');await page.locator('[name=email]').fill(email);await page.locator('[name=password]').fill(password);await page.locator('button').click();await completeRegistration(page,email);await login();
 await score(0);
 // Both rendered labels and source text must follow display order for every lesson.
 for(const lesson of lessons){
  assert.equal(lesson.answers.length,2);
  await page.locator(`[data-lesson="${lesson.id}"]`).click();
  assert.deepEqual(await order(),['1','0']);
  await expect(page.locator('[data-answer] span')).toHaveText(['A','B']);
  for(const choice of [0,1])await expect(page.locator(`[data-answer="${choice}"]`)).toContainText(lesson.answers[choice]);
 }
 await page.locator('[data-lesson="1"]').click();
 await page.locator('[data-answer="1"]').click();await score(1);
 await expect(page.locator('#feedback')).toHaveText('ถูกต้อง — '+lessons[0].why);
 assert.equal((await snapshot()).criteria.flow.manual,false);
 await page.locator('#step').click();await score(2);
 assert.equal((await snapshot()).completed_count,0); // correct thinking + simulation is NOT manual.
 await page.evaluate(()=>{Math.random=()=>0.99;});
 await page.locator('[data-lesson="2"]').click();await page.locator('[data-lesson="1"]').click();await page.locator('#reset').click();
 assert.deepEqual(await order(),['1','0']);await expect(page.locator('[data-answer="1"]')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#feedback')).toHaveText('ถูกต้อง — '+lessons[0].why);
 await page.locator('.quiz').scrollIntoViewIfNeeded();await page.screenshot({path:new URL('correct-at-A.png',evidence).pathname});
 await page.evaluate(()=>sessionStorage.setItem('qa-random','0.99'));await page.reload();await score(2);
 assert.deepEqual(await order(),['0','1']);
 await expect(page.locator('[data-answer] span')).toHaveText(['A','B']);
 await expect(page.locator('[data-answer="1"]')).toHaveAttribute('aria-pressed','false');
 await page.locator('[data-answer="1"]').click();await score(2);
 await expect(page.locator('#participation-status')).toContainText('กดซ้ำไม่เพิ่มคะแนน');
 await expect(page.locator('#feedback')).toHaveText('ถูกต้อง — '+lessons[0].why);
 await page.locator('.quiz').scrollIntoViewIfNeeded();await page.screenshot({path:new URL('correct-at-B.png',evidence).pathname});
 await page.locator('[data-answer="0"]').click();await score(3);
 await expect(page.locator('#feedback')).toHaveText('ยังไม่ถูก — '+lessons[0].why);
 await page.locator('[data-answer="0"]').click();await score(3);
 assert.equal((await snapshot()).completed_count,0);
 await page.locator('#complete-lesson').click();await expect(page.locator('#progress')).toContainText('1 / 12');
 // Other eleven lessons: wrong choices qualify with manual + main simulation.
 for(let i=1;i<lessons.length;i++){
  const l=lessons[i];await page.locator(`[data-lesson="${l.id}"]`).click();
  assert.deepEqual(await order(),['0','1']);
  await page.locator('#complete-lesson').click();await expect(page.locator('#complete-lesson')).toHaveText('✓ กดเรียนจบแล้ว');
  await page.locator(`[data-action="${manifest.participation[l.kind][l.kind][0]}"]`).click();
  await page.locator('[data-answer="0"]').click();await expect(page.locator('#feedback')).toHaveText('ยังไม่ถูก — '+l.why);
  await expect(page.locator('#progress')).toContainText(`${i+1} / 12`);
 }
 await score(25);
 await page.goto(base+'/');await page.locator('form[action="/logout"] button').click();await login();await score(25);await expect(page.locator('#progress')).toContainText('12 / 12');
 await page.locator('[data-answer="1"]').click();await score(25);
 await page.locator('[data-answer="0"]').click();await score(25);
 for(const width of [320,390]){await page.setViewportSize({width,height:844});await page.locator('.quiz').scrollIntoViewIfNeeded();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:new URL(`mobile-${width}.png`,evidence).pathname});}
 const flow=posts.filter(p=>p.request.lesson_id==='flow'&&p.request.simulation_id==='check-your-thinking');
 assert.deepEqual(flow.map(p=>[p.request.action,p.response.awarded]),[
 ['quiz-answer-b',true],['quiz-answer-b',false],['quiz-answer-a',true],['quiz-answer-a',false],['quiz-answer-b',false],['quiz-answer-a',false]]);
 assert.equal(new Set(flow.map(p=>p.request.event_id)).size,flow.length);
 assert.ok(assets.length>0);assert.ok(assets.every(a=>a.status===200));assert.deepEqual(errors,[]);
 const report={passed:true,base,serverPid:info.pid,completed:(await snapshot()).completed_count,score:25,lessonsVerified:lessons.length,permutations:[['1','0'],['0','1']],flowAwards:flow.map(p=>({action:p.request.action,awarded:p.response.awarded})),errors,assets};
 await writeFile(new URL('browser.json',evidence),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
