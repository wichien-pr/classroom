import {defineConfig} from '@playwright/test';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('./.browsers',import.meta.url).pathname;
process.env.QUEUE_EVIDENCE='../../evidence/lab10-backlog-animation';
export default defineConfig({testDir:'./tests/browser',workers:1,timeout:90000,reporter:[['list'],['json',{outputFile:'../../evidence/lab10-backlog-animation/browser.json'}]],outputDir:'../../evidence/lab10-backlog-animation/test-output',use:{channel:'chromium',baseURL:'http://127.0.0.1:4173',viewport:{width:1280,height:1000}}});
