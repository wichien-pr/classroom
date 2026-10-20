import assert from 'node:assert/strict';
import {completeRegistration} from './complete-registration.mjs';
import {readFile,writeFile} from 'node:fs/promises';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const {expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const root=new URL('../',import.meta.url), evidence=new URL(process.env.PARTICIPATION_QA_EVIDENCE || 'evidence/',root);
const info=JSON.parse(await readFile(new URL('participation-qa-server.json',evidence)));
process.env.CLASSROOM_QA_MAIL_DIR ||= info.qa;
const base=info.base, endpoint=base+'/api/courses/scale-lab/participation';
const browser=await chromium.launch({channel:'chromium'});
const errors=[],api=[],coverage=[];
const report={base,passed:false,errors,api,coverage};
const snapshot=page=>page.request.get(endpoint).then(r=>r.json());
try{
 if(process.argv.includes('--restart')){
   const previous=JSON.parse(await readFile(new URL('participation-browser.json',evidence)));
   assert.notEqual(previous.serverPid,info.pid,'Must really restart server process');
   for(const [account,expected] of Object.entries(previous.accountScores)){
     const context=await browser.newContext({storageState:new URL(`participation-${account}-session.json`,evidence).pathname});
     const page=await context.newPage();await page.goto(base+'/courses/scale-lab/');
     await expect(page.locator('#participation-score')).toHaveText(String(expected));
     assert.equal((await snapshot(page)).score,expected);
     if(account==='a'){await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(200);await page.screenshot({path:new URL('participation-desktop.png',evidence).pathname});}
     await context.close();
   }
   const result={passed:true,oldPid:previous.serverPid,newPid:info.pid,accountScores:previous.accountScores};
   await writeFile(new URL('participation-restart.json',evidence),JSON.stringify(result,null,2));
   console.log(JSON.stringify(result));
 }else{
   const context=await browser.newContext({viewport:{width:1440,height:1000}});
   const page=await context.newPage();
   page.on('pageerror',e=>errors.push(String(e)));
   page.on('response',r=>{if(r.url().includes('/api/'))api.push({method:r.request().method(),path:new URL(r.url()).pathname,status:r.status()});});
   const stamp=Date.now(),password='participation QA password';
   async function register(label){
     await page.goto(base+'/register');await page.locator('[name=name]').fill('Participation QA '+label);
     await page.locator('[name=email]').fill(`participation-${label}-${stamp}@example.test`);await page.locator('[name=password]').fill(password);
     await page.locator('button').click();await completeRegistration(page,`participation-${label}-${stamp}@example.test`);
     await page.locator('[name=email]').fill(`participation-${label}-${stamp}@example.test`);await page.locator('[name=password]').fill(password);
     await page.locator('button').click();await page.waitForURL(base+'/');
     assert.equal(await page.locator('a[href="/community"]').count(),0);
     await page.goto(base+'/courses/scale-lab/');await expect(page.locator('#participation-score')).toHaveText('0');
   }
   await register('a');
   await page.locator('#reset').click();await page.locator('[data-lesson="2"]').click();
   assert.equal((await snapshot(page)).score,0);
   const manifest=JSON.parse(await readFile(new URL('courses/scale-lab/course.json',root)));
   let score=0; const deliberateEvents=[];
   page.on('request',r=>{if(r.url()===endpoint && r.method()==='POST') deliberateEvents.push(r.postDataJSON());});
   for(const [index,lesson] of manifest.lessons.entries()){
     // Only first distinct button awards points.
     await page.locator(`[data-lesson="${index+1}"]`).click();
     for(const action of manifest.participation[lesson][lesson]){
       await page.locator(`[data-action="${action}"]`).click();score++;
       await expect(page.locator('#participation-score')).toHaveText(String(score));
       coverage.push({lesson,simulation:lesson,action,score});
     }
     const seenChoices=new Set();
     for(const choice of [0,0,1,1,0]){
       await page.locator(`[data-answer="${choice}"]`).click();if(!seenChoices.has(choice)){score++;seenChoices.add(choice);}
       await expect(page.locator('#participation-score')).toHaveText(String(score));
       await expect(page.locator(`[data-answer="${choice}"]`)).toHaveAttribute('aria-pressed','true');
       await expect(page.locator('#feedback')).toContainText(choice===1?'ถูกต้อง':'ยังไม่ถูก');
       coverage.push({lesson,simulation:'check-your-thinking',action:choice===0?'quiz-answer-a':'quiz-answer-b',choice,score});
       await expect(page.locator('#complete-lesson')).toHaveText('ทำเครื่องหมายว่าเรียนจบ');
     }
   }
   const expectedDefinitions=Object.entries(manifest.participation).flatMap(([lesson,definitions])=>Object.entries(definitions).flatMap(([simulation,actions])=>actions.map(action=>`${lesson}/${simulation}/${action}`)));
   assert.deepEqual([...new Set(coverage.map(e=>`${e.lesson}/${e.simulation}/${e.action}`))].sort(),expectedDefinitions.sort());
   assert.equal(deliberateEvents.length,78);
   assert.equal(new Set(deliberateEvents.map(e=>e.event_id)).size,deliberateEvents.length,'each deliberate click gets a fresh UUID');
   const captured=deliberateEvents.filter(e=>e.action.startsWith('quiz-answer-')).slice(0,4);
   const {csrf_token}=await snapshot(page);
   for(const data of captured){
     const response=await page.request.post(endpoint,{data,headers:{'X-CSRF-Token':csrf_token}});
     assert.equal(response.status(),200);assert.equal((await response.json()).score,score);
   }
   await page.reload();await expect(page.locator('#participation-score')).toHaveText(String(score));
   assert.equal((await page.request.get(base+'/api/courses/scale-lab/progress').then(r=>r.json())).completed_count,0);
   // A real POST commits, but transport loses its response. Retry must reuse the original event.
   let dropped, retried;
   await page.route('**/api/courses/scale-lab/participation',async route=>{
     if(route.request().method()==='POST' && !dropped){
       dropped=route.request().postDataJSON();await route.fetch();await route.abort();
     }else{if(route.request().method()==='POST')retried=route.request().postDataJSON();await route.continue();}
   });
   await page.locator('[data-answer="1"]').click();await expect(page.locator('#participation-status')).toContainText('บันทึกไม่ได้');
   await expect(page.locator('[data-answer="0"]')).toBeDisabled();
   await expect(page.locator('#participation-score')).toHaveText(String(score));
   assert.equal((await snapshot(page)).score,score);
   await page.locator('[data-lesson="2"]').click();await page.locator('#retry-participation').click();
   await expect(page.locator('#participation-score')).toHaveText(String(score));assert.deepEqual(retried,dropped);
   assert.equal(retried.lesson_id,'flow');assert.equal(retried.simulation_id,'check-your-thinking');assert.equal(retried.action,'quiz-answer-b');await page.unroute('**/api/courses/scale-lab/participation');
   // Mobile actual interactions and saved state, not screenshots of a seeded number.
   for(const width of [320,390]){
     await page.setViewportSize({width,height:844});await page.locator(`[data-answer="${width===320?1:0}"]`).click();
     await expect(page.locator('#participation-score')).toHaveText(String(score));
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
     await page.locator('.participation').scrollIntoViewIfNeeded();await expect(page.locator('#participation-score')).toBeInViewport();
     await page.screenshot({path:new URL(`participation-mobile-${width}.png`,evidence).pathname});
     await page.locator('.quiz').scrollIntoViewIfNeeded();
     await page.screenshot({path:new URL(`participation-quiz-mobile-${width}.png`,evidence).pathname});
   }
   await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>scrollTo(0,0));
   await page.screenshot({path:new URL('participation-desktop.png',evidence).pathname});
   await context.storageState({path:new URL('participation-a-session.json',evidence).pathname});
   const firstScore=score;
   await page.goto(base+'/');await page.locator('form[action="/logout"] button').click();
   await page.goto(base+'/login');await page.locator('[name=email]').fill(`participation-a-${stamp}@example.test`);await page.locator('[name=password]').fill(password);
   await page.locator('button').click();await page.waitForURL(base+'/');await page.goto(base+'/courses/scale-lab/');
   await expect(page.locator('#participation-score')).toHaveText(String(score));
   for(let i=0;i<2;i++){
     await page.locator('#reset').click();await page.locator('#step').click();
     await expect(page.locator('#participation-status')).toContainText('นับคะแนนแล้ว');
     await expect(page.locator('#participation-score')).toHaveText(String(score));
   }
   await context.storageState({path:new URL('participation-a-session.json',evidence).pathname});
   // Separate real browser cookie jar/account, no localStorage import.
   await context.clearCookies();await register('b');
   await page.locator('[data-answer="1"]').click();await expect(page.locator('#participation-score')).toHaveText('1');
   await expect(page.locator('#complete-lesson')).toHaveText('ทำเครื่องหมายว่าเรียนจบ');
   await page.reload();await expect(page.locator('#participation-score')).toHaveText('1');
   await context.storageState({path:new URL('participation-b-session.json',evidence).pathname});
   const first=await browser.newContext({storageState:new URL('participation-a-session.json',evidence).pathname});
   const firstPage=await first.newPage();await firstPage.goto(base+'/courses/scale-lab/');
   await expect(firstPage.locator('#participation-score')).toHaveText(String(firstScore));
   assert.deepEqual(errors,[]);
   Object.assign(report,{passed:true,serverPid:info.pid,accountScores:{a:firstScore,b:1},reload:true,twoAccounts:true,realLostResponseRetry:true,mobile:[320,390],quizDoesNotMarkManual:true,repeatedWrongAndRight:true,capturedUuidRetries:captured,definitionCount:expectedDefinitions.length});
   await writeFile(new URL('participation-browser.json',evidence),JSON.stringify(report,null,2));
   console.log(JSON.stringify(report,null,2));
 }
}finally{await browser.close();}
