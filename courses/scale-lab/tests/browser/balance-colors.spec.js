import {test,expect} from '@playwright/test';
const evidence=process.env.COLORS_EVIDENCE||new URL('../../../../evidence/lab04-colors/',import.meta.url).pathname;
const colors={light:{routing:'rgb(8, 85, 157)',delivered:'rgb(23, 102, 82)',failed:'rgb(180, 35, 50)'},dark:{routing:'rgb(110, 202, 255)',delivered:'rgb(125, 227, 198)',failed:'rgb(255, 142, 152)'}};
for(const theme of ['light','dark'])for(const width of [1280,390,320])test(`request stages ${theme} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.locator('[data-lesson="4"]').click();
 const card=i=>page.locator(`[data-request="${i}"]`);
 async function state(i,value){await expect(card(i)).toHaveAttribute('data-request-state',value);if(colors[theme][value]){await expect(card(i)).toHaveCSS('color',colors[theme][value]);await expect(card(i)).toHaveCSS('border-top-color',colors[theme][value]);await expect(card(i).locator('small')).toHaveCSS('color',colors[theme][value]);}}
 async function pause(){await page.locator('#balance-pause').click();await page.locator('.balance-particle').evaluateAll(async es=>Promise.all(es.flatMap(e=>e.getAnimations()).map(a=>a.ready)));}
 await state(0,'waiting');const neutral=await card(5).evaluate(e=>getComputedStyle(e).backgroundColor);
 await page.locator('#route').click();await pause();await state(0,'routing');await state(1,'waiting');expect(await card(0).evaluate(e=>getComputedStyle(e).backgroundColor)).not.toBe(neutral);
 await page.waitForTimeout(1500);await state(0,'routing');await expect(card(0)).toContainText('กำลังส่ง');
 await page.locator('#balance-pause').click();await expect.poll(()=>page.locator('.balance-particle[data-active=true]').evaluateAll(es=>Math.max(...es.flatMap(e=>e.getAnimations()).map(a=>a.currentTime||0))),{intervals:[30]}).toBeGreaterThan(1300);await pause();await state(0,'routing');await state(1,'waiting');await page.locator('#balance-pause').click();await expect(card(1)).toHaveAttribute('data-request-state','routing',{timeout:4000});await pause();await state(0,'delivered');await state(1,'routing');await state(2,'waiting');
 await page.setViewportSize({width,height:2000});await page.locator('.balance-scene').evaluate(e=>window.scrollTo(0,e.getBoundingClientRect().top+scrollY-120));await page.locator('.balance-scene').screenshot({path:`${evidence}/${theme}-${width}-intermediate.png`});
 await page.locator('#balance-pause').click();await expect(page.locator('#route')).toBeEnabled({timeout:20000});for(let i=0;i<6;i++)await state(i,'delivered');
 await page.locator('#balance-replay').click();await pause();await state(0,'routing');await state(1,'waiting');
 await page.locator('#lesson-topic-next').click();await state(0,'waiting');await page.waitForTimeout(2600);await state(0,'waiting');
 await page.locator('#lesson-topic-next').click();await page.locator('#route').click();await pause();await state(0,'routing');await page.locator('#balance-pause').click();await expect(card(1)).toHaveAttribute('data-request-state','routing',{timeout:3000});await pause();await state(0,'failed');await state(1,'routing');await state(2,'waiting');
 await page.locator('.balance-scene').evaluate(e=>window.scrollTo(0,e.getBoundingClientRect().top+scrollY-120));await page.locator('.balance-scene').screenshot({path:`${evidence}/${theme}-${width}-503.png`});
 await page.emulateMedia({reducedMotion:'reduce'});await state(1,'failed');await page.locator('#balance-pause').click();await expect(page.locator('#route')).toBeEnabled();for(let i=0;i<6;i++)await state(i,'failed');
 await page.locator('#balance-replay').click();await expect(page.locator('#route')).toBeEnabled();for(let i=0;i<6;i++)await state(i,'failed');
 await page.locator('#reset').click();await state(0,'waiting');
});
