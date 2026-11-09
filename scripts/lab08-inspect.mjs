import {mkdir} from 'node:fs/promises';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const out=new URL('../evidence/lab08-presentation/',import.meta.url).pathname;await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chromium'}),page=await browser.newPage({viewport:{width:1280,height:1000}});
await page.goto('http://127.0.0.1:4173/');
for(const i of [1,2,3,4,5,6,8]){await page.locator(`[data-lesson="${i}"]`).click();await page.locator('#architecture').scrollIntoViewIfNeeded();await page.screenshot({path:out+`before-${i}.png`});console.log(i,await page.locator('#architecture').innerText());}
await browser.close();
