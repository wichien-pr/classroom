import {test,expect} from '@playwright/test';

test('HTTP response arrow never crosses the request labels',async({page})=>{
 await page.goto('/');
 expect(await page.locator('#architecture svg').evaluate(svg=>{
  const path=svg.querySelector('[data-edge="http-response"] path');
  return [...svg.querySelectorAll('[data-edge="http-request"] text')].some(text=>{
   const b=text.getBBox();for(let x=b.x;x<=b.x+b.width;x++)for(let y=b.y;y<=b.y+b.height;y++)if(path.isPointInStroke(new DOMPoint(x,y)))return true;return false;
  });
 })).toBe(false);
});

for(const width of [320,390,1440])test(`mobile JSON mode and responsive original diagram ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/');
 expect(await page.locator('#architecture svg text').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize)*el.getScreenCTM().a)).toBeGreaterThanOrEqual(12);
 await expect(page.locator('#flow-client')).toBeVisible();
 await page.locator('#flow-client').selectOption('mobile');
 await expect(page.locator('[data-node="mobile"]')).toContainText('Mobile app');
 await expect(page.locator('[data-node="mobile"]')).not.toContainText('HTML / JavaScript');
 for(let i=0;i<6;i++)await page.locator('#step').click();
 await expect(page.locator('#state-view')).toContainText('200 · JSON');
 await expect(page.locator('#flow-payload')).toContainText('"id": 12');
 await expect(page.locator('#outcome')).toContainText('John Smith');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('#reset').click();await expect(page.locator('#flow-client')).toHaveValue('browser');
 await expect(page.locator('#flow-payload')).toContainText('ยังไม่ได้รับ');
 for(let i=0;i<6;i++)await page.locator('#step').click();
 await expect(page.locator('#flow-payload')).toContainText('<h1>John Smith</h1>');
});

test('single host source journey: explicit DNS return and direct HTTP, deterministic terminal no-op',async({page})=>{
 await page.goto('/');
 await expect(page.locator('h1')).toContainText('Single-server setup');
 const svg=page.locator('#architecture svg');
 await expect(svg).toHaveAttribute('aria-label',/Single server/);
 await expect(svg.locator('[data-host="single"]')).toContainText('Database');
 await expect(svg.locator('[data-host="single"]')).toContainText('Cache');
 await expect(svg.locator('[data-node="browser"]')).toHaveClass(/active/);
 const stages=['dns-query','dns-return','http-request','process','http-response','display'];
 for(const stage of stages){await page.locator('#step').click();await expect(svg).toHaveAttribute('data-stage',stage);}
 await expect(page.locator('#state-view')).toContainText('HTML');
 await expect(page.locator('#outcome')).toContainText('แสดงผล');
 const log=await page.locator('#event-log').textContent();await page.locator('#step').click();await expect(page.locator('#event-log')).toHaveText(log);
 await page.locator('[data-answer="0"]').click();await expect(page.locator('#feedback')).toContainText('ยังไม่ถูก');
 const order=await page.locator('[data-answer]').evaluateAll(es=>es.map(e=>e.dataset.answer));
 await page.locator('#reset').click();await expect(svg).toHaveAttribute('data-stage','ready');
 expect(await page.locator('[data-answer]').evaluateAll(es=>es.map(e=>e.dataset.answer))).toEqual(order);
 await expect(page.locator('[data-answer="0"]')).toHaveAttribute('aria-pressed','true');
});
