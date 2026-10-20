import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const {expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const evidence=new URL('../evidence/',import.meta.url).pathname,base=process.env.QA_URL||'http://127.0.0.1:8100';
const target=JSON.parse(await readFile(evidence+'community-restart-target.json'));
const browser=await chromium.launch({channel:'chromium'});
try {
 const context=await browser.newContext({storageState:evidence+'community-browser-session.json',viewport:{width:1440,height:1100}}),page=await context.newPage();
 await page.goto(base+'/community');
 let card=page.locator('.post-card').filter({has:page.getByRole('link',{name:target.title,exact:true})});
 await expect(card.locator('.last-comment')).toHaveCount(0);
 await card.getByRole('button',{name:'ถูกใจ',exact:true}).focus();
 assert.equal(await card.getByRole('button',{name:'ถูกใจ',exact:true}).evaluate(e=>getComputedStyle(e).outlineStyle),'solid');
 const neutral=await card.locator('.reaction').first().evaluate(e=>getComputedStyle(e).color);
 await page.keyboard.press('Space');await expect(page.getByRole('button',{name:'ยกเลิกถูกใจ',exact:true})).toHaveText('1');
 await page.goto(base+'/community');await expect(card.getByRole('button',{name:'ยกเลิกถูกใจ',exact:true})).toHaveAttribute('aria-pressed','true');
 const selected=await card.locator('.reaction').first().evaluate(e=>getComputedStyle(e).color);assert.notEqual(neutral,selected);
 await card.screenshot({path:evidence+'community-card-feed-selected.png'});
 await card.getByRole('button',{name:'ยกเลิกถูกใจ',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.getByRole('button',{name:'ถูกใจ',exact:true})).toHaveText('0');await page.reload();await expect(page.getByRole('button',{name:'ถูกใจ',exact:true})).toHaveText('0');
 await page.goto(base+'/community');await card.getByRole('link',{name:'0 ความคิดเห็น',exact:true}).click();assert.equal(page.url(),target.url+'#comments');
 const result={passed:true,feedKeyboardLikeUnlike:true,reloadStateAndCount:true,selectedColorDistinct:true,visibleKeyboardFocus:true,emptyLatestCommentTruthful:true,commentAnchor:true};
 await writeFile(evidence+'community-card-browser.json',JSON.stringify(result,null,2));console.log(result);
} finally {await browser.close()}
