import {test,expect} from '@playwright/test';
for(const theme of ['dark','light'])for(const width of [1280,390,320])test(`full live model diagram precedes action ${theme} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:width===1280?800:568});await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
 const diagram=page.locator('#architecture'),original=await diagram.elementHandle();
 expect(await diagram.evaluate(e=>!e.closest('details')&&!!(e.compareDocumentPosition(document.querySelector('#step'))&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
 await expect(diagram.locator('.flow-server')).toContainText('Database');await expect(diagram.locator('.flow-server')).toContainText('Cache');
 await expect(diagram.locator('.flow-server [data-node="dns"]')).toHaveCount(0);
 await expect(diagram.locator('.flow-http-routes')).toContainText('Server → Browser');
 await page.locator('#step').click();await expect(diagram.locator('span[data-stage="dns-query"]')).toHaveClass(/active/);
 await expect(page.locator('#flow-scene')).toHaveAttribute('data-stage','dns-return');
 await page.locator('#flow-slide-next').click();await page.locator('#flow-slide-back').click();expect(await original.evaluate(e=>e===document.querySelector('#architecture'))).toBe(true);
 await expect(page.locator('#flow-scene')).toHaveAttribute('data-stage','ready');
 const d=await diagram.boundingBox(),a=await page.locator('#step').boundingBox();expect(d.y+d.height).toBeLessThanOrEqual(a.y);expect(a.y-d.y-d.height).toBeLessThan(50);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
