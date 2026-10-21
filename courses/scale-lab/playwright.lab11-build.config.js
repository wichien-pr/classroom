import {defineConfig} from '@playwright/test';
process.env.PLAYWRIGHT_BROWSERS_PATH=process.env.CLASSROOM_BROWSER_CACHE||new URL('./.browsers',import.meta.url).pathname;
export default defineConfig({testDir:'./tests/browser',workers:1,reporter:[['list'],['json',{outputFile:'evidence/lab11/browser.json'}]],use:{channel:'chromium',baseURL:'http://127.0.0.1:4182',viewport:{width:1440,height:1000}},webServer:{command:'npm run preview -- --port 4182 --strictPort',url:'http://127.0.0.1:4182',reuseExistingServer:false}});
