// Offline regression: execute only the runner's catalog assertion, never its account journey.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {chromium} from '../courses/back-of-the-envelope-estimation/node_modules/playwright/index.mjs';
import {expect} from '../courses/back-of-the-envelope-estimation/node_modules/@playwright/test/index.mjs';

const manifest = JSON.parse(await readFile(new URL('../courses/back-of-the-envelope-estimation/course.json', import.meta.url)));
const source = await readFile(new URL('./estimation-browser-verify.mjs', import.meta.url), 'utf8');
const returnLine = source.split('\n').find(line => line.includes('const returnLink='));
const assertion = returnLine.split("await p.waitForURL(base+'/');")[1].split('await p.goto(url);')[0];
assert.ok(assertion, 'Extract the actual catalog-return assertion');
const check = new (Object.getPrototypeOf(async function() {}).constructor)('p', 'expect', 'assert', 'manifest', 'id', assertion);

test('catalog return accepts manifest title only on the target course link', async () => {
  const browser = await chromium.launch({channel: 'chrome', headless: true});
  try {
    const page = await browser.newPage();
    await page.route('**/*', route => route.abort());
    // Match the catalog card structure without Flask, HTTP, accounts or databases.
    await page.setContent('<a href="/courses/scale-lab/"><h2>Scale Lab</h2></a><a id="target"><strong></strong><h2></h2></a>');
    await page.locator('#target').evaluate((link, course) => {
      link.setAttribute('href', `/courses/${course.id}/`);
      for (const title of link.children) title.textContent = course.title;
    }, manifest);
    await check(page, expect.configure({timeout: 250}), assert, manifest, manifest.id);
    // A correct title elsewhere must not hide a stale target card.
    await page.locator('#target').evaluate(link => { link.textContent = 'Back-of-the-envelope Estimation'; });
    await page.locator('a').first().evaluate((link, title) => { link.textContent = title; }, manifest.title);
    await assert.rejects(check(page, expect.configure({timeout: 250}), assert, manifest, manifest.id));
  } finally {
    await browser.close();
  }
});
