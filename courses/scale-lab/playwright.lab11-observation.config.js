process.env.LOGGING_QA_EVIDENCE ||= '../../evidence/lab11-merge-observation';
import {defineConfig} from '@playwright/test';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('./.browsers',import.meta.url).pathname;
export default defineConfig({testDir:'./tests/browser',testMatch:['logging-navigation.spec.js','logging-story.spec.js','logging-merged-pages.spec.js','logging-observation.spec.js'],timeout:60000,expect:{timeout:15000},fullyParallel:true,workers:3,outputDir:process.env.LOGGING_QA_EVIDENCE+'/test-results',reporter:[['list'],['json',{outputFile:process.env.LOGGING_QA_EVIDENCE+'/browser.json'}]],use:{channel:'chromium',baseURL:process.env.LOGGING_QA_URL||'http://127.0.0.1:4173',viewport:{width:1280,height:800}}});
