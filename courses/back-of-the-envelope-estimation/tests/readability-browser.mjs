// Compiled standalone QA; external dependencies/output are explicit, never live dist.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {chromium} from '@playwright/test';
import {lessons} from '../src/lessons.js';
const dist=process.env.ESTIMATE_DIST, evidence=process.env.ESTIMATE_EVIDENCE;
assert.ok(dist&&evidence);fs.mkdirSync(evidence,{recursive:true});
const server=http.createServer((req,res)=>{const f=path.join(dist,req.url==='/'?'index.html':req.url.split('?')[0]);if(!fs.existsSync(f)){res.writeHead(404);res.end();return}res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(f))});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true});
const report={expected:5,labs:[],errors:[],mode:'compiled standalone; theme attribute matches platform; no authenticated persistence'};
try {
 const page=await browser.newPage({viewport:{width:1280,height:1000}});
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
 await page.goto(`http://127.0.0.1:${server.address().port}`);
 for(const l of lessons){
  await page.locator(`[data-lesson="${l.id}"]`).click();
  await page.locator('#calculate').click();
  const baseline=await page.locator('#result').innerText();assert.match(baseline,/≈/);
  for(const a of [0,1]){await page.locator(`[data-answer="${a}"]`).click();assert.ok((await page.locator('#feedback').innerText()).includes(l.answers[a].reason))}
  const input=page.locator('#calculator input').first();await input.fill('');await page.locator('#calculate').click();assert.ok(await page.locator('#input-error').innerText());
  await page.locator('#reset').click();await page.locator('#calculate').click();await input.fill('2');
  await page.locator(`[data-lesson="${lessons[(lessons.indexOf(l)+1)%5].id}"]`).click();await page.locator(`[data-lesson="${l.id}"]`).click();assert.equal(await page.locator('#result').innerText(),baseline);
  await page.locator('#reset').click();assert.match(await page.locator('#result').innerText(),/ยังไม่ได้คำนวณ/);await page.locator('#calculate').click();
  for(const details of await page.locator('.practice-card details').all()){await details.locator('summary').focus();await page.keyboard.press('Enter');assert.equal(await details.getAttribute('open'),'');}
  const item={id:l.id,calculator:true,bothQuizChoices:true,snapshotStable:true,reset:true,layouts:[]};
  for(const theme of ['light','dark'])for(const width of [320,390,768,1280]){
   await page.setViewportSize({width,height:1000});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
   const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,body:parseFloat(getComputedStyle(document.body).fontSize),intro:parseFloat(getComputedStyle(document.querySelector('.lesson-intro p:last-child')).fontSize),lineHeight:parseFloat(getComputedStyle(document.querySelector('.concept p')).lineHeight),smallestControl:Math.min(...[...document.querySelectorAll('#calculator input,#calculator select,#calculate,#reset,.answers button,summary')].map(e=>e.getBoundingClientRect().height))}));
   const contrast=await page.locator('.practice-card dd').evaluateAll(nodes=>nodes.map(el=>{const rgb=s=>s.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});const lum=s=>rgb(s).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);const a=lum(getComputedStyle(el).color),b=lum(getComputedStyle(el.closest('.practice-card')).backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)}));assert.ok(contrast.every(x=>x>=4.5),`practice contrast ${contrast}`);
   item.layouts.push({theme,width,...layout});assert.equal(layout.overflow,false);assert.equal(layout.body,14,`Scale body parity at ${width}`);assert.equal(layout.intro,width<=700?12:13,'Scale objective parity');assert.ok(layout.lineHeight>=27,'retain spacious prose leading');assert.ok(layout.smallestControl>=44);
   await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(evidence,`${l.id}-${theme}-${width}.png`),fullPage:true});
  }
  report.labs.push(item);fs.writeFileSync(path.join(evidence,'coverage.json'),JSON.stringify(report,null,2));
 }
 await page.locator('[data-lesson="estimate-latency"]').click();await page.selectOption('#input-first','150000000');await page.selectOption('#input-second','100');await page.locator('#calculate').click();assert.match(await page.locator('#result').innerText(),/เร็วกว่า/);
 await page.selectOption('#input-first','100');await page.locator('#calculate').click();assert.match(await page.locator('#result').innerText(),/ใช้เวลาเท่ากัน/);
 assert.deepEqual(report.errors,[]);assert.equal(report.labs.length,5);report.covered=report.labs.length;report.passed=true;console.log(JSON.stringify(report,null,2));
} finally {await browser.close();await new Promise(r=>server.close(r));fs.writeFileSync(path.join(evidence,'coverage.json'),JSON.stringify(report,null,2));}
