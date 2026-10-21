import {defineConfig} from '@playwright/test';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('./.browsers',import.meta.url).pathname;
export default defineConfig({testDir:'./tests/browser',workers:1,reporter:[['list'],['json',{outputFile:'evidence/lab10/compiled-browser.json'}]],use:{channel:'chromium',baseURL:'http://127.0.0.1:4180',viewport:{width:1440,height:1000}},webServer:{command:'npm run preview -- --port 4180 --strictPort',url:'http://127.0.0.1:4180',reuseExistingServer:false}});
