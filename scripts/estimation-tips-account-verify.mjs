// Isolated genuine OTP + browser + Flask/SQLite; fault injection never fabricates API success.
import assert from 'node:assert/strict';import {readFile,writeFile} from 'node:fs/promises';
import {completeRegistration} from './complete-registration.mjs';
import {lessons} from '../courses/back-of-the-envelope-estimation/src/lessons.js';
import {chromium} from '../courses/back-of-the-envelope-estimation/node_modules/playwright/index.mjs';
import {expect} from '../courses/back-of-the-envelope-estimation/node_modules/@playwright/test/index.mjs';
const evidence=new URL('../evidence/estimation-tips/account-qa/',import.meta.url),info=JSON.parse(await readFile(new URL('server.json',evidence))),base=info.base,id='back-of-the-envelope-estimation',url=base+'/courses/'+id+'/',api=base+'/api/courses/'+id;
process.env.CLASSROOM_QA_MAIL_DIR=info.qa;
const browser=await chromium.launch({channel:'chrome',headless:true});const posts=[],assets=[],errors=[],checks=[];
const manifest=JSON.parse(await readFile(new URL('../courses/back-of-the-envelope-estimation/course.json',import.meta.url)));
const resume=process.argv.includes('--restart');const privateFile=info.qa+'/browser-users.json';
let users=resume?JSON.parse(await readFile(privateFile)):Array.from({length:2},(_,i)=>({email:`estimation-${Date.now()}-${i}@example.test`,password:crypto.randomUUID(),name:`Estimation QA ${i+1}`}));
if(!resume)await writeFile(privateFile,JSON.stringify(users),{mode:0o600});
async function setup(user,register=false){const context=await browser.newContext({viewport:{width:1440,height:1100}});await context.addInitScript(()=>{Math.random=()=>Number(sessionStorage.getItem('qa-random')||0);});const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));page.on('response',async r=>{if(r.url().includes('/assets/'))assets.push({path:new URL(r.url()).pathname,status:r.status()});if(r.request().method()==='POST'&&r.url()===api+'/participation'&&r.status()===200){try{posts.push({request:r.request().postDataJSON(),response:await r.json()})}catch{}}});
 if(register){await page.goto(base+'/register');await page.locator('[name=name]').fill(user.name);await page.locator('[name=email]').fill(user.email);await page.locator('[name=password]').fill(user.password);await page.locator('button[type=submit]').click();await completeRegistration(page,user.email)}
 await login(page,user);return {context,page}}
async function login(page,user){await page.goto(base+'/login');await page.locator('[name=email]').fill(user.email);await page.locator('[name=password]').fill(user.password);await page.locator('button[type=submit]').click();await page.waitForURL(base+'/');await page.goto(url);await ready(page)}
async function ready(p){await expect(p.locator('#calculate')).toBeEnabled();await expect(p.locator('[data-answer="0"]')).toBeEnabled()}
async function score(p,n){await expect(p.locator('#score')).toHaveText(String(n));await ready(p)}
async function snapshot(p,course=id){return (await p.request.get(base+'/api/courses/'+course+'/progress')).json()}
async function act(p,selector){await p.locator(selector).click();await ready(p)}
try{
 const guest=await browser.newContext();const gp=await guest.newPage();await gp.goto(url);assert.equal(new URL(gp.url()).pathname,'/login');assert.equal((await gp.request.get(api+'/progress')).status(),401);assert.equal((await gp.request.get(api+'/participation')).status(),401);await guest.close();checks.push('guest protections');
 if(resume){for(let i=0;i<2;i++){const {page,context}=await setup(users[i]);await score(page,i===0?18:2);assert.equal((await snapshot(page)).completed_count,i===0?6:1);assert.equal((await snapshot(page,'scale-lab')).completed_count,0);await context.close()}checks.push('both account scores/qualification and Scale Lab isolation survive process restart');await writeFile(new URL('restart.json',evidence),JSON.stringify({checks,errors},null,2));console.log('Restart verified: A 6/6 + 18; B 1/6 + 2; Scale Lab zero for both');}
 else{
 const {page:p,context:c}=await setup(users[0],true);await score(p,0);
 // Account mode must not read/write local history, even when unavailable.
 await p.addInitScript(()=>{Storage.prototype.getItem=new Proxy(Storage.prototype.getItem,{apply(target,self,args){if(self===localStorage)throw Error('account read localStorage');return Reflect.apply(target,self,args)}});Storage.prototype.setItem=new Proxy(Storage.prototype.setItem,{apply(target,self,args){if(self===localStorage)throw Error('account write localStorage');return Reflect.apply(target,self,args)}})});
 await p.reload();await ready(p);assert.equal((await snapshot(p)).completed_count,0);
 await p.locator('#input-amount').fill('');await p.locator('#calculate').click();await expect(p.locator('#input-error')).not.toHaveText('');await score(p,0);await p.locator('#reset').click();assert.equal((await snapshot(p)).criteria['estimate-units'].simulation,false);checks.push('invalid/empty inputs and reset do not award');
 let n=0;
 for(let i=0;i<lessons.length;i++){
  const l=lessons[i];await p.locator(`[data-lesson="${l.id}"]`).click();assert.deepEqual(await p.locator('[data-answer]').evaluateAll(es=>es.map(e=>e.dataset.answer)),['0','1']);
  if(i%2===0){await act(p,'#complete-lesson');assert.equal((await snapshot(p)).criteria[l.id].manual,true);assert.equal((await snapshot(p)).completed_count,i)}
  await act(p,'#calculate');await score(p,++n);
  const wrong=l.answers.findIndex(a=>!a.correct);await act(p,`[data-answer="${wrong}"]`);await score(p,++n);
  if(i%2){assert.equal((await snapshot(p)).criteria[l.id].manual,false);assert.equal((await snapshot(p)).completed_count,i);await act(p,'#complete-lesson')}
  assert.equal((await snapshot(p)).completed_count,i+1);
  await act(p,`[data-answer="${1-wrong}"]`);await score(p,++n);
  const selected=await p.locator('[data-answer][aria-pressed=true]').getAttribute('data-answer');await p.locator('#reset').click();assert.equal(await p.locator('[data-answer][aria-pressed=true]').getAttribute('data-answer'),selected);
  await act(p,'#calculate');await score(p,n);await act(p,`[data-answer="${wrong}"]`);await score(p,n);
  await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:new URL(`account-${l.id}.png`,evidence).pathname,fullPage:true});
  checks.push({lesson:l.id,actions:manifest.participation[l.id],qualified:true,wrongQualifies:true,dedup:true});
 }
 assert.equal(n,18);
 const state=await snapshot(p),event={lesson_id:'estimate-units',simulation_id:'estimate-units',action:'calculate',event_id:crypto.randomUUID()};
 const send=body=>p.request.post(api+'/participation',{data:body,headers:{'X-CSRF-Token':state.csrf_token,Origin:base}});
 const concurrent=await Promise.all(Array.from({length:4},()=>send(event)));for(const response of concurrent){assert.equal(response.status(),200);assert.equal((await response.json()).awarded,false)}
 assert.equal((await send({...event,simulation_id:'check-your-thinking',action:'quiz-answer-a'})).status(),409);checks.push('concurrent semantic dedup and conflicting UUID rejected by real server');
 await p.evaluate(()=>sessionStorage.setItem('qa-random','.99'));await p.reload();await score(p,18);assert.deepEqual(await p.locator('[data-answer]').evaluateAll(es=>es.map(e=>e.dataset.answer)),['1','0']);await act(p,'[data-answer="0"]');await score(p,18);checks.push('opposite shuffle preserves semantic identity');
 // Real commit, then lost response; navigation cannot change captured retry payload.
 let lostBody;await p.route('**/api/courses/'+id+'/participation',async route=>{if(route.request().method()!=='POST')return route.continue();lostBody=route.request().postDataJSON();const response=await route.fetch();assert.equal(response.status(),200);await route.abort('failed');await p.unroute('**/api/courses/'+id+'/participation')});
 await p.locator('[data-answer="1"]').click();await expect(p.locator('#retry')).toBeVisible();await p.locator('[data-lesson="estimate-tips"]').click();await p.locator('#retry').click();await score(p,18);assert.equal(posts.at(-1).request.event_id,lostBody.event_id);assert.equal(posts.at(-1).request.lesson_id,'estimate-units');checks.push('lost response after real commit retains UUID and lesson across navigation');
 // Real load failure is explicit and no local fallback; retry loads server state.
 await p.route('**/api/courses/'+id+'/progress',route=>route.abort());await p.reload();await expect(p.locator('#retry')).toBeVisible();assert.equal(await p.locator('#calculate').isDisabled(),true);await p.unroute('**/api/courses/'+id+'/progress');await p.locator('#retry').click();await score(p,18);checks.push('load failure/retry blocks shared controls');
 const sourceResponse=await p.request.get(url+'assessment.json');assert.equal(sourceResponse.status(),404);assert.equal((await p.request.get(url+'src/main.js')).status(),404);assert.equal((await p.request.get(url+'assets/missing.js')).status(),404);await p.goto(url+'deep/route');await ready(p);checks.push('private bank/source excluded; asset 404; deep refresh');
 const returnLink=p.getByRole('link',{name:'ออกจากคลาส · กลับหน้าแรก'});await returnLink.click();await p.waitForURL(base+'/');await expect(p.locator(`a[href="/courses/${id}/"]`)).toContainText(manifest.title);await p.goto(url);await score(p,18);
 for(const width of [320,390,1440]){await p.setViewportSize({width,height:1000});for(const l of lessons){await p.locator(`[data-lesson="${l.id}"]`).click();assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}await p.evaluate(()=>scrollTo(0,document.body.scrollHeight));assert.ok(await returnLink.evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}));await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:new URL(`account-${width}.png`,evidence).pathname});}
 checks.push('320/390/1440 all lessons and sticky return; catalog navigation retains account');
 await p.goto(base+'/');await p.locator('form[action="/logout"] button').click();await login(p,users[0]);await score(p,18);assert.equal((await snapshot(p)).completed_count,6);assert.equal((await snapshot(p,'scale-lab')).completed_count,0);
 const {page:q,context:d}=await setup(users[1],true);await score(q,0);assert.equal((await snapshot(q)).completed_count,0);assert.equal((await snapshot(q,'scale-lab')).completed_count,0);
 // Manual response held after real commit; navigate before resolving it.
 let release;await q.route('**/api/courses/'+id+'/progress',async route=>{if(route.request().method()!=='POST')return route.continue();const response=await route.fetch();await new Promise(r=>release=r);await route.fulfill({response})});
 await q.locator('#complete-lesson').click();await expect.poll(()=>Boolean(release)).toBe(true);await q.locator('[data-lesson="estimate-latency"]').click();release();await ready(q);await q.unroute('**/api/courses/'+id+'/progress');assert.equal((await snapshot(q)).criteria['estimate-units'].manual,true);assert.equal((await snapshot(q)).criteria['estimate-latency'].manual,false);
 await q.locator('[data-lesson="estimate-units"]').click();await act(q,'#calculate');await act(q,'[data-answer="0"]');await score(q,2);assert.equal((await snapshot(q)).completed_count,1);await q.reload();await score(q,2);await q.goto(base+'/');await q.locator('form[action="/logout"] button').click();await login(q,users[1]);await score(q,2);assert.equal((await snapshot(q)).completed_count,1);assert.equal((await snapshot(p)).completed_count,6);checks.push('second account independent writes/reload/relogin; manual captures lesson during navigation');
 const coverage=new Set(posts.map(x=>`${x.request.lesson_id}/${x.request.simulation_id}/${x.request.action}`));const expected=Object.entries(manifest.participation).flatMap(([l,sims])=>Object.entries(sims).flatMap(([s,acts])=>acts.map(a=>`${l}/${s}/${a}`)));assert.deepEqual([...coverage].sort(),expected.sort());assert.equal(coverage.size,18);assert.ok(assets.length>0&&assets.every(a=>a.status===200));assert.deepEqual(errors,[]);
 await writeFile(new URL('account-browser.json',evidence),JSON.stringify({checks,coverage:[...coverage],definitionCount:expected.length,assets,errors,posts:posts.map(x=>({lesson:x.request.lesson_id,simulation:x.request.simulation_id,action:x.request.action,awarded:x.response.awarded,score:x.response.score}))},null,2));
 console.log('Real OTP account QA passed: all 18 definitions, 6 qualified lessons; second account 1 lesson/2 points; retries, shuffle, mobile, isolation');await c.close();await d.close();
 }
}finally{await browser.close()}
