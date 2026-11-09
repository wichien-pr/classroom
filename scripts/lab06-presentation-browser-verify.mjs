// Real compiled LAB06 APIs; synthetic account and disposable SQLite only.
import {spawn} from 'node:child_process';
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),courses=process.env.QA_COURSES_ROOT;
if(!process.env.TMPDIR||!courses||!process.env.QA_PYTHON)throw Error('Set scratch TMPDIR, QA_COURSES_ROOT and QA_PYTHON');
process.env.PLAYWRIGHT_BROWSERS_PATH=root+'courses/scale-lab/.browsers';
const {chromium,expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const out=root+'evidence/lab06-presentation';await mkdir(out,{recursive:true});
for(const f of ['course.json','assessment.json'])await copyFile(root+'courses/scale-lab/'+f,courses+'/scale-lab/'+f);
const server=spawn('/usr/bin/arch',['-'+(process.env.QA_PYTHON_ARCH||'arm64'),process.env.QA_PYTHON,root+'scripts/theme-qa-server.py'],{cwd:root,env:process.env});
let log='',browser;server.stderr.on('data',b=>log+=b);
try{
 const qa=await new Promise((resolve,reject)=>{let s='';const t=setTimeout(()=>reject(Error(log)),20000);server.on('exit',()=>reject(Error(log)));server.stdout.on('data',b=>{s+=b;if(s.includes('\n')){clearTimeout(t);resolve(JSON.parse(s.split('\n')[0]));}});});
 browser=await chromium.launch({channel:'chromium'});const page=await browser.newPage({viewport:{width:1280,height:800}}),posts=[],errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(r.method()==='POST'&&/\/(participation|progress)$/.test(r.url()))posts.push(r.postDataJSON());});
 await page.goto(qa.url+'/login');await page.locator('[name=email]').fill('theme@example.test');await page.locator('[name=password]').fill('QA-theme-only-2026');await page.locator('form button[type=submit]').click();await page.waitForURL(qa.url+'/');
 await page.goto(qa.url+'/courses/scale-lab/');await expect(page.locator('#step')).toBeEnabled();await page.locator('[data-lesson="6"]').click();
 const read=()=>page.evaluate(async()=>({participation:await fetch('/api/courses/scale-lab/participation').then(r=>r.json()),progress:await fetch('/api/courses/scale-lab/progress').then(r=>r.json())}));
 for(let i=0;i<4;i++)await page.locator('#lesson-topic-next').click();for(let i=0;i<4;i++)await page.locator('#lesson-topic-back').click();expect(posts).toHaveLength(0);expect((await read()).participation.score).toBe(0);
 await page.emulateMedia({reducedMotion:'reduce'});
 // Hold the real transport; no second action until the first save confirms.
 let release,arrived;const held=new Promise(r=>release=r),ready=new Promise(r=>arrived=r);
 await page.route('**/api/courses/scale-lab/participation',async route=>{if(route.request().method()==='POST'){arrived();await held;}await route.continue();});
 await page.locator('#cache-run').focus();await page.keyboard.press('Enter');await ready;
 await expect(page.locator('#cache-run')).toBeDisabled();await expect(page.locator('#cache-run')).toHaveAttribute('aria-label','กำลังบันทึก');
 await expect(page.locator('#cache-stage')).toContainText('1 / 2');
 await page.evaluate(()=>document.querySelector('#cache-run').click());expect(posts).toHaveLength(1);
 release();await expect(page.locator('#cache-run')).toBeEnabled();await expect(page.locator('#cache-run')).toBeFocused();await page.unroute('**/api/courses/scale-lab/participation');
 expect(posts.map(p=>p.action)).toEqual(['read-cache','read-cache']);
 await expect(page.locator('#complete-lesson')).toBeDisabled();
 await page.locator('[data-answer="0"]').click();await expect(page.locator('#cache-run')).toBeEnabled();await expect(page.locator('#complete-lesson')).toBeEnabled();
 const sequences=[['read-cache','read-cache'],['read-cache','update','read-cache'],['read-cache','update','read-cache','invalidate','read-cache'],['read-cache','update','read-cache'],['read-cache','read-cache','read-cache']];
 const run=async i=>{const count=posts.length;await page.locator('#cache-run').click();await expect(page.locator('#cache-run')).toBeEnabled();expect(posts.slice(count).map(p=>p.action)).toEqual(sequences[i]);};
 await run(0);
 for(let i=1;i<5;i++){
  const count=posts.length;await page.locator('#lesson-topic-next').click();expect(posts).toHaveLength(count);await run(i);
  const before=posts.length;await page.locator('#cache-replay').click();await expect(page.locator('#cache-run')).toBeEnabled();expect(posts).toHaveLength(before);
 }
 expect((await read()).participation.score).toBe(4);
 // Drop a response AFTER real commit. Retry must reuse the UUID and resume without another write.
 await page.locator('#reset').click();let lost=true;
 await page.route('**/api/courses/scale-lab/participation',async route=>{if(route.request().method()==='POST'&&lost){lost=false;await route.fetch();await route.abort();}else await route.continue();});
 const failureStart=posts.length;await page.locator('#cache-run').click();await expect(page.locator('#retry-participation')).toBeVisible();
 await expect(page.locator('#cache-stage')).toContainText('1 / 2');expect(posts.length).toBe(failureStart+1);
 await page.locator('#retry-participation').click();await expect(page.locator('#cache-run')).toBeEnabled();expect(posts.at(-1)).toEqual(posts[failureStart]);
 await page.locator('#cache-run').click();await expect(page.locator('#cache-run')).toBeEnabled();expect(posts.slice(failureStart).map(p=>p.action)).toEqual(['read-cache','read-cache','read-cache']);
 await expect(page.locator('.cache-premise')).toContainText('DB reads 1');await page.unroute('**/api/courses/scale-lab/participation');
 for(const target of ['topic','reset','lesson']){
  await page.locator('#reset').click();let unlock,notify;const gate=new Promise(r=>unlock=r),arrival=new Promise(r=>notify=r);
  await page.route('**/api/courses/scale-lab/participation',async route=>{if(route.request().method()==='POST'){notify();await gate;}await route.continue();});
  const count=posts.length;await page.locator('#cache-run').click();await arrival;
  await page.locator(target==='topic'?'#lesson-topic-next':target==='reset'?'#reset':'[data-lesson="5"]').click();unlock();
  await expect(page.locator('#participation-notice')).toBeHidden();await page.waitForTimeout(150);expect(posts.length).toBe(count+1);expect(posts.at(-1).lesson_id).toBe('cache');
  if(target!=='lesson')await expect(page.locator('#cache-result')).toContainText('ยังไม่ได้ทดลอง');
  else await page.locator('[data-lesson="6"]').click();await page.unroute('**/api/courses/scale-lab/participation');
 }
 expect((await read()).progress.criteria.cache).toEqual({manual:false,simulation:true,thinking:true});
 await page.reload();await page.locator('[data-lesson="6"]').click();await expect(page.locator('#complete-lesson')).toBeEnabled();
 let releaseProgress,progressArrived;const progressGate=new Promise(r=>releaseProgress=r),progressReady=new Promise(r=>progressArrived=r);
 await page.route('**/api/courses/scale-lab/progress',async route=>{if(route.request().method()==='POST'){progressArrived();await progressGate;}await route.continue();});
 await page.locator('#complete-lesson').click();await progressReady;await expect(page.locator('#cache-run')).toBeDisabled();releaseProgress();
 await expect(page.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');await page.unroute('**/api/courses/scale-lab/progress');await page.reload();await page.locator('[data-lesson="6"]').click();await expect(page.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');
 const saved=await read();expect(saved.progress.completed).toEqual(['cache']);expect(saved.participation.score).toBe(4);expect(errors).toEqual([]);
 const local=await browser.newPage();local.on('pageerror',e=>errors.push(String(e)));await local.goto('http://127.0.0.1:4173/');await local.locator('[data-lesson="6"]').click();await expect(local.locator('#lesson-topic-title')).toContainText('1 / 5');await expect(local.locator('#complete-lesson')).toBeDisabled();await local.locator('[data-answer="0"]').click();await expect(local.locator('#complete-lesson')).toBeDisabled();await local.emulateMedia({reducedMotion:'reduce'});await local.locator('#cache-run').click();await expect(local.locator('#cache-run')).toBeEnabled();await expect(local.locator('#complete-lesson')).toBeEnabled();await local.locator('#complete-lesson').click();await local.reload();await local.locator('[data-lesson="6"]').click();await expect(local.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');
 for(let i=0;i<4;i++)await local.locator('#lesson-topic-next').click();await local.locator('#cache-run').click();await expect(local.locator('#cache-run')).toBeEnabled();
 for(const width of [1280,390,320])for(const theme of ['dark','light']){
  await local.setViewportSize({width,height:800});await local.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  await local.locator('#lesson-topic').evaluate(e=>window.scrollBy(0,e.getBoundingClientRect().top-100));await local.screenshot({path:`${out}/preview-${theme}-${width}-header.png`});
  await local.locator('.workload-actions').scrollIntoViewIfNeeded();await local.screenshot({path:`${out}/preview-${theme}-${width}-result.png`});
  expect(await local.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 expect(errors).toEqual([]);
 const report={realBackend:true,syntheticAccount:true,topics:5,experimentPosts:posts.filter(p=>p.simulation_id==='cache').length,originalActions:[...new Set(posts.filter(p=>p.simulation_id==='cache').map(p=>p.action))],semanticScore:saved.participation.score,completed:saved.progress.completed,wrongAnswerQualifies:true,playbackNavigationPosts:0,pendingFocus:true,lostResponseRetry:true,cancelDuringSave:true,reload:true,standalonePreview:true,errors};await writeFile(out+'/account-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{if(browser)await browser.close();server.kill('SIGTERM');await new Promise(resolve=>server.exitCode!==null?resolve():server.once('exit',resolve));}
