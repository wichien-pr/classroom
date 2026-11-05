// Isolated compiled account QA: synthetic seeded user, never production data.
import {spawn} from 'node:child_process';
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const scratch=process.env.TMPDIR, courses=process.env.QA_COURSES_ROOT;
if(!scratch||!courses||!process.env.QA_PYTHON)throw Error('Set TMPDIR, QA_COURSES_ROOT (isolated compiled tree), QA_PYTHON');
process.env.PLAYWRIGHT_BROWSERS_PATH=root+'courses/scale-lab/.browsers';
const {chromium,expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const out=root+'evidence/flow-thinking-account';await mkdir(out,{recursive:true});
for(const f of ['course.json','assessment.json'])await copyFile(root+'courses/scale-lab/'+f,courses+'/scale-lab/'+f);
const args=[process.env.QA_PYTHON,root+'scripts/theme-qa-server.py'];
const server=spawn(process.env.QA_PYTHON_ARCH?'/usr/bin/arch':args.shift(),process.env.QA_PYTHON_ARCH?['-'+process.env.QA_PYTHON_ARCH,...args]:args,{cwd:root,env:process.env});
let log='',browser;server.stderr.on('data',b=>log+=b);
try{
 const qa=await new Promise((resolve,reject)=>{let s='';const t=setTimeout(()=>reject(Error(log)),20000);server.on('exit',()=>reject(Error(log)));server.stdout.on('data',b=>{s+=b;if(s.includes('\n')){clearTimeout(t);resolve(JSON.parse(s.split('\n')[0]));}});});
 browser=await chromium.launch({channel:'chromium'});const page=await browser.newPage(),checks=[],errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(qa.url+'/login');await page.locator('[name=email]').fill('theme@example.test');await page.locator('[name=password]').fill('QA-theme-only-2026');await page.locator('form button[type=submit]').click();await page.waitForURL(qa.url+'/');
 for(const width of [1280,390,320])for(const theme of ['dark','light']){
  await page.setViewportSize({width,height:800});await page.goto(qa.url+'/courses/scale-lab/');
  if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('#theme-toggle').click();
  const answer=page.locator('[data-answer="1"]');await expect(answer).toBeEnabled();
  const response=page.waitForResponse(r=>r.url().endsWith('/participation')&&r.request().method()==='POST');await answer.click();
  const saved=await response;expect(saved.status()).toBe(200);expect(saved.request().postDataJSON()).toMatchObject({lesson_id:'flow',simulation_id:'check-your-thinking',action:'quiz-answer-b'});
  await expect(answer).toBeEnabled();await expect(page.locator('#feedback')).toContainText('ถูกต้อง —');
  const typography=await page.locator('.quiz').evaluate(q=>Object.fromEntries(['[data-answer]','[data-answer] span','#feedback','#feedback .term-trigger'].map(s=>[s,getComputedStyle(q.querySelector(s)).fontSize])));
  expect(typography['[data-answer]']).toBe('16px');expect(typography['#feedback']).toBe('16px');expect(typography['#feedback .term-trigger']).toBe('16px');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const state=await page.evaluate(async()=>({participation:await fetch('/api/courses/scale-lab/participation').then(r=>r.json()),progress:await fetch('/api/courses/scale-lab/progress').then(r=>r.json())}));
  expect(state.participation.score).toBe(1);expect(state.progress.completed).toEqual([]);expect(state.progress.criteria.flow).toMatchObject({manual:false,simulation:false,thinking:true});
  await page.locator('.quiz').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${theme}-${width}.png`});checks.push({width,theme,typography,score:1,criteria:state.progress.criteria.flow});
 }
 expect(errors).toEqual([]);await writeFile(out+'/report.json',JSON.stringify({checks,errors,realBackend:true,seededAccount:true,restartTested:false},null,2));console.log(JSON.stringify({passed:checks.length,errors}));
}finally{if(browser)await browser.close();server.kill('SIGTERM');await new Promise(resolve=>server.exitCode!==null?resolve():server.once('exit',resolve));}
