// Serve ONLY the isolated standalone build on an OS-selected loopback port.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {join,resolve,extname} from 'node:path';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const {expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const evidence=new URL('../evidence/lab06/',import.meta.url),info=JSON.parse(await readFile(new URL('standalone.json',evidence)));
const server=createServer(async(req,res)=>{try{const path=resolve(join(info.dist,req.url==='/'?'index.html':decodeURIComponent(req.url)));assert.ok(path.startsWith(info.dist+'/'));const body=await readFile(path);res.writeHead(200,{'Content-Type':{'.html':'text/html','.js':'text/javascript','.css':'text/css'}[extname(path)]||'application/octet-stream'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:'chromium'}),page=await browser.newPage(),errors=[],requests=[];
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/'))requests.push(r.url());});
try{
 await page.addInitScript(()=>{if(!localStorage.getItem('seeded')){localStorage.setItem('scale-lab-progress','[5,6,7,12]');localStorage.setItem('seeded','1');}});
 await page.goto(base);await expect(page.locator('[data-lesson]')).toHaveCount(11);await expect(page.getByRole('link',{name:'ออกจากคลาส · กลับหน้าแรก'})).toHaveCount(0);
 await expect(page.locator('#progress')).toContainText('3 / 11');await page.locator('[data-lesson="6"]').click();await page.locator('#read-cache').click();await expect(page.locator('#outcome')).toContainText('MISS');await page.locator('#read-cache').click();await expect(page.locator('#outcome')).toContainText('HIT');
 await page.locator('#price').fill('220');await page.locator('#update').click();await page.locator('#read-cache').click();await expect(page.locator('#outcome')).toContainText('STALE');
 for(let i=0;i<3;i++)await page.locator('#cache-tick').click();await page.locator('#read-cache').click();await expect(page.locator('#outcome')).toContainText('220 / DB 220');
 for(const width of [320,390,1440]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.doesNotMatch(await page.locator('body').innerText(),/Cache\.pdf|PDF|คู่มือต้นฉบับ|หน้า\s*\d/);}
 await page.locator('[data-lesson="1"]').click();await page.locator('#complete-lesson').click();await page.reload();await expect(page.locator('#progress')).toContainText('4 / 11');assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('scale-lab-progress-v2')).completed),['session','replica','cache','shard','flow']);
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);const report={passed:true,compiled:true,port:server.address().port,viewports:[320,390,1440],historicalNumericMapping:true,retiredSessionPreserved:true,noAccountCalls:true,noAttribution:true,errors};await writeFile(new URL('standalone-browser.json',evidence),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();await new Promise(done=>server.close(done));}
