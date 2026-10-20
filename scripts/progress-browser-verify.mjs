import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const {expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const base=process.env.CLASSROOM_QA_URL || 'http://127.0.0.1:8093';
const browser=await chromium.launch({channel:'chromium'});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[], api=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('response',r=>{if(r.url().includes('/api/'))api.push({method:r.request().method(),url:r.url(),status:r.status()});});
const password='progress browser password';
const first=`progress-a-${Date.now()}@example.com`,second=`progress-b-${Date.now()}@example.com`;
async function login(email){
 await page.goto(base+'/login');await page.locator('[name=email]').fill(email);await page.locator('[name=password]').fill(password);
 await page.locator('button').click();await page.waitForURL(base+'/');
}
async function register(email){
 await page.goto(base+'/register');await page.locator('[name=name]').fill('Progress QA');await page.locator('[name=email]').fill(email);
 await page.locator('[name=password]').fill(password);await page.locator('button').click();await page.waitForURL('**/login');await login(email);
}
async function logout(){await page.goto(base+'/');await page.getByRole('button',{name:'ออกจากระบบ'}).click();await page.waitForURL('**/login');}
const card=()=>page.locator('a[href="/courses/scale-lab/"] .account-progress');
try{
 await register(first);
 await expect(card()).toHaveText('0 / 12 บทเรียน');
 // Same browser profile already has legacy state. It must never be imported.
 await page.evaluate(()=>localStorage.setItem('scale-lab-progress','[1,2,3]'));
 await page.goto(base+'/courses/scale-lab/');
 await expect(page.locator('#progress-status')).toContainText('บัญชีแล้ว');
 await expect(page.locator('#progress')).toContainText('0 / 12');
 await page.locator('[data-action="step"]').click();
 await page.locator('[data-answer="0"]').click();
 await expect(page.locator('#progress')).toContainText('0 / 12');
 await page.getByRole('button',{name:'ทำเครื่องหมายว่าเรียนจบ',exact:true}).click();
 await expect(page.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');
 await expect(page.locator('#feedback')).toContainText('ยังไม่ถูก');
 assert.deepEqual((await page.request.get(base+'/api/courses/scale-lab/progress').then(r=>r.json())).completed,['flow']);
 await expect(page.locator('#progress')).toContainText('1 / 12');
 await page.reload();await expect(page.locator('#progress')).toContainText('1 / 12');
 await expect(page.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');
 await page.locator('[data-lesson="2"]').click();
 await expect(page.locator('#complete-lesson')).toHaveText('ทำเครื่องหมายว่าเรียนจบ');
 await page.locator('[data-lesson="1"]').click();
 await expect(page.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');
 await page.screenshot({path:new URL('../evidence/account-progress-course.png',import.meta.url).pathname,fullPage:true});
 await page.getByRole('link',{name:'ออกจากคลาส · กลับหน้าแรก'}).click();
 await expect(card()).toHaveText('1 / 12 บทเรียน');
 // New course discovered from a manifest; no course-specific backend edits.
 await page.locator('a[href="/courses/future-course/"]').click();
 await expect(page.locator('#progress')).toHaveText('0 / 2');
 await page.locator('#complete').click();await expect(page.locator('#progress')).toHaveText('1 / 2');
 await page.reload();await expect(page.locator('#progress')).toHaveText('1 / 2');
 await page.goto(base+'/');
 await expect(card()).toHaveText('1 / 12 บทเรียน');
 await expect(page.locator('a[href="/courses/future-course/"] .account-progress')).toHaveText('1 / 2 บทเรียน');
 await page.screenshot({path:new URL('../evidence/account-progress-catalog.png',import.meta.url).pathname,fullPage:true});
 await logout();await login(first);
 await expect(card()).toHaveText('1 / 12 บทเรียน');
 await page.goto(base+'/courses/scale-lab/');await expect(page.locator('#progress')).toContainText('1 / 12');
 await logout();await register(second);
 await expect(card()).toHaveText('0 / 12 บทเรียน');
 await page.goto(base+'/courses/scale-lab/');
 await expect(page.locator('#progress-status')).toContainText('บัญชีแล้ว');
 await expect(page.locator('#progress')).toContainText('0 / 12');
 await page.locator('[data-lesson="2"]').click();await page.locator('[data-answer="1"]').click();
 await expect(page.locator('#progress')).toContainText('0 / 12');
 await page.locator('[data-action="estimate"]').click();await page.locator('#complete-lesson').click();
 await expect(page.locator('#progress')).toContainText('1 / 12');
 assert.equal((await page.request.get(base+'/api/courses/future-course/progress').then(r=>r.json())).completed_count,0);
 await page.setViewportSize({width:390,height:844});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await expect(page.locator('.sidebar')).toHaveCount(1);
 await page.locator('.lesson-completion').evaluate(el=>el.scrollIntoView({block:'center'}));
 await expect(page.locator('#complete-lesson')).toBeInViewport();
 await page.screenshot({path:new URL('../evidence/account-progress-mobile.png',import.meta.url).pathname});
 await logout();await login(first);
 const snapshot=await page.request.get(base+'/api/courses/scale-lab/progress').then(r=>r.json());
 assert.deepEqual(snapshot.completed,['flow']);
 assert.equal(await page.evaluate(()=>localStorage.getItem('scale-lab-progress')),'[1,2,3]');
 assert.deepEqual(errors,[]);
 assert.ok(api.length>0 && api.every(r=>r.status===200));
 const result={passed:true,base,manualCompletionReload:true,manualDoesNotPassQuiz:true,perLessonStatus:true,combinedQualification:true,relogin:true,catalog:true,secondAccountIsolation:true,legacyNotImported:true,genericNewCourse:true,mobileNoOverflow:true,errors,api};
 await writeFile(new URL('../evidence/account-progress-browser.json',import.meta.url),JSON.stringify(result,null,2));
 console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}
