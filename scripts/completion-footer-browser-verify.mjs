// Compiled account QA against disposable SQLite and a seeded synthetic account only.
import {spawn} from 'node:child_process';
import {mkdir,copyFile,writeFile,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const courses=process.env.QA_COURSES_ROOT;
if(!process.env.TMPDIR||!courses||!process.env.QA_PYTHON)throw Error('Set scratch TMPDIR, QA_COURSES_ROOT and QA_PYTHON');
process.env.PLAYWRIGHT_BROWSERS_PATH=root+'courses/scale-lab/.browsers';
const {chromium,expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const manifest=JSON.parse(await readFile(root+'courses/scale-lab/course.json','utf8'));
const out=root+'evidence/completion-footer';await mkdir(out,{recursive:true});
for(const f of ['course.json','assessment.json'])await copyFile(root+'courses/scale-lab/'+f,courses+'/scale-lab/'+f);
const server=spawn('/usr/bin/arch',['-'+(process.env.QA_PYTHON_ARCH||'arm64'),process.env.QA_PYTHON,root+'scripts/theme-qa-server.py'],{cwd:root,env:process.env});
let log='',browser;server.stderr.on('data',b=>log+=b);
try{
 const qa=await new Promise((resolve,reject)=>{let s='';const t=setTimeout(()=>reject(Error(log)),20000);server.on('exit',()=>reject(Error(log)));server.stdout.on('data',b=>{s+=b;if(s.includes('\n')){clearTimeout(t);resolve(JSON.parse(s.split('\n')[0]));}});});
 browser=await chromium.launch({channel:'chromium'});const page=await browser.newPage({viewport:{width:1280,height:800}}),posts=[],errors=[],checks=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(r.method()==='POST'&&/\/(participation|progress)$/.test(r.url()))posts.push(r.postDataJSON());});
 await page.goto(qa.url+'/login');await page.locator('[name=email]').fill('theme@example.test');await page.locator('[name=password]').fill('QA-theme-only-2026');await page.locator('form button[type=submit]').click();await page.waitForURL(qa.url+'/');
 await page.goto(qa.url+'/courses/scale-lab/');await expect(page.locator('#step')).toBeEnabled();
 const read=()=>page.evaluate(async()=>({participation:await fetch('/api/courses/scale-lab/participation').then(r=>r.json()),progress:await fetch('/api/courses/scale-lab/progress').then(r=>r.json())}));
 async function capture(state){for(const width of [1280,390,320])for(const theme of ['dark','light']){
  await page.setViewportSize({width,height:800});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  await page.locator('footer').scrollIntoViewIfNeeded();await page.waitForTimeout(150);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`${out}/account-${state}-${theme}-${width}.png`});
 }}
 await capture('unqualified');
 for(let i=0;i<3;i++)await page.locator('#flow-slide-next').click();for(let i=0;i<3;i++)await page.locator('#flow-slide-back').click();expect(posts).toHaveLength(0);
 for(const [index,kind] of manifest.lessons.entries()){
  await page.locator(`[data-lesson="${index+1}"]`).click();
  await expect(page.locator('footer .lesson-completion')).toHaveCount(1);await expect(page.locator('.lesson-completion')).toHaveCount(1);await expect(page.locator('#next')).toHaveCount(0);
  await expect(page.locator('#complete-lesson')).toBeDisabled();
  await page.locator('[data-answer="0"]').click();await expect(page.locator('[data-answer="0"]')).toBeEnabled();
  await expect(page.locator('#complete-lesson')).toBeDisabled();
  if(!index)await capture('partial');
  const action=manifest.participation[kind][kind][0];await page.locator(`[data-action="${action}"]`).click();await expect(page.locator('#complete-lesson')).toBeEnabled();
  let saved=await read();expect(saved.progress.criteria[kind]).toEqual({manual:false,simulation:true,thinking:true});expect(saved.progress.completed).not.toContain(kind);
  expect(saved.participation.score).toBe((index+1)*2);
  if(!index){await capture('eligible');const before=posts.length;await page.locator('#flow-replay').click();await page.locator('#flow-pause').click();expect(posts).toHaveLength(before);}
  await page.locator(`[data-action="${action}"]`).click();await expect(page.locator('#complete-lesson')).toBeEnabled();saved=await read();expect(saved.participation.score).toBe((index+1)*2);
  await page.locator('#complete-lesson').focus();await page.keyboard.press('Enter');await expect(page.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');
  expect(await page.locator('[aria-current="page"]').getAttribute('data-lesson')).toBe(String(index+1));
  saved=await read();expect(saved.progress.completed).toContain(kind);expect(saved.progress.completed_count).toBe(index+1);
  checks.push({kind,criteria:saved.progress.criteria[kind],score:saved.participation.score});
  if(!index)await capture('completed');
 }
 await page.reload();await expect(page.locator('#progress')).toContainText('12 / 12');await expect(page.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');
 const saved=await read();expect(saved.participation.score).toBe(24);expect(saved.progress.completed).toEqual(manifest.lessons);expect(errors).toEqual([]);
 // Verify the parent-owned standalone compiled preview, not a source dev server.
 const local=await browser.newPage();await local.goto('http://127.0.0.1:4173/');await expect(local.locator('footer #complete-lesson')).toBeDisabled();
 await local.locator('#step').click();await expect(local.locator('#complete-lesson')).toBeDisabled();await local.locator('[data-answer="1"]').click();await expect(local.locator('#complete-lesson')).toBeEnabled();
 await expect(local.locator('#progress')).toContainText('0 / 12');await local.locator('#complete-lesson').click();await local.reload();await expect(local.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');
 for(const width of [1280,390,320])for(const theme of ['dark','light']){await local.setViewportSize({width,height:800});await local.evaluate(t=>document.documentElement.dataset.theme=t,theme);await local.locator('footer').scrollIntoViewIfNeeded();await local.screenshot({path:`${out}/standalone-${theme}-${width}.png`});}
 const report={realBackend:true,seededSyntheticAccount:true,lessons:checks.length,checks,score:saved.participation.score,completionPosts:posts.filter(p=>p.manual).length,unscoredNavigationAndReplay:true,reload:true,standaloneCompiledPreview:true,errors};
 await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{if(browser)await browser.close();server.kill('SIGTERM');await new Promise(resolve=>server.exitCode!==null?resolve():server.once('exit',resolve));}
