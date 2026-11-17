import {defineConfig} from '@playwright/test';
import {resolve} from 'node:path';
const evidence=resolve(process.env.QA_EVIDENCE||'test-results/lab05-current');
export default defineConfig({
 testDir:'./tests/browser',testMatch:['replication-simple.spec.js','replication-presentation.spec.js'],
 fullyParallel:true,timeout:120000,workers:3,
 use:{baseURL:process.env.QA_BASE_URL||'http://127.0.0.1:4189'},
 outputDir:resolve(evidence,'artifacts'),
 reporter:[['list'],['json',{outputFile:resolve(evidence,'results.json')}]],
});
