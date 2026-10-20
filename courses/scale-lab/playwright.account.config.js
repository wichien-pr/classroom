import {defineConfig} from '@playwright/test';
process.env.PLAYWRIGHT_BROWSERS_PATH = new URL('./.browsers',import.meta.url).pathname;
export default defineConfig({testDir:'./tests/account',workers:1,reporter:'list',use:{channel:'chromium',baseURL:'http://127.0.0.1:4176'},webServer:{command:'VITE_CLASSROOM_URL=/ VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress npm run dev -- --port 4176 --strictPort',url:'http://127.0.0.1:4176',reuseExistingServer:false}});
