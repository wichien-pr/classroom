// Isolated synthetic-account verification; never loads the production .env/database.
import {spawn} from 'node:child_process';
import {mkdir,copyFile,writeFile,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),courses=process.env.QA_COURSES_ROOT;
if(!process.env.TMPDIR||!courses||!process.env.QA_PYTHON)throw Error('Set TMPDIR, QA_COURSES_ROOT and QA_PYTHON');
process.env.PLAYWRIGHT_BROWSERS_PATH=root+'courses/scale-lab/.browsers';
const {chromium,expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const out=process.env.QA_EVIDENCE||root+'evidence/lab02-presets-account';await mkdir(out,{recursive:true});
for(const f of ['course.json','assessment.json'])await copyFile(root+'courses/scale-lab/'+f,courses+'/scale-lab/'+f);
const args=[process.env.QA_PYTHON,root+'scripts/theme-qa-server.py'];
const server=spawn(process.env.QA_PYTHON_ARCH?'/usr/bin/arch':args.shift(),process.env.QA_PYTHON_ARCH?['-'+process.env.QA_PYTHON_ARCH,...args]:args,{cwd:root,env:process.env});
let log='',browser;server.stderr.on('data',b=>log+=b);
try{
 const qa=await new Promise((resolve,reject)=>{let s='';const t=setTimeout(()=>reject(Error(log)),20000);server.on('exit',()=>reject(Error(log)));server.stdout.on('data',b=>{s+=b;if(s.includes('\n')){clearTimeout(t);resolve(JSON.parse(s.split('\n')[0]));}});});
 browser=await chromium.launch({channel:'chromium'});const page=await browser.newPage({viewport:{width:1280,height:800}}),posts=[],errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(r.method()==='POST'&&/\/(participation|progress)$/.test(r.url()))posts.push(r.postDataJSON());});
 await page.goto(qa.url+'/login');await page.locator('[name=email]').fill('theme@example.test');await page.locator('[name=password]').fill('QA-theme-only-2026');await page.locator('form button[type=submit]').click();await page.waitForURL(qa.url+'/');
 await page.goto(qa.url+'/courses/scale-lab/');await page.locator('[data-lesson-kind="workload"]').click();await expect(page.locator('#estimate')).toBeEnabled();
 const read=()=>page.evaluate(async()=>({participation:await fetch('/api/courses/scale-lab/participation').then(r=>r.json()),progress:await fetch('/api/courses/scale-lab/progress').then(r=>r.json())}));
 for(let i=0;i<3;i++)await page.locator('#lesson-topic-next').click();for(let i=0;i<3;i++)await page.locator('#lesson-topic-back').click();expect(posts).toHaveLength(0);expect((await read()).participation.score).toBe(0);await expect(page.locator('#lesson-topic input,#lesson-topic select,#lesson-topic-settings')).toHaveCount(0);
 async function run(){const response=page.waitForResponse(r=>r.url().endsWith('/participation')&&r.request().method()==='POST');await page.locator('#estimate').click();expect((await response).status()).toBe(200);await expect(page.locator('#estimate')).toBeEnabled();}
 await run();expect(posts[0]).toMatchObject({lesson_id:'workload',simulation_id:'workload',action:'estimate'});
 let saved=await read();expect(saved.participation.score).toBe(1);expect(saved.progress.criteria.workload).toEqual({manual:false,simulation:true,thinking:false});
 const before=posts.length;await page.locator('#workload-pause').click();await page.locator('#workload-replay').click();await page.locator('#lesson-topic-next').click();await page.locator('#lesson-topic-back').click();expect(posts).toHaveLength(before);
 await expect(page.locator('#workload-scenario')).toContainText('Web 3');expect((await read()).participation.score).toBe(1);
 await page.locator('#lesson-topic-next').click();await run();await expect(page.locator('.workload-scene')).toHaveAttribute('data-layout','single');
 await page.locator('#lesson-topic-next').click();await run();await expect(page.locator('#workload-result')).toContainText('อ่านข้อมูลไม่ได้');expect((await read()).participation.score).toBe(1);
 await page.locator('#lesson-topic-next').click();
 for(const [frame,verdict] of [[1,'เหมาะเป็นจุดเริ่มต้น'],[2,'ทบทวนตัวเลือก'],[3,'เหมาะเป็นจุดเริ่มต้น']]){await run();await expect(page.locator('#workload-scenario')).toContainText(`กรณี ${frame}/3`);await expect(page.locator('#workload-result')).toContainText(verdict);expect((await read()).participation.score).toBe(1);}
 await page.reload();await expect(page.locator('#participation-score')).toHaveText('1');saved=await read();expect(saved.progress.completed).not.toContain('workload');expect(errors).toEqual([]);
 const report={realBackend:true,seededAccount:true,score:saved.participation.score,criteria:saved.progress.criteria.workload,mainActionPosts:posts.length,visualAndNavigationPosts:0,reload:true,errors};await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{if(browser)await browser.close();server.kill('SIGTERM');await new Promise(resolve=>server.exitCode!==null?resolve():server.once('exit',resolve));}
