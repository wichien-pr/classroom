import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
process.env.PLAYWRIGHT_BROWSERS_PATH ||= fileURLToPath(new URL('../courses/scale-lab/.browsers',import.meta.url));
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const work=process.env.CTO_QA_WORKSPACE;
const {url}=JSON.parse(fs.readFileSync(`${work}/server.json`));
assert(url.startsWith('http://127.0.0.1:'),'isolated loopback QA only');
const tokens=JSON.parse(fs.readFileSync(`${work}/private-sessions.json`));
const out=pathToFileURL(path.resolve(process.env.CTO_QA_EVIDENCE || path.join(work,'evidence'))+path.sep);fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});const errors=[];const checks=[];
async function account(id,width=Number(process.env.CTO_QA_WIDTH || 1280)){const ctx=await browser.newContext({viewport:{width,height:900}});await ctx.addCookies([{name:'aw_session',value:tokens[id],url}]);const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(url+'/courses/cto-project-lab/');return page;}
async function settled(page){await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('บันทึก/โหลด'));}
async function choose(page,n,review=false){const scope=page.locator(review?'#dashboard':'#workspace');if(await scope.locator('[data-step-select]').isVisible())await scope.locator('[data-step-select]').selectOption(String(n));else await scope.locator(`[data-nav-step="${n}"]`).click();}
async function view(page,name){await settled(page);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight));await page.screenshot({path:fileURLToPath(new URL(name+'.png',out))});checks.push(name);}
async function api(page){return page.evaluate(()=>fetch('/api/cto-project').then(r=>r.json()));}
try{
 const learner=await account(1), reviewer=await account(3);
 if(process.argv.includes('--resume')){
  await settled(learner);const state=await api(learner);assert.equal(state.steps.filter(s=>s.state==='approved').length,7);assert.equal(await learner.locator('[data-step]').count(),1);assert.equal(await learner.locator('[data-step="7"]').count(),1);checks.push('restart-seven-approvals');
  const second=await account(2);await settled(second);assert.equal(await second.getByLabel('หลักฐาน / Evidence').inputValue(),'Independent account draft');assert.equal((await api(second)).steps.filter(s=>s.state==='approved').length,0);checks.push('restart-second-account-draft');
 }else{
  await learner.locator('#start').click();await settled(learner);assert.equal(await learner.locator('[data-step]').count(),1);
  const assignment=(await api(learner)).project;assert(await learner.locator('[data-nav-step="2"]').isDisabled());
  await view(learner,'desktop-initial');
  await reviewer.locator('#review').click();await settled(reviewer);
  for(let n=1;n<=7;n++){
   if(n>1){await learner.reload();await settled(learner);assert.equal(await learner.locator(`[data-step="${n}"]`).count(),1);}
   const evidence=`Step ${n}: synthetic repository and test evidence — `+'หลักฐาน '.repeat(n===2?300:3);
   await learner.getByLabel('หลักฐาน / Evidence').fill(evidence);await learner.getByLabel('AI usage & reflection').fill(`Step ${n}: AI suggested an approach; checked requirements and rejected unsupported claims.`);
   await learner.getByRole('button',{name:'บันทึกร่าง',exact:true}).click();await settled(learner);
   if(n>1){await choose(learner,n-1);assert(await learner.getByLabel('หลักฐาน / Evidence').isDisabled());await choose(learner,n);assert.equal(await learner.getByLabel('หลักฐาน / Evidence').inputValue(),evidence);}
   await learner.reload();await settled(learner);assert.equal(await learner.getByLabel('หลักฐาน / Evidence').inputValue(),evidence);assert.deepEqual((await api(learner)).project,assignment);
   await learner.getByRole('button',{name:'ส่งตรวจ',exact:true}).click();await settled(learner);assert(await learner.getByLabel('หลักฐาน / Evidence').isDisabled());assert.equal(await learner.locator(`[data-step="${n}"]`).count(),1);assert.equal(await learner.getByRole('button',{name:'Pass',exact:true}).count(),0);if(n<7)assert.equal((await api(learner)).steps[n].unlocked,false);
   await reviewer.locator('#review').click();await settled(reviewer);await choose(reviewer,n,true);
   assert.equal(await reviewer.locator('[data-review]').count(),1);
   if(n===1){
    await reviewer.getByLabel('Feedback CTO').fill('Add failure acceptance case');await reviewer.getByRole('button',{name:'ขอแก้ไข',exact:true}).click();await settled(reviewer);
    await learner.reload();await settled(learner);assert.equal(await learner.locator('[data-step]').getAttribute('data-state'),'changes_requested');assert((await learner.locator('.feedback').textContent()).includes('failure'));
    await learner.getByRole('button',{name:'ส่งตรวจ',exact:true}).click();await settled(learner);await reviewer.locator('#review').click();await settled(reviewer);
   }
   await reviewer.getByLabel('Feedback CTO').fill(`Synthetic step ${n} reviewed`);
   if(n===2){await choose(reviewer,1,true);await choose(reviewer,2,true);assert.equal(await reviewer.getByLabel('Feedback CTO').inputValue(),'Synthetic step 2 reviewed');await view(reviewer,'reviewer-desktop');}
   if(n===1){await reviewer.getByRole('button',{name:'Pass',exact:true}).scrollIntoViewIfNeeded();await reviewer.screenshot({path:fileURLToPath(new URL('pass-control.png',out))});}
   await reviewer.getByRole('button',{name:'Pass',exact:true}).click();await settled(reviewer);
   assert.equal(await reviewer.locator(`[data-review="1-${Math.min(n+1,7)}"]`).count(),1,'Pass automatically selects next step; final stays at 7');await learner.locator(`[data-step="${Math.min(n+1,7)}"]`).waitFor();const snapshot=await api(learner);assert.equal(snapshot.steps[n-1].state,'approved');if(n<7)assert(snapshot.steps[n].unlocked);checks.push(`step-${n}-save-reload-review-unlock`);
   if(n===1){await learner.reload();await settled(learner);await view(learner,'desktop-unlocked');}
  }
  const second=await account(2);await second.locator('#start').waitFor();assert.equal((await api(second)).project,null);await second.locator('#start').click();await settled(second);await second.getByLabel('หลักฐาน / Evidence').fill('Independent account draft');await second.getByRole('button',{name:'บันทึกร่าง',exact:true}).click();await settled(second);await second.reload();await settled(second);assert.equal(await second.getByLabel('หลักฐาน / Evidence').inputValue(),'Independent account draft');checks.push('second-account-isolation');
 }
 await learner.reload();await settled(learner);await view(learner,'desktop-completed');
 for(const width of [390,320]){
  const mobile=await account(1,width);await settled(mobile);assert.equal(await mobile.locator('[data-step]').count(),1);await choose(mobile,1);assert(await mobile.getByLabel('หลักฐาน / Evidence').isDisabled());await choose(mobile,7);await view(mobile,`mobile-${width}`);
  await mobile.locator('.step-detail').evaluate(el=>el.scrollTop=el.scrollHeight);assert.equal(await mobile.evaluate(()=>scrollY),0);assert((await mobile.locator('[data-step-select]').boundingBox()).y>=0);await mobile.getByRole('link',{name:'ออกจากคลาส · กลับหน้าแรก'}).click();assert.equal(new URL(mobile.url()).pathname,'/');
  const rm=await account(3,width);await rm.locator('#review').click();await settled(rm);await choose(rm,1,true);await view(rm,`reviewer-mobile-${width}`);
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(new URL(process.argv.includes('--resume')?'restart.json':'browser.json',out),JSON.stringify({passed:true,mode:'isolated compiled Flask QA; synthetic authenticated sessions (not login/OTP)',checks,errors},null,2));console.log(JSON.stringify({passed:true,checks:checks.length,errors}));
}finally{await browser.close();}
