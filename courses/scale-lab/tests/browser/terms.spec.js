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
  for(let id=1;id<=12;id++) {
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
