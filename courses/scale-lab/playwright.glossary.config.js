import {defineConfig} from '@playwright/test';
process.env.PLAYWRIGHT_BROWSERS_PATH = new URL('./.browsers',import.meta.url).pathname;
export default defineConfig({testDir:'./tests/browser',testMatch:['terms.spec.js','terms-expansions.spec.js'],workers:1,reporter:[['list'],['json',{outputFile:'evidence/glossary/browser-results.json'}]],use:{channel:'chromium',baseURL:process.env.GLOSSARY_URL||'http://127.0.0.1:4187',viewport:{width:1440,height:1000},screenshot:'only-on-failure'},outputDir:'evidence/glossary/test-results'});
