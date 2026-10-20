import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const {expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const evidence=new URL('../evidence/qualification/',import.meta.url);
const info=JSON.parse(await readFile(new URL('participation-qa-server.json',evidence)));
const before=JSON.parse(await readFile(new URL('qualification-browser.json',evidence)));
assert.notEqual(info.pid,before.serverPid);
const browser=await chromium.launch({channel:'chromium'});
try{
 const context=await browser.newContext({storageState:new URL('qualification-session.json',evidence).pathname});
 const page=await context.newPage();await page.goto(info.base+'/courses/scale-lab/');await expect(page.locator('#progress')).toContainText('11 / 11');
 const progress=await page.request.get(info.base+'/api/courses/scale-lab/progress').then(r=>r.json());assert.deepEqual(progress.completed,before.completed);
 const ranks=await page.request.get(info.base+'/api/leaderboards').then(r=>r.json());assert.equal(ranks.members.find(m=>m.id===ranks.user_id).level,2);
 const result={passed:true,oldPid:before.serverPid,newPid:info.pid,completed:progress.completed,level:2};await writeFile(new URL('qualification-restart.json',evidence),JSON.stringify(result,null,2));console.log(result);
}finally{await browser.close();}
