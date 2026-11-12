import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const evidence=process.env.QA_EVIDENCE;
for(const theme of ['light','dark'])for(const width of [1280,390,320])test(`partition, routes, growing load and controls ${theme} ${width}`,async({page})=>{
 await mkdir(evidence,{recursive:true});await page.setViewportSize({width,height:800});await page.goto('/');
 await page.evaluate(t=>{document.documentElement.dataset.theme=t;document.documentElement.dataset.classroomTheme=t},theme);
 await page.locator('[data-lesson="12"]').click();await page.locator('#lesson-topic-next').click();
 await expect(page.locator('.tier-sharding')).toHaveCount(1);
 await expect(page.locator('#lesson-topic-title')).toHaveText('2 / 2 · Sharding · แบ่งข้อมูล กระจายภาระงาน');
 for(let phase=0;phase<1;phase++){
  await expect(page.locator('.tier-phase')).toHaveText(`แบ่งข้อมูล → แบ่งภาระต่อเครื่อง`);
  await expect(page.locator('.tier-scene')).toHaveAttribute('data-phase','placement');
  await page.locator('#tier-pause').click();
  await page.evaluate(()=>Promise.all(document.getAnimations().map(a=>a.ready)));
  const times=()=>page.locator('.tier-token:not([hidden])').evaluateAll(es=>es.flatMap(e=>e.getAnimations()).map(a=>a.currentTime));
  const frozen=await times();expect(frozen.length).toBeGreaterThan(0);await page.waitForTimeout(100);expect(await times()).toEqual(frozen);
  await page.locator('#tier-pause').click();
  await expect(page.locator('.tier-scene')).toHaveAttribute('data-phase','requests');
  await page.evaluate(()=>Promise.all(document.getAnimations().map(a=>a.ready)));
  const moving=await times();await page.waitForTimeout(120);expect(await times()).not.toEqual(moving);
  await expect(page.locator('.tier-scene')).toHaveAttribute('data-phase','capacity',{timeout:10000});await page.locator('#tier-pause').click();
  const loads=[4,4,4,4];
  expect(await page.locator('.tier-load').allTextContents()).toEqual(loads.map(n=>`ภาระ ${n} / 8`));
  expect(await page.locator('[data-row]').evaluateAll(es=>es.map(e=>Number(e.dataset.row)).sort((a,b)=>a-b))).toEqual(Array.from({length:16},(_,i)=>i));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  const height=await page.locator('#lesson-topic').evaluate(e=>e.getBoundingClientRect().height);await page.setViewportSize({width,height:Math.ceil(height)+200});
  await page.locator('#lesson-topic').screenshot({path:`${evidence}/${theme}-${width}-phase${phase}.png`});await page.setViewportSize({width,height:800});
  await page.locator('#tier-pause').click();
 }
 await expect(page.locator('.tier-scene')).toHaveAttribute('data-playback','finished');
 await page.locator('#tier-replay').click();await expect(page.locator('.tier-scene')).toHaveAttribute('data-phase','placement');
 await expect(page.locator('#lesson-topic-next')).toBeDisabled();await expect(page.locator('#lesson-topic')).not.toContainText('Resharding');await expect(page.locator('.tier-migration, .tier-move-count, #tier-shards')).toHaveCount(0);
 await page.locator('#lesson-topic-back').click();await expect(page.locator('#lesson-topic-title')).toContainText('1 / 2');await expect(page.locator('#lesson-topic-back')).toBeDisabled();await expect(page.locator('#lesson-topic-next')).toBeEnabled();await page.locator('#reset').click();await expect(page.locator('#lesson-topic-title')).toContainText('1 / 2');await expect(page.locator('#lesson-topic-back')).toBeDisabled();await expect(page.locator('.tier-comparison')).toHaveCount(3);await expect(page.locator('.tier-bridge')).toHaveCount(0);
});
test('explicit experiment advances real per-shard load; pause, replay and navigation never add evaluations',async({page})=>{
 await page.goto('/');await page.locator('[data-lesson="12"]').click();await page.locator('#lesson-topic-next').click();
 await page.locator('#tier-run').click();await expect(page.locator('.tier-phase')).toHaveText('แบ่งข้อมูล → แบ่งภาระต่อเครื่อง');
 await expect(page.locator('.tier-load').first()).toHaveText('ภาระ 1 / 8');await page.locator('#tier-pause').click();
 const counts=await page.locator('.tier-load').allTextContents();expect(counts).toEqual(Array(4).fill('ภาระ 1 / 8'));
 await page.waitForTimeout(250);expect(await page.locator('.tier-load').allTextContents()).toEqual(counts);
 const geometry=await page.locator('.tier-token:not([hidden])').evaluateAll(es=>es.map(e=>{const b=e.getBoundingClientRect(),g=e.parentElement.getBoundingClientRect();return b.left>=g.left-1&&b.right<=g.right+1;}));expect(geometry).toEqual(Array(4).fill(true));
 await page.locator('#tier-pause').click();await expect(page.locator('.tier-load').first()).toHaveText('ภาระ 2 / 8');
 await page.locator('#lesson-topic-back').click();await expect(page.locator('#lesson-topic-title')).toContainText('1 / 2');
 await page.locator('[data-answer="0"]').click();await expect(page.locator('#complete-lesson')).toBeDisabled();
 await page.waitForTimeout(7000);await expect(page.locator('#lesson-topic-title')).toContainText('1 / 2');await expect(page.locator('#complete-lesson')).toBeDisabled();
});
test('explicit run, reduced-motion replay and navigation retain completion gates',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.locator('[data-lesson="12"]').click();await page.locator('#lesson-topic-next').click();await page.locator('#tier-replay').click();await expect(page.locator('.tier-scene')).toHaveAttribute('data-playback','finished');
 await page.locator('[data-answer="0"]').click();await expect(page.locator('#complete-lesson')).toBeDisabled();await page.locator('#tier-run').click();await expect(page.locator('#complete-lesson')).toBeEnabled();
});
