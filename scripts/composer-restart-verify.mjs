import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const {expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const root=new URL('../evidence/',import.meta.url).pathname;
const target=JSON.parse(await readFile(root+'composer-restart-target.json'));
const browser=await chromium.launch({channel:'chromium'});
try {
 const context=await browser.newContext({storageState:root+'composer-session.json'}),page=await context.newPage();
 await page.goto(target.url);await expect(page.locator('.post-title')).toHaveText(target.title);await expect(page.locator('.community-poll')).toContainText('1 โหวต');await expect(page.locator('.attachment-grid figure')).toHaveCount(2);
 for(const media of target.media){assert.equal((await page.request.get('http://127.0.0.1:8101'+media)).status(),200)}
 await page.goto(target.url+'/edit');await page.locator('[data-remove]').first().click();page.once('dialog',d=>d.accept());await page.locator('#composer-cancel').click();await page.locator('#write-prompt').click();assert.equal(await page.locator('[data-existing][data-removed]').count(),0,'cancel must restore existing attachment controls');await page.keyboard.press('Escape');
 await page.goto('http://127.0.0.1:8101/community');
 for(const width of [390,320]){await page.setViewportSize({width,height:844});await page.locator('#write-prompt').click();await expect(page.locator('#composer-submit')).toBeDisabled();assert.ok(await page.locator('#composer-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1));await page.screenshot({path:root+`composer-empty-mobile-${width}.png`});for(const button of await page.locator('.composer-tools button').all()){await button.scrollIntoViewIfNeeded();const rect=await button.boundingBox();assert.ok(rect.width>=44 && rect.height>=44)}await page.screenshot({path:root+`composer-footer-mobile-${width}.png`});await page.keyboard.press('Escape')}
 const csrf=await page.locator('[name=csrf_token]').first().inputValue();
 const invalid=await page.request.post('http://127.0.0.1:8101/community/posts',{multipart:{csrf_token:csrf,title:'QA invalid binary',body:'Keep draft',category:'general',attachments:{name:'fake.png',mimeType:'image/png',buffer:Buffer.from('<svg onload=alert(1)>')}}});assert.equal(invalid.status(),400);assert.match(await invalid.text(),/เลือกไฟล์ใหม่/);
 const guest=await browser.newContext();assert.equal((await guest.request.get('http://127.0.0.1:8101'+target.media[0],{maxRedirects:0})).status(),303);await guest.close();
 const fallback=await browser.newContext({storageState:root+'composer-session.json',javaScriptEnabled:false});const f=await fallback.newPage();await f.goto(target.url+'/edit');await expect(f.locator('#composer')).toBeVisible();await expect(f.locator('[name=attachments]')).toHaveCount(1);await expect(f.locator('[name=title]')).toHaveValue(target.title);await fallback.close();
 const result={passed:true,cancelRestoresAttachments:true,restartedPostPollFiles:true,mobile320and390:true,toolbar44px:true,invalidSignatureDraftGuidance:true,guestMediaProtected:true,noJavaScriptEditor:true};await writeFile(root+'composer-restart.json',JSON.stringify(result,null,2));console.log(result);
}finally{await browser.close()}
