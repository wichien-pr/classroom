import {defineConfig} from '@playwright/test';
const output=process.env.MENU_BUILD;
if(!output)throw new Error('Set MENU_BUILD to an isolated Vite build directory');
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('./.browsers',import.meta.url).pathname;
export default defineConfig({testDir:'./tests/browser',testMatch:['sidebar-readability.spec.js','flow-readability.spec.js','flow-slides.spec.js'],workers:1,reporter:'list',use:{channel:'chromium',baseURL:'http://127.0.0.1:4191'},webServer:{command:`npm run preview -- --outDir "${output}" --port 4191 --strictPort`,url:'http://127.0.0.1:4191',reuseExistingServer:false}});
