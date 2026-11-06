// Real compiled LAB03 APIs, synthetic account and disposable SQLite only.
import {spawn} from 'node:child_process';
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),courses=process.env.QA_COURSES_ROOT;
if(!process.env.TMPDIR||!courses||!process.env.QA_PYTHON)throw Error('Set scratch TMPDIR, QA_COURSES_ROOT and QA_PYTHON');
process.env.PLAYWRIGHT_BROWSERS_PATH=root+'courses/scale-lab/.browsers';
const {chromium,expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const out=root+'evidence/lab03-presentation';await mkdir(out,{recursive:true});
for(const f of ['course.json','assessment.json'])await copyFile(root+'courses/scale-lab/'+f,courses+'/scale-lab/'+f);
const server=spawn('/usr/bin/arch',['-'+(process.env.QA_PYTHON_ARCH||'arm64'),process.env.QA_PYTHON,root+'scripts/theme-qa-server.py'],{cwd:root,env:process.env});
let log='',browser;server.stderr.on('data',b=>log+=b);
try{
 const qa=await new Promise((resolve,reject)=>{let s='';const t=setTimeout(()=>reject(Error(log)),20000);server.on('exit',()=>reject(Error(log)));server.stdout.on('data',b=>{s+=b;if(s.includes('\n')){clearTimeout(t);resolve(JSON.parse(s.split('\n')[0]));}});});
 browser=await chromium.launch({channel:'chromium'});const page=await browser.newPage({viewport:{width:1280,height:800}}),posts=[],errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(r.method()==='POST'&&/\/(participation|progress)$/.test(r.url()))posts.push(r.postDataJSON());});
 await page.goto(qa.url+'/login');await page.locator('[name=email]').fill('theme@example.test');await page.locator('[name=password]').fill('QA-theme-only-2026');await page.locator('form button[type=submit]').click();await page.waitForURL(qa.url+'/');
 await page.goto(qa.url+'/courses/scale-lab/');await expect(page.locator('#step')).toBeEnabled();await page.locator('[data-lesson="3"]').click();
 const read=()=>page.evaluate(async()=>({participation:await fetch('/api/courses/scale-lab/participation').then(r=>r.json()),progress:await fetch('/api/courses/scale-lab/progress').then(r=>r.json())}));
 for(let i=0;i<4;i++)await page.locator('#lesson-topic-next').click();for(let i=0;i<4;i++)await page.locator('#lesson-topic-back').click();expect(posts).toHaveLength(0);expect((await read()).participation.score).toBe(0);
 await page.locator('[data-answer="0"]').click();await expect(page.locator('#order')).toBeEnabled();await expect(page.locator('#complete-lesson')).toBeDisabled();
 for(let i=0;i<5;i++){
  await page.locator('#order').click();await expect(page.locator('#order')).toBeEnabled();await expect(page.locator('#complete-lesson')).toBeEnabled();
  expect(posts.at(-1)).toMatchObject({lesson_id:'stock',simulation_id:'stock',action:'order'});
  const saved=await read();expect(saved.participation.score).toBe(2);expect(saved.progress.criteria.stock).toEqual({manual:false,simulation:true,thinking:true});
  const count=posts.length,result=await page.locator('#scaling-result').innerText();await page.locator('#scaling-replay').click();await page.locator('#scaling-pause').click();await page.locator('#scaling-pause').click();await page.locator('#scaling-replay').click();expect(await page.locator('#scaling-result').innerText()).toBe(result);
  if(i<4)await page.locator('#lesson-topic-next').click();await page.waitForTimeout(50);expect(posts).toHaveLength(count);expect((await read()).participation.score).toBe(2);
 }
 await page.reload();await page.locator('[data-lesson="3"]').click();await expect(page.locator('#complete-lesson')).toBeEnabled();await page.locator('#complete-lesson').click();await expect(page.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');await page.reload();await page.locator('[data-lesson="3"]').click();await expect(page.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');
 const saved=await read();expect(saved.progress.completed).toEqual(['stock']);expect(saved.participation.score).toBe(2);expect(errors).toEqual([]);
 const local=await browser.newPage();await local.goto('http://127.0.0.1:4173/');await local.locator('[data-lesson="3"]').click();await expect(local.locator('#lesson-topic-title')).toContainText('1 / 5');await expect(local.locator('#complete-lesson')).toBeDisabled();await local.locator('[data-answer="0"]').click();await expect(local.locator('#complete-lesson')).toBeDisabled();await local.locator('#order').click();await expect(local.locator('#complete-lesson')).toBeEnabled();await local.locator('#complete-lesson').click();await local.reload();await local.locator('[data-lesson="3"]').click();await expect(local.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');
 for(let i=0;i<3;i++)await local.locator('#lesson-topic-next').click();await local.locator('#order').click();await local.locator('#scaling-pause').click();
 for(const width of [1280,390,320])for(const theme of ['dark','light']){
  await local.setViewportSize({width,height:800});await local.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  await local.locator('#lesson-topic').evaluate(e=>window.scrollBy(0,e.getBoundingClientRect().top-100));await local.screenshot({path:`${out}/preview-${theme}-${width}-header.png`});
  await local.locator('.workload-actions').scrollIntoViewIfNeeded();await local.screenshot({path:`${out}/preview-${theme}-${width}-result.png`});
  expect(await local.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 const report={realBackend:true,syntheticAccount:true,topics:5,experimentPosts:posts.filter(p=>p.action==='order').length,semanticScore:saved.participation.score,completed:saved.progress.completed,wrongAnswerQualifies:true,playbackNavigationPosts:0,reload:true,standalonePreview:true,errors};await writeFile(out+'/account-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{if(browser)await browser.close();server.kill('SIGTERM');await new Promise(resolve=>server.exitCode!==null?resolve():server.once('exit',resolve));}
