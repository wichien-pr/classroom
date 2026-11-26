// Live compiled reference comparison, not a guessed minimum font size.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from '@playwright/test';
const evidence=process.env.ESTIMATE_EVIDENCE;
assert.ok(evidence);fs.mkdirSync(evidence,{recursive:true});
const roles={body:['body','body'],title:['h1','.lesson-intro h1'],intro:['.objective','.lesson-intro p:last-child'],prose:['.flow-intro>p:not(.eyebrow)','.concept p'],heading:['.flow-intro h2','.concept h2'],experimentHeading:['.panel-title h2','.experiment-heading h2'],reading:['#flow-details p','.lesson-notes p'],disclosure:['#flow-details summary','.lesson-notes summary'],control:['#step','#calculate'],input:['#step','#calculator input'],quiz:['.answers button','.answers button'],quizHeading:['.quiz h2','.thinking h2'],caption:['figcaption','.estimate-diagram figcaption'],navigation:['nav button','.sidebar nav button'],completion:['#completion-status','#completion-status']};
assert.ok(process.env.SCALE_URL && process.env.ESTIMATE_URL, 'SCALE_URL and ESTIMATE_URL are required');
const browser=await chromium.launch({headless:true});const report={reference:process.env.SCALE_URL,estimate:process.env.ESTIMATE_URL,layouts:[],mismatches:[]};
try{
 for(const theme of ['light','dark'])for(const width of [320,390,768,1280]){
  const pages=await Promise.all([report.reference,report.estimate].map(async url=>{const p=await browser.newPage({viewport:{width,height:1000}});await p.goto(url);await p.evaluate(t=>{document.documentElement.dataset.theme=t;document.querySelectorAll('details').forEach(d=>d.open=true)},theme);return p}));
  const sizes={};for(const [role,selectors] of Object.entries(roles)){
   sizes[role]=await Promise.all(pages.map((p,i)=>p.locator(selectors[i]).first().evaluate(e=>getComputedStyle(e).fontSize)));
   if(sizes[role][0]!==sizes[role][1])report.mismatches.push({theme,width,role,scale:sizes[role][0],estimate:sizes[role][1]});
  }
  report.layouts.push({theme,width,sizes});
  if([390,1280].includes(width))for(const [i,p] of pages.entries()){
   await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:path.join(evidence,`${i?'estimate':'scale'}-${theme}-${width}.png`),fullPage:true});
   await p.locator(i?'.lesson-intro':'h1').evaluate(e=>{e.scrollIntoView({block:'start'});window.scrollBy(0,-70)});await p.screenshot({path:path.join(evidence,`${i?'estimate':'scale'}-${theme}-${width}-reading.png`)});
  }
  await Promise.all(pages.map(p=>p.close()));
 }
 fs.writeFileSync(path.join(evidence,'parity.json'),JSON.stringify(report,null,2));
 assert.deepEqual(report.mismatches,[],'Estimate role sizes must equal the current Scale reference');
 console.log(`PASS: ${report.layouts.length} theme/width comparisons × ${Object.keys(roles).length} typography roles`);
}finally{await browser.close();fs.writeFileSync(path.join(evidence,'parity.json'),JSON.stringify(report,null,2));}
