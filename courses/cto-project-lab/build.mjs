import fs from 'node:fs';
import path from 'node:path';
const args=process.argv.slice(2); const i=args.indexOf('--outDir');
const out=i>=0?args[i+1]:'dist';
fs.mkdirSync(out,{recursive:true});
for(const f of ['index.html','app.js','style.css']) fs.copyFileSync(path.join('src',f),path.join(out,f));
console.log('Built CTO Project Lab: '+path.resolve(out));
