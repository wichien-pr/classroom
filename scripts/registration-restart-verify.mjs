import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const {expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const evidence=new URL('../evidence/registration/',import.meta.url),info=JSON.parse(await readFile(new URL('server.json',evidence)));
const mail=JSON.parse(await readFile(info.qa+'/mail-5.json'));
const browser=await chromium.launch({channel:'chromium'});
try{
 const context=await browser.newContext({storageState:info.qa+'/restart-state.json'}),page=await context.newPage();
 await page.goto(info.base+'/register/verify');await page.locator('#code').fill(mail.code);await page.getByRole('button',{name:'ยืนยันอีเมล',exact:true}).click();await page.waitForURL('**/login');
 await page.locator('[name=email]').fill('restart@example.test');await page.locator('[name=password]').fill('browser-password-123');await page.locator('button').click();await page.waitForURL(info.base+'/');
 const progress=await page.request.get(info.base+'/api/courses/scale-lab/progress');assert.equal(progress.status(),200);
 const report={passed:true,serverPid:info.pid,checks:['pending challenge and browser cookie survive real process restart','verification then explicit login succeeds','authenticated progress endpoint accessible']};
 await writeFile(new URL('restart.json',evidence),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close()}
