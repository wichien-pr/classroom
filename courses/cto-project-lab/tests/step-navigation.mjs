import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
process.env.PLAYWRIGHT_BROWSERS_PATH ||= fileURLToPath(new URL('../../scale-lab/.browsers',import.meta.url));
const {chromium}=await import('../../scale-lab/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();
const state={csrf_token:'fixture',reviewer:false,project:{kind:'web',difficulty:3,title:'Test assignment',requirements:['Requirement'],examples:['Example'],nonfunctional:['Quality']},history:[],steps:Array.from({length:7},(_,i)=>({step:i+1,title:`Task ${i+1}`,weeks:'1 week',tasks:'Do task',deliverables:'Evidence',ai:'Reflect',evidence:'',reflection:'',feedback:'',version:0,unlocked:i<2,state:i===0?'approved':'draft'}))};
await page.route('http://fixture.test/**',route=>{const path=new URL(route.request().url()).pathname;if(path==='/api/cto-project')return route.fulfill({json:state});if(path==='/api/cto-project/review')return route.fulfill({json:{projects:[{user_id:1,name:'Synthetic learner',project:state.project,steps:state.steps.map(s=>({...s,state:s.step===2?'submitted':s.state}))}],next:null}});const file=path.endsWith('app.js')?'app.js':path.endsWith('style.css')?'style.css':'index.html';return route.fulfill({body:fs.readFileSync(new URL('../src/'+file,import.meta.url)),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});});
try {
 await page.goto('http://fixture.test/courses/cto-project-lab/');await page.locator('[data-step="2"]').waitFor();
 assert.equal(await page.getByRole('button',{name:'ส่งตรวจ',exact:true}).count(),1);
 assert.equal(await page.getByRole('button',{name:'Pass',exact:true}).count(),0);
 assert.equal(await page.locator('[data-step]').count(),1,'mount only current actionable step, not seven cards');
 assert.equal(await page.locator('[data-nav-step]').count(),7);
 assert.equal(await page.locator('[data-nav-step="2"]').getAttribute('aria-current'),'step');
 await page.locator('[data-nav-step="1"]').click();assert.equal(await page.locator('[data-step="1"]').count(),1);assert(await page.locator('[data-step="1"] textarea').first().isDisabled());
 assert(await page.locator('[data-nav-step="3"]').isDisabled());
 await page.locator('[data-nav-step="2"]').click();
 await page.getByLabel('หลักฐาน / Evidence').fill('Unsaved evidence retained across navigation');
 await page.locator('[data-nav-step="1"]').click();await page.locator('[data-nav-step="2"]').click();
 assert.equal(await page.getByLabel('หลักฐาน / Evidence').inputValue(),'Unsaved evidence retained across navigation');
 for(const width of [1280,390,320]){
  await page.setViewportSize({width,height:800});
  assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight),'app fits viewport without page scroll');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
 }
 state.reviewer=true;await page.setViewportSize({width:1280,height:800});await page.reload();
 await page.locator('#review').click();await page.locator('[data-review="1-2"]').waitFor();
 assert.equal(await page.locator('[data-review]').count(),1,'review mounts one selected step');
 assert(await page.locator('#workspace').isHidden());
 await page.getByLabel('Feedback CTO').fill('Retained reviewer note');
 await page.locator('#dashboard [data-nav-step="1"]').click();await page.locator('#dashboard [data-nav-step="2"]').click();
 assert.equal(await page.getByLabel('Feedback CTO').inputValue(),'Retained reviewer note');
 assert((await page.locator('#dashboard .step-detail').textContent()).includes('Synthetic learner · #1 · Test assignment'),'selected reviewer project identity readable outside clipped native selector');
 console.log('PASS selected-only learner/reviewer navigation, retained drafts, desktop/mobile viewport');
} finally {await browser.close();}
