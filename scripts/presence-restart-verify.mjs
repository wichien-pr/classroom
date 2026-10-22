import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const {expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const evidence=new URL('../evidence/presence/',import.meta.url).pathname;
const qa=JSON.parse(await readFile(evidence+'server.json'));
const prepare=process.argv.includes('--prepare');
const browser=await chromium.launch({channel:'chromium'});
try {
 const context=await browser.newContext(prepare?{}:{storageState:qa.private+'/browser-state.json'});
 const page=await context.newPage();
 if(prepare){
  await page.goto(qa.url+'/login');
  await page.locator('[name=email]').fill('presence-1@example.test');
  await page.locator('[name=password]').fill('QA-presence-only-2026');
  await page.locator('form button').click(); await page.waitForURL(qa.url+'/');
 }else await page.goto(qa.url+'/');
 await expect(page.locator('.presence')).toHaveAttribute('data-state','ready');
 const data=await (await page.request.get(qa.url+'/api/presence')).json();
 assert.ok(data.members.some(m=>m.id===1));
 if(prepare){await context.storageState({path:qa.private+'/browser-state.json'}); console.log('Private restart session prepared');}
 else {
  await page.locator('#presence-toggle').click();
  await page.screenshot({path:evidence+'after-restart.png',fullPage:true});
  const result={passed:true,sessionSurvived:true,memberPresent:true,total:data.total,serverPid:qa.pid};
  await writeFile(evidence+'restart.json',JSON.stringify(result,null,2)); console.log(JSON.stringify(result));
 }
}finally{await browser.close()}
