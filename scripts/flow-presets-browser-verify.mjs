// Synthetic account only; compiled scratch build, real API readback, no production data.
import {spawn} from 'node:child_process';
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),courses=process.env.QA_COURSES_ROOT;
if(!process.env.TMPDIR||!courses||!process.env.QA_PYTHON)throw Error('Set TMPDIR, QA_COURSES_ROOT and QA_PYTHON');
process.env.PLAYWRIGHT_BROWSERS_PATH=root+'courses/scale-lab/.browsers';
const {chromium,expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const out=root+'evidence/flow-presets-account';await mkdir(out,{recursive:true});
for(const f of ['course.json','assessment.json'])await copyFile(root+'courses/scale-lab/'+f,courses+'/scale-lab/'+f);
const server=spawn('/usr/bin/arch',['-'+(process.env.QA_PYTHON_ARCH||'x86_64'),process.env.QA_PYTHON,root+'scripts/theme-qa-server.py'],{cwd:root,env:process.env});
let log='',browser;server.stderr.on('data',b=>log+=b);
try{
 const qa=await new Promise((resolve,reject)=>{let s='';const t=setTimeout(()=>reject(Error(log)),20000);server.on('exit',()=>reject(Error(log)));server.stdout.on('data',b=>{s+=b;if(s.includes('\n')){clearTimeout(t);resolve(JSON.parse(s.split('\n')[0]));}});});
 browser=await chromium.launch({channel:'chromium'});const page=await browser.newPage({viewport:{width:1280,height:800}}),posts=[],errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(r.method()==='POST'&&/\/(participation|progress)$/.test(r.url()))posts.push(r.postDataJSON());});
 await page.goto(qa.url+'/login');await page.locator('[name=email]').fill('theme@example.test');await page.locator('[name=password]').fill('QA-theme-only-2026');await page.locator('form button[type=submit]').click();await page.waitForURL(qa.url+'/');
 await page.goto(qa.url+'/courses/scale-lab/');await expect(page.locator('#step')).toBeEnabled();
 const read=()=>page.evaluate(async()=>({participation:await fetch('/api/courses/scale-lab/participation').then(r=>r.json()),progress:await fetch('/api/courses/scale-lab/progress').then(r=>r.json())}));
 for(let i=0;i<3;i++)await page.locator('#flow-slide-next').click();for(let i=0;i<3;i++)await page.locator('#flow-slide-back').click();expect(posts).toHaveLength(0);
 for(let topic=0;topic<4;topic++){
  await page.locator('#reset').click();for(let i=0;i<topic;i++)await page.locator('#flow-slide-next').click();
  await expect(page.locator('#flow-result')).toHaveText('ยังไม่ได้ทดลอง');
  const before=posts.length;
  const response=page.waitForResponse(r=>r.url().endsWith('/participation')&&r.request().method()==='POST');
  await page.locator('#step').focus();await page.keyboard.press('Enter');expect((await response).status()).toBe(200);await expect(page.locator('#step')).toBeEnabled();
  expect(posts).toHaveLength(before+1);expect(posts.at(-1)).toMatchObject({lesson_id:'flow',simulation_id:'flow',action:'step'});
  await expect(page.locator('#step')).toBeFocused();
  const saved=await read();expect(saved.participation.score).toBe(1);expect(saved.progress.criteria.flow).toEqual({manual:false,simulation:true,thinking:false});expect(saved.progress.completed).not.toContain('flow');
  await page.locator('#flow-pause').click();await page.locator('#flow-replay').click();await page.locator('#flow-pause').click();expect(posts).toHaveLength(before+1);
 }
 await page.reload();await expect(page.locator('#participation-score')).toHaveText('1');
 const saved=await read();expect(saved.progress.completed).not.toContain('flow');expect(errors).toEqual([]);
 const report={realBackend:true,seededAccount:true,score:saved.participation.score,criteria:saved.progress.criteria.flow,independentTopics:4,mainActionPosts:posts.length,visualAndNavigationPosts:0,reload:true,errors};await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{if(browser)await browser.close();server.kill('SIGTERM');await new Promise(resolve=>server.exitCode!==null?resolve():server.once('exit',resolve));}
