import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const evidence=new URL('../evidence/',import.meta.url).pathname;
const qa=JSON.parse(await readFile(evidence+(process.env.PROFILE_QA_INFO || 'profile-qa-server.json')));
assert.equal(qa.url,process.env.CLASSROOM_QA_URL || 'http://127.0.0.1:8096');
const browser=await chromium.launch({channel:'chromium'});
const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(String(e)));
async function registerLogin(p,email,name){await p.goto(qa.url+'/register');await p.locator('[name=name]').fill(name);await p.locator('[name=email]').fill(email);await p.locator('[name=password]').fill('QA-photo-password-2026');await p.locator('form button').click();await p.waitForURL('**/login');await p.locator('[name=email]').fill(email);await p.locator('[name=password]').fill('QA-photo-password-2026');await p.locator('form button').click();await p.waitForURL(qa.url+'/');}
async function screenshot(name){await page.screenshot({path:evidence+name+'.png',fullPage:true})}
async function imagesLoaded(){assert.ok(await page.locator('img[src^="/account/photos/"]').count()>0);assert.ok(await page.locator('img[src^="/account/photos/"]').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0)))}
try{
 await page.goto(qa.url+'/account/profile');assert.equal(page.url(),qa.url+'/login');
 await registerLogin(page,`photo-${Date.now()}@example.test`,'QA Photo Robot');
 await page.getByRole('link',{name:'โปรไฟล์บัญชี',exact:true}).click();
 assert.equal(await page.locator('#photo').count(),0);await page.getByRole('link',{name:'แก้ไขโปรไฟล์',exact:true}).click();assert.equal(await page.locator('form form').count(),0);await page.locator('#photo').setInputFiles(qa.fixture);await page.locator('#photo-preview').waitFor({state:'visible'});
 assert.ok(await page.locator('#photo-preview').evaluate(i=>i.naturalWidth===400));await screenshot('profile-preview');
 await page.getByRole('button',{name:'บันทึกรูปโปรไฟล์',exact:true}).click();await page.waitForURL('**/account/profile/edit?photo_saved=1');await imagesLoaded();
 const src=await page.locator('header img').getAttribute('src');const photo=await page.request.get(qa.url+src);assert.equal(photo.status(),200);assert.match(photo.headers()['content-type'],/image\/jpeg/);const first=await photo.body();
 await page.reload();await imagesLoaded();await screenshot('profile-desktop');
 await page.goto(qa.url+'/');await imagesLoaded();await screenshot('profile-catalog');
 await page.goto(qa.url+'/leaderboards');await imagesLoaded();assert.equal(await page.locator('.ranking img').count(),1);await screenshot('profile-leaderboards');
 const otherContext=await browser.newContext();const other=await otherContext.newPage();await registerLogin(other,`photo-other-${Date.now()}@example.test`,'QA No Photo');await other.goto(qa.url+'/account/profile');assert.equal(await other.locator('img[src^="/account/photos/"]').count(),0);assert.equal((await other.request.get(qa.url+src)).status(),200);
 await page.goto(qa.url+'/account/profile/edit');await page.locator('#photo').setInputFiles({name:'fake.png',mimeType:'image/png',buffer:Buffer.from('not an image')});await page.getByRole('button',{name:'บันทึกรูปโปรไฟล์',exact:true}).click();await page.getByRole('alert').waitFor();assert.match(await page.getByRole('alert').innerText(),/รูปภาพ/);assert.deepEqual(await (await page.request.get(qa.url+src)).body(),first);await screenshot('profile-invalid');
 await page.locator('#photo').setInputFiles({name:'large.png',mimeType:'image/png',buffer:Buffer.alloc(5242881)});assert.match(await page.locator('#preview-status').innerText(),/5 MiB/);
 const oversizedResponse=page.waitForResponse(r=>r.request().isNavigationRequest()&&r.request().method()==='POST');await page.locator('#photo').evaluate(el=>el.form.submit());assert.equal((await oversizedResponse).status(),413);await page.getByRole('alert').waitFor();assert.match(await page.getByRole('alert').innerText(),/5 MiB/);assert.ok(await page.locator('#display-name').isVisible());assert.ok(await page.locator('#photo').isVisible());assert.deepEqual(await (await page.request.get(qa.url+src)).body(),first);await screenshot('profile-photo-oversize');
 const csrf=await page.locator('main [name=csrf_token]').first().inputValue();
 assert.equal((await page.request.post(qa.url+'/account/profile',{multipart:{csrf_token:csrf,photo:{name:'large.png',mimeType:'image/png',buffer:Buffer.alloc(5242881)}}})).status(),413);
 assert.equal((await page.request.post(qa.url+'/account/profile',{form:{action:'remove'}})).status(),403);
 await page.goto(qa.url+'/account/profile');await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await imagesLoaded();assert.equal(await page.locator('#photo').count(),0);await screenshot('profile-mobile');await page.getByRole('link',{name:'แก้ไขโปรไฟล์',exact:true}).click();for(const width of [390,320]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await screenshot(`profile-photo-editor-mobile-${width}`);}
 await page.goto(qa.url+'/leaderboards');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await screenshot('profile-leaderboards-mobile');
 await page.goto(qa.url+'/account/profile/edit');await page.getByRole('button',{name:'ลบรูปโปรไฟล์',exact:true}).click();await page.waitForURL('**/account/profile/edit?photo_saved=1');assert.equal(await page.locator('img[src^="/account/photos/"]').count(),0);assert.equal((await page.request.get(qa.url+src)).status(),404);
 await page.locator('#photo').setInputFiles(qa.fixture);await page.getByRole('button',{name:'บันทึกรูปโปรไฟล์',exact:true}).click();await page.waitForURL('**/account/profile/edit?photo_saved=1');await imagesLoaded();
 await other.reload();assert.equal(await other.locator('img[src^="/account/photos/"]').count(),0);
 await page.getByRole('button',{name:'ออกจากระบบ'}).click();assert.equal((await page.request.get(qa.url+src,{maxRedirects:0})).status(),303);
 assert.deepEqual(errors,[]);const result={passed:true,realServer:qa.url,preview:true,persistedReload:true,authenticatedJPEG:true,headerCatalogLeaderboard:true,secondAccountUnchanged:true,invalid400:true,oversize413:true,csrf403:true,mobileNoOverflow:true,removeReupload:true,guestProtected:true,errors};await writeFile(evidence+'profile-browser.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await browser.close()}
