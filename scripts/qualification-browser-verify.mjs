import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const {expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const root=new URL('../',import.meta.url), evidence=new URL('evidence/qualification/',root);
const info=JSON.parse(await readFile(new URL('participation-qa-server.json',evidence)));
const manifest=JSON.parse(await readFile(new URL('courses/scale-lab/course.json',root)));
const browser=await chromium.launch({channel:'chromium'}), context=await browser.newContext({viewport:{width:1440,height:1000}}), page=await context.newPage();
const base=info.base, errors=[], steps=[];
page.on('pageerror',e=>errors.push(String(e)));
const snapshot=()=>page.request.get(base+'/api/courses/scale-lab/progress').then(r=>r.json());
const level=async()=>{const data=await page.request.get(base+'/api/leaderboards').then(r=>r.json());return data.members.find(m=>m.id===data.user_id).level;};
const email=`qualification-${Date.now()}@example.com`,password='qualification QA password';
async function login(){await page.goto(base+'/login');await page.locator('[name=email]').fill(email);await page.locator('[name=password]').fill(password);await page.locator('button').click();await page.waitForURL(base+'/');await page.goto(base+'/courses/scale-lab/');}
try {
 await page.goto(base+'/register');await page.locator('[name=name]').fill('Qualification QA');await page.locator('[name=email]').fill(email);await page.locator('[name=password]').fill(password);await page.locator('button').click();await page.waitForURL('**/login');await login();
 await page.locator('#complete-lesson').click();await expect(page.locator('#complete-lesson')).toHaveText('✓ กดเรียนจบแล้ว');assert.equal((await snapshot()).completed_count,0);steps.push('manual only insufficient');await page.locator('#completion-status').scrollIntoViewIfNeeded();await page.screenshot({path:new URL('qualification-manual-only.png',evidence).pathname});
 await page.locator('[data-action="step"]').click();await page.locator('[data-answer="0"]').click();await expect(page.locator('#progress')).toContainText('1 / 11');assert.equal(await level(),1);steps.push('manual + simulation + wrong A qualifies one lesson, not whole course');
 await page.locator('[data-lesson="2"]').click();await page.locator('[data-action="estimate"]').click();await page.locator('[data-answer="1"]').click();await expect(page.locator('#feedback')).toContainText('ถูกต้อง');
 await expect.poll(async()=> (await snapshot()).criteria.workload.thinking).toBe(true);assert.equal((await snapshot()).criteria.workload.manual,false);assert.equal((await snapshot()).completed_count,1);steps.push('simulation + correct B without manual insufficient');await page.locator('#completion-status').scrollIntoViewIfNeeded();await page.screenshot({path:new URL('qualification-missing-manual.png',evidence).pathname});
 await page.locator('#complete-lesson').click();await expect(page.locator('#progress')).toContainText('2 / 11');
 for(let i=2;i<manifest.lessons.length;i++){
  const lesson=manifest.lessons[i];await page.locator(`[data-lesson="${i+1}"]`).click();
  await page.locator('[data-answer="0"]').click();await page.locator('#complete-lesson').click();
  await page.locator(`[data-action="${manifest.participation[lesson][lesson][0]}"]`).click();
  await expect(page.locator('#progress')).toContainText(`${i+1} / 11`);
  assert.equal(await level(),i===manifest.lessons.length-1?2:1);
 }
 steps.push('all eleven lessons required; final main action raises L2');
 const before=await snapshot();await page.reload();await expect(page.locator('#progress')).toContainText('11 / 11');
 await page.locator('[data-action="step"]').click();await page.locator('[data-answer="0"]').click();assert.deepEqual((await snapshot()).completed,before.completed);steps.push('repeat and reload do not add completion');
 for(const width of [320,390]){await page.setViewportSize({width,height:844});await page.locator('#completion-status').scrollIntoViewIfNeeded();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:new URL(`qualification-${width}.png`,evidence).pathname});}
 await page.goto(base+'/');await page.locator('form[action="/logout"] button').click();await login();await expect(page.locator('#progress')).toContainText('11 / 11');assert.equal(await level(),2);steps.push('relogin persists qualified course');
 await context.storageState({path:new URL('qualification-session.json',evidence).pathname});
 const other=await browser.newContext(), second=await other.newPage();await second.goto(base+'/register');await second.locator('[name=name]').fill('Isolated QA');await second.locator('[name=email]').fill('other-'+email);await second.locator('[name=password]').fill(password);await second.locator('button').click();await second.waitForURL('**/login');await second.locator('[name=email]').fill('other-'+email);await second.locator('[name=password]').fill(password);await second.locator('button').click();await second.waitForURL(base+'/');await second.goto(base+'/courses/scale-lab/');await expect(second.locator('#progress')).toContainText('0 / 11');steps.push('separate account remains empty');
 await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/courses/scale-lab/');await expect(page.locator('#progress')).toContainText('11 / 11');await page.screenshot({path:new URL('qualification-desktop.png',evidence).pathname});
 assert.deepEqual(errors,[]);const report={passed:true,serverPid:info.pid,base,steps,errors,completed:(await snapshot()).completed,level:await level()};await writeFile(new URL('qualification-browser.json',evidence),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
