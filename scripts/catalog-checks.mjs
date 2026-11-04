import assert from 'node:assert/strict';
export const frameworkOverview='ฝึกออกแบบระบบผ่าน 4 Labs ตั้งแต่ทำความเข้าใจข้อกำหนดและขอบเขต ร่างภาพรวมร่วมกับลูกค้า เจาะรายละเอียดส่วนสำคัญ ไปจนถึงสรุปแบบ ระบุคอขวด และวางแผนปรับปรุง';
export async function checkCatalog(page, mode, width) {
  assert.equal(await page.locator('.grid > .card').count(),3);
  const covers=await page.locator('.grid > .card .cover').evaluateAll(els=>els.map(e=>{
    const css=getComputedStyle(e), small=getComputedStyle(e.querySelector('small')), strong=getComputedStyle(e.querySelector('strong'));
    const rgb=s=>s.match(/[\d.]+/g).map(Number);
    const lum=s=>rgb(s).slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
    const contrast=c=>(Math.max(lum(c),lum(css.backgroundColor))+.05)/(Math.min(lum(c),lum(css.backgroundColor))+.05);
    return {background:css.backgroundColor,subtitleColor:small.color,titleContrast:contrast(strong.color),subtitleContrast:contrast(small.color),decoration:getComputedStyle(e,'::after').color};
  }));
  for(const cover of covers){
    assert.equal(cover.background,mode==='light'?'rgb(226, 239, 232)':'rgb(30, 57, 49)','cover must adapt to the selected theme');
    assert.equal(cover.subtitleColor,mode==='light'?'rgb(57, 94, 78)':'rgb(180, 208, 193)','subtitle uses cover-specific muted text');
    assert.ok(cover.titleContrast>=4.5&&cover.subtitleContrast>=4.5,JSON.stringify(cover));
    assert.equal(cover.decoration,mode==='light'?'rgb(173, 204, 185)':'rgb(66, 102, 86)');
  }
  const rows=await page.locator('.grid > .card').evaluateAll(cards=>cards.map(c=>{
    const rect=s=>{const r=c.querySelector(s).getBoundingClientRect();return {y:r.y,bottom:r.bottom};};
    return {card:rect('.cover'),progress:rect('.account-progress'),bar:rect('progress'),action:rect('.body > p:last-child')};
  }));
  for(const row of rows)assert.ok(row.bar.y-row.progress.bottom<=18,'progress count and bar form one compact group');
  if(width>850)for(const row of rows)assert.ok(Math.abs(row.bar.y-rows[0].bar.y)<1,'desktop progress bars align despite different overview lengths');
  const target=page.locator('.card[href="/courses/framework-for-system-design-interview/"]');
  assert.equal(await target.locator('.body h2').textContent(),'Framework Lab');
  assert.equal(await target.locator('.body > p').first().textContent(),frameworkOverview,'Framework card must describe all four labs');
}
