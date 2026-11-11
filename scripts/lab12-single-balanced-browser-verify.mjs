// Disposable real Flask/SQLite account QA; no production account or signup flow.
import {spawn} from 'node:child_process';
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=process.env.QA_SOURCE_ROOT||fileURLToPath(new URL('../',import.meta.url)),courses=process.env.QA_COURSES_ROOT;
if(!process.env.TMPDIR||!courses||!process.env.QA_PYTHON)throw Error('Set scratch TMPDIR, QA_COURSES_ROOT, QA_PYTHON');
process.env.PLAYWRIGHT_BROWSERS_PATH=root+'courses/scale-lab/.browsers';
const {chromium,expect}=await import(root+'courses/scale-lab/node_modules/@playwright/test/index.mjs');
const out=process.env.QA_EVIDENCE||root+'evidence/lab12-single-balanced/account';await mkdir(out,{recursive:true});
for(const f of ['course.json','assessment.json'])await copyFile(root+'courses/scale-lab/'+f,courses+'/scale-lab/'+f);
const server=spawn('/usr/bin/arch',['-'+(process.env.QA_PYTHON_ARCH||'arm64'),process.env.QA_PYTHON,root+'scripts/theme-qa-server.py'],{cwd:root,env:process.env});
let log='',browser;server.stderr.on('data',b=>log+=b);
try{
 const qa=await new Promise((resolve,reject)=>{let s='';const t=setTimeout(()=>reject(Error(log)),20000);server.on('exit',()=>reject(Error(log)));server.stdout.on('data',b=>{s+=b;if(s.includes('\n')){clearTimeout(t);resolve(JSON.parse(s.split('\n')[0]));}});});
 browser=await chromium.launch({channel:'chromium'});const page=await browser.newPage({viewport:{width:390,height:800}}),posts=[],errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(r.method()==='POST'&&/\/(participation|progress)$/.test(r.url()))posts.push(r.postDataJSON());});
 await page.goto(qa.url+'/login');await page.locator('[name=email]').fill('theme@example.test');await page.locator('[name=password]').fill('QA-theme-only-2026');await page.locator('form button[type=submit]').click();await page.waitForURL(qa.url+'/');
 await page.goto(qa.url+'/courses/scale-lab/');await expect(page.locator('#step')).toBeEnabled();await page.locator('[data-lesson="12"]').click();await page.emulateMedia({reducedMotion:'reduce'});
 const read=()=>page.evaluate(async()=>({participation:await fetch('/api/courses/scale-lab/participation').then(r=>r.json()),progress:await fetch('/api/courses/scale-lab/progress').then(r=>r.json())}));
 const select=async index=>{await page.locator('#reset').click();for(let i=0;i<index;i++)await page.locator('#lesson-topic-next').click();};
 const play=async()=>{await page.locator('#tier-run').click();await expect(page.locator('#tier-run')).toBeEnabled({timeout:15000});};
 for(let i=0;i<2;i++)await page.locator('#lesson-topic-next').click();for(let i=0;i<2;i++)await page.locator('#lesson-topic-back').click();await page.locator('#tier-replay').click();
 expect(posts).toHaveLength(0);let saved=await read();expect(saved.participation.score).toBe(0);expect(saved.progress.criteria['database-scaling']).toEqual({manual:false,simulation:false,thinking:false});
 const coverage=[];
 for(const index of [2,0,1]){
  await select(index);const before=posts.length;await play();expect(posts.slice(before).map(p=>p.action)).toEqual(Array(index===0?3:1).fill('evaluate-data-tier'));
  const after=posts.length;await page.locator('#tier-replay').click();await expect(page.locator('.tier-scene')).toHaveAttribute('data-playback','finished');expect(posts.length).toBe(after);coverage.push(index+1);
 }
 saved=await read();expect(saved.participation.score).toBe(1);expect(saved.progress.completed).toEqual([]);expect(saved.progress.criteria['database-scaling']).toEqual({manual:false,simulation:true,thinking:false});
 // Pause while an actual save is held: settling it must not start phase 2.
 await select(0);let pauseRelease,pauseArrive;const pauseHeld=new Promise(r=>pauseRelease=r),pauseReady=new Promise(r=>pauseArrive=r);let holdOnce=true;
 await page.route('**/api/courses/scale-lab/participation',async route=>{if(route.request().method()==='POST'&&holdOnce){holdOnce=false;pauseArrive();await pauseHeld;}await route.continue();});
 const pauseBefore=posts.length;await page.locator('#tier-run').click();await pauseReady;await page.locator('#tier-pause').click();pauseRelease();await page.waitForTimeout(350);
 expect(posts.length).toBe(pauseBefore+1);await expect(page.locator('.tier-comparison')).toHaveCount(3);await expect(page.locator('.tier-scene')).toHaveAttribute('data-playback','paused');
 await page.locator('#tier-pause').click();await expect(page.locator('#tier-run')).toBeEnabled();expect(posts.length).toBe(pauseBefore+3);await page.unroute('**/api/courses/scale-lab/participation');
 // Cancel the single balanced page during its save boundary.
 await select(1);let release,arrived,handled;const held=new Promise(r=>release=r),ready=new Promise(r=>arrived=r),handledPromise=new Promise(r=>handled=r);
 await page.route('**/api/courses/scale-lab/participation',async route=>{if(route.request().method()==='POST'){arrived();await held;}await route.continue();handled();});
 const before=posts.length;await page.locator('#tier-run').click();await ready;await page.locator('#lesson-topic-next').click();release();await handledPromise;await expect(page.locator('#tier-run')).toBeEnabled();await page.waitForTimeout(200);expect(posts.length).toBe(before+1);await expect(page.locator('#lesson-topic-title')).toContainText('3 / 3');await page.unroute('**/api/courses/scale-lab/participation');
 // Lost response after real commit: exact payload/UUID survives reset and cannot resume canceled page.
 await select(1);let lose=true;
 await page.route('**/api/courses/scale-lab/participation',async route=>{if(route.request().method()==='POST'&&lose){lose=false;await route.fetch();await route.abort();}else await route.continue();});
 await page.locator('#tier-run').click();await expect(page.locator('#retry-participation')).toBeVisible();const failed=posts.at(-1);await page.locator('#lesson-topic-next').click();await page.locator('#reset').click();const count=posts.length;
 await page.locator('#retry-participation').click();await expect(page.locator('#tier-run')).toBeEnabled();expect(posts.length).toBe(count+1);expect(posts.at(-1)).toEqual(failed);await expect(page.locator('.tier-scene')).toHaveAttribute('data-playback','idle');await page.unroute('**/api/courses/scale-lab/participation');
 // Same-page exact retry, then continue remaining original evaluations only on explicit run.
 await select(1);lose=true;await page.route('**/api/courses/scale-lab/participation',async route=>{if(route.request().method()==='POST'&&lose){lose=false;await route.fetch();await route.abort();}else await route.continue();});
 await page.locator('#tier-run').click();await expect(page.locator('#retry-participation')).toBeVisible();const same=posts.at(-1);await page.locator('#retry-participation').click();await expect(page.locator('#tier-run')).toBeEnabled();expect(posts.at(-1)).toEqual(same);const resumed=posts.length;await play();expect(posts.length).toBe(resumed);await page.unroute('**/api/courses/scale-lab/participation');
 await expect(page.locator('#complete-lesson')).toBeDisabled();await page.locator('[data-answer="0"]').click();await expect(page.locator('#complete-lesson')).toBeEnabled();saved=await read();expect(saved.progress.completed).toEqual([]);expect(saved.progress.criteria['database-scaling']).toEqual({manual:false,simulation:true,thinking:true});
 await page.locator('#complete-lesson').click();await expect(page.locator('#complete-lesson')).toBeDisabled();saved=await read();expect(saved.progress.completed).toEqual(['database-scaling']);
 await page.reload();await page.locator('[data-lesson="12"]').click();await expect(page.locator('#tier-run')).toBeEnabled();await play();saved=await read();expect(saved.participation.score).toBe(2);expect(saved.progress.completed).toEqual(['database-scaling']);expect(errors).toEqual([]);
 const report={realBackend:true,syntheticAccount:true,guidedEvaluations:5,pageEvaluationCounts:[3,1,1],coverage,navigationReplayPosts:0,originalIdentity:'database-scaling / database-scaling / evaluate-data-tier',semanticSimulationAwards:1,scoreAfterWrongAnswer:2,completed:saved.progress.completed,heldSaveCancellation:true,exactUUIDRetryAfterReset:true,samePageRetry:true,manualCompletionOnly:true,reloadDedup:true,errors};await writeFile(out+'/account-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{if(browser)await browser.close();server.kill('SIGTERM');await new Promise(resolve=>server.exitCode!==null?resolve():server.once('exit',resolve));}