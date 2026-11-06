import {test,expect} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const evidence=process.env.SCENE_EVIDENCE;
const surface='#flow-scene,.workload-scene,.scaling-scene';
for(const theme of ['dark','light'])for(const width of [1280,390,320])test(`simulation canvas ${theme} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto(process.env.SCENE_PREVIEW_URL||'/');
 await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
 const records=[];
 for(let lesson=1;lesson<=12;lesson++){
  await page.locator(`[data-lesson="${lesson}"]`).click();
  const scene=page.locator(lesson<=3?surface:'#architecture');
  await expect(scene).toHaveCount(1);
  const styles=await scene.evaluate(e=>[e,...e.querySelectorAll('*')].map(n=>{const s=getComputedStyle(n);return [n.tagName,n.className.baseVal??n.className,s.color,s.backgroundColor,s.backgroundImage,s.borderColor,s.stroke,s.fill];}));
  records.push({lesson,styles});
  if(process.env.SCENE_BASELINE)continue;
  if(theme==='light'){
   await expect(scene).toHaveCSS('background-color','rgb(243, 247, 250)');await expect(scene).toHaveCSS('background-image','none');
   if(lesson===1){await expect(page.locator('#flow-result')).toHaveCSS('color','rgb(25, 59, 80)');await expect(page.locator('#flow-scene > .flow-actions')).toHaveCount(1);}
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(evidence&&(lesson<=3||(theme==='light'&&width===1280))){await mkdir(evidence,{recursive:true});await scene.screenshot({path:`${evidence}/${theme}-${width}-lab${lesson}.png`});}
  if(theme==='light'){
   const low=await scene.evaluate(root=>{
    const lum=c=>{const v=c.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;});return v[0]*.2126+v[1]*.7152+v[2]*.0722;};
    return [...root.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().width&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())).flatMap(e=>{
     let p=e,bg;while(p){const s=getComputedStyle(p);if(s.backgroundColor!=='rgba(0, 0, 0, 0)'){bg=s.backgroundColor;break;}p=p.parentElement;}
     if(!bg)return [];const a=lum(getComputedStyle(e).color),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
     return ratio<4.5?[{text:e.textContent.slice(0,60),ratio}]:[];
    });
   });
   expect(low,`LAB${lesson} light text contrast`).toEqual([]);
  }
 }
 if(evidence&&theme==='dark'){
  const path=`${evidence}/dark-baseline-${width}.json`;
  if(process.env.SCENE_BASELINE){await mkdir(evidence,{recursive:true});await writeFile(path,JSON.stringify(records));}
  else expect(records).toEqual(JSON.parse(await readFile(path,'utf8')));
 }
});
