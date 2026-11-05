// Synthetic-account compiled QA; no .env, published dist or production database.
import {spawn} from 'node:child_process';
import {mkdir,copyFile,writeFile,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {lessonTopics} from '../courses/scale-lab/src/lesson-topics.js';
import {lessons} from '../courses/scale-lab/src/lessons.js';
const root=fileURLToPath(new URL('../',import.meta.url)),courses=process.env.QA_COURSES_ROOT;
if(!process.env.TMPDIR||!courses||!process.env.QA_PYTHON)throw Error('Set TMPDIR, QA_COURSES_ROOT (isolated compiled tree), QA_PYTHON');
process.env.PLAYWRIGHT_BROWSERS_PATH=root+'courses/scale-lab/.browsers';
const {chromium,expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const out=root+'evidence/lesson-topics-account';await mkdir(out,{recursive:true});
const manifest=JSON.parse(await readFile(root+'courses/scale-lab/course.json'));
for(const f of ['course.json','assessment.json'])await copyFile(root+'courses/scale-lab/'+f,courses+'/scale-lab/'+f);
const args=[process.env.QA_PYTHON,root+'scripts/theme-qa-server.py'];
const server=spawn(process.env.QA_PYTHON_ARCH?'/usr/bin/arch':args.shift(),process.env.QA_PYTHON_ARCH?['-'+process.env.QA_PYTHON_ARCH,...args]:args,{cwd:root,env:process.env});
let log='',browser;server.stderr.on('data',b=>log+=b);
try{
 const qa=await new Promise((resolve,reject)=>{let s='';const t=setTimeout(()=>reject(Error(log)),20000);server.on('exit',()=>reject(Error(log)));server.stdout.on('data',b=>{s+=b;if(s.includes('\n')){clearTimeout(t);resolve(JSON.parse(s.split('\n')[0]));}});});
 browser=await chromium.launch({channel:'chromium'});const page=await browser.newPage({viewport:{width:1280,height:800}}),checks=[],errors=[],posts=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('request',r=>{if(r.method()==='POST'&&/\/(participation|progress)$/.test(r.url()))posts.push({url:r.url().split('/').pop(),payload:r.postDataJSON()});});
 await page.goto(qa.url+'/login');await page.locator('[name=email]').fill('theme@example.test');await page.locator('[name=password]').fill('QA-theme-only-2026');await page.locator('form button[type=submit]').click();await page.waitForURL(qa.url+'/');
 await page.goto(qa.url+'/courses/scale-lab/');
 const getState=()=>page.evaluate(async()=>({participation:await fetch('/api/courses/scale-lab/participation').then(r=>r.json()),progress:await fetch('/api/courses/scale-lab/progress').then(r=>r.json())}));
 async function atTopic(n){let current=Number(await page.locator('#lesson-topic').getAttribute('data-topic'));while(current!==n){await page.locator(current<n?'#lesson-topic-next':'#lesson-topic-back').click();current+=current<n?1:-1;}}
 async function action(kind,id,simulation=kind){
  const selector=id.startsWith('quiz-answer-')?`[data-answer="${id.endsWith('a')?0:1}"]`:`#${id}`;
  if(simulation===kind){const n=lessonTopics[kind].findIndex(t=>t[1].split(' ').includes(id));expect(n).toBeGreaterThanOrEqual(0);await atTopic(n);}
  const button=page.locator(selector);await expect(button).toBeEnabled();
  const response=page.waitForResponse(r=>r.url().endsWith('/participation')&&r.request().method()==='POST');await button.click();const saved=await response;
  expect(saved.status(),id).toBe(200);expect(saved.request().postDataJSON()).toMatchObject({lesson_id:kind,simulation_id:simulation,action:id});
  await expect(button).toBeEnabled();await expect(page.locator('#participation-status')).not.toContainText('กำลัง');
 }
 let expectedScore=0;
 for(const [kind,topics] of Object.entries(lessonTopics)){
  await page.locator(`[data-lesson-kind="${kind}"]`).click();await expect(page.locator('#complete-lesson')).toBeEnabled();
  const start=posts.length;
  await atTopic(topics.length-1);await atTopic(0);expect(posts.length,kind+' navigation POSTs').toBe(start);
  let state=await getState();expect(state.progress.criteria[kind]).toMatchObject({manual:false,simulation:false,thinking:false});
  // Manual-first: skipping all topics alone is not qualification.
  await page.locator('#complete-lesson').click();await expect(page.locator('#complete-lesson')).toHaveText('✓ กดเรียนจบแล้ว');
  state=await getState();expect(state.progress.criteria[kind]).toMatchObject({manual:true,simulation:false,thinking:false});expect(state.progress.completed).not.toContain(kind);
  const actions=manifest.participation[kind][kind];
  for(const id of actions){await action(kind,id);expectedScore++;}
  state=await getState();expect(state.participation.score).toBe(expectedScore);expect(state.progress.criteria[kind]).toMatchObject({manual:true,simulation:true,thinking:false});expect(state.progress.completed).not.toContain(kind);
  const snapshot=await page.locator('#architecture').innerHTML(),message=await page.locator('#outcome').textContent(),afterActions=posts.length;
  await atTopic(topics.length-1);await atTopic(0);expect(posts.length).toBe(afterActions);if(kind==='workload'){await expect(page.locator('#workload-replay')).toBeDisabled();await expect(page.locator('#outcome')).toContainText('กดทดลอง');}else{expect(await page.locator('#architecture').innerHTML()).toBe(snapshot);await expect(page.locator('#outcome')).toHaveText(message);}
  await action(kind,actions[0]);state=await getState();expect(state.participation.score).toBe(expectedScore);
  await action(kind,'quiz-answer-a','check-your-thinking');expectedScore++;await expect(page.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');
  await action(kind,'quiz-answer-b','check-your-thinking');expectedScore++;
  state=await getState();expect(state.participation.score).toBe(expectedScore);expect(state.progress.completed).toContain(kind);
  checks.push({kind,title:lessons.find(l=>l.kind===kind).title,topics:topics.map(t=>({title:t[0],controls:t[1].split(' ')})),actions,criteria:state.progress.criteria[kind],score:expectedScore,navigationPOSTs:0});
  await page.locator('.control-area').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${kind}-result.png`});
 }
 const expectedActions=Object.keys(lessonTopics).flatMap(k=>Object.values(manifest.participation[k]).flat());expect(expectedScore).toBe(expectedActions.length);
 await page.reload();await expect(page.locator('#participation-score')).toHaveText(String(expectedScore));
 const final=await getState();expect(final.progress.completed.slice().sort()).toEqual(Object.keys(lessonTopics).sort());expect(final.progress.criteria.flow).toMatchObject({manual:false,simulation:false,thinking:false});
 expect(checks).toHaveLength(11);expect(errors).toEqual([]);
 await writeFile(out+'/report.json',JSON.stringify({checks,expectedScore,final,postCount:posts.length,errors,realBackend:true,seededAccount:true,reloadTested:true,restartTested:false},null,2));
 console.log(JSON.stringify({lessons:checks.length,topics:checks.reduce((n,c)=>n+c.topics.length,0),score:expectedScore,completed:final.progress.completed.length,errors}));
}finally{if(browser)await browser.close();server.kill('SIGTERM');await new Promise(resolve=>server.exitCode!==null?resolve():server.once('exit',resolve));}
