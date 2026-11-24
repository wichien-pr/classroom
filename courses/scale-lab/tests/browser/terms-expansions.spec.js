import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {glossaryInventory} from '../../src/terms.js';
const expansions=JSON.parse(readFileSync(new URL('../fixtures/glossary-expansions.json',import.meta.url)));

async function mountVocabulary(page,words){
 await page.evaluate(words=>{
  const fixture=document.createElement('section');fixture.id='glossary-fixture';
  for(const word of words){const p=document.createElement('p');p.className='objective';p.textContent=word;fixture.append(p);}
  document.querySelector('#app').append(fixture);
 },words);
}

// A prose fixture exercises the actual compiled observer/renderer without
// adding test vocabulary to lessons. This is standalone UI QA, not account QA.
test('all shared glossary aliases preserve their Thai body and canonical grouping',async({page})=>{
 test.setTimeout(120000);
 const entries=new Map();
 for(const entry of glossaryInventory)for(const alias of entry.aliases)entries.set(alias.name.toLowerCase(),{...entry,...alias});
 await page.goto('/');await mountVocabulary(page,[...entries.values()].map(e=>e.name));
 await expect(page.locator('#glossary-fixture .term-trigger')).toHaveCount(entries.size);
 for(const [key,entry] of entries){
  const trigger=page.locator(`#glossary-fixture [data-term="${key}"]`);
  await trigger.click();
  await expect(page.locator('#term-hint-title')).toHaveText(entry.heading);
  await expect(page.locator('#term-meaning')).toHaveText(entry.meaning);
  await expect(page.locator('#term-example')).toHaveText(entry.example);
  await expect(page.locator('#term-warning')).toHaveText(entry.warning);
  await page.keyboard.press('Escape');
 }
});

for(const width of [1440,390,320])for(const theme of ['light','dark']){
 test(`expanded headings fit and remain readable: ${width}px ${theme}`,async({page})=>{
  test.setTimeout(60000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width,height:900});await page.goto('/');
  await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
  await mountVocabulary(page,Object.keys(expansions));
  for(const [word,form] of Object.entries(expansions)){
   const trigger=page.locator('#glossary-fixture .term-trigger').filter({hasText:new RegExp('^'+word+'$')});
   await trigger.focus();await page.keyboard.press('Enter');
   const dialog=page.getByRole('dialog',{name:`${word} (${form})`,exact:true});
   await expect(dialog).toBeVisible();
   expect(await dialog.evaluate(el=>{const b=el.getBoundingClientRect();return b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight&&el.scrollWidth<=el.clientWidth;})).toBe(true);
   expect(await page.locator('#term-hint-title').evaluate(el=>{
    const luminance=color=>{const rgb=color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
    const fg=luminance(getComputedStyle(el).color),bg=luminance(getComputedStyle(el.closest('#term-hint')).backgroundColor);
    return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05);
   })).toBeGreaterThanOrEqual(4.5);
   if(['HTTP','RDBMS','CDN'].includes(word))await dialog.screenshot({path:`evidence/glossary/${width}-${theme}-${word}.png`});
   await page.keyboard.press('Escape');await expect(trigger).toBeFocused();await expect(trigger).toHaveAttribute('aria-expanded','false');
  }
  expect(errors).toEqual([]);
 });
}


test('every registered acronym uses its own expanded heading, including shared aliases',async({page})=>{
 await page.goto('/');
 await page.evaluate(words=>{
  const fixture=document.createElement('section');fixture.id='glossary-fixture';
  for(const word of words){const p=document.createElement('p');p.className='objective';p.textContent=word;fixture.append(p);}
  document.querySelector('#app').append(fixture);
 },Object.keys(expansions));
 for(const [word,fullForm] of Object.entries(expansions)){
  const term=page.locator('#glossary-fixture .term-trigger').filter({hasText:new RegExp('^'+word+'$')});
  await term.click();
  await expect(page.locator('#term-hint-title')).toHaveText(`${word} (${fullForm})`);
  await expect(term).toHaveText(word);
  await page.keyboard.press('Escape');await expect(term).toBeFocused();
 }
});

test('HTTP heading includes full English form while inline label stays concise',async({page})=>{
 await page.goto('/');
 const term=page.getByRole('button',{name:'อธิบายคำศัพท์ HTTP',exact:true}).first();
 await term.click();
 await expect(page.locator('#term-hint-title')).toHaveText('HTTP (Hypertext Transfer Protocol)');
 await expect(term).toHaveText('HTTP');
 await expect(page.locator('#term-warning')).toContainText('HTTPS');
});
