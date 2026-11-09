import {defineConfig} from '@playwright/test';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('./.browsers',import.meta.url).pathname;
export default defineConfig({testDir:'./tests/browser',workers:1,timeout:60000,reporter:[['list'],['json',{outputFile:'../../evidence/lab09-capacity-animation/browser-results.json'}]],outputDir:'../../evidence/lab09-capacity-animation/test-output',use:{channel:'chromium',baseURL:'http://127.0.0.1:4173',viewport:{width:1280,height:1000},screenshot:'only-on-failure'}});
