import {defineConfig} from '@playwright/test';
process.env.PLAYWRIGHT_BROWSERS_PATH = new URL('./.browsers',import.meta.url).pathname;
export default defineConfig({testDir:'./tests/browser',workers:1, reporter:[['list'],['json',{outputFile:'evidence/browser-results.json'}]],use:{channel:'chromium',baseURL:'http://127.0.0.1:4175',viewport:{width:1440,height:1000},screenshot:'only-on-failure'},webServer:{command:'npm run dev -- --port 4175 --strictPort',url:'http://127.0.0.1:4175',reuseExistingServer:false}});
