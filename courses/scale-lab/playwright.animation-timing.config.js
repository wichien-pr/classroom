import {defineConfig} from '@playwright/test';
const evidence=process.env.ANIMATION_TIMING_EVIDENCE||'../../evidence/animation-timing-config';
export default defineConfig({testDir:'./tests/browser',testMatch:/(particle-speed|animation-timing)\.spec\.js/,timeout:120000,workers:1,use:{baseURL:'http://127.0.0.1:4178',viewport:{width:1280,height:900}},outputDir:`${evidence}/playwright`,reporter:[['list'],['json',{outputFile:`${evidence}/browser.json`}]]});
