import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const {expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const evidence=new URL('../evidence/',import.meta.url).pathname;
const target=JSON.parse(await readFile(evidence+'community-restart-target.json'));
assert.ok(target.url.startsWith('http://127.0.0.1:8100/'));
const browser=await chromium.launch({channel:'chromium'});
try{
 const context=await browser.newContext({storageState:evidence+'community-browser-session.json'}),page=await context.newPage();
 const response=await page.goto(target.url);assert.equal(response.status(),200);
 await expect(page.locator('.post-title')).toHaveText(target.title);
 await expect(page.locator('.post-card')).toContainText('ปักหมุด');
 assert.equal(await page.locator('.comment').count(),0);
 await page.screenshot({path:evidence+'community-after-restart.png',fullPage:true});
 const result={passed:true,existingSession:true,editedPostPersisted:true,pinPersisted:true,commentDeletionPersisted:true,url:target.url};
 await writeFile(evidence+'community-restart.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await browser.close()}
