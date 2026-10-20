import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const {expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const evidence=new URL('../evidence/single-server/',import.meta.url);
const info=JSON.parse(await readFile(new URL('server.json',evidence)));
const browser=await chromium.launch({channel:'chromium'});
const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
const errors=[],posts=[],assets=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith('/participation'))posts.push(r.postDataJSON());});
page.on('response',r=>{if(r.url().includes('/assets/'))assets.push(r.status());});
const snapshot=()=>page.request.get(info.base+'/api/courses/scale-lab/progress').then(r=>r.json());
const diagramShot=async name=>{await page.locator('#architecture').evaluate(el=>window.scrollTo(0,el.getBoundingClientRect().top+scrollY-110));await page.locator('#architecture').screenshot({path:new URL(name,evidence).pathname});};
const ready=async()=>{await expect(page.locator('#step')).toBeEnabled();await expect(page.locator('[data-answer="0"]')).toBeEnabled();};
try{
 await page.goto(info.base+'/login');await page.locator('[name=email]').fill('legacy@example.test');await page.locator('[name=password]').fill('legacy-password-123');await page.locator('button').click();await page.waitForURL(info.base+'/');await page.goto(info.base+'/courses/scale-lab/');await ready();
 const start=Number(await page.locator('#participation-score').innerText());
 await expect(page.locator('h1')).toContainText('Single-server setup');
 for(const mode of ['browser','mobile']){
  await page.locator('#flow-client').selectOption(mode);await expect(page.locator('svg[data-stage]')).toHaveAttribute('data-stage','ready');
  for(const stage of ['dns-query','dns-return','http-request','process','http-response','display']){
   await page.locator('#step').click();await ready();await expect(page.locator('svg[data-stage]')).toHaveAttribute('data-stage',stage);
   await diagramShot(`${mode}-${stage}.png`);
  }
  await expect(page.locator('#state-view')).toContainText(mode==='browser'?'200 · HTML':'200 · JSON');
  const count=posts.length;await page.locator('#step').click();await ready();assert.equal(posts.length,count);
 }
 assert.deepEqual([...new Set(posts.map(p=>`${p.lesson_id}/${p.simulation_id}/${p.action}`))],['flow/flow/step']);
 await expect(page.locator('#participation-score')).toHaveText(String(start===0?1:start));
 await page.locator('[data-answer="0"]').click();await ready();await expect(page.locator('#feedback')).toContainText('ยังไม่ถูก');
 await page.locator('[data-answer="1"]').click();await ready();await expect(page.locator('#feedback')).toContainText('ถูกต้อง');
 const before=await snapshot();
 if(start===0){assert.equal(before.criteria.flow.manual,false);assert.equal(before.completed_count,0);}
 if(!before.criteria.flow.manual)await page.locator('#complete-lesson').click();await expect(page.locator('#progress')).toContainText('1 / 11');
 const score=await page.locator('#participation-score').innerText();assert.equal(score,'3');
 const order=await page.locator('[data-answer]').evaluateAll(es=>es.map(e=>e.dataset.answer));
 await page.locator('#reset').click();await ready();assert.deepEqual(await page.locator('[data-answer]').evaluateAll(es=>es.map(e=>e.dataset.answer)),order);await expect(page.locator('[data-answer="1"]')).toHaveAttribute('aria-pressed','true');
 for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:1000});await page.locator('#flow-client').selectOption('mobile');
  for(let i=0;i<6;i++){await page.locator('#step').click();await ready();}
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await diagramShot(`diagram-${width}.png`);
  await page.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:new URL(`page-${width}.png`,evidence).pathname,fullPage:true});
 }
 await page.reload();await ready();await page.locator('#step').click();await ready();await expect(page.locator('#participation-score')).toHaveText(score);await expect(page.locator('#progress')).toContainText('1 / 11');
 assert.deepEqual(errors,[]);assert.ok(assets.length>0&&assets.every(s=>s===200));
 const report={passed:true,startingScore:start,score,completed:(await snapshot()).completed,serverPid:info.pid,errors,assets,simulationPosts:posts.filter(p=>p.action==='step').length,stableSimulationActions:[...new Set(posts.filter(p=>p.action==='step').map(p=>p.lesson_id+'/'+p.simulation_id+'/'+p.action))],viewports:[320,390,1440],modes:['HTML','JSON'],terminalNoOp:true,manualRequired:true};
 await writeFile(new URL('lab01-browser.json',evidence),JSON.stringify(report,null,2));console.log(report);
}finally{await browser.close();}
