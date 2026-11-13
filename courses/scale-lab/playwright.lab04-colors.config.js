import {defineConfig} from '@playwright/test';
const evidence=process.env.COLORS_EVIDENCE||'../../evidence/lab04-colors';
export default defineConfig({testDir:'./tests/browser',testMatch:'balance-colors.spec.js',timeout:90000,workers:2,use:{baseURL:process.env.QA_BASE_URL||'http://127.0.0.1:4178'},outputDir:evidence+'/artifacts',reporter:[['list'],['json',{outputFile:evidence+'/results.json'}]]});
