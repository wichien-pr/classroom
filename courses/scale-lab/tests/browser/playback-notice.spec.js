import {test,expect} from '@playwright/test';
const labs=['flow','workload','scaling','balance','replication','cache','cdn'];
for(const theme of ['light','dark'])for(const width of [1280,390,320])test(`LAB01–07 compact playback without explanatory notices ${theme} ${width}`,async({page},testInfo)=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.setViewportSize({width,height:800});await page.goto('/');
 await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
 for(const [index,lab] of labs.entries()){
  await page.locator(`[data-lesson="${index+1}"]`).click();
  const scene=page.locator(lab==='flow'?'#flow-scene':`.${lab}-scene`),result=page.locator(`#${lab}-result`),replay=page.locator(`#${lab}-replay`),pause=page.locator(`#${lab}-pause`);
  await expect(page.locator('.flow-playback-note,.workload-playback-note')).toHaveCount(0);
  await expect(result).toBeVisible();await expect(result).not.toHaveText('');
  await expect(page.locator('.simulation')).toContainText('ไม่ใช่ benchmark จริง');
  await expect(replay).toHaveAccessibleName('เล่นภาพซ้ำ');await expect(pause).toHaveAccessibleName('พักภาพ');
  expect(await page.evaluate(()=>Array.from(document.querySelectorAll('[aria-describedby],[aria-labelledby],[aria-controls]')).flatMap(e=>['aria-describedby','aria-labelledby','aria-controls'].flatMap(a=>(e.getAttribute(a)||'').split(/\s+/).filter(id=>id&&!document.getElementById(id)))))).toEqual([]);
  const run=scene.getByRole('button',{name:'ทดลอง',exact:true});await expect(run).toBeVisible();
  await run.click();await expect(pause).toBeEnabled();await pause.click();await expect(scene).toHaveAttribute('data-playback','paused');await expect(pause).toHaveAccessibleName('เล่นภาพต่อ');
  await page.evaluate(async()=>Promise.all(document.getAnimations().map(a=>a.ready)));
  await page.waitForTimeout(100);await expect(scene).toHaveAttribute('data-playback','paused');await pause.click();
  await expect(scene).toHaveAttribute('data-playback','finished',{timeout:30000});
  await replay.click();await expect(scene).toHaveAttribute('data-playback','running');await pause.click();await expect(scene).toHaveAttribute('data-playback','paused');
  await expect(result).not.toHaveText('');
  if(index>=4)await expect(page.locator(`#${lab}-stage`)).not.toHaveText('');
  await expect(page.locator('.flow-playback-note,.workload-playback-note')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await pause.evaluate(e=>window.scrollBy(0,e.getBoundingClientRect().top-180));await page.mouse.move(0,0);await pause.blur();
  await page.screenshot({path:testInfo.outputPath(`${lab}-${theme}-${width}.png`)});
 }
 expect(errors).toEqual([]);
});
