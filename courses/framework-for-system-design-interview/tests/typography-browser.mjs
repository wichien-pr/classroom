import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.FRAMEWORK_EVIDENCE;
assert.ok(out && process.env.ESTIMATE_URL && process.env.FRAMEWORK_PREVIEW_URL, 'FRAMEWORK_EVIDENCE, ESTIMATE_URL and FRAMEWORK_PREVIEW_URL are required');
await mkdir(out,{recursive:true});
const roles={body:['body','body'],title:['.lesson-intro h1','.lesson-intro h1'],intro:['.lesson-intro p:last-child','.lesson-intro p:last-child'],prose:['.concept p','.concept p'],heading:['.concept h2','.concept h2'],experimentHeading:['.experiment-heading h2','.experiment-heading h2'],stepHeading:['.lesson-steps h3','.lesson-steps h3'],control:['#calculate','#calculate'],reset:['#reset','#reset'],quiz:['.answers button','.answers button'],quizHeading:['.thinking h2','.quiz h2'],navigation:['.sidebar nav button','.sidebar nav button'],completion:['#completion-status','#completion-status'],completionButton:['#complete-lesson','#complete-lesson'],eyebrow:['.eyebrow','.eyebrow'],reading:['.lesson-notes p','.caveat p'],disclosure:['.lesson-notes summary','.caveat summary'],feedback:['#feedback','#feedback']};
const properties=['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing'];
const report={reference:process.env.ESTIMATE_URL,framework:process.env.FRAMEWORK_PREVIEW_URL,roles,rows:[],mismatches:[],errors:[]};
const browser=await chromium.launch();
const measure=async(p,s)=>p.locator(s).first().evaluate((e,keys)=>Object.fromEntries(keys.map(k=>[k,getComputedStyle(e)[k]])),properties);
try{
for(const theme of ['light','dark'])for(const width of [320,390,768,1280]){
 const pages=await Promise.all([report.reference,report.framework].map(async url=>{const p=await browser.newPage({viewport:{width,height:1000}});p.on('pageerror',e=>report.errors.push(e.message));await p.goto(url);await p.evaluate(t=>document.documentElement.dataset.theme=t,theme);return p;}));
 const [ref,page]=pages;await ref.evaluate(()=>document.querySelectorAll('details').forEach(e=>e.open=true));
 const reference=Object.fromEntries(await Promise.all(Object.entries(roles).map(async([r,s])=>[r,await measure(ref,s[0])])));
 for(const id of ['framework-scope','framework-blueprint','framework-deep-dive','framework-wrap-up']){
  await page.locator(`[data-lesson="${id}"]`).click();await page.evaluate(()=>document.querySelectorAll('details').forEach(e=>e.open=true));
  const measured={};for(const [role,s] of Object.entries(roles)){
   measured[role]=await measure(page,s[1]);for(const key of properties)if(reference[role][key]!==measured[role][key])report.mismatches.push({id,theme,width,role,key,reference:reference[role][key],actual:measured[role][key]});
  }
  const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,clipped:[...document.querySelectorAll('#lesson h1,#lesson h2,#lesson h3,#lesson p,#lesson button,#lesson summary')].filter(e=>e.getClientRects().length&&((e.scrollWidth>e.clientWidth+1&&getComputedStyle(e).overflowX==='hidden')||(e.scrollHeight>e.clientHeight+1&&getComputedStyle(e).overflowY==='hidden'))).map(e=>e.textContent),spacing:Object.fromEntries(['.course-content','.concept','.experiment-panel','.quiz','.answers button'].map(s=>[s,Object.fromEntries(['padding','margin','gap'].map(k=>[k,getComputedStyle(document.querySelector(s))[k]]))]))}));
  if(await page.locator('textarea,select').count()){
   const selector=await page.locator('select').count()?'select':'textarea';
   const expected=await measure(ref,selector==='select'?'.input-grid select':'.input-grid input');const actual=await measure(page,selector);
   measured.input=actual;reference.input=expected;
   for(const key of properties)if(expected[key]!==actual[key])report.mismatches.push({id,theme,width,role:'input',key,reference:expected[key],actual:actual[key]});
  }
  if(await page.locator('.estimate-diagram').count()){
   for(const selector of ['.estimate-diagram figcaption','.diagram-flow strong','.diagram-flow span']){
    const expected=await measure(ref,selector),actual=await measure(page,selector);
    measured[selector]=actual;reference[selector]=expected;
    for(const key of properties)if(expected[key]!==actual[key])report.mismatches.push({id,theme,width,role:selector,key,reference:expected[key],actual:actual[key]});
   }
  }
  const referenceSpacing=await ref.evaluate(()=>Object.fromEntries(['.course-content','.concept','.experiment-panel','.answers button'].map(s=>[s,Object.fromEntries(['padding','margin','gap'].map(k=>[k,getComputedStyle(document.querySelector(s))[k]]))])));
  for(const selector of ['.course-content','.concept','.experiment-panel','.answers button'])assert.equal(layout.spacing[selector].padding,referenceSpacing[selector].padding,`${id} ${width} ${selector} padding`);
  report.rows.push({id,theme,width,reference,measured,referenceSpacing,layout});
  assert.equal(layout.overflow,false,`${id} ${width} overflow`);assert.deepEqual(layout.clipped,[],`${id} clipped`);
  if([390,1280].includes(width)){
   for(const [section,selector] of [['reading','.lesson-intro'],['concept','.concept'],['quiz','.quiz']]){
    await page.locator(selector).first().evaluate(e=>e.scrollIntoView({block:'start'}));
    await page.mouse.move(0,0);await page.waitForTimeout(170);
    await page.screenshot({path:`${out}/${id}-${theme}-${width}-${section}.png`});
   }
  }
 }
 await Promise.all(pages.map(p=>p.close()));
}
assert.equal(report.rows.length,32);assert.deepEqual(report.errors,[]);assert.equal(report.mismatches.length,0,JSON.stringify(report.mismatches.slice(0,12)));
console.log(JSON.stringify({cases:report.rows.length,roles:Object.keys(roles).length,properties:properties.length,mismatches:report.mismatches.length,out}));
}finally{await browser.close();await writeFile(`${out}/metrics.json`,JSON.stringify(report,null,2));}
