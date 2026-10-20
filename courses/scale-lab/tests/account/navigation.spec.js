import {test,expect} from '@playwright/test';
for(const width of [390,1440]) test(`exit course remains reachable at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:844});
 await page.route('**/api/courses/scale-lab/progress',r=>r.fulfill({json:{completed:[],total:11,csrf_token:'test'}}));
 await page.goto('/courses/scale-lab/');
 const link=page.getByRole('link',{name:'ออกจากคลาส · กลับหน้าแรก'});
 await expect(link).toBeVisible();
 await expect(link).toHaveAttribute('href','/');
 await expect(link).toBeInViewport();
 await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
 await expect(link).toBeInViewport();
 const box=await link.boundingBox(); expect(box.height).toBeGreaterThanOrEqual(44);
 await link.click(); await expect(page).toHaveURL('http://127.0.0.1:4176/');
});
