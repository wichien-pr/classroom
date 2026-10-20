import {test,expect} from '@playwright/test';

test('each lesson draws its own order once before rendering, not on first navigation',async({page})=>{
 await page.addInitScript(()=>{window.quizDraws=0;Math.random=()=>window.quizDraws++%2?0.75:0.25;});
 await page.goto('/');
 await expect(page.locator('[data-answer]')).toHaveCount(2);
 expect(await page.evaluate(()=>window.quizDraws)).toBe(11);
 for(let id=1;id<=11;id++){
  await page.locator(`[data-lesson="${id}"]`).click();
  expect(await page.locator('[data-answer]').evaluateAll(nodes=>nodes.map(n=>n.dataset.answer))).toEqual(id%2?['1','0']:['0','1']);
  await page.locator('#reset').click();
 }
 expect(await page.evaluate(()=>window.quizDraws)).toBe(11);
});

for(const random of [0,0.999999]) test(`thinking presentation uses RNG ${random} without changing choice identity`,async({page})=>{
 await page.addInitScript(value=>{Math.random=()=>value;},random);
 await page.goto('/');
 const order=random<0.5?['1','0']:['0','1'];
 const answers=page.locator('[data-answer]');
 await expect(answers).toHaveCount(2);
 expect(await answers.evaluateAll(nodes=>nodes.map(n=>n.dataset.answer))).toEqual(order);
 await expect(answers.locator('span')).toHaveText(['A','B']);
 await expect(page.locator('.participation small')).toContainText('นับตามตัวเลือกเดิม ไม่ใช่ตำแหน่ง A/B');
 await page.locator('[data-answer="0"]').click();
 await expect(page.locator('#feedback')).toContainText('ยังไม่ถูก');
 await page.locator('[data-answer="1"]').click();
 await expect(page.locator('#feedback')).toContainText('ถูกต้อง —');
 // Change the dependency after initialization: remounting must not reshuffle.
 await page.evaluate(()=>{Math.random=()=>0.75;});
 for(const id of [2,1]) await page.locator(`[data-lesson="${id}"]`).click();
 await page.locator('#reset').click();
 expect(await answers.evaluateAll(nodes=>nodes.map(n=>n.dataset.answer))).toEqual(order);
 await expect(page.locator('[data-answer="1"]')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#feedback')).toContainText('ถูกต้อง —');
 await expect(page.locator('#participation-score')).toHaveText('—');
});
