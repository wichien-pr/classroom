process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const b=await chromium.launch({channel:'chromium'}),p=await b.newPage({viewport:{width:390,height:740}});
await p.goto('http://127.0.0.1:4173');await p.locator('[data-lesson="9"]').click();await p.emulateMedia({reducedMotion:'reduce'});await p.locator('#dc-run').click();await p.waitForTimeout(500);
console.log(await p.locator('.dc-map').evaluate(m=>({rect:m.getBoundingClientRect().toJSON(),nodes:[...m.querySelectorAll('[data-node]')].map(n=>({id:n.dataset.node,rect:n.getBoundingClientRect().toJSON()})),paths:[...m.querySelectorAll('path')].map(p=>p.getAttribute('d'))})));
await b.close();
