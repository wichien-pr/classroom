import {defineConfig} from '@playwright/test';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('./.browsers',import.meta.url).pathname;
process.env.QUEUE_EVIDENCE='../../evidence/lab10-message-boxes';
export default defineConfig({testDir:'./tests/browser',workers:1,timeout:120000,reporter:[['list'],['json',{outputFile:process.env.QUEUE_REPORT||'../../evidence/lab10-message-boxes/browser.json'}]],outputDir:'../../evidence/lab10-message-boxes/test-output',use:{channel:'chromium',baseURL:'http://127.0.0.1:4173',viewport:{width:1280,height:1000}}});
