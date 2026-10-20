import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const {expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const evidence=new URL('../evidence/',import.meta.url).pathname;
const qa=JSON.parse(await readFile(evidence+'inline-editor-qa-server.json'));
const browser=await chromium.launch({channel:'chromium'}),page=await browser.newPage({viewport:{width:1200,height:1000}});
try {
await page.goto(qa.url+'/login');await page.locator('[name=email]').fill('composer-a@example.test');await page.locator('[name=password]').fill('QA-composer-password-2026');await page.locator('form button').click();await page.waitForURL(qa.url+'/');
await page.goto(qa.url+'/community');await page.locator('#write-prompt').click();
await page.locator('#compose-title').fill('Ordered image '+Date.now());await page.locator('[name=category]').selectOption('general');
const text=page.locator('#block-editor [contenteditable="plaintext-only"]');
await expect(text).toHaveCount(1);await text.fill('Before photo');await text.press('End');
await page.locator('#compose-files').setInputFiles(path.join(path.dirname(qa.database),'fixtures/qa-image.png'));
await expect(page.locator('#block-editor img')).toHaveCount(1);await expect(text).toHaveCount(2);await text.last().fill('After photo');
await page.screenshot({path:evidence+'inline-editor-desktop.png'});
await page.locator('#composer-submit').click();await page.waitForURL('**/community/posts/*');
await expect(page.locator('.ordered-content > *')).toHaveCount(3);assert.deepEqual(await page.locator('.ordered-content > *').evaluateAll(es=>es.map(e=>e.tagName)),['DIV','FIGURE','DIV']);
await page.screenshot({path:evidence+'inline-editor-published.png'});await page.reload();await page.getByRole('link',{name:'แก้ไขโพสต์',exact:true}).click();await expect(text.first()).toHaveText('Before photo');await expect(text.last()).toHaveText('After photo');
for(const width of [390,320]) {await page.setViewportSize({width,height:844});await page.locator('#composer-submit').scrollIntoViewIfNeeded();assert.ok(await page.locator('#composer-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth));await page.screenshot({path:evidence+`inline-editor-${width}.png`});}
await page.getByRole('button',{name:'นำออก qa-image.png',exact:true}).click();await text.first().fill('Discarded');page.once('dialog',d=>d.accept());await page.locator('#composer-cancel').click();await page.locator('#write-prompt').click();await expect(text.first()).toHaveText('Before photo');await expect(text.last()).toHaveText('After photo');await expect(page.locator('#block-editor img')).toHaveCount(1);await expect(page.locator('[name=remove_attachments]')).toHaveValue('');
await text.first().fill('');await text.last().fill('');await expect(page.locator('#composer-submit')).toBeEnabled();await page.locator('#composer-submit').click();await page.waitForURL('**/community/posts/*');await expect(page.locator('.ordered-content img')).toHaveCount(1);
const savedUrl=page.url();await page.getByRole('link',{name:'แก้ไขโพสต์',exact:true}).click();await text.first().fill('Before photo');await text.last().fill('After photo');await page.locator('#composer-submit').click();await page.waitForURL(savedUrl);await writeFile(evidence+'inline-editor-target.json',JSON.stringify({url:savedUrl}));await page.context().storageState({path:evidence+'inline-editor-session.json'});
await writeFile(evidence+'inline-editor-browser.json',JSON.stringify({passed:true,url:qa.url}));console.log('PASS ordered text/image/text, reload/edit, image-only and mobile');
} finally {await browser.close();}
