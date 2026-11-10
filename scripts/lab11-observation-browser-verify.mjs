// Merged LAB11 account QA on a disposable backend.
import {spawn} from 'node:child_process';
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),courses=process.env.QA_COURSES_ROOT;
if(!process.env.TMPDIR||!courses||!process.env.QA_PYTHON)throw Error('Set scratch TMPDIR, QA_COURSES_ROOT and QA_PYTHON');
process.env.PLAYWRIGHT_BROWSERS_PATH=root+'courses/scale-lab/.browsers';
const {chromium,expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const out=process.env.LOGGING_QA_EVIDENCE||root+'evidence/lab11-merge-observation';await mkdir(out,{recursive:true});
for(const f of ['course.json','assessment.json'])await copyFile(root+'courses/scale-lab/'+f,courses+'/scale-lab/'+f);
const server=spawn('/usr/bin/arch',['-'+(process.env.QA_PYTHON_ARCH||'arm64'),process.env.QA_PYTHON,root+'scripts/theme-qa-server.py'],{cwd:root,env:process.env});
let log='',browser;server.stderr.on('data',b=>log+=b);
try{
 const qa=await new Promise((resolve,reject)=>{let s='';const t=setTimeout(()=>reject(Error(log)),20000);server.on('exit',()=>reject(Error(log)));server.stdout.on('data',b=>{s+=b;if(s.includes('\n')){clearTimeout(t);resolve(JSON.parse(s.split('\n')[0]));}});});
 browser=await chromium.launch({channel:'chromium'});const page=await browser.newPage({viewport:{width:390,height:800}}),posts=[],errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(r.method()==='POST'&&/\/(participation|progress)$/.test(r.url()))posts.push(r.postDataJSON());});
 await page.goto(qa.url+'/login');await page.locator('[name=email]').fill('theme@example.test');await page.locator('[name=password]').fill('QA-theme-only-2026');await page.locator('form button[type=submit]').click();await page.waitForURL(qa.url+'/');
 await page.goto(qa.url+'/courses/scale-lab/');await expect(page.locator('#step')).toBeEnabled();await page.locator('[data-lesson="11"]').click();await page.emulateMedia({reducedMotion:'reduce'});
 const read=()=>page.evaluate(async()=>({participation:await fetch('/api/courses/scale-lab/participation').then(r=>r.json()),progress:await fetch('/api/courses/scale-lab/progress').then(r=>r.json())}));
 const select=async index=>{await page.locator('#reset').click();for(let i=0;i<index;i++)await page.locator('#lesson-topic-next').click();};
 const play=async()=>{await page.locator('#logging-run').click();await expect(page.locator('#logging-run')).toBeEnabled({timeout:15000});await expect(page.locator('.logging-scene')).toHaveAttribute('data-playback','finished');};
 const navigate=async()=>{for(let i=0;i<2;i++)await page.locator('#lesson-topic-next').click();for(let i=0;i<2;i++)await page.locator('#lesson-topic-back').click();await page.locator('#logging-replay').click();};
 await navigate();expect(posts).toHaveLength(0);let saved=await read();expect(saved.participation.score).toBe(0);expect(saved.progress.criteria['logging-operations']).toEqual({manual:false,simulation:false,thinking:false});
 // Independently enter every page out of order; no prerequisite posts.
 const actions=[['run-pipeline'],['run-pipeline','run-pipeline','run-pipeline'],['inspect-logs','inspect-metrics','inspect-metrics','inspect-metrics']],coverage=[];
 for(const index of [2,1,0]){
  await select(index);const before=posts.length;await play();expect(posts.slice(before).map(p=>p.action)).toEqual(actions[index]);
  await expect(page.locator('#lesson-topic-title')).toContainText(`${index+1} / 3`);
  const after=posts.length;await page.locator('#logging-replay').click();await expect(page.locator('.logging-scene')).toHaveAttribute('data-playback','finished');expect(posts.length).toBe(after);
  coverage.push({page:index+1,action:actions[index]});
 }
 saved=await read();expect(saved.participation.score).toBe(3);expect(saved.progress.completed).toEqual([]);
 await play();expect((await read()).participation.score).toBe(3);
 // Hold an actual request and navigate while saving; only the captured page saves.
 await select(1);let release,arrived;const held=new Promise(r=>release=r),ready=new Promise(r=>arrived=r);
 await page.route('**/api/courses/scale-lab/participation',async route=>{if(route.request().method()==='POST'){arrived();await held;}await route.continue();});
 const before=posts.length;await page.locator('#logging-run').click();await ready;
 await page.locator('#lesson-topic-next').click();release();await expect(page.locator('#logging-run')).toBeEnabled();await page.waitForTimeout(300);expect(posts.length).toBe(before+1);await expect(page.locator('.logging-scene')).toHaveAttribute('data-stage','observe');await page.unroute('**/api/courses/scale-lab/participation');
 // Lose a response after server commit; retry must resend EXACT event even after navigation/reset.
 await select(1);let lose=true;
 await page.route('**/api/courses/scale-lab/participation',async route=>{if(route.request().method()==='POST'&&lose){lose=false;await route.fetch();await route.abort();}else await route.continue();});
 await page.locator('#logging-run').click();await expect(page.locator('#retry-participation')).toBeVisible();const failed=posts.at(-1);
 await page.locator('#lesson-topic-next').click();await page.locator('#reset').click();const count=posts.length;await page.locator('#retry-participation').click();await expect(page.locator('#logging-run')).toBeEnabled();await page.waitForTimeout(300);expect(posts.length).toBe(count+1);expect(posts.at(-1)).toEqual(failed);await expect(page.locator('.logging-scene')).toHaveAttribute('data-stage','idle');await page.unroute('**/api/courses/scale-lab/participation');
 // Retry on the same merged page resumes after committed Build, not another Build mutation.
 await select(1);await expect(page.locator('.logging-scene')).toHaveAttribute('data-stage','deployed');let drop=true;
 await page.evaluate(()=>{window.mergePhases=[];new MutationObserver(()=>{const key=document.querySelector('.logging-scene')?.dataset.stage;if(key&&window.mergePhases.at(-1)!==key)window.mergePhases.push(key);}).observe(document.querySelector('#architecture'),{childList:true,subtree:true});});
 await page.route('**/api/courses/scale-lab/participation',async route=>{if(route.request().method()==='POST'&&drop){drop=false;await route.fetch();await route.abort();}else await route.continue();});
 const retryStart=posts.length;
 await page.locator('#logging-run').click();await expect(page.locator('#retry-participation')).toBeVisible();
 await expect(page.locator('.logging-scene')).toHaveAttribute('data-stage','build-fixed');
 const captured=posts.at(-1);await page.locator('#retry-participation').click();await expect(page.locator('#logging-run')).toBeEnabled();
 await play();expect(posts.slice(retryStart).map(p=>p.action)).toEqual(['run-pipeline','run-pipeline','run-pipeline','run-pipeline']);
 expect(posts[retryStart+1]).toEqual(captured);
 expect(new Set(posts.slice(retryStart).map(p=>p.event_id)).size).toBe(3);
 expect(await page.evaluate(()=>window.mergePhases.filter(k=>k==='build-fixed').length)).toBe(1);
 await expect(page.locator('.logging-scene')).toHaveAttribute('data-stage','deployed');
 await expect(page.locator('#lesson-topic-title')).toContainText('2 / 3');
 await page.unroute('**/api/courses/scale-lab/participation');
 for(const cancel of [true,false]){
  await select(2);let drop=true;
  await page.route('**/api/courses/scale-lab/participation',async route=>{if(route.request().method()==='POST'&&drop){drop=false;await route.fetch();await route.abort();}else await route.continue();});
  const start=posts.length;await page.locator('#logging-run').click();await expect(page.locator('#retry-participation')).toBeVisible();const event=posts.at(-1);
  if(cancel)await page.locator('#reset').click();
  await page.locator('#retry-participation').click();await expect(page.locator('#logging-run')).toBeEnabled();
  expect(posts[start+1]).toEqual(event);
  if(cancel){await page.waitForTimeout(300);expect(posts.length).toBe(start+2);}
  else{await play();expect(posts.slice(start).map(p=>p.action)).toEqual(['inspect-logs','inspect-logs','inspect-metrics','inspect-metrics','inspect-metrics']);await expect(page.locator('.logging-scene')).toHaveAttribute('data-stage','observe');}
  await page.unroute('**/api/courses/scale-lab/participation');
 }
 await select(2);let releaseObservation,arriveObservation;const observationGate=new Promise(r=>releaseObservation=r),observationReady=new Promise(r=>arriveObservation=r);
 await page.route('**/api/courses/scale-lab/participation',async route=>{if(route.request().method()==='POST'){arriveObservation();await observationGate;}await route.continue();});
 const observationStart=posts.length;await page.locator('#logging-run').click();await observationReady;await page.locator('#lesson-topic-back').click();releaseObservation();await expect(page.locator('#logging-run')).toBeEnabled();await page.waitForTimeout(300);expect(posts.length).toBe(observationStart+1);await page.unroute('**/api/courses/scale-lab/participation');
 await page.locator('#reset').click();
 const baseline=posts.length;await navigate();expect(posts.length).toBe(baseline);
 saved=await read();expect(saved.participation.score).toBe(3);expect(saved.progress.criteria['logging-operations']).toEqual({manual:false,simulation:true,thinking:false});expect(saved.progress.completed).toEqual([]);expect(errors).toEqual([]);
 await page.reload();await page.locator('[data-lesson="11"]').click();expect((await read()).participation.score).toBe(3);await expect(page.locator('#complete-lesson')).toBeDisabled();
 const report={realBackend:true,syntheticAccount:true,coverage,navigationPlaybackPosts:0,semanticScore:saved.participation.score,completed:saved.progress.completed,heldSaveCancellation:true,observationSaveCancellation:true,observationExactRetry:true,mergedExactRetryWithoutRepeatedMutation:true,lostResponseExactRetryAfterReset:true,reload:true,errors};await writeFile(out+'/account-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{if(browser)await browser.close();server.kill('SIGTERM');await new Promise(resolve=>server.exitCode!==null?resolve():server.once('exit',resolve));}
