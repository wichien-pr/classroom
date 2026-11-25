import {defineConfig} from '@playwright/test';
import {existsSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const localBrowsers=fileURLToPath(new URL('./.browsers',import.meta.url));
if(!process.env.PLAYWRIGHT_BROWSERS_PATH&&existsSync(localBrowsers))process.env.PLAYWRIGHT_BROWSERS_PATH=localBrowsers;
if(!process.env.READMORE_URL)throw new Error('Set READMORE_URL to the compiled standalone build being verified');
export default defineConfig({
 testDir:'./tests/browser',testMatch:['stateless-intro-removal.spec.js','web-presentation.spec.js','logging-stream.spec.js','logging-single.spec.js'],
 timeout:30000,workers:1,forbidOnly:true,retries:0,reporter:'list',
 outputDir:process.env.READMORE_TEST_OUTPUT||mkdtempSync(join(tmpdir(),'scale-readmore-tests-')),
 use:{channel:'chromium',baseURL:process.env.READMORE_URL,viewport:{width:1280,height:900}},
});
