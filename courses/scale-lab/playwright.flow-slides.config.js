import {defineConfig} from '@playwright/test';
const output=process.env.FLOW_SLIDES_BUILD;
if(!output)throw new Error('Set FLOW_SLIDES_BUILD to an isolated Vite build directory');
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('./.browsers',import.meta.url).pathname;
export default defineConfig({testDir:'./tests',testMatch:['account/flow-slides.spec.js'],workers:1,reporter:'list',use:{channel:'chromium',baseURL:'http://127.0.0.1:4187'},webServer:{command:`npm run preview -- --outDir "${output}" --port 4187 --strictPort`,url:'http://127.0.0.1:4187',reuseExistingServer:false}});
