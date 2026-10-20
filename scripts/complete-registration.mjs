// QA-only fixture: consume an actual private local-double receipt, never bypass verification.
import {readdir,readFile} from 'node:fs/promises';
export async function completeRegistration(page,email){
  await page.waitForURL('**/register/verify');
  const dir=process.env.CLASSROOM_QA_MAIL_DIR;
  if(!dir)throw new Error('Set CLASSROOM_QA_MAIL_DIR to the isolated registration Graph-double directory');
  let receipt;
  for(let attempt=0;attempt<50;attempt++){
    const files=(await readdir(dir)).filter(f=>/^mail-\d+\.json$/.test(f)).sort((a,b)=>Number(b.match(/\d+/)[0])-Number(a.match(/\d+/)[0]));
    for(const file of files){const data=JSON.parse(await readFile(dir+'/'+file));if(data.to===email&&data.code){receipt=data;break}}
    if(receipt)break;
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  if(!receipt)throw new Error('No matching OTP receipt in private local QA mailbox');
  await page.locator('#code').fill(receipt.code);
  await page.getByRole('button',{name:'ยืนยันอีเมล',exact:true}).click();
  await page.waitForURL('**/login');
}
