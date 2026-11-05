import {defineConfig} from '@playwright/test';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('./.browsers',import.meta.url).pathname;
export default defineConfig({testDir:'./tests/browser',testMatch:'lesson-topics*.spec.js',workers:1,reporter:'list',use:{channel:'chromium',baseURL:'http://127.0.0.1:4198'},webServer:{command:'npm run dev -- --port 4198 --strictPort',url:'http://127.0.0.1:4198',reuseExistingServer:false}});
