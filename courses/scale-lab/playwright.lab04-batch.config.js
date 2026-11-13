import {defineConfig} from '@playwright/test';
const evidence=process.env.BATCH_EVIDENCE||'../../evidence/lab04-batch';
export default defineConfig({testDir:'./tests/browser',testMatch:'balance-batch.spec.js',timeout:120000,workers:2,use:{baseURL:process.env.QA_BASE_URL||'http://127.0.0.1:4178'},outputDir:evidence+'/artifacts',reporter:[['list'],['json',{outputFile:evidence+'/results.json'}]]});
