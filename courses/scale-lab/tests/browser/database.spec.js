import {test,expect} from '@playwright/test';
test('LAB 02 separates tiers, compares databases, exposes failure and resets',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.locator('[data-lesson="2"]').click();
 await expect(page.locator('h1')).toContainText('Database');
 await page.getByRole('button',{name:'อธิบายคำศัพท์ NoSQL',exact:true}).first().click();
 await expect(page.locator('#term-hint')).toContainText('ไม่ใช่');await page.keyboard.press('Escape');
 await page.locator('#web-size').fill('3');await page.locator('#estimate').click();
 await expect(page.locator('#state-view')).toContainText('Web tier: 3');
 await expect(page.locator('#state-view')).toContainText('Data tier: 1');
 await page.locator('#db-available').uncheck();await page.locator('#estimate').click();
 await expect(page.locator('#outcome')).toContainText('อ่านข้อมูลไม่ได้');
 await page.locator('#db-available').check();await page.locator('#db-layout').selectOption('single');await page.locator('#estimate').click();
 await expect(page.locator('#state-view')).toContainText('Data tier: 3');
 for(const [scenario,engine] of [['orders','sql'],['session','key-value'],['catalog','document'],['connections','graph'],['events','column']]) {
  await page.locator('#db-scenario').selectOption(scenario);await page.locator('#db-engine').selectOption(engine);await page.locator('#estimate').click();
  await expect(page.locator('#outcome')).toContainText('เหมาะเป็นจุดเริ่มต้น');
 }
 await page.locator('#db-scenario').selectOption('orders');await page.locator('#db-engine').selectOption('key-value');await page.locator('#estimate').click();
 await expect(page.locator('#outcome')).toContainText('ทบทวนตัวเลือก');
 await page.locator('[data-answer="0"]').click();await expect(page.locator('#feedback')).toContainText('ยังไม่ถูก');
 await expect(page.locator('#db-engine')).toHaveValue('key-value');
 await page.locator('#reset').click();await expect(page.locator('#db-layout')).toHaveValue('split');await expect(page.locator('#web-size')).toHaveValue('1');
 for(const width of [320,390,1440]) {
  await page.setViewportSize({width,height:1000});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('#architecture').scrollIntoViewIfNeeded();
  await page.locator('#architecture').screenshot({path:`evidence/lab02-diagram-${width}.png`});
 }
 await page.locator('#estimate').focus();await page.keyboard.press('Enter');await expect(page.locator('#event-log li')).toHaveCount(1);
 expect(errors).toEqual([]);
});
