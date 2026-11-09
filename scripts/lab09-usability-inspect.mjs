import {mkdir,writeFile} from 'node:fs/promises';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const out=new URL('../evidence/lab09-usability/',import.meta.url).pathname;await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chromium'});const phase=process.argv[2]||'before';const rows=[];
for(const width of [1280,390,320])for(const theme of ['light','dark']){
 const page=await browser.newPage({viewport:{width,height:width===1280?900:600},reducedMotion:'reduce'});await page.goto('http://127.0.0.1:4173/');await page.locator('[data-lesson="9"]').click();await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
 await page.locator('#lesson-topic').evaluate(e=>window.scrollBy(0,e.getBoundingClientRect().top-100));await page.screenshot({path:`${out}${phase}-${width}-${theme}-top.png`});
 await page.locator('#dc-run').click();await page.locator('#dc-run').evaluate(e=>window.scrollBy(0,e.getBoundingClientRect().top-140));await page.screenshot({path:`${out}${phase}-${width}-${theme}-result.png`});
 rows.push({width,theme,text:await page.locator('#lesson-topic').innerText(),geometry:await page.locator('#lesson-topic').evaluate(e=>({height:e.getBoundingClientRect().height,overflow:document.documentElement.scrollWidth>innerWidth}))});await page.close();
}await writeFile(out+phase+'-density.json',JSON.stringify(rows,null,2));await browser.close();
