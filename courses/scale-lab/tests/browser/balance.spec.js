import {test,expect} from '@playwright/test';
test('LAB04 DNS return, private pool, failover, expansion and reset',async({page})=>{
 await page.goto('/');await page.locator('[data-lesson="4"]').click();
 await expect(page.locator('.balance-diagram')).toContainText('DNS คืน IP ให้ client');
 await expect(page.locator('.balance-diagram')).toContainText('192.0.2.20');
 await page.locator('#route').click();await expect(page.locator('#outcome')).toContainText('App A');
 await page.locator('#route').click();await expect(page.locator('#outcome')).toContainText('App B');
 await page.locator('#up-a').uncheck();await page.locator('#route').click();await expect(page.locator('[data-server="1"]')).toContainText('รับแล้ว 2');
 await page.locator('#up-b').uncheck();await page.locator('#route').click();await expect(page.locator('#outcome')).toContainText('503');
 await page.locator('#up-c').check();await page.locator('#route').click();await expect(page.locator('#outcome')).toContainText('App C');
 await expect(page.locator('[data-server="2"]')).toContainText('รับแล้ว 1');
 await page.locator('#reset').click();await expect(page.locator('#up-c')).not.toBeChecked();await expect(page.locator('[data-server="0"]')).toContainText('รับแล้ว 0');
 for(const width of [320,390,1440]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});
