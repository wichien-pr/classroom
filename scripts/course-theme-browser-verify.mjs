import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,mkdtemp,copyFile,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
const {chromium,expect}=await import('../courses/framework-for-system-design-interview/node_modules/@playwright/test/index.mjs');
const root=new URL('../',import.meta.url).pathname;
const evidence=process.env.QA_EVIDENCE||root+'evidence/course-theme/';await mkdir(evidence,{recursive:true});
const {checkNavigation}=await import('./course-navigation-checks.mjs');
const navigation=[];
const privateDir=await mkdtemp(tmpdir()+'/course-theme-build-');
const ids=[];
for(const entry of await readdir(root+'courses/',{withFileTypes:true}))if(entry.isDirectory()){
 try{const m=JSON.parse(await readFile(root+`courses/${entry.name}/course.json`));if(m.enabled)ids.push(entry.name);}catch(e){if(e.code!=='ENOENT')throw e;}
}
const courses=[];let server,browser,qa;let stderr='';
const checks=[],errors=[];
async function theme(p,t){await expect(p.locator('html')).toHaveAttribute('data-theme',t);await expect(p.locator('#theme-toggle')).toHaveAttribute('aria-pressed',String(t==='dark'));await expect(p.locator('#theme-toggle')).toBeVisible();}
try{
 for(const id of ids){
  const manifest=JSON.parse(await readFile(root+`courses/${id}/course.json`));assert.ok(manifest.enabled);courses.push(manifest);
  const dest=privateDir+'/'+id;await mkdir(dest,{recursive:true});await copyFile(root+`courses/${id}/course.json`,dest+'/course.json');
  execFileSync(process.execPath,[root+'courses/framework-for-system-design-interview/node_modules/vite/bin/vite.js','build','--base',`/courses/${id}/`,'--outDir',dest+'/dist'],{cwd:root+`courses/${id}`,env:{...process.env,VITE_CLASSROOM_URL:'/',VITE_CLASSROOM_PROGRESS_URL:`/api/courses/${id}/progress`},stdio:'pipe'});
 }
 const python=process.env.QA_PYTHON||root+'appworks/.venv/bin/python';
 const args=[root+'scripts/theme-qa-server.py'];
 server=spawn(process.env.QA_PYTHON_ARCH?'/usr/bin/arch':python,process.env.QA_PYTHON_ARCH?['-'+process.env.QA_PYTHON_ARCH,python,...args]:args,{cwd:root,env:{...process.env,QA_COURSES_ROOT:privateDir}});
 server.stderr.on('data',b=>stderr+=b);
 qa=await new Promise((resolve,reject)=>{let out='';const t=setTimeout(()=>reject(Error(stderr)),20000);server.once('exit',()=>{clearTimeout(t);reject(Error(stderr));});server.stdout.on('data',b=>{out+=b;if(out.includes('\n')){clearTimeout(t);resolve(JSON.parse(out.split('\n')[0]));}});});
 browser=await chromium.launch({channel:'chromium'});
 const context=await browser.newContext({viewport:{width:1280,height:900},colorScheme:'light'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(/\.(js|css)(\?|$)/.test(r.url())&&r.status()>=400)errors.push(`asset ${r.status()} ${r.url()}`);});
 await page.goto(qa.url+'/login');await page.locator('[name=email]').fill('theme@example.test');await page.locator('[name=password]').fill('QA-theme-only-2026');await page.locator('form button[type=submit]').click();await page.waitForURL(qa.url+'/');
 await page.locator('#theme-toggle').click();await theme(page,'dark');
 for(const course of courses){
  await page.goto(qa.url+`/courses/${course.id}/`);await theme(page,'dark');
  await page.locator('#theme-toggle').focus();await page.keyboard.press('Enter');await theme(page,'light');await expect(page.locator('#theme-toggle')).toBeFocused();
  await page.locator('[data-lesson]').last().click();await theme(page,'light');await page.locator('#theme-toggle').click();await theme(page,'dark');
  await page.reload();await theme(page,'dark');
  for(const width of [1280,390,320])for(const mode of ['light','dark']){
   await page.setViewportSize({width,height:900});if(await page.locator('html').getAttribute('data-theme')!==mode)await page.locator('#theme-toggle').click();
   for(let i=0;i<course.lessons.length;i++){
    await page.locator('[data-lesson]').nth(i).click();await theme(page,mode);
    const navContrast=await checkNavigation(page,mode);
    navigation.push({course:course.id,lesson:i+1,width,mode,colors:navContrast});
    await writeFile(evidence+'navigation.json',JSON.stringify(navigation,null,2));
    assert.deepEqual(navContrast.filter(c=>c.ratio<4.5),[],`navigation contrast ${course.id} ${mode}`);
    if(width===1280){
     const action=page.locator('#calculate, [data-action]').first();await expect(action).toBeEnabled();
     const saved=page.waitForResponse(r=>r.url().endsWith('/participation')&&r.request().method()==='POST');await action.click();assert.equal((await saved).status(),200);
     const answer=page.locator('[data-answer]').first();await expect(answer).toBeEnabled();const answered=page.waitForResponse(r=>r.url().endsWith('/participation')&&r.request().method()==='POST');await answer.click();assert.equal((await answered).status(),200);
     await expect(page.locator('#reset')).toBeEnabled();
    }
    await page.locator('main details').evaluateAll(es=>es.forEach(e=>e.open=true));
    if(i===0&&await page.locator('.term-trigger').count()){
     const term=page.locator('.term-trigger').first();await term.focus();await page.keyboard.press('Enter');
     await expect(page.locator('#term-hint')).toBeVisible();
     const box=await page.locator('#term-hint').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width);
     await page.screenshot({path:evidence+`${course.id}-glossary-${mode}-${width}.png`});
     await page.keyboard.press('Escape');await expect(term).toBeFocused();
    }
    await page.locator('#theme-toggle').focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');await expect(page.locator('#theme-toggle')).toBeFocused();assert.notEqual(await page.locator('#theme-toggle').evaluate(e=>getComputedStyle(e).outlineStyle),'none');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${course.id} ${i} ${mode} ${width}`);
    const box=await page.locator('#theme-toggle').boundingBox();assert.ok(box.width>=44&&box.height>=44&&box.x+box.width<=width);
    if(mode==='dark')assert.equal(await page.locator('html').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(17, 23, 34)');
    const contrast=await page.locator('main p,main li,main h1,main h2,main h3,main label,main summary,main legend,main th,main td,main dd,main dt,main button,.topbar,.course-top').evaluateAll(es=>es.filter(e=>e.getBoundingClientRect().height&&getComputedStyle(e).visibility!=='hidden'&&!e.disabled).map(e=>{
     const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),lum=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
     let p=e,bg;while(p){bg=rgb(getComputedStyle(p).backgroundColor);if(bg.length===3||bg[3]===1)break;p=p.parentElement;}
     const a=lum(rgb(getComputedStyle(e).color)),b=lum(bg);return {tag:e.tagName,cls:e.className,text:e.textContent.slice(0,45),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
    }));
    const failures=contrast.filter(c=>c.ratio<4.5);
    if(failures.length){errors.push({course:course.id,lesson:i+1,width,mode,failures});}
    if(i===0||i===course.lessons.length-1){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:evidence+`${course.id}-${i+1}-${mode}-${width}.png`,fullPage:true});}
    if(width===1280){await page.locator('#reset').click();await theme(page,mode);}
   }
   checks.push(`${course.id} ${width} ${mode}: ${course.lessons.length} lessons, toggle remount, bounds, overflow`);
  }
  await page.locator('.classroom-exit a').click();await page.waitForURL(qa.url+'/');await theme(page,'dark');
 }
 await context.storageState({path:privateDir+'/auth.json'});
 for(const course of courses){
  for(const system of ['light','dark']){
   const fresh=await browser.newContext({storageState:privateDir+'/auth.json',colorScheme:system});await fresh.addInitScript(()=>localStorage.removeItem('classroom-theme'));
   const p=await fresh.newPage();p.on('pageerror',e=>errors.push(String(e)));await p.goto(qa.url+`/courses/${course.id}/`);await theme(p,system);
   await p.emulateMedia({colorScheme:system==='dark'?'light':'dark'});await theme(p,system==='dark'?'light':'dark');await fresh.close();
  }
  const blocked=await browser.newContext({storageState:privateDir+'/auth.json',colorScheme:'dark'});await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('blocked','SecurityError');}}));
  const bp=await blocked.newPage();bp.on('pageerror',e=>errors.push(String(e)));await bp.goto(qa.url+`/courses/${course.id}/`);await theme(bp,'dark');await bp.locator('#theme-toggle').click();await theme(bp,'light');await bp.locator('[data-lesson]').last().click();await theme(bp,'light');await bp.reload();await theme(bp,'dark');await blocked.close();
  const tab=await context.newPage();await tab.goto(qa.url+`/courses/${course.id}/`);await page.locator('#theme-toggle').click();await theme(tab,'light');await tab.locator('#theme-toggle').click();await theme(page,'dark');await tab.close();
  checks.push(`${course.id}: direct system light/dark + changes; blocked storage remount/reload; platform/course cross-tab sync`);
 }
 await writeFile(evidence+'contrast-failure.json',JSON.stringify(errors,null,2));
 assert.deepEqual(errors,[]);
 await writeFile(evidence+'browser.json',JSON.stringify({passed:true,checks,errors,courses:courses.map(c=>({id:c.id,lessons:c.lessons})),isolated:true},null,2));console.log(JSON.stringify({passed:true,checks},null,2));
}finally{
 if(browser)await browser.close();if(server){const exit=once(server,'exit');server.kill('SIGTERM');await exit;}
 if(qa){try{await fetch(qa.url+'/healthz');throw Error('QA listener remains');}catch(e){if(e.message==='QA listener remains')throw e;}}
 await rm(privateDir,{recursive:true,force:true});console.log('Isolated build/database/server cleaned.');
}
