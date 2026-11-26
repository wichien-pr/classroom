import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn, spawnSync} from 'node:child_process';
import {once} from 'node:events';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
process.env.PLAYWRIGHT_BROWSERS_PATH ||= fileURLToPath(new URL('../courses/scale-lab/.browsers',import.meta.url));
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const root=fileURLToPath(new URL('../',import.meta.url));
const scratch=path.resolve(process.env.QA_SCRATCH_ROOT || os.tmpdir());
const work=fs.mkdtempSync(path.join(scratch,'cto-polling-'));
const out=path.resolve(process.env.QA_EVIDENCE || path.join(work,'evidence'));fs.mkdirSync(out,{recursive:true});
const course=path.join(work,'courses/cto-project-lab');fs.mkdirSync(course,{recursive:true});
fs.copyFileSync(path.join(root,'courses/cto-project-lab/course.json'),path.join(course,'course.json'));
assert.equal(spawnSync(process.execPath,['build.mjs','--outDir',path.join(course,'dist')],{cwd:path.join(root,'courses/cto-project-lab')}).status,0);
const python=process.env.QA_PYTHON || 'python3';
// Do not inherit live configuration, upload paths or mail transports into QA.
const qaEnv=Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('APPWORKS_')&&!key.startsWith('CTO_REVIEWER_')&&!key.startsWith('OUTLOOK_')));
qaEnv.QA_SCRATCH_ROOT=scratch;
const args=['scripts/cto-email-role-qa-server.py','--workspace',work,'--courses-root',path.join(work,'courses')];
const server=process.env.QA_PYTHON_ARCH
 ? spawn('/usr/bin/arch',['-'+process.env.QA_PYTHON_ARCH,python,...args],{cwd:root,env:qaEnv,stdio:['ignore','pipe','pipe']})
 : spawn(python,args,{cwd:root,env:qaEnv,stdio:['ignore','pipe','pipe']});
let logs='';server.on('error',error=>{logs+=error.message;});server.stderr.on('data',d=>logs+=d);let browser;let url;const report={checks:[],errors:[],workspace:work};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 for(let i=0;i<100&&!fs.existsSync(path.join(work,'server.json'));i++){if(server.exitCode!==null)throw Error(logs);await sleep(100);}
 ({url}=JSON.parse(fs.readFileSync(path.join(work,'server.json'))));
 const tokens=JSON.parse(fs.readFileSync(path.join(work,'private-sessions.json')));
 browser=await chromium.launch({headless:true});
 async function account(id,width=1280){const ctx=await browser.newContext({viewport:{width,height:900}});await ctx.addCookies([{name:'aw_session',value:tokens[id],url}]);const page=await ctx.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto(url+'/courses/cto-project-lab/');await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('บันทึก/โหลด'));return page;}
 if(process.argv.includes('--workflow')){
  const result=spawnSync(process.execPath,['scripts/cto-email-role-browser-verify.mjs'],{cwd:root,env:{...process.env,CTO_QA_WORKSPACE:work,CTO_QA_EVIDENCE:path.join(out,'workflow/')},encoding:'utf8',timeout:120000});
  console.log(result.stdout);assert.equal(result.status,0,result.stderr);report.checks.push('existing-email-role-seven-steps-and-mobile');report.passed=true;
 }else{
 const page=await account(1);
 await page.locator('#start').click();await page.locator('[data-action="submit"]').waitFor();
 await page.locator('[data-field="evidence"]').fill('Synthetic polling evidence');await page.locator('[data-field="reflection"]').fill('Checked synthetic evidence');await page.locator('[data-action="submit"]').click();await page.locator('[data-state="submitted"]').waitFor();
 let gets=0;page.on('request',r=>{if(r.url()===url+'/api/cto-project'&&r.method()==='GET')gets++;});
 await page.evaluate(()=>{const detail=document.querySelector('.step-detail');document.querySelector('.project').open=true;document.querySelector('.project details').open=true;document.querySelector('.rubric').open=true;detail.scrollTop=180;const focus=document.querySelector('[data-nav-step="1"]');focus.focus();window.probe={node:detail,focus,scroll:detail.scrollTop,disabled:0,mutations:0};new MutationObserver(ms=>{window.probe.mutations+=ms.length;for(const m of ms)if(m.attributeName==='disabled'&&m.target===focus)window.probe.disabled++;}).observe(document.querySelector('#workspace'),{subtree:true,childList:true,attributes:true});});
 await page.waitForTimeout(6500);
 const proof=await page.evaluate(()=>({same:probe.node===document.querySelector('.step-detail'),focused:document.activeElement===probe.focus,open:[...document.querySelectorAll('#workspace details')].every(d=>d.open),scroll:document.querySelector('.step-detail').scrollTop,previousScroll:probe.scroll,step:document.querySelector('[data-step]').dataset.step,disabled:probe.disabled,mutations:probe.mutations,navigations:performance.getEntriesByType('navigation').length}));
 report.unchanged={...proof,gets};console.log(JSON.stringify(report.unchanged));
 assert(gets>=3);assert(proof.same,'unchanged polling must preserve workspace DOM identity');assert(proof.focused);assert(proof.open);assert.equal(proof.scroll,proof.previousScroll);assert.equal(proof.disabled,0);assert.equal(proof.step,'1');assert.equal(proof.navigations,1);report.checks.push('unchanged-real-time-three-polls');
 // Hold an old pending snapshot while a real reviewer approves and a foreground reload wins.
 const reviewer=await account(3);
 let release,heldResolve;const held=new Promise(r=>heldResolve=r);let intercepted=false;
 await page.route('**/api/cto-project',async route=>{if(route.request().method()!=='GET'||intercepted)return route.continue();intercepted=true;const response=await route.fetch();heldResolve();await new Promise(r=>release=r);await route.fulfill({response});});
 await held;
 const heldGets=gets;await page.waitForTimeout(4200);assert.equal(gets,heldGets,'only one background request may be in flight');assert(await page.locator('#reload').isEnabled());report.checks.push('single-flight-with-live-controls');
 const approval=await reviewer.evaluate(async()=>{const own=await fetch('/api/cto-project').then(r=>r.json());const listing=await fetch('/api/cto-project/review').then(r=>r.json());const step=listing.projects.find(p=>p.user_id===1).steps[0];return fetch('/api/cto-project/review/1',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':own.csrf_token},body:JSON.stringify({action:'approved',step:1,version:step.version,request_id:crypto.randomUUID(),feedback:'Synthetic approval'})}).then(r=>r.status);});assert.equal(approval,200);
 page.once('dialog',d=>d.accept());await page.locator('#reload').click();await page.locator('[data-step="2"]').waitFor();
 release();await page.waitForTimeout(350);
 assert.equal(await page.locator('[data-nav-step="2"]').isEnabled(),true,'late poll must not overwrite foreground approval');assert.equal(await page.locator('[data-field="evidence"]').isEnabled(),true);report.checks.push('foreground-wins-over-old-poll');
 await page.unroute('**/api/cto-project');
 await page.locator('[data-field="evidence"]').fill('Step two');await page.locator('[data-field="reflection"]').fill('Reviewed');await page.locator('[data-action="submit"]').click();await page.locator('[data-state="submitted"]').waitFor();
 await page.locator('[data-nav-step="1"]').click();
 await page.evaluate(()=>{document.querySelector('.project').open=true;document.querySelector('.step-detail').scrollTop=100;window.reading={detail:document.querySelector('.step-detail'),article:document.querySelector('[data-step]'),focus:document.activeElement,scroll:document.querySelector('.step-detail').scrollTop};});
 await reviewer.evaluate(async()=>{const own=await fetch('/api/cto-project').then(r=>r.json());const listing=await fetch('/api/cto-project/review').then(r=>r.json());const step=listing.projects.find(p=>p.user_id===1).steps[1];const r=await fetch('/api/cto-project/review/1',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':own.csrf_token},body:JSON.stringify({action:'changes_requested',step:2,version:step.version,request_id:crypto.randomUUID(),feedback:'Clarify failure path'})});if(!r.ok)throw Error('review failed');});
 await page.waitForFunction(()=>document.querySelector('[data-nav-step="2"]').textContent.includes('ต้องแก้ไข'));
 const retained=await page.evaluate(()=>({detail:reading.detail===document.querySelector('.step-detail'),article:reading.article===document.querySelector('[data-step]'),focus:reading.focus===document.activeElement,open:document.querySelector('.project').open,scroll:document.querySelector('.step-detail').scrollTop===reading.scroll}));report.irrelevant=retained;assert(Object.values(retained).every(Boolean),'remote change to another step must preserve reading DOM/focus/scroll'); report.checks.push('other-step-change-retains-reading');
 await page.locator('[data-nav-step="2"]').click();await page.locator('[data-field="evidence"]').fill('Updated synthetic step two');await page.locator('[data-action="submit"]').click();await page.locator('[data-state="submitted"]').waitFor();
 // A background outage must leave focus/DOM alone, show one calm notice and back off.
 let failures=0;await page.route('**/api/cto-project',route=>{if(route.request().method()==='GET'){failures++;return route.fulfill({status:503,json:{error:'synthetic_outage'}});}return route.continue();});
 await page.waitForTimeout(8500);assert(failures<=2,'background errors must back off rather than retry every tick');assert((await page.locator('#status').textContent()).includes('อัตโนมัติ'));assert(await page.locator('#retry').isHidden());report.checks.push('background-error-backoff');await page.unroute('**/api/cto-project');
 await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('อัปเดตสถานะ'),{},{timeout:16000});report.checks.push('background-recovers-without-reload');
 for(const width of [390,320]){
  const mobile=await account(1,width);let polls=0;mobile.on('request',r=>{if(r.url()===url+'/api/cto-project'&&r.method()==='GET')polls++;});
  await mobile.evaluate(()=>{document.querySelector('.project').open=true;document.querySelector('.step-detail').scrollTop=130;document.querySelector('[data-step-select]').focus();window.reading={node:document.querySelector('.step-detail'),focus:document.activeElement,scroll:document.querySelector('.step-detail').scrollTop};});
  await mobile.waitForTimeout(4500);assert(polls>=2);assert(await mobile.evaluate(()=>reading.node===document.querySelector('.step-detail')&&reading.focus===document.activeElement&&document.querySelector('.project').open&&document.querySelector('.step-detail').scrollTop===reading.scroll&&document.documentElement.scrollWidth<=innerWidth));await mobile.screenshot({path:path.join(out,`polling-${width}.png`)});await mobile.close();report.checks.push(`mobile-${width}-two-live-polls`);
 }
 const historyPage=await account(1);await historyPage.locator('[data-nav-step="1"]').click();await historyPage.evaluate(()=>{document.querySelector('.rubric').open=true;document.querySelector('.rubric > summary').focus();window.historyFocus=document.activeElement;});
 // An approval arriving after the learner chooses an older step must not hijack navigation.
 await page.locator('[data-nav-step="1"]').click();
 await page.evaluate(()=>{document.querySelector('.project').open=true;document.querySelector('.project details').open=true;document.querySelector('.project > summary').focus();window.summaryFocus=document.activeElement;});
 await reviewer.evaluate(async()=>{const own=await fetch('/api/cto-project').then(r=>r.json());const listing=await fetch('/api/cto-project/review').then(r=>r.json());const step=listing.projects.find(p=>p.user_id===1).steps[1];const r=await fetch('/api/cto-project/review/1',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':own.csrf_token},body:JSON.stringify({action:'approved',step:2,version:step.version,request_id:crypto.randomUUID(),feedback:'Checked changes'})});if(!r.ok)throw Error('review failed');});
 await page.waitForFunction(()=>!document.querySelector('[data-nav-step="3"]').disabled);
 assert.equal(await page.locator('[data-step]').getAttribute('data-step'),'1','approval should not hijack reading a different step');report.checks.push('approval-preserves-deliberate-navigation');
 assert(await page.evaluate(()=>summaryFocus===document.activeElement&&document.querySelector('.project details').open),'project approval counter must not replace the focused disclosure');
 await historyPage.waitForFunction(()=>!document.querySelector('[data-nav-step="3"]').disabled);assert(await historyPage.evaluate(()=>historyFocus===document.activeElement&&document.querySelector('.rubric').open),'appended history must preserve focused disclosure');await historyPage.close();report.checks.push('project-and-history-disclosure-focus');
 // A stale poll must not replace a newer save or an unsaved in-tab draft.
 await page.locator('[data-nav-step="3"]').click();await page.locator('[data-field="evidence"]').fill('Step three pending');await page.locator('[data-field="reflection"]').fill('Reviewed');await page.locator('[data-action="submit"]').click();await page.locator('[data-state="submitted"]').waitFor();
 let releaseSave,readySave;const heldSave=new Promise(r=>readySave=r);let interceptedSave=false;
 await page.route('**/api/cto-project',async route=>{if(route.request().method()!=='GET'||interceptedSave)return route.continue();interceptedSave=true;const response=await route.fetch();readySave();await new Promise(r=>releaseSave=r);await route.fulfill({response});});await heldSave;
 await reviewer.evaluate(async()=>{const own=await fetch('/api/cto-project').then(r=>r.json());const listing=await fetch('/api/cto-project/review').then(r=>r.json());const step=listing.projects.find(p=>p.user_id===1).steps[2];const r=await fetch('/api/cto-project/review/1',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':own.csrf_token},body:JSON.stringify({action:'changes_requested',step:3,version:step.version,request_id:crypto.randomUUID(),feedback:'Add test'})});return r.status;}).then(code=>assert.equal(code,200));
 page.once('dialog',d=>d.accept());await page.locator('#reload').click();await page.locator('[data-state="changes_requested"]').waitFor();await page.locator('[data-field="evidence"]').fill('New saved evidence');await page.locator('[data-action="save"]').click();await page.waitForFunction(()=>!document.querySelector('[data-action="save"]').disabled);
 await page.locator('[data-field="evidence"]').fill('Unsaved draft after save');await page.evaluate(()=>window.draftNode=document.activeElement);releaseSave();await page.waitForTimeout(350);assert(await page.evaluate(()=>draftNode===document.activeElement));assert.equal(await page.locator('[data-field="evidence"]').inputValue(),'Unsaved draft after save');await page.locator('[data-nav-step="2"]').click();await page.locator('[data-nav-step="3"]').click();assert.equal(await page.locator('[data-field="evidence"]').inputValue(),'Unsaved draft after save');report.checks.push('save-and-unsaved-draft-win-over-old-poll');
 assert.deepEqual(report.errors,[]);report.passed=true;
 }
}catch(e){report.passed=false;report.failure=e.stack;throw e;}
finally{
 try {if(browser)await browser.close();}
 finally {
  if(server.pid && server.exitCode===null && server.signalCode===null){
   const exited=once(server,'exit');server.kill('SIGTERM');
   const timer=setTimeout(()=>server.kill('SIGKILL'),5000);
   try{await exited;}finally{clearTimeout(timer);}
  }
  report.serverStopped=!server.pid||server.exitCode!==null||server.signalCode!==null;
  if(url){try{await fetch(url,{signal:AbortSignal.timeout(2000)});report.listenerClosed=false;}catch{report.listenerClosed=true;}}
  fs.writeFileSync(path.join(out,process.env.QA_REPORT || 'browser.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({passed:report.passed,checks:report.checks,serverStopped:report.serverStopped,listenerClosed:report.listenerClosed,evidence:out}));
  assert(report.serverStopped && (!url || report.listenerClosed),'QA server must stop and close its listener');
 }
}
