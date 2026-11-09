import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const out=process.env.LAB09_EVIDENCE||new URL('../../../../evidence/lab09-capacity-animation/',import.meta.url).pathname;
for(const width of [1280,390,320])for(const theme of ['light','dark'])test(`capacity ${width} ${theme}`,async({page})=>{
 await mkdir(out,{recursive:true});await page.setViewportSize({width,height:1000});await page.goto('/');await page.locator('[data-lesson="9"]').click();await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
 for(let i=0;i<5;i++)await page.locator('#lesson-topic-next').click();
 await page.locator('#dc-run').click();const scene=page.locator('.dc-scene');
 await expect(scene).toHaveAttribute('data-stage','route');
 expect(await page.locator('.dc-particle').evaluate(async e=>{const a=e.getAnimations()[0];await a.ready;return a.effect.getTiming().duration;})).toBe(2000);
 const geometry=await scene.evaluate(s=>{const map=s.querySelector('.dc-map').getBoundingClientRect(),nodes=[...s.querySelectorAll('.dc-node')].map(n=>n.getBoundingClientRect()),issues=[];for(const p of s.querySelectorAll('.dc-wire'))for(let i=1;i<50;i++){const q=p.getPointAtLength(p.getTotalLength()*i/50),x=q.x+map.x,y=q.y+map.y;if(q.x<0||q.x>map.width||q.y<0||q.y>map.height)issues.push('bounds');if(nodes.some(n=>x>n.left+1&&x<n.right-1&&y>n.top+1&&y<n.bottom-1))issues.push('intersection');}return issues;});expect(geometry).toEqual([]);
 await expect(page.locator('.dc-capacity-excess')).not.toBeVisible();
 await expect(scene).toHaveAttribute('data-stage','capacity-fill');await page.locator('#dc-pause').click();await page.evaluate(async()=>Promise.all(document.getAnimations().map(a=>a.ready)));
 const time=await scene.evaluate(s=>s.getAnimations({subtree:true}).map(a=>a.currentTime));await scene.screenshot({path:out+`mid-${width}-${theme}.png`});await page.waitForTimeout(1500);expect(await scene.evaluate(s=>s.getAnimations({subtree:true}).map(a=>a.currentTime))).toEqual(time);await expect(page.locator('#dc-run')).toBeDisabled();
 await page.locator('#dc-pause').click();await expect(scene).toHaveAttribute('data-playback','finished');await expect(page.locator('#dc-run')).toBeEnabled();
 await expect(page.locator('.dc-capacity-within')).toContainText('60 / 60');await expect(page.locator('.dc-capacity-excess')).toContainText('เกินกำลัง 40');await expect(page.locator('[data-node=east]')).toContainText('เครื่องพร้อม');await expect(page.locator('[data-node=east]')).not.toHaveClass(/dc-offline/);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await scene.screenshot({path:out+`final-${width}-${theme}.png`});await page.locator('#dc-replay').click();await expect(scene).toHaveAttribute('data-stage','route');await expect(page.locator('.dc-capacity-excess')).not.toBeVisible();await expect(scene).toHaveAttribute('data-stage','capacity-fill');await expect(page.locator('#lesson-topic-next')).toBeDisabled();await page.locator('#lesson-topic-back').click();await page.waitForTimeout(1600);await expect(page.locator('.dc-capacity-panel')).toHaveCount(0);await expect(page.locator('#dc-result')).toContainText('ยังไม่ได้ทดลอง');
 await page.locator('#lesson-topic-next').click();await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#dc-run').click();await expect(scene).toHaveAttribute('data-stage','capacity-excess');await expect(page.locator('#dc-run')).toBeEnabled();await expect(page.locator('.dc-capacity-excess')).toBeVisible();
});
