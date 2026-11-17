// Real disposable account/SQLite verification; no production data or signup bypass.
import {spawn} from 'node:child_process';
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),courses=process.env.QA_COURSES_ROOT,out=process.env.QA_EVIDENCE;
if(!courses||!out||!process.env.QA_PYTHON||!process.env.TMPDIR)throw Error('Set QA_COURSES_ROOT, QA_EVIDENCE, QA_PYTHON, scratch TMPDIR');
process.env.PLAYWRIGHT_BROWSERS_PATH??=root+'courses/scale-lab/.browsers';
const {chromium,expect}=await import(root+'courses/scale-lab/node_modules/@playwright/test/index.mjs');
await mkdir(out,{recursive:true});await mkdir(courses+'/scale-lab',{recursive:true});for(const f of ['course.json','assessment.json'])await copyFile(root+'courses/scale-lab/'+f,courses+'/scale-lab/'+f);
const pythonArgs=[root+'scripts/theme-qa-server.py'];
const useArch=process.platform==='darwin'&&process.env.QA_PYTHON_ARCH;
const server=spawn(useArch?'/usr/bin/arch':process.env.QA_PYTHON,useArch?['-'+process.env.QA_PYTHON_ARCH,process.env.QA_PYTHON,...pythonArgs]:pythonArgs,{cwd:root,env:process.env});let log='',browser;server.stderr.on('data',b=>log+=b);
try{
 const qa=await new Promise((resolve,reject)=>{let s='';const t=setTimeout(()=>reject(Error(log)),20000);server.on('exit',()=>reject(Error(log)));server.stdout.on('data',b=>{s+=b;if(s.includes('\n')){clearTimeout(t);resolve(JSON.parse(s.split('\n')[0]));}});});
 browser=await chromium.launch({channel:'chromium'});const page=await browser.newPage({viewport:{width:390,height:900}}),posts=[],errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(r.method()==='POST'&&/\/(participation|progress)$/.test(r.url()))posts.push(r.postDataJSON());});
 await page.goto(qa.url+'/login');await page.locator('[name=email]').fill('theme@example.test');await page.locator('[name=password]').fill('QA-theme-only-2026');await page.locator('form button[type=submit]').click();await page.waitForURL(qa.url+'/');
 await page.goto(qa.url+'/courses/scale-lab/');await expect(page.locator('#step')).toBeEnabled();await page.locator('[data-lesson="5"]').click();await page.emulateMedia({reducedMotion:'reduce'});
 const read=()=>page.evaluate(async()=>({participation:await fetch('/api/courses/scale-lab/participation').then(r=>r.json()),progress:await fetch('/api/courses/scale-lab/progress').then(r=>r.json())}));
 const select=async index=>{await page.locator('#reset').click();for(let i=0;i<index;i++)await page.locator('#lesson-topic-next').click();};
 const play=async()=>{await page.locator('#replication-run').click();await expect(page.locator('#replication-run')).toBeEnabled({timeout:15000});};
 await select(5);await page.locator('#lesson-topic-back').click();await page.locator('#lesson-topic-next').click();expect(posts).toHaveLength(0);expect((await read()).participation.score).toBe(0);
 const expected=[['write','read-replica'],['read-primary','sync','read-replica'],['read-replica'],['read-replica'],['write','read-replica'],['write','read-primary','read-replica','sync','read-replica']];
 for(let i=0;i<6;i++){await select(i);const before=posts.length;await play();expect(posts.slice(before).map(p=>p.action)).toEqual(expected[i]);for(const p of posts.slice(before)){expect(p.lesson_id).toBe('replica');expect(p.simulation_id).toBe('replica');}const after=posts.length;await page.locator('#replication-replay').click();await expect(page.locator('#replication-run')).toBeEnabled();expect(posts.length).toBe(after);}
 let saved=await read();expect(saved.participation.score).toBe(4);expect(saved.progress.criteria.replica).toEqual({manual:false,simulation:true,thinking:false});expect(saved.progress.completed).toEqual([]);
 // Hold real first write save; pause blocks the next read even after response settles.
 await select(5);let release,arrive;const held=new Promise(r=>release=r),ready=new Promise(r=>arrive=r);let once=true;
 await page.route('**/api/courses/scale-lab/participation',async route=>{if(route.request().method()==='POST'&&once){once=false;arrive();await held;}await route.continue();});
 const before=posts.length;await page.locator('#replication-run').click();await ready;await page.locator('#replication-pause').click();await page.screenshot({path:out+'/saving-paused.png',fullPage:true});release();await page.waitForTimeout(400);expect(posts.length).toBe(before+1);await expect(page.locator('.replication-scene')).toHaveAttribute('data-model-stage','5');await page.locator('#replication-pause').click();await expect(page.locator('#replication-run')).toBeEnabled();expect(posts.length).toBe(before+5);await page.unroute('**/api/courses/scale-lab/participation');
 // Cancel while a real write is in flight; releasing it must not start later actions.
 await select(5);let cancelRelease,cancelArrive,handled;const cancelHeld=new Promise(r=>cancelRelease=r),cancelReady=new Promise(r=>cancelArrive=r),handledPromise=new Promise(r=>handled=r);
 await page.route('**/api/courses/scale-lab/participation',async route=>{if(route.request().method()==='POST'){cancelArrive();await cancelHeld;}await route.continue();handled();});
 const cancelBefore=posts.length;await page.locator('#replication-run').click();await cancelReady;await page.locator('#lesson-topic-back').click();cancelRelease();await handledPromise;await expect(page.locator('#replication-run')).toBeEnabled();await page.waitForTimeout(200);expect(posts.length).toBe(cancelBefore+1);await expect(page.locator('#replication-result')).toContainText('ยังไม่ได้ทดลอง');await page.unroute('**/api/courses/scale-lab/participation');
 // Lost response after commit on each meaningful internal stage; retry exact event then explicitly resume.
 for(let failedStage=0;failedStage<5;failedStage++){
  await select(5);let n=0,failed;await page.route('**/api/courses/scale-lab/participation',async route=>{if(route.request().method()==='POST'&&n++===failedStage){failed=route.request().postDataJSON();await route.fetch();await route.abort();}else await route.continue();});
  await page.locator('#replication-run').click();await expect(page.locator('#retry-participation')).toBeVisible();await expect(page.locator('.workload-feedback #replication-result')).toBeVisible();await expect(page.locator('#replication-result')).toHaveCount(1);await expect(page.locator('#replication-result')).toContainText('บันทึก');const count=posts.length;await page.locator('#retry-participation').click();await expect(page.locator('#replication-run')).toBeEnabled();expect(posts.at(-1)).toEqual(failed);await play();expect(posts.length).toBe(count+1+(4-failedStage));await expect(page.locator('.replication-map [data-copy="1"]')).toHaveText('รับงานเขียนใหม่แล้ว');await page.unroute('**/api/courses/scale-lab/participation');
 }
 // Cancellation after committed/lost save: exact retry cannot restart canceled phases.
 await select(5);let lose=true;await page.route('**/api/courses/scale-lab/participation',async route=>{if(route.request().method()==='POST'&&lose){lose=false;await route.fetch();await route.abort();}else await route.continue();});
 await page.locator('#replication-run').click();await expect(page.locator('#retry-participation')).toBeVisible();const failed=posts.at(-1);await page.locator('#lesson-topic-back').click();await page.locator('#reset').click();const count=posts.length;await page.locator('#retry-participation').click();await expect(page.locator('#replication-run')).toBeEnabled();expect(posts.length).toBe(count+1);expect(posts.at(-1)).toEqual(failed);await expect(page.locator('#replication-result')).toContainText('ยังไม่ได้ทดลอง');await page.unroute('**/api/courses/scale-lab/participation');
 saved=await read();expect(saved.participation.score).toBe(4);expect(saved.progress.completed).toEqual([]);expect(saved.progress.criteria.replica).toEqual({manual:false,simulation:true,thinking:false});expect(errors).toEqual([]);
 const report={realBackend:true,syntheticAccount:true,topics:6,actions:expected,navigationReplayPosts:0,semanticAwards:4,identity:'replica / replica / write, read-primary, read-replica, sync',allFiveStageExactRetries:true,pauseDuringSave:true,inFlightSaveCancellation:true,canceledRetryCannotResume:true,manualCompletionUnchanged:true,errors};await writeFile(out+'/account-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{if(browser)await browser.close();server.kill('SIGTERM');await new Promise(r=>server.exitCode!==null?r():server.once('exit',r));}
