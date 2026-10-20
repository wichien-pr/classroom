import {test,expect} from '@playwright/test';
test('LAB05 source topology, manual lag/failure/recovery and LAB06 session',async({page})=>{
 await page.goto('/');await page.locator('[data-lesson="5"]').click();
 await expect(page.locator('.source-ref')).toHaveText('Database replication');
 await expect(page.locator('#architecture .replication-diagram')).toContainText('DNS คืน IP');
 await expect(page.locator('#architecture .replication-diagram')).toContainText('Web tier');
 await expect(page.locator('.replication-notes')).toContainText('ทำสำเนาฐานข้อมูล');
 await expect(page.locator('.replication-notes')).not.toContainText(/เอกสาร|ต้นฉบับ|Figure|PDF|หน้า\s*\d/);
 await expect(page.locator('.replication-fanout')).toContainText('Primary → Replica 1');
 await expect(page.locator('.replication-fanout')).toContainText('Primary → Replica 2');
 await page.locator('#write').click();await page.locator('#read-replica').click();await expect(page.locator('#outcome')).toContainText('STALE');
 await page.locator('#sync').click();await page.locator('#read-replica').click();await expect(page.locator('#outcome')).not.toContainText('STALE');
 await page.locator('#db-up-1').uncheck();await page.locator('#read-replica').click();await expect(page.locator('#outcome')).toContainText('Replica 2');
 await page.locator('#db-up-2').uncheck();await page.locator('#read-replica').click();await expect(page.locator('#outcome')).toContainText('fallback');
 await page.locator('#write').click();await page.locator('#db-up-0').uncheck();await page.locator('#write').click();await expect(page.locator('#outcome')).toContainText('503');
 await page.locator('#db-up-1').check();await page.locator('#promote').click();await expect(page.locator('#outcome')).toContainText('ยัง promote ไม่ได้');
 await page.locator('#fenced').check();await page.locator('#accept-loss').check();await page.locator('#promote').click();await expect(page.locator('#outcome')).toContainText('สูญเสีย 1');await expect(page.locator('#db-up-0')).toBeDisabled();
 await page.locator('#write').click();await expect(page.locator('#outcome')).toContainText('Replica 1');
 await page.locator('#reset').click();await expect(page.locator('[data-db="0"]')).toContainText('version 0');
 for(const width of [320,390,1440]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await page.locator('#architecture .replication-diagram').evaluate(el=>[...el.querySelectorAll('span,strong')].every(x=>parseFloat(getComputedStyle(x).fontSize)>=14))).toBe(true);}
 await page.locator('[data-lesson="6"]').click();await expect(page.locator('h1')).toContainText('session');await page.locator('#login').click();await page.locator('#session').click();await expect(page.locator('#outcome')).toContainText('401');
});
test('legacy standalone completion follows identity through swap and reload',async({page})=>{
 await page.addInitScript(()=>{if(!localStorage.getItem('seeded')){localStorage.setItem('scale-lab-progress','[5]');localStorage.setItem('seeded','1');}});
 await page.goto('/');await expect(page.locator('[data-lesson="6"] .done')).toHaveText('✓');await expect(page.locator('[data-lesson="5"] .done')).toBeEmpty();
 await page.locator('[data-lesson="5"]').click();await page.locator('#complete-lesson').click();await page.reload();
 await expect(page.locator('[data-lesson="5"] .done')).toHaveText('✓');await expect(page.locator('[data-lesson="6"] .done')).toHaveText('✓');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('scale-lab-progress-v2')))).toEqual({version:2,completed:['replica','session']});
 expect(await page.evaluate(()=>localStorage.getItem('scale-lab-progress'))).toBe('[5]');
});
