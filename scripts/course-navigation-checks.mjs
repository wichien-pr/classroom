import assert from 'node:assert/strict';
import {expect} from '../courses/framework-for-system-design-interview/node_modules/@playwright/test/index.mjs';

// Assert actual rendered surfaces, not merely the presence of theme tokens.
export async function checkNavigation(page, mode) {
  const dark = mode === 'dark';
  const surface = dark ? 'rgb(27, 36, 50)' : 'rgb(255, 255, 255)';
  const hover = dark ? 'rgb(38, 51, 71)' : 'rgb(238, 242, 248)';
  const color = dark ? 'rgb(231, 237, 247)' : 'rgb(37, 52, 49)';
  const bg = locator => locator.evaluate(e => getComputedStyle(e).backgroundColor);
  for (const selector of ['.sidebar', '.classroom-exit', '.topbar, .course-top']) {
    assert.equal(await bg(page.locator(selector)), surface, `${mode} ${selector} surface`);
  }
  const active = page.locator('[data-lesson]:is([aria-current=page],[aria-current=step])');
  const idle = page.locator('[data-lesson]:not(:is([aria-current=page],[aria-current=step]))').first();
  await page.mouse.move(0, 0);
  await expect(active).toHaveCSS('background-color', 'rgb(23, 107, 91)');
  await expect(active).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(idle).toHaveCSS('color', color);
  await idle.hover();
  await expect(idle).toHaveCSS('background-color', hover);
  await active.hover();
  await expect(active).toHaveCSS('background-color', 'rgb(18, 87, 71)');
  const exit = page.locator('.classroom-exit a');
  await exit.hover();
  await expect(exit).toHaveCSS('background-color', hover);
  await expect(exit).toHaveCSS('color', color);
  for (const item of [exit, idle, active]) {
    await item.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
    await expect(item).toBeFocused();
    assert.equal(await item.evaluate(e => getComputedStyle(e).outlineStyle), 'solid');
    assert.equal(await item.evaluate(e => getComputedStyle(e).outlineWidth), '3px');
  }
  await page.mouse.move(0, 0);
  await expect(active).toHaveCSS('background-color', 'rgb(23, 107, 91)');
  return page.locator('.sidebar, .brand, .brand small, .brand-mark, .course-label, .sidebar-bottom, .sidebar-progress, .sidebar-progress strong, [data-lesson], [data-lesson] span, .classroom-exit, .classroom-exit a, .topbar, .course-top').evaluateAll(es => es.filter(e => e.getBoundingClientRect().height).map(e => {
    const rgb = s => (s.match(/[\d.]+/g) || []).map(Number);
    const lum = c => c.slice(0, 3).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((a,v,i) => a + v * [.2126,.7152,.0722][i], 0);
    let p = e, background;
    while (p) { background = rgb(getComputedStyle(p).backgroundColor); if (background.length === 3 || background[3] === 1) break; p = p.parentElement; }
    const a = lum(rgb(getComputedStyle(e).color)), b = lum(background);
    return {selector:e.className, text:e.textContent.slice(0,45), background, color:getComputedStyle(e).color, ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
  }));
}
