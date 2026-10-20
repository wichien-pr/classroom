// Isolated QA only; real browser + Flask + private Graph mail double.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {completeRegistration} from './complete-registration.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const {expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const evidence=new URL('../evidence/lab03/',import.meta.url);
const info=JSON.parse(await readFile(new URL('server.json',evidence)));
assert.equal(info.base,'http://127.0.0.1:8124');
process.env.CLASSROOM_QA_MAIL_DIR=info.qa;
const browser=await chromium.launch({channel:'chromium'}),context=await browser.newContext(),page=await context.newPage();
const email='lab03@example.test',password='qa-only-lab03-password',errors=[];
page.on('pageerror',e=>errors.push(e.message));
const resume=process.argv.includes('--resume');
async function login(){await page.goto(info.base+'/login');await page.locator('[name=email]').fill(email);await page.locator('[name=password]').fill(password);await page.locator('button').click();await page.waitForURL(info.base+'/');}
try {
 if(!resume){
  await page.goto(info.base+'/register');await page.locator('[name=name]').fill('Lab03 QA');await page.locator('[name=email]').fill(email);await page.locator('[name=password]').fill(password);await page.getByRole('button',{name:'สมัครสมาชิก',exact:true}).click();await completeRegistration(page,email);
 }
 await login();await page.goto(info.base+'/courses/scale-lab/');await page.locator('[data-lesson="3"]').click();
 await expect(page.locator('h1')).toContainText('Vertical scaling');
 if(!resume){
  await page.locator('#order').click();await expect(page.locator('#participation-score')).toHaveText('1');
  await page.locator('#order').click();await expect(page.locator('#participation-status')).toContainText('ปุ่มนี้นับคะแนนแล้ว');await expect(page.locator('#participation-score')).toHaveText('1');
  await page.locator('[data-answer="0"]').click();await expect(page.locator('#participation-score')).toHaveText('2');
  await page.locator('#complete-lesson').click();await expect(page.locator('#progress')).toContainText('1 / 12');
 }
 const result=await (await page.request.get(info.base+'/api/courses/scale-lab/progress')).json();
 assert.deepEqual(result.completed,['stock']);assert.deepEqual(result.criteria.stock,{manual:true,simulation:true,thinking:true});
 await page.reload();await page.locator('[data-lesson="3"]').click();await expect(page.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');
 await page.locator('#scale-servers').fill('3');await page.locator('#scale-down').check();
 await page.locator('#order').click();await expect(page.locator('#outcome')).toContainText('เข้าใช้งานไม่ได้');
 await page.locator('#scale-balanced').check();await page.locator('#order').click();await expect(page.locator('#outcome')).toContainText('โหลดเกิน');
 await page.locator('#scale-power').fill('2');await page.locator('#order').click();await expect(page.locator('#outcome')).toContainText('รับโหลดได้');
 await expect(page.locator('#participation-score')).toHaveText('2');
 for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('#architecture').evaluate(el=>window.scrollTo(0,window.scrollY+el.getBoundingClientRect().top-150));
  await page.screenshot({path:new URL(`integrated-${width}.png`,evidence).pathname});
 }
 await page.getByRole('link',{name:'ออกจากคลาส · กลับหน้าแรก'}).click();await expect(page).toHaveURL(info.base+'/');
 assert.deepEqual(errors,[]);
 const report={passed:true,resume,qualifiedLesson:'stock',repeatSimulationDeduplicated:!resume,browserErrors:errors,viewports:[320,390,1440],providerTraffic:false};
 await writeFile(new URL(resume?'restart.json':'browser.json',evidence),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
} finally {await browser.close();}
