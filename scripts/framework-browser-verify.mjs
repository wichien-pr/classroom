// Authenticated synthetic-account QA of the actual image; no live volume/env/email.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomUUID, randomBytes} from 'node:crypto';
import {mkdirSync, writeFileSync} from 'node:fs';
import {chromium} from '../courses/framework-for-system-design-interview/node_modules/@playwright/test/index.mjs';
const image = process.env.FRAMEWORK_QA_IMAGE || 'classroom:https-local';
const name = 'classroom-framework-browser-' + randomUUID();
const out = new URL('../evidence/framework-integration/', import.meta.url);
mkdirSync(out, {recursive:true});
const run = (args, input) => execFileSync('docker', args, {encoding:'utf8', input, stdio:['pipe','pipe','pipe']}).trim();
const id = 'framework-for-system-design-interview';
const title = 'A Framework For System Design Interviews';
let browser;
try {
  run(['run','-d','--name',name,'--label','classroom.qa=framework-empty','-p','127.0.0.1::8080',
    '--read-only','--tmpfs','/tmp:rw,nosuid,size=64m','-e','APPWORKS_DATABASE=/tmp/qa.sqlite3',
    '-e','APPWORKS_PROFILE_UPLOAD_DIR=/tmp/photos','-e','APPWORKS_COMMUNITY_UPLOAD_DIR=/tmp/uploads',
    '-e','APPWORKS_RESET_ENABLED=0',image,'waitress-serve','--listen=0.0.0.0:8080','--call','app:create_app']);
  const meta = JSON.parse(run(['inspect',name]))[0]; // inspected privately; never dump env
  assert.equal(meta.Config.Labels['classroom.qa'], 'framework-empty');
  assert.equal(meta.Mounts.length, 0);
  const origin = 'http://127.0.0.1:' + meta.NetworkSettings.Ports['8080/tcp'][0].HostPort;
  for(let i=0;i<60;i++) {try {if((await fetch(origin+'/healthz')).ok) break;} catch {} await new Promise(r=>setTimeout(r,500));}
  const password = randomBytes(24).toString('hex');
  run(['exec','-i',name,'python','-c', `import sqlite3,sys,os
from werkzeug.security import generate_password_hash
assert os.environ['APPWORKS_DATABASE']=='/tmp/qa.sqlite3'
with sqlite3.connect('/tmp/qa.sqlite3') as db:
 assert db.execute('SELECT count(*) FROM users').fetchone()[0]==0
 db.execute('INSERT INTO users(name,email,password_hash,username) VALUES(?,?,?,?)',('Empty course QA','framework@example.test',generate_password_hash(sys.stdin.read()),'framework-qa'))`],password);
  browser = await chromium.launch({headless:true});
  const results=[];
  for(const width of [1280,390,320]) {
    const context = await browser.newContext({viewport:{width,height:800}});
    const page = await context.newPage();
    const errors=[], failedAssets=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.url().includes('/assets/') && r.status()>=400) failedAssets.push(r.status());});
    await page.goto(origin+`/courses/${id}/`);
    assert.equal(new URL(page.url()).pathname,'/login');
    await page.locator('[name=email]').fill('framework@example.test');
    await page.locator('[name=password]').fill(password);
    await page.locator('form button[type=submit], form button').first().click();
    await page.waitForURL(origin+'/');
    const card=page.locator(`a.card[href="/courses/${id}/"]`);
    await card.waitFor();
    assert.equal(await card.locator('h2').textContent(),title);
    assert.match(await card.textContent(),/รอเอกสารต้นฉบับ/);
    assert.equal(await card.locator('progress').count(),0);
    await page.screenshot({path:new URL(`catalog-${width}.png`,out).pathname,fullPage:true});
    await card.click();
    await page.getByRole('heading',{name:title,exact:true}).waitFor();
    await page.getByRole('heading',{name:'รอเอกสารต้นฉบับ',exact:true}).waitFor();
    assert.equal(await page.locator('progress,[data-lesson],[data-answer],.completion-strip').count(),0);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    const back=page.getByRole('link',{name:'ออกจากคลาส · กลับหน้าแรก'});
    assert.ok((await back.boundingBox()).height>=44);
    await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));
    assert.ok((await back.boundingBox()).y>=0);
    await back.focus();
    await page.keyboard.press('Enter');
    await page.waitForURL(origin+'/');
    await card.waitFor();
    await card.click();
    await page.reload();
    await page.getByRole('heading',{name:title,exact:true}).waitFor();
    await page.screenshot({path:new URL(`course-${width}.png`,out).pathname,fullPage:true});
    const exam=await (await context.request.get(origin+'/api/exam')).json();
    assert.equal(exam.completed_courses,0); assert.equal(exam.eligible,false); assert.equal(exam.attempt,null);
    for(const endpoint of ['progress','participation']) assert.equal((await context.request.get(origin+`/api/courses/${id}/${endpoint}`)).status(),404);
    const ranks=await(await context.request.get(origin+'/api/leaderboards')).json();
    assert.equal(ranks.members[0].level,1); assert.equal(ranks.members[0].completed_courses,0);
    await back.click();
    await page.getByRole('button',{name:'ออกจากระบบ',exact:true}).click();
    await page.waitForURL(origin+'/login');
    const guest=await context.request.get(origin+`/courses/${id}/`,{maxRedirects:0});
    assert.equal(guest.status(),303);
    assert.deepEqual(errors,[]); assert.deepEqual(failedAssets,[]);
    results.push({width,login:true,catalog:true,entry:true,returnWithSession:true,reload:true,noCredit:true,logout:true,noPageErrors:true});
    await context.close();
  }
  const report={image:meta.Image,syntheticAccountOnly:true,mailDisabled:true,isolatedTmpfsDatabase:true,results};
  writeFileSync(new URL('browser.json',out),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
} finally { if(browser) await browser.close(); run(['rm','-f',name]); }
