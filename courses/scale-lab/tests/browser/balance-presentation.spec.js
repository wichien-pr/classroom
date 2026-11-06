import {test,expect} from '@playwright/test';
test('LAB04 independent guided actions retain original routing and result',async({page})=>{
 await page.goto('/');await page.locator('[data-lesson="4"]').click();
 await expect(page.locator('#lesson-topic input,#lesson-topic-settings')).toHaveCount(0);
 for(const [topic,targets] of [[0,['A','B','A']],[1,['B','B','B']],[2,[null,null,null]],[3,['B','C','B']]]){
  await expect(page.locator('#balance-replay')).toBeDisabled();
  for(const target of targets){await page.locator('#route').click();await expect(page.locator('#balance-result')).toContainText(target?`App ${target}`:'503');}
  const before=await page.locator('#balance-result').innerText();
  await page.locator('#balance-pause').click();await page.locator('#balance-replay').click();await expect(page.locator('#balance-result')).toHaveText(before);
  await expect(page.locator('#complete-lesson')).toBeDisabled();
  if(topic<3)await page.locator('#lesson-topic-next').click();
 }
 await page.locator('[data-answer="0"]').click();await expect(page.locator('#complete-lesson')).toBeEnabled();
});
