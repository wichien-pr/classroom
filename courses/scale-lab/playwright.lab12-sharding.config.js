import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/browser',testMatch:/data-tier-sharding\.spec\.js/,timeout:90000,workers:1,use:{baseURL:process.env.QA_URL||'http://127.0.0.1:4178'},outputDir:process.env.QA_EVIDENCE+'/playwright',reporter:[['list'],['json',{outputFile:process.env.QA_EVIDENCE+'/browser.json'}]]});
