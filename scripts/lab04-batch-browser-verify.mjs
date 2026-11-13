// Disposable real Flask/SQLite account QA; no production account or signup flow.
import {spawn} from 'node:child_process';
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=process.env.QA_SOURCE_ROOT||fileURLToPath(new URL('../',import.meta.url)),courses=process.env.QA_COURSES_ROOT;
if(!process.env.TMPDIR||!courses||!process.env.QA_PYTHON)throw Error('Set scratch TMPDIR, QA_COURSES_ROOT, QA_PYTHON');
process.env.PLAYWRIGHT_BROWSERS_PATH=root+'courses/scale-lab/.browsers';
const {chromium,expect}=await import(root+'courses/scale-lab/node_modules/@playwright/test/index.mjs');
const out=process.env.QA_EVIDENCE||root+'evidence/lab04-batch';await mkdir(out,{recursive:true});
for(const f of ['course.json','assessment.json'])await copyFile(root+'courses/scale-lab/'+f,courses+'/scale-lab/'+f);
const server=spawn('/usr/bin/arch',['-'+(process.env.QA_PYTHON_ARCH||'arm64'),process.env.QA_PYTHON,root+'scripts/theme-qa-server.py'],{cwd:root,env:process.env});
let log='',browser;server.stderr.on('data',b=>log+=b);
try{
 const qa=await new Promise((resolve,reject)=>{let s='';const t=setTimeout(()=>reject(Error(log)),20000);server.on('exit',()=>reject(Error(log)));server.stdout.on('data',b=>{s+=b;if(s.includes('\n')){clearTimeout(t);resolve(JSON.parse(s.split('\n')[0]));}});});
 browser=await chromium.launch({channel:'chromium'});const page=await browser.newPage({viewport:{width:390,height:800}}),posts=[],errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(r.method()==='POST'&&/\/(participation|progress)$/.test(r.url()))posts.push(r.postDataJSON());});
 await page.goto(qa.url+'/login');await page.locator('[name=email]').fill('theme@example.test');await page.locator('[name=password]').fill('QA-theme-only-2026');await page.locator('form button[type=submit]').click();await page.waitForURL(qa.url+'/');
 await page.goto(qa.url+'/courses/scale-lab/');await expect(page.locator('#step')).toBeEnabled();await page.locator('[data-lesson="4"]').click();await page.emulateMedia({reducedMotion:'reduce'});
 const read=()=>page.evaluate(async()=>({participation:await fetch('/api/courses/scale-lab/participation').then(r=>r.json()),progress:await fetch('/api/courses/scale-lab/progress').then(r=>r.json())}));
 const select=async index=>{await page.locator('#reset').click();for(let i=0;i<index;i++)await page.locator('#lesson-topic-next').click();};
 const play=async()=>{await page.locator('#route').click();await expect(page.locator('#route')).toBeEnabled({timeout:15000});};
 for(let i=0;i<3;i++)await page.locator('#lesson-topic-next').click();for(let i=0;i<3;i++)await page.locator('#lesson-topic-back').click();
 expect(posts).toHaveLength(0);let saved=await read();expect(saved.participation.score).toBe(0);expect(saved.progress.criteria.balance).toEqual({manual:false,simulation:false,thinking:false});
 const coverage=[];
 for(const index of [0,1,2,3]){
  await select(index);const before=posts.length;await play();expect(posts.slice(before).map(p=>[p.lesson_id,p.simulation_id,p.action])).toEqual(Array.from({length:6},()=>['balance','balance','route']));
  const after=posts.length;await page.locator('#balance-replay').click();await expect(page.locator('#route')).toBeEnabled();expect(posts.length).toBe(after);coverage.push(index+1);
 }
 saved=await read();expect(saved.participation.score).toBe(1);expect(saved.progress.completed).toEqual([]);
 // Hold original save. Pause must gate subsequent mutations even after it resolves.
 await select(0);let release,arrive,handled;const held=new Promise(r=>release=r),ready=new Promise(r=>arrive=r),handledPromise=new Promise(r=>handled=r);let first=true;
 await page.route('**/api/courses/scale-lab/participation',async route=>{if(route.request().method()==='POST'&&first){first=false;arrive();await held;await route.continue();handled();}else await route.continue();});
 const pauseBefore=posts.length;await page.locator('#route').click();await ready;await page.locator('#balance-pause').click();release();await handledPromise;await page.waitForTimeout(300);
 expect(posts.length).toBe(pauseBefore+1);await expect(page.locator('.balance-load')).toContainText('1 / 6');await expect(page.locator('.balance-scene')).toHaveAttribute('data-playback','paused');
 await page.locator('#balance-pause').click();await expect(page.locator('#route')).toBeEnabled();expect(posts.length).toBe(pauseBefore+6);await page.unroute('**/api/courses/scale-lab/participation');
 // Cancel an already in-flight save: allow that one receipt, never later routes.
 await select(0);let cancelRelease,cancelArrive,cancelHandled;const cancelHeld=new Promise(r=>cancelRelease=r),cancelReady=new Promise(r=>cancelArrive=r),cancelDone=new Promise(r=>cancelHandled=r);first=true;
 await page.route('**/api/courses/scale-lab/participation',async route=>{if(route.request().method()==='POST'&&first){first=false;cancelArrive();await cancelHeld;await route.continue();cancelHandled();}else await route.continue();});
 const cancelBefore=posts.length;await page.locator('#route').click();await cancelReady;await page.locator('#lesson-topic-next').click();cancelRelease();await cancelDone;await expect(page.locator('#route')).toBeEnabled();await page.waitForTimeout(200);expect(posts.length).toBe(cancelBefore+1);await expect(page.locator('.balance-load')).toContainText('0 / 6');await page.unroute('**/api/courses/scale-lab/participation');
 // Real committed response loss, same page exact retry, no duplicate route mutation.
 await select(0);let lose=true;await page.route('**/api/courses/scale-lab/participation',async route=>{if(route.request().method()==='POST'&&lose){lose=false;await route.fetch();await route.abort();}else await route.continue();});
 await page.locator('#route').click();await expect(page.locator('#retry-participation')).toBeVisible();const failed=posts.at(-1);await expect(page.locator('[data-server="0"] [data-count]')).toHaveText('รับแล้ว 1 request');
 await page.locator('#retry-participation').click();await expect(page.locator('#route')).toBeEnabled();expect(posts.at(-1)).toEqual(failed);const resumed=posts.length;await play();expect(posts.length).toBe(resumed+5);
 await expect(page.locator('[data-server="0"] [data-count]')).toHaveText('รับแล้ว 3 request');await expect(page.locator('[data-server="1"] [data-count]')).toHaveText('รับแล้ว 3 request');await page.unroute('**/api/courses/scale-lab/participation');
 // Retained failed payload survives reset/navigation, with no automatic continuation.
 await select(0);lose=true;await page.route('**/api/courses/scale-lab/participation',async route=>{if(route.request().method()==='POST'&&lose){lose=false;await route.fetch();await route.abort();}else await route.continue();});
 await page.locator('#route').click();await expect(page.locator('#retry-participation')).toBeVisible();const canceled=posts.at(-1);await page.locator('#reset').click();await page.locator('#lesson-topic-next').click();const beforeRetry=posts.length;
 await page.locator('#retry-participation').click();await expect(page.locator('#route')).toBeEnabled();expect(posts.length).toBe(beforeRetry+1);expect(posts.at(-1)).toEqual(canceled);await expect(page.locator('.balance-load')).toContainText('0 / 6');await page.unroute('**/api/courses/scale-lab/participation');
 saved=await read();expect(saved.participation.score).toBe(1);expect(saved.progress.criteria.balance).toEqual({manual:false,simulation:true,thinking:false});
 await expect(page.locator('#complete-lesson')).toBeDisabled();await page.locator('[data-answer="0"]').click();await expect(page.locator('#complete-lesson')).toBeEnabled();saved=await read();expect(saved.progress.completed).toEqual([]);
 await page.locator('#complete-lesson').click();await expect(page.locator('#complete-lesson')).toBeDisabled();saved=await read();expect(saved.progress.completed).toEqual(['balance']);
 await page.reload();await page.locator('[data-lesson="4"]').click();await expect(page.locator('#route')).toBeEnabled();await play();saved=await read();expect(saved.participation.score).toBe(2);expect(saved.progress.completed).toEqual(['balance']);expect(errors).toEqual([]);
 const report={realBackend:true,syntheticAccount:true,coverage,requestsPerExperiment:6,navigationReplayPosts:0,originalIdentity:'balance / balance / route',semanticSimulationAwards:1,scoreAfterWrongAnswer:2,completed:saved.progress.completed,heldSavePause:true,heldSaveCancellation:true,exactUUIDRetryAfterReset:true,samePageRetryWithoutDuplicateMutation:true,manualCompletionOnly:true,reloadDedup:true,errors};await writeFile(out+'/account-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{if(browser)await browser.close();server.kill('SIGTERM');await new Promise(resolve=>server.exitCode!==null?resolve():server.once('exit',resolve));}
