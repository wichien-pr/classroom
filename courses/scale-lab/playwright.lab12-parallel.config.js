import {defineConfig} from '@playwright/test';
const evidence=process.env.QA_EVIDENCE||'../../evidence/lab12-parallel';
export default defineConfig({testDir:'./tests/browser',testMatch:/data-tier-parallel\.spec\.js/,timeout:90000,workers:1,use:{baseURL:process.env.QA_URL||'http://127.0.0.1:4178'},outputDir:evidence+'/playwright',reporter:[['list'],['json',{outputFile:evidence+'/browser.json'}]]});
