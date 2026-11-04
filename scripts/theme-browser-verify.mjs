import assert from 'node:assert/strict';
import {checkCatalog} from './catalog-checks.mjs';
import {mkdir, writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
const {chromium, expect} = await import('../courses/framework-for-system-design-interview/node_modules/@playwright/test/index.mjs');
const root = new URL('../', import.meta.url).pathname;
const evidence = root+(process.env.QA_EVIDENCE || 'evidence/theme/');
await mkdir(evidence,{recursive:true});
const python = process.env.QA_PYTHON || root+'appworks/.venv/bin/python';
const args = [root+'scripts/theme-qa-server.py'];
const server = process.env.QA_PYTHON_ARCH ? spawn('/usr/bin/arch',['-'+process.env.QA_PYTHON_ARCH,python,...args],{cwd:root}) : spawn(python,args,{cwd:root});
let log=''; server.stderr.on('data',b=>{log+=b;});
const qa = await new Promise((resolve,reject)=>{
  let out=''; const timer=setTimeout(()=>reject(new Error('QA startup timeout: '+log)),20000);
  server.once('exit',()=>{clearTimeout(timer);reject(new Error('QA startup failed: '+log));});
  server.stdout.on('data',b=>{out+=b; if(out.includes('\n')){clearTimeout(timer);resolve(JSON.parse(out.split('\n')[0]));}});
});
const browser = await chromium.launch({channel:'chromium'});
const checks=[], errors=[], shots=[];
const check = text=>checks.push(text);
async function theme(page,value){await expect(page.locator('html')).toHaveAttribute('data-theme',value);await expect(page.locator('#theme-toggle')).toHaveAttribute('aria-pressed',String(value==='dark'));}
async function shot(page,name){const path=evidence+name+'.png';await page.screenshot({path,fullPage:true});shots.push(path);}
try {
  const context=await browser.newContext({colorScheme:'dark',viewport:{width:1280,height:900}});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(qa.url+'/login'); await theme(page,'dark');check('system dark default');
  await page.locator('#theme-toggle').focus();await page.keyboard.press('Enter');await theme(page,'light');
  await expect(page.locator('#theme-toggle')).toBeFocused();
  assert.notEqual(await page.locator('#theme-toggle').evaluate(e=>getComputedStyle(e).outlineStyle),'none');
  await page.reload();await theme(page,'light');
  await page.emulateMedia({colorScheme:'dark'});await theme(page,'light');check('keyboard toggle, focus, explicit preference persists over reload/system');
  await page.locator('[name=email]').fill('theme@example.test');await page.locator('[name=password]').fill('QA-theme-only-2026');
  await page.locator('form button[type=submit]').click();await page.waitForURL(qa.url+'/');await theme(page,'light');check('real synthetic-account login preserves preference');
  await shot(page,'header-layout-start');
  assert.ok(await page.locator('.top #theme-toggle').evaluate(e=>!['absolute','fixed'].includes(getComputedStyle(e).position)), 'header theme toggle must participate in normal layout, not an overlay');
  for(const width of [1920,1280,900,768,390,320]) {
    await page.setViewportSize({width,height:900});
    for(const mode of ['light','dark']) {
      if(await page.locator('html').getAttribute('data-theme')!==mode)await page.locator('#theme-toggle').click();
      for(const [route,name] of [['/','catalog'],['/leaderboards','leaderboards'],['/account/profile','profile'],['/account/profile/edit','editor'],['/community','community'],['/exam','exam']]){
        await page.goto(qa.url+route);await theme(page,mode);
        if(name==='catalog')await checkCatalog(page,mode,width);
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow: ${name} ${mode} ${width}`);
        const box=await page.locator('#theme-toggle').boundingBox();
        const layout=await page.locator('.top').evaluate(top=>{
          const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};
          const q=s=>rect(top.querySelector(s));
          return {top:rect(top),brand:q('.header-brand'),actions:q('.header-actions'),account:q('.account-link'),logout:q('form button'),toggle:q('#theme-toggle'),nav:rect(document.querySelector('header nav')),padding:getComputedStyle(top).paddingRight,position:getComputedStyle(top.querySelector('#theme-toggle')).position};
        });
        const {top,brand,actions,account,logout,toggle,nav}=layout;
        assert.ok(box.width>=44&&box.height>=44&&box.x+box.width<=width,`toggle bounds ${name}`);
        assert.equal(layout.position,'static','toggle participates in flow');
        assert.ok(Math.abs(top.x-(width-top.right))<1&&top.w<=1160,'centered max-width rail');
        assert.equal(layout.padding,width<=600?'16px':'24px','symmetric gutters, no reserved overlay space');
        assert.ok(Math.abs(toggle.right-(top.right-parseFloat(layout.padding)))<1,'actions end at right gutter');
        assert.ok(Math.abs(logout.h-toggle.h)<1&&Math.abs(logout.y-toggle.y)<1,'logout and theme share height and alignment');
        assert.ok(Math.abs(toggle.x-logout.right-12)<1,'consistent control gap');
        assert.ok(nav.y>=top.bottom-1&&brand.bottom<=top.bottom&&actions.bottom<=top.bottom,'header groups stay in flow above nav');
        for(const a of [account,logout,toggle])assert.ok(a.x>=top.x&&a.right<=top.right&&a.h>=44,'controls contained and touch-sized');
        assert.ok(account.right<=logout.x||account.bottom<=logout.y,'profile never overlaps logout');
        if(width>=1280)assert.ok(Math.abs(account.y+account.h/2-(brand.y+brand.h/2))<1,'desktop groups centered vertically');
        if(width<=600)assert.ok(account.bottom<=logout.y&&brand.bottom<=account.y,'mobile groups wrap in reading order');
        await expect(page.locator('header nav a[href="/community"]')).toHaveCount(0);
        const contrasts=await page.locator('header nav a, #theme-toggle, main h1, main p, .cover small, main th, main td, main .rank').evaluateAll(elements=>elements.filter(e=>e.getBoundingClientRect().height>0).map(e=>{
          const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number);
          const lum=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
          let parent=e,bg;while(parent){bg=rgb(getComputedStyle(parent).backgroundColor);if(bg.length===3||bg[3]>0)break;parent=parent.parentElement;}
          const a=lum(rgb(getComputedStyle(e).color)),b=lum(bg);return {text:e.textContent.slice(0,45),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
        }));
        assert.ok(contrasts.every(c=>c.ratio>=4.5),`contrast ${name} ${mode}: ${JSON.stringify(contrasts.filter(c=>c.ratio<4.5))}`);
        if(['catalog','profile','community','leaderboards'].includes(name))await shot(page,`${name}-${mode}-${width}`);
      }
      check(`${width}px ${mode}: six authenticated pages, balanced in-flow header, aligned 44px controls, no overflow, hidden Community nav`);
    }
  }
  await page.goto(qa.url+'/community');
  if(await page.locator('html').getAttribute('data-theme')!=='dark')await page.locator('#theme-toggle').click();
  await page.locator('#presence-toggle').click();await expect(page.locator('#presence-panel')).toBeVisible();
  await shot(page,'presence-dark-320');await page.locator('#presence-close').click();
  await page.locator('#write-prompt').click();await expect(page.locator('#composer-dialog')).toBeVisible();
  for(const selector of ['#compose-title','#composer .category-select'])assert.equal(await page.locator(selector).evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(27, 36, 50)',selector);
  await shot(page,'composer-dark-320');await page.keyboard.press('Escape');check('dark presence disclosure and composer dialog');
  await page.goto(qa.url+'/');await page.locator('#theme-toggle').click();
  const selected=await page.locator('html').getAttribute('data-theme');
  await page.locator('.card').first().click();await expect(page.locator('html')).toHaveAttribute('data-theme',selected);
  await page.goto(qa.url+'/');await theme(page,selected);check('shared preference applied to course HTML and retained on return (published course dist is not rebuilt by this runner)');
  const tab=await context.newPage();await tab.goto(qa.url+'/');await page.locator('#theme-toggle').click();
  await theme(tab,await page.locator('html').getAttribute('data-theme'));check('cross-tab preference sync');
  for(const width of [1280,390,320]) {
    const guest=await browser.newContext({colorScheme:'light',viewport:{width,height:900}}), p=await guest.newPage();
    for(const route of ['/login','/register','/forgot-password','/reset-password']) {
      await p.goto(qa.url+route);await p.evaluate(()=>localStorage.removeItem('classroom-theme'));await p.reload();await theme(p,'light');
      await p.locator('#theme-toggle').click();await theme(p,'dark');
      assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      if(route==='/login')await shot(p,`login-dark-${width}`);
    }
    await guest.close();check(`${width}px guest auth/recovery pages both themes`);
  }
  const fallback=await browser.newContext({colorScheme:'dark'});
  await fallback.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}});});
  const blocked=await fallback.newPage();blocked.on('pageerror',e=>errors.push(String(e)));
  await blocked.goto(qa.url+'/login');await theme(blocked,'dark');await blocked.locator('#theme-toggle').click();await theme(blocked,'light');check('blocked storage degrades to usable in-page toggle');
  const system=await browser.newContext({colorScheme:'light'}), p=await system.newPage();
  await p.goto(qa.url+'/login');await theme(p,'light');await p.emulateMedia({colorScheme:'dark'});await theme(p,'dark');
  await p.evaluate(()=>localStorage.setItem('classroom-theme','invalid'));await p.reload();await theme(p,'dark');check('unselected system changes and invalid-storage fallback');
  for(const width of [1280,768,390,320]) {
    await page.setViewportSize({width,height:900});await page.goto(qa.url+'/');
    await page.locator('.account-link>span:last-child').evaluate(e=>e.textContent='ชื่อสมาชิกยาวมาก'.repeat(8));
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'long display name stays contained');
    const name=page.locator('.account-link');
    assert.ok(await name.evaluate(e=>e.scrollWidth<=e.clientWidth),'long display name wraps without clipping');
    if(width<=390)await page.locator('header').screenshot({path:evidence+`header-long-name-${width}.png`});
  }
  check('long display names wrap at desktop/tablet/390/320px');
  for(const width of [1280,390,320]) {
    await page.setViewportSize({width,height:900});
    for(const mode of ['light','dark']) {
      await page.goto(qa.url+'/');
      if(await page.locator('html').getAttribute('data-theme')!==mode)await page.locator('#theme-toggle').click();
      const path=evidence+`header-${mode}-${width}.png`;
      await page.locator('header').screenshot({path});shots.push(path);
    }
  }
  await page.locator('.account-link').click();await page.waitForURL(qa.url+'/account/profile');
  await page.locator('.header-actions form button').click();await page.waitForURL(qa.url+'/login');
  await page.goto(qa.url+'/');await page.waitForURL(qa.url+'/login');
  check('header profile link and CSRF logout work; protected catalog redirects after logout');
  assert.deepEqual(errors,[]);
  const result={passed:true,checksPassed:checks.length,checks,pageErrors:errors,screenshots:shots,isolatedDatabase:true,notDeployed:true};
  await writeFile(evidence+'browser.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
} finally {
  await browser.close();
  const exited=once(server,'exit');server.kill('SIGTERM');await exited;
  try {await fetch(qa.url+'/healthz');throw new Error('QA listener still alive');}catch(error){if(error.message==='QA listener still alive')throw error;}
  console.log('Owned QA server terminated; listener closed.');
}
