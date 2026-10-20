import {test,expect} from '@playwright/test';
test('Cache LAB06 teaches tier/TTL/eviction/failure without attribution and preserves retired local history',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('scale-lab-progress','[5]'));
 await page.goto('/');await page.locator('[data-lesson="6"]').click();
 await expect(page.locator('.course-label')).toContainText('11 LABS');
 await expect(page.locator('#progress')).toContainText('0 / 11');
 await expect(page.locator('#cache-notes')).toContainText('LRU');
 await expect(page.locator('#cache-notes')).toContainText('read-through');
 await expect(page.locator('#cache-diagram')).toBeVisible();
 expect(await page.locator('body').innerText()).not.toMatch(/Cache\.pdf|PDF|คู่มือต้นฉบับ|หน้า\s*\d/);
 await page.locator('#read-cache').click();await page.locator('#price').fill('220');await page.locator('#update').click();await page.locator('#read-cache').click();await expect(page.locator('#outcome')).toContainText('STALE');
 for(let i=0;i<3;i++)await page.locator('#cache-tick').click();
 await page.locator('#read-cache').click();await expect(page.locator('#outcome')).toContainText('220 / DB 220');
 await page.locator('#cache-outage').click();await page.locator('#read-cache').click();await expect(page.locator('#outcome')).toContainText('BYPASS');
 await page.locator('#cache-restart').click();await page.locator('#read-cache').click();await expect(page.locator('#outcome')).toContainText('MISS');
 await page.locator('#complete-lesson').click();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('scale-lab-progress-v2')).completed)).toEqual(['session','cache']);
 await page.reload();await expect(page.locator('#progress')).toContainText('1 / 11');
 await page.locator('[data-lesson="11"]').click();await page.locator('#next').click();await expect(page.locator('.lesson-heading .eyebrow')).toContainText('LAB 01');
});

test('cache diagram text has readable contrast on boxes, links and code',async({page})=>{
 await page.goto('/');await page.locator('[data-lesson="6"]').click();await page.locator('#read-cache').click();
 const ratios=await page.locator('.cache-box,.cache-link,.cache-selected,#cache-notes pre').evaluateAll(nodes=>nodes.map(el=>{
  const rgb=s=>s.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4;});
  const lum=s=>{const [r,g,b]=rgb(s);return .2126*r+.7152*g+.0722*b;};
  let bg=el;while(getComputedStyle(bg).backgroundColor==='rgba(0, 0, 0, 0)'&&bg.parentElement)bg=bg.parentElement;
  const a=lum(getComputedStyle(el).color),b=lum(getComputedStyle(bg).backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
 }));
 for(const ratio of ratios)expect(ratio).toBeGreaterThanOrEqual(4.5);
});
