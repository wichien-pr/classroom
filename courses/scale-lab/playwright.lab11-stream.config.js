import {defineConfig} from '@playwright/test';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('./.browsers',import.meta.url).pathname;
export default defineConfig({testDir:'./tests/browser',testMatch:process.env.LAB11_ACCOUNT?['logging-pipeline-boundaries.spec.js','logging-stream-account.spec.js']:['logging-stream.spec.js','logging-single.spec.js'],timeout:30000,workers:1,outputDir:process.env.LAB11_EVIDENCE||'evidence/lab11-stream/test-results',reporter:'list',use:{channel:'chromium',baseURL:process.env.LAB11_URL||'http://127.0.0.1:4186',viewport:{width:1280,height:900}}});
