// Checks the actual local receiver experiment without printing invoice tokens.
import {readFile,stat} from 'node:fs/promises';
import {createHash,createDecipheriv,randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium,expect} from '@playwright/test';
import postgres from 'postgres';

const root=new URL('../.env.invoice-experiment/',import.meta.url);
const configPath=new URL('worker.json',root);
const permissions=await stat(configPath);
assert.equal(permissions.mode&0o077,0);
assert.equal(permissions.uid,process.getuid());
const config=JSON.parse(await readFile(configPath,'utf8'));
assert.equal(new URL(config.app_url).hostname,'127.0.0.1');
assert.equal(new URL(config.app_url).protocol,'http:');
assert.equal(new URL(config.database_url).hostname,'127.0.0.1');
assert.equal(new URL(config.database_url).pathname,'/shadowbid_invoice_experiment');
const accounts=JSON.parse(await readFile(new URL('accounts.json',root),'utf8'));
const fixture=JSON.parse(await readFile(new URL('fixture.json',root),'utf8'));
const sql=postgres(config.database_url,{max:1});
let browser;
let checkpoint='initialization';
try{
  const health=await (await fetch(config.app_url+'/api/worker/health')).json();
  assert.equal(health.chainCrossChecked,true);
  browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
  const owner=await browser.newContext({baseURL:config.app_url,permissions:['clipboard-read','clipboard-write']});
  const login=await owner.request.post('/api/auth/login',{headers:{origin:config.app_url},data:accounts.owner});
  assert.equal(login.status(),200);
  const page=await owner.newPage();
  const addresses=[];
  for(const f of fixture.invoices){
    checkpoint='winner checkout';
    const [invoice]=await sql`select address,token_ciphertext,status,paid_zats from invoices where id=${f.id}`;
    assert(invoice.address);addresses.push(invoice.address);
    const bytes=Buffer.from(invoice.token_ciphertext,'base64');
    const decipher=createDecipheriv('aes-256-gcm',createHash('sha256').update(config.worker_secret).digest(),bytes.subarray(0,12));
    decipher.setAuthTag(bytes.subarray(12,28));
    const token=Buffer.concat([decipher.update(bytes.subarray(28)),decipher.final()]).toString();
    const path='/checkout/'+token;
    checkpoint='winner page authorization';
    assert.equal((await page.goto(path)).status(),200);
    checkpoint='winner domain';
    await expect(page.getByRole('heading',{name:f.domain,exact:true})).toBeVisible();
    checkpoint='winner receiver visibility';
    await expect(page.getByText(invoice.address,{exact:true})).toBeVisible();
    const amount=f.amount_zats==='1000000'?'0.01':'0.02';
    const uri=`zcash:${invoice.address}?amount=${amount}`;
    checkpoint='ZIP-321 payment link and QR';
    await expect(page.getByRole('link',{name:'Open compatible wallet'})).toHaveAttribute('href',uri);
    const qr=page.getByRole('img',{name:'ZIP-321 payment QR code'});
    await expect(qr).toBeVisible();await expect(qr).toHaveAttribute('src',/^data:image\/png;base64,/);
    checkpoint='amount clipboard';
    await page.getByRole('button',{name:'Copy amount',exact:true}).click();
    assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),amount);
    checkpoint='address clipboard';
    await page.getByRole('button',{name:'Copy address',exact:true}).click();
    assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),invoice.address);
    checkpoint='payment link clipboard';
    await page.getByRole('button',{name:'Copy payment link',exact:true}).click();
    assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),uri);
    await expect(page.getByRole('button',{name:/mark.*paid/i})).toHaveCount(0);
    checkpoint='unpaid receipt and transfer denial';
    if(invoice.status!=='confirmed'){
      assert.equal((await owner.request.get(`/api/checkout/${token}/receipt`)).status(),409);
      assert.equal((await owner.request.post(`/api/checkout/${token}/transfer`,{headers:{origin:config.app_url},data:{action:'received'}})).status(),409);
      await expect(page.getByRole('link',{name:'Download payment receipt'})).toHaveCount(0);
    }
    await page.reload();
    checkpoint='authenticated navigation after reload';
    await expect(page.getByRole('link',{name:'Account',exact:true}).first()).toBeVisible();
    checkpoint='invoice access control';
    const seller=await browser.newContext({baseURL:config.app_url});
    assert.equal((await seller.request.post('/api/auth/login',{headers:{origin:config.app_url},data:accounts.seller})).status(),200);
    const sellerHtml=await (await seller.request.get(path)).text();
    assert(!sellerHtml.includes(invoice.address));
    assert.equal((await seller.request.get(`/api/checkout/${token}/receipt`)).status(),404);
    await seller.close();
    const stranger=await browser.newContext({baseURL:config.app_url});
    const email=`outsider-${randomBytes(8).toString('hex')}@example.test`;
    assert.equal((await stranger.request.post('/api/auth/signup',{headers:{origin:config.app_url},data:{email,password:randomBytes(24).toString('base64url')}})).status(),200);
    assert.equal((await stranger.request.get(path)).status(),404);
    assert.equal((await stranger.request.get(`/api/checkout/${token}/receipt`)).status(),404);
    assert.equal((await stranger.request.post('/api/worker/observe',{data:{}})).status(),401);
    await stranger.close();
  }
  assert.equal(new Set(addresses).size,fixture.invoices.length);
  const anonymous=await browser.newContext({baseURL:config.app_url});
  assert.equal((await anonymous.request.get('/checkout/not-a-token',{maxRedirects:0})).status(),307);
  await anonymous.close();
  checkpoint='sign out and session invalidation';
  await page.getByRole('button',{name:/sign out/i}).first().click();
  await page.reload();await expect(page.getByRole('link',{name:'Sign In',exact:true}).first()).toBeVisible();
  assert.equal((await owner.request.get('/dashboard',{maxRedirects:0})).status(),307);
  console.log('PASS: distinct real wallet receivers, winner-only instructions, ZIP-321 QR, exact clipboard values, account refresh and sign-out. No invoice payment was simulated.');
}catch{
  console.error(`Local receiver checkout verification failed at ${checkpoint}; private details withheld.`);
  process.exitCode=1;
}finally{
  await browser?.close();await sql.end();
}
