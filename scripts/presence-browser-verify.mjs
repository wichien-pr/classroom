import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
process.env.PLAYWRIGHT_BROWSERS_PATH = new URL('../courses/scale-lab/.browsers', import.meta.url).pathname;
const {chromium} = await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const {expect} = await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const evidence = new URL('../evidence/presence/', import.meta.url).pathname;
const qa = JSON.parse(await readFile(evidence+'server.json'));
assert.match(qa.url, /^http:\/\/127\.0\.0\.1:8134$/);
const browser = await chromium.launch({channel:'chromium'});
const checks = [], errors = [];
const check = text => checks.push(text);
async function login(page, uid=1) {
  await page.goto(qa.url+'/login');
  await page.locator('[name=email]').fill(`presence-${uid}@example.test`);
  await page.locator('[name=password]').fill('QA-presence-only-2026');
  await page.locator('form button[type=submit], form button:not([type])').first().click();
  await page.waitForURL(qa.url+'/');
  await expect(page.locator('.presence')).toHaveAttribute('data-state','ready');
}
async function snapshot(page) { return (await page.request.get(qa.url+'/api/presence')).json(); }
async function shot(page, name) { await page.screenshot({path:evidence+name+'.png',fullPage: !/^(header|popover)-/.test(name)}); }
try {
  const context = await browser.newContext({viewport:{width:1440,height:1000}}), page = await context.newPage();
  page.on('pageerror', e => errors.push(String(e)));
  assert.equal((await page.request.get(qa.url+'/api/presence')).status(),401);
  await login(page); await expect(page.locator('#presence-label')).toHaveText('ออนไลน์ 1');
  check('guest denied; authenticated initial visible heartbeat');
  const otherContext = await browser.newContext(), other = await otherContext.newPage();
  await login(other,2);
  const thirdContext = await browser.newContext(), third = await thirdContext.newPage();
  await login(third,3);
  const duplicateContext = await browser.newContext(), duplicate = await duplicateContext.newPage();
  await login(duplicate,1);
  const tab = await context.newPage(); await tab.goto(qa.url+'/account/profile');
  await expect(tab.locator('.presence')).toHaveAttribute('data-state','ready');
  assert.equal((await snapshot(page)).total,3); check('unique across two tabs and independent sessions');
  await tab.close();
  await page.reload(); await expect(page.locator('#presence-label')).toHaveText('ออนไลน์ 3');
  await expect(page.locator('#presence-stack .presence-face')).toHaveCount(3);
  await expect(page.locator('#presence-stack img')).toHaveCount(1);
  assert.equal(await page.locator('#presence-stack img').evaluate(i=>i.complete&&i.naturalWidth>0),true);
  await shot(page,'header-desktop');
  await page.locator('#presence-toggle').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#presence-panel')).toBeVisible();
  await expect(page.locator('#presence-members a')).toHaveCount(3);
  await expect(page.locator('#presence-members')).toContainText('<script>ปลอดภัย</script>');
  assert.equal(await page.locator('#presence-members script').count(),0);
  assert.equal((await page.locator('#presence-panel').textContent()).includes('@example.test'),false);
  await shot(page,'popover-desktop');
  await page.keyboard.press('Escape'); await expect(page.locator('#presence-panel')).toBeHidden();
  await expect(page.locator('#presence-toggle')).toBeFocused();
  check('real photo, escaped long names, no email; keyboard disclosure and Escape focus return');
  for (const width of [390,320]) {
    await page.setViewportSize({width,height:844});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await shot(page,`header-${width}`);
    await page.locator('#presence-toggle').click(); await expect(page.locator('#presence-panel')).toBeVisible();
    const bounds = await page.locator('#presence-panel').boundingBox(); assert.ok(bounds.x>=0&&bounds.x+bounds.width<=width);
    for (const id of ['toggle','close']) assert.ok((await page.locator('#presence-'+id).boundingBox()).height>=44);
    await shot(page,`popover-${width}`);
    await page.keyboard.press('Escape');
  }
  check('320/390 no document overflow; bounded popover; 44px targets');
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('#presence-toggle').click();
  await page.locator('#presence-members a[href="/members/2"]').click();
  await page.waitForURL(qa.url+'/members/2'); await expect(page.locator('.profile-name')).toHaveText('QA สมชาย');
  await expect(page.locator('.presence')).toHaveAttribute('data-state','ready');
  await shot(page,'member-profile'); check('member link and shared profile header');
  for (const route of ['/leaderboards','/community','/account/profile/edit']) {
    await page.goto(qa.url+route); await expect(page.locator('.presence')).toHaveAttribute('data-state','ready');
  }
  check('leaderboards/community/profile editor shared header');
  await duplicate.getByRole('button',{name:'ออกจากระบบ',exact:true}).click(); await duplicate.waitForURL('**/login');
  assert.equal((await snapshot(page)).total,3); check('logging out one session preserves another active session');
  await other.getByRole('button',{name:'ออกจากระบบ',exact:true}).click(); await other.waitForURL('**/login');
  assert.equal((await snapshot(page)).total,2); check('last-session logout disappears immediately');
  let coursePosts=0;
  third.on('request', req=>{if(new URL(req.url()).pathname==='/api/presence'&&req.method()==='POST')coursePosts++;});
  await third.goto(qa.url+'/courses/scale-lab/');
  await expect.poll(()=>coursePosts).toBeGreaterThan(0);
  assert.equal(await third.locator('#presence-toggle').count(),0);
  assert.equal(await third.locator('script[src="/platform/presence.js"]').count(),1);
  await shot(third,'course-presence'); check('unchanged compiled course runs platform heartbeat without header injection');
  // Real two-minute expiry after closing the last visible page for member 3.
  await third.close();
  await expect.poll(async()=> (await snapshot(page)).total,{timeout:130000,intervals:[3000]}).toBe(1);
  check('closed tab expires after real server 120-second window');
  // Browser boundary visibility testing with controlled clock, not OS visibility claims.
  const visibility = await context.newPage(); await visibility.clock.install();
  let posts=0;
  visibility.on('request',r=>{if(r.url().includes('/api/presence')&&r.method()==='POST')posts++;});
  await visibility.goto(qa.url+'/'); await expect(visibility.locator('.presence')).toHaveAttribute('data-state','ready');
  const before=posts;
  await visibility.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});document.dispatchEvent(new Event('visibilitychange'));});
  await visibility.clock.runFor(65000); assert.equal(posts,before);
  await visibility.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'visible'});document.dispatchEvent(new Event('visibilitychange'));});
  await expect.poll(()=>posts).toBe(before+1);
  await visibility.close(); check('hidden visibility event stops timers; visible event resumes immediately');
  // Populate pagination using authenticated QA-only fixture accounts through real APIs.
  const fixtureContexts=[];
  for(let uid=4;uid<=23;uid++) {
    const c=await browser.newContext(); fixtureContexts.push(c);
    const html=await (await c.request.get(qa.url+'/login')).text();
    const csrf=html.match(/name="csrf_token" value="([^"]+)"/)[1];
    await c.request.post(qa.url+'/login',{form:{email:`presence-${uid}@example.test`,password:'QA-presence-only-2026',csrf_token:csrf}});
    const data=await (await c.request.get(qa.url+'/api/presence')).json();
    assert.equal((await c.request.post(qa.url+'/api/presence',{data:{},headers:{'X-CSRF-Token':data.csrf_token,Origin:qa.url}})).status(),200);
  }
  await page.goto(qa.url+'/'); await expect(page.locator('#presence-label')).toHaveText('ออนไลน์ 21');
  await page.locator('#presence-toggle').click(); await expect(page.locator('#presence-members a')).toHaveCount(20);
  await page.locator('#presence-next').click(); await expect(page.locator('#presence-page')).toHaveText('2 / 2');
  await expect(page.locator('#presence-members a')).toHaveCount(1); await shot(page,'pagination');
  await page.locator('#presence-prev').click(); await expect(page.locator('#presence-page')).toHaveText('1 / 2');
  check('21 unique members pagination total/list consistent and navigable');
  await page.route('**/api/presence*',route=>route.fulfill({status:503,body:'unavailable'}));
  await page.reload(); await expect(page.locator('#presence-label')).toHaveText('ตรวจสอบออนไลน์ไม่ได้');
  assert.equal(await page.locator('#presence-stack .presence-face').count(),0);
  await page.locator('#presence-toggle').click(); await shot(page,'unavailable');
  await page.unroute('**/api/presence*'); await page.locator('#presence-retry').click();
  await expect(page.locator('.presence')).toHaveAttribute('data-state','ready'); check('503 unavailable not zero; clears stale identity and retry recovers');
  await page.route('**/api/presence*',route=>route.fulfill({status:401,body:'expired'}));
  await page.reload(); await expect(page.locator('.presence')).toHaveAttribute('data-state','error');
  await page.locator('#presence-toggle').click(); await expect(page.locator('#presence-status')).toContainText('เซสชันหมดอายุ');
  await expect(page.locator('#presence-retry')).toBeHidden(); check('expired auth clears data and stops retries');
  assert.deepEqual(errors,[]);
  const result={passed:true,checksPassed:checks.length,checks,pageErrors:errors,url:qa.url};
  await writeFile(evidence+'browser.json',JSON.stringify(result,null,2)); console.log(JSON.stringify(result,null,2));
} finally { await browser.close(); }
