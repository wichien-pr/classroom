import {defineConfig} from '@playwright/test';
import {mkdtempSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

// Each invocation owns fresh builds/results, never dist or an existing preview.
const scratch=mkdtempSync(join(tmpdir(),'scale-lab-current-'));
const localBrowsers=fileURLToPath(new URL('./.browsers',import.meta.url));
if(!process.env.PLAYWRIGHT_BROWSERS_PATH&&existsSync(localBrowsers))process.env.PLAYWRIGHT_BROWSERS_PATH=localBrowsers;
const port=Number(process.env.SCALE_LAB_TEST_PORT||4191);
const url=p=>`http://127.0.0.1:${p}`;
const server=(name,p,account)=>{
 const out=join(scratch,name);
 return {
  command:`npm run build -- --outDir ${JSON.stringify(out)} --base / && npm run preview -- --outDir ${JSON.stringify(out)} --port ${p} --strictPort`,
  url:url(p),reuseExistingServer:false,timeout:120000,
  env:{VITE_CLASSROOM_URL:'',VITE_CLASSROOM_PROGRESS_URL:account?'/api/qa/progress':''},
 };
};
export default defineConfig({
 testDir:'./tests/browser',timeout:90000,workers:1,forbidOnly:true,retries:0,
 outputDir:join(scratch,'results'),reporter:[['list'],['json',{outputFile:join(scratch,'results.json')}]],
 use:{channel:'chromium',viewport:{width:1280,height:1000},screenshot:'only-on-failure'},
 projects:[
  {name:'standalone',testMatch:['cdn-current.spec.js','web-presentation.spec.js','dc-comparison.spec.js','queue-story.spec.js','logging-single.spec.js'],use:{baseURL:url(port)}},
  {name:'frontend-api-contract',testMatch:'logging-pipeline-boundaries.spec.js',use:{baseURL:url(port+1)}},
 ],
 webServer:[server('standalone',port,false),server('account',port+1,true)],
});
