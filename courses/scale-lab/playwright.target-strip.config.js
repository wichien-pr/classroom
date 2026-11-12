import {defineConfig} from '@playwright/test';
const evidence=process.env.STRIP_EVIDENCE||'../../evidence/labs01-08-strips';
export default defineConfig({testDir:'./tests/browser',testMatch:'target-instruction-removal.spec.js',timeout:240000,workers:2,use:{baseURL:'http://127.0.0.1:4178'},outputDir:`${evidence}/playwright`,reporter:[['list'],['json',{outputFile:process.env.STRIP_REPORT||`${evidence}/browser.json`}]]});
