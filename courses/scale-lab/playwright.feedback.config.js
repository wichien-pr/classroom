import {defineConfig} from '@playwright/test';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('./.browsers',import.meta.url).pathname;
export default defineConfig({testDir:'./tests/browser',testMatch:['feedback-typography.spec.js','flow-thinking-readability.spec.js','quiz-order.spec.js','participation.spec.js'],workers:1,timeout:120000,reporter:'list',outputDir:'/Users/prommeesee/.hermes/cache/scratch/feedback-results',use:{baseURL:'http://127.0.0.1:4178',headless:true}});
