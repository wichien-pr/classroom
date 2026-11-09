import {defineConfig} from '@playwright/test';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('./.browsers',import.meta.url).pathname;
process.env.LAB09_EVIDENCE=new URL('../../evidence/lab09-remove-release-topic/',import.meta.url).pathname;
const baseURL=process.env.LAB09_PREVIEW_URL||'http://127.0.0.1:4173';
export default defineConfig({testDir:'./tests/browser',workers:1,timeout:60000,reporter:[['list'],['json',{outputFile:'../../evidence/lab09-remove-release-topic/browser-results.json'}]],outputDir:'../../evidence/lab09-remove-release-topic/test-output',use:{channel:'chromium',baseURL,viewport:{width:1280,height:1000},screenshot:'only-on-failure'}});
