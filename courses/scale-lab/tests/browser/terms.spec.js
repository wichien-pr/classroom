import { test, expect } from '@playwright/test';

test('technical terms open Thai hints with example and warning; keyboard and outside dismiss', async ({page}) => {
  await page.goto('/');
  const term = page.getByRole('button', {name:'อธิบายคำศัพท์ DNS'}).first();
  await term.focus();
  await page.keyboard.press('Enter');
  const hint = page.locator('#term-hint');
  await expect(hint).toBeVisible();
  await expect(hint).toContainText('ความหมาย');
  await expect(hint).toContainText('ตัวอย่าง');
  await expect(hint).toContainText('ข้อควรระวัง');
  await expect(hint).toContainText('ชื่อโดเมน');
  await page.keyboard.press('Escape');
  await expect(hint).not.toBeVisible();
  await expect(term).toBeFocused();
  await term.click();
  await page.locator('.brand').click();
  await expect(hint).not.toBeVisible();
  await page.locator('#step').click();
  await expect(page.locator('#event-log')).toContainText('DNS');
});

test('hints cover lessons without nesting in action controls; mobile stays within viewport', async ({page}) => {
  await page.setViewportSize({width:375,height:812});
  await page.goto('/');
  for(let id=1;id<=11;id++) {
    await page.locator(`[data-lesson="${id}"]`).click();
    const terms=page.locator('.term-trigger');
    expect(await terms.count()).toBeGreaterThan(0);
    await terms.first().click();
    await expect(page.locator('#term-hint')).toBeVisible();
    expect(await page.locator('#term-hint').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})).toBe(true);
    await page.getByRole('button',{name:'ปิดคำอธิบายศัพท์'}).click();
    await expect(page.locator('#term-hint')).not.toBeVisible();
  }
  await expect(page.locator('button button, a button, label .term-trigger')).toHaveCount(0);
  await expect(page.locator('#guide')).toHaveCount(0);
});

test('LAB08 moved prose and numbered steps retain contextual hints',async({page})=>{
 await page.goto('/');await page.locator('[data-lesson-kind="stateless-web"]').click();
 await page.locator('.web-steps li').first().getByRole('button',{name:'อธิบายคำศัพท์ session',exact:true}).click();
 await expect(page.locator('#term-hint')).toContainText('บริบทผู้ใช้');await page.keyboard.press('Escape');
 await expect(page.locator('.web-intro .term-trigger')).not.toHaveCount(0);
 await page.locator('#web-details summary').click();
 await page.locator('#web-details').getByRole('button',{name:'อธิบายคำศัพท์ NoSQL',exact:true}).click();await expect(page.locator('#term-hint')).toContainText('ฐานข้อมูล');
 await expect(page.locator('button button, label .term-trigger, select .term-trigger, .answers .term-trigger')).toHaveCount(0);
});

test('LAB08 vocabulary opens meanings across steps, figures and expanded details',async({page})=>{
 await page.setViewportSize({width:390,height:900});await page.goto('/');await page.locator('[data-lesson-kind="stateless-web"]').click();await page.locator('#web-details summary').click();
 for(const word of ['Stateful','Sticky','Cookie','Shared store','Authentication','Autoscaling','Redis','Memcached','Persistence','Expiry','Recovery','Health check','Client','HTTP']){
  const term=page.locator('.term-trigger').filter({hasText:new RegExp('^'+word+'$','i')}).first();await term.click();
  await expect(page.locator('#term-hint')).toBeVisible();await expect(page.locator('#term-meaning')).not.toBeEmpty();
  expect(await page.locator('#term-hint').evaluate(el=>{const b=el.getBoundingClientRect();return b.left>=0&&b.right<=innerWidth})).toBe(true);
  await page.keyboard.press('Escape');await expect(term).toBeFocused();
 }
 await page.locator('#web-request').click();await expect(page.locator('#outcome')).toContainText('NO_SESSION');
 await expect(page.locator('button button, label .term-trigger, select .term-trigger, .answers .term-trigger')).toHaveCount(0);
});

test('term hints remain readable on dark LAB08 figures',async({page})=>{
 await page.goto('/');await page.locator('[data-lesson-kind="stateless-web"]').click();
 const term=page.locator('#web-diagram .term-trigger').first();
 await expect(term).toHaveCSS('color','rgb(188, 232, 252)');
 await term.hover();await expect(term).toHaveCSS('color','rgb(255, 255, 255)');
});
