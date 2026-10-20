import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const {expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const base='http://127.0.0.1:8099', browser=await chromium.launch({channel:'chromium'});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(String(e)));
const password='activity browser password',email=`activity-${Date.now()}@example.test`;
const shot=name=>page.screenshot({path:new URL(`../evidence/activity-${name}.png`,import.meta.url).pathname,fullPage:true});
async function login(){await page.goto(base+'/login');await page.locator('[name=email]').fill(email);await page.locator('[name=password]').fill(password);await page.locator('button').click();await page.waitForURL(base+'/');}
try{
 await page.goto(base+'/register');await page.locator('[name=name]').fill('Activity QA');await page.locator('[name=email]').fill(email);await page.locator('[name=password]').fill(password);await page.locator('button').click();await page.waitForURL('**/login');await login();
 await page.goto(base+'/account/profile');
 assert.ok(await page.locator('.activity-scroll').evaluate(el=>el.scrollWidth<=el.clientWidth), 'whole calendar and weekdays fit desktop');
 const today=await page.locator('.activity-day[aria-pressed=true]').getAttribute('data-date');
 const cell=()=>page.locator(`.activity-day[data-date="${today}"]`);
 await expect(page.locator('#activity-detail')).toContainText('1 กิจกรรม · เข้าสู่ระบบ 1 · เปิดคอร์ส 0 · เรียนจบ 0 บท');
 await page.goto(base+'/courses/scale-lab/');await expect(page.locator('#progress-status')).toContainText('บัญชีแล้ว');
 await page.getByRole('button',{name:'ทำเครื่องหมายว่าเรียนจบ',exact:true}).click();await expect(page.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');
 await page.reload();await expect(page.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');
 await page.goto(base+'/account/profile');await cell().click();
 await expect(page.locator('#activity-detail')).toContainText('3 กิจกรรม · เข้าสู่ระบบ 1 · เปิดคอร์ส 1 · เรียนจบ 1 บท');
 await shot('desktop');
 await page.locator('.activity-day.unknown').first().focus();await page.keyboard.press('Enter');
 await expect(page.locator('#activity-detail')).toContainText('ไม่ทราบกิจกรรม');
 await cell().focus();await page.keyboard.press('Enter');await expect(cell()).toHaveAttribute('aria-pressed','true');
 await page.locator('.activity-help summary').click();await expect(page.locator('.activity-help')).toContainText('1–2 / 3–4 / 5–7 / 8');await shot('details');
 await page.getByRole('button',{name:'ออกจากระบบ'}).click();await login();
 await page.goto(base+'/account/profile');await expect(page.locator('#activity-detail')).toContainText('3 กิจกรรม');
 for(const width of [390,320]){
  await page.setViewportSize({width,height:900});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const card=await page.locator('.profile-card').boundingBox(),activity=await page.locator('#activity-calendar').boundingBox();assert.ok(activity.y>=card.y+card.height);
  await cell().click();await expect(page.locator('#activity-detail')).toContainText('3 กิจกรรม');await shot(`mobile-${width}`);
 }
 await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/members/1');
 await expect(page.locator('.activity-summary')).toContainText('ใช้งาน 0 วัน · เรียนรู้ 0 วัน');
 await expect(page.locator('#activity-detail')).toContainText('วันนี้ยังไม่มีกิจกรรม');
 assert.equal(await page.locator('a[href="/account/profile/edit"]').count(),0);
 assert.ok(!(await page.locator('main').innerText()).includes('legacy-qa@example.test'));await shot('empty-member');
 await page.goto(base+'/courses/future-course/');await page.locator('#complete').click();await expect(page.locator('#progress')).toHaveText('1 / 2');
 await page.goto(base+'/account/profile');await expect(page.locator('#activity-detail')).toContainText('5 กิจกรรม · เข้าสู่ระบบ 1 · เปิดคอร์ส 2 · เรียนจบ 2 บท');
 await page.reload();await expect(page.locator('#activity-detail')).toContainText('5 กิจกรรม');
 assert.deepEqual(errors,[]);
 const result={passed:true,base,today,loginOnly:1,afterCourseAndManualCompletion:3,afterSyntheticCourse:5,reloginDedup:true,keyboardDetails:true,mobile:[390,320],emptyLegacyIsolation:true,errors};
 await writeFile(new URL('../evidence/activity-restart-baseline.json',import.meta.url),JSON.stringify({email,inceptionText:await page.locator('.activity-inception').innerText()},null,2));
 await writeFile(new URL('../evidence/activity-browser.json',import.meta.url),JSON.stringify(result,null,2));console.log(result);
}finally{await browser.close();}
