import {defineConfig} from '@playwright/test';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('./.browsers',import.meta.url).pathname;
export default defineConfig({testDir:'./tests/browser',testMatch:'read-more-typography.spec.js',workers:1,timeout:120000,reporter:'list',outputDir:process.env.READ_MORE_EVIDENCE||'/Users/prommeesee/.hermes/cache/scratch/read-more-test-results',use:{baseURL:'http://127.0.0.1:4178',headless:true}});
