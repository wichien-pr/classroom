import {readFile} from 'node:fs/promises';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const {expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const qa=JSON.parse(await readFile(new URL('../evidence/presence/server.json',import.meta.url)));
const browser=await chromium.launch({channel:'chromium'});
try {
for(const width of [390,320]) {
 const context=await browser.newContext({viewport:{width,height:844},storageState:qa.private+'/browser-state.json'});
 const page=await context.newPage();await page.goto(qa.url+'/');await expect(page.locator('.presence')).toHaveAttribute('data-state','ready');
 await expect(page.locator('header')).toHaveCount(1);
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 console.log(JSON.stringify({width,overflow:false,headerCount:1}));
 await page.screenshot({path:new URL(`../evidence/presence/header-${width}.png`,import.meta.url).pathname});
 await page.locator('#presence-toggle').click();await expect(page.locator('#presence-panel')).toBeVisible();
 await page.screenshot({path:new URL(`../evidence/presence/popover-${width}.png`,import.meta.url).pathname});
 await context.close();
}
} finally {await browser.close()}
