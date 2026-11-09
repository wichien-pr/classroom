// Isolated authenticated LAB09 QA, not signup/OTP or production verification.
import {spawn} from 'node:child_process';
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),courses=process.env.QA_COURSES_ROOT;
if(!process.env.TMPDIR||!courses||!process.env.QA_PYTHON)throw Error('Set scratch TMPDIR, QA_COURSES_ROOT and QA_PYTHON');
process.env.PLAYWRIGHT_BROWSERS_PATH=root+'courses/scale-lab/.browsers';
const {chromium,expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const out=process.env.QA_EVIDENCE||root+'evidence/lab09-presentation';await mkdir(out,{recursive:true});
for(const f of ['course.json','assessment.json'])await copyFile(root+'courses/scale-lab/'+f,courses+'/scale-lab/'+f);
const server=spawn('/usr/bin/arch',['-'+(process.env.QA_PYTHON_ARCH||'arm64'),process.env.QA_PYTHON,root+'scripts/theme-qa-server.py'],{cwd:root,env:process.env});
let log='',browser;server.stderr.on('data',b=>log+=b);
try{
 const qa=await new Promise((resolve,reject)=>{let s='';const t=setTimeout(()=>reject(Error(log)),20000);server.on('exit',()=>reject(Error(log)));server.stdout.on('data',b=>{s+=b;if(s.includes('\n')){clearTimeout(t);resolve(JSON.parse(s.split('\n')[0]));}});});
 browser=await chromium.launch({channel:'chromium'});const page=await browser.newPage({viewport:{width:1280,height:800}}),posts=[],errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(r.method()==='POST'&&/\/(participation|progress)$/.test(r.url()))posts.push(r.postDataJSON());});
 await page.goto(qa.url+'/login');await page.locator('[name=email]').fill('theme@example.test');await page.locator('[name=password]').fill('QA-theme-only-2026');await page.locator('form button[type=submit]').click();await page.waitForURL(qa.url+'/');
 await page.goto(qa.url+'/courses/scale-lab/');await expect(page.locator('#step')).toBeEnabled();await page.locator('[data-lesson="9"]').click();await page.emulateMedia({reducedMotion:'reduce'});
 const read=()=>page.evaluate(async()=>({participation:await fetch('/api/courses/scale-lab/participation').then(r=>r.json()),progress:await fetch('/api/courses/scale-lab/progress').then(r=>r.json())}));
 for(let i=0;i<5;i++)await page.locator('#lesson-topic-next').click();for(let i=0;i<5;i++)await page.locator('#lesson-topic-back').click();expect(posts).toHaveLength(0);expect((await read()).participation.score).toBe(0);
 // Hold actual save to check duplicate guard and focus; backend is never mocked.
 let release,arrived;const held=new Promise(r=>release=r),ready=new Promise(r=>arrived=r);
 await page.route('**/api/courses/scale-lab/participation',async route=>{if(route.request().method()==='POST'){arrived();await held;}await route.continue();});
 await page.locator('#dc-run').focus();await page.keyboard.press('Enter');await ready;
 await expect(page.locator('#dc-run')).toBeDisabled();await expect(page.locator('#dc-run')).toHaveAttribute('aria-label','กำลังบันทึก');await page.evaluate(()=>document.querySelector('#dc-run').click());expect(posts).toHaveLength(1);
 release();await expect(page.locator('#dc-run')).toBeEnabled();await expect(page.locator('#dc-run')).toBeFocused();await page.unroute('**/api/courses/scale-lab/participation');
 expect(posts[0]).toMatchObject({lesson_id:'data-centers',simulation_id:'data-centers',action:'dc-request'});
 await expect(page.locator('#complete-lesson')).toBeDisabled();expect((await read()).participation.score).toBe(1);
 await page.locator('[data-answer="0"]').click();await expect(page.locator('#dc-run')).toBeEnabled();await expect(page.locator('#complete-lesson')).toBeEnabled();
 for(let i=0;i<6;i++){
  const count=posts.length;await page.locator('#dc-run').click();await expect(page.locator('#dc-run')).toBeEnabled();expect(posts.slice(count).map(p=>p.action)).toEqual(['dc-request']);
  const before=posts.length;await page.locator('#dc-replay').click();await expect(page.locator('#dc-run')).toBeEnabled();expect(posts).toHaveLength(before);
  if(i<5)await page.locator('#lesson-topic-next').click();expect(posts).toHaveLength(before);
 }
 expect((await read()).participation.score).toBe(2);
 // Lost response after real SQLite commit; preserve captured event UUID.
 await page.locator('#reset').click();let lost=true;
 await page.route('**/api/courses/scale-lab/participation',async route=>{if(route.request().method()==='POST'&&lost){lost=false;await route.fetch();await route.abort();}else await route.continue();});
 const failureStart=posts.length;await page.locator('#dc-run').click();await expect(page.locator('#retry-participation')).toBeVisible();await expect(page.locator('.dc-details, #dc-route')).toHaveCount(0);await expect(page.locator('#dc-result')).not.toContainText('ยังไม่ได้ทดลอง');
 await page.locator('#retry-participation').click();await expect(page.locator('#dc-run')).toBeEnabled();expect(posts.at(-1)).toEqual(posts[failureStart]);
 await page.locator('#dc-run').click();await expect(page.locator('#dc-run')).toBeEnabled();expect(posts.length).toBe(failureStart+2);await expect(page.locator('.dc-details, #dc-route')).toHaveCount(0);await expect(page.locator('#dc-result')).not.toContainText('ยังไม่ได้ทดลอง');await page.unroute('**/api/courses/scale-lab/participation');
 for(const target of ['topic','reset','lesson']){
  await page.locator('#reset').click();let unlock,notify;const gate=new Promise(r=>unlock=r),arrival=new Promise(r=>notify=r);
  await page.route('**/api/courses/scale-lab/participation',async route=>{if(route.request().method()==='POST'){notify();await gate;}await route.continue();});
  const count=posts.length;await page.locator('#dc-run').click();await arrival;await page.locator(target==='topic'?'#lesson-topic-next':target==='reset'?'#reset':'[data-lesson="5"]').click();unlock();
  await expect(page.locator('#participation-notice')).toBeHidden();await page.waitForTimeout(150);expect(posts.length).toBe(count+1);expect(posts.at(-1).lesson_id).toBe('data-centers');
  if(target!=='lesson')await expect(page.locator('#dc-result')).toContainText('ยังไม่ได้ทดลอง');else await page.locator('[data-lesson="9"]').click();await page.unroute('**/api/courses/scale-lab/participation');
 }
 expect((await read()).progress.criteria['data-centers']).toEqual({manual:false,simulation:true,thinking:true});
 await page.reload();await page.locator('[data-lesson="9"]').click();await expect(page.locator('#complete-lesson')).toBeEnabled();
 let unlock,notify;const heldProgress=new Promise(r=>unlock=r),progressReady=new Promise(r=>notify=r);
 await page.route('**/api/courses/scale-lab/progress',async route=>{if(route.request().method()==='POST'){notify();await heldProgress;}await route.continue();});
 await page.locator('#complete-lesson').click();await progressReady;await expect(page.locator('#dc-run')).toBeDisabled();unlock();await expect(page.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');await page.unroute('**/api/courses/scale-lab/progress');
 await page.reload();await page.locator('[data-lesson="9"]').click();await expect(page.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');
 const saved=await read();expect(saved.progress.completed).toEqual(['data-centers']);expect(saved.participation.score).toBe(2);
 const local=await browser.newPage();await local.goto(process.env.LAB09_PREVIEW_URL||'http://127.0.0.1:4173/');await local.locator('[data-lesson="9"]').click();await local.emulateMedia({reducedMotion:'reduce'});
 await local.locator('[data-answer="0"]').click();await expect(local.locator('#complete-lesson')).toBeDisabled();await local.locator('#dc-run').click();await expect(local.locator('#complete-lesson')).toBeEnabled();await local.locator('#complete-lesson').click();await local.reload();await local.locator('[data-lesson="9"]').click();await expect(local.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');
 expect(errors).toEqual([]);
 const report={realBackend:true,syntheticAccount:true,topics:6,experimentPosts:posts.filter(p=>p.simulation_id==='data-centers').length,originalActions:[...new Set(posts.filter(p=>p.simulation_id==='data-centers').map(p=>p.action))],semanticScore:saved.participation.score,completed:saved.progress.completed,wrongAnswerQualifies:true,playbackNavigationPosts:0,pendingFocus:true,lostResponseRetry:true,cancelDuringSave:true,reload:true,standalonePreview:true,errors};await writeFile(out+'/account-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{if(browser)await browser.close();server.kill('SIGTERM');await new Promise(resolve=>server.exitCode!==null?resolve():server.once('exit',resolve));}
