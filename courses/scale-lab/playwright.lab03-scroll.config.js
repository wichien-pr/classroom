import {defineConfig} from '@playwright/test';
const evidence=process.env.SCROLL_EVIDENCE||'../../evidence/lab03-scroll';
export default defineConfig({testDir:'./tests/browser',testMatch:'scaling-scroll.spec.js',timeout:90000,workers:1,use:{baseURL:process.env.QA_BASE_URL||'http://127.0.0.1:4178'},outputDir:evidence+'/artifacts',reporter:[['list'],['json',{outputFile:evidence+'/results.json'}]]});
