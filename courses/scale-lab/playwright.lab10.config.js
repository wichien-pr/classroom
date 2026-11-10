import {defineConfig} from '@playwright/test';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('./.browsers',import.meta.url).pathname;
export default defineConfig({testDir:'./tests/browser',workers:1,timeout:90000,reporter:[['list'],['json',{outputFile:'../../evidence/lab10-presentation/compiled-browser.json'}]],outputDir:'../../evidence/lab10-presentation/test-output',use:{channel:'chromium',baseURL:'http://127.0.0.1:4173',viewport:{width:1280,height:800}}});
