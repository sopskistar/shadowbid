import {test,expect} from '@playwright/test';
import {loadEnvConfig} from '@next/env';
import {randomUUID} from 'node:crypto';
import postgres from 'postgres';
import {safeE2eDatabaseUrl} from './safe-db';

loadEnvConfig(process.cwd());
const sql=postgres(safeE2eDatabaseUrl());
const base=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:3000';

for(const viewport of [{name:'desktop',width:1440,height:1000},{name:'mobile',width:390,height:844}]){
  test(`${viewport.name}: DNS retries preserve unverified status and account controls remain usable`,async({page,context,browser},testInfo)=>{
    await page.setViewportSize({width:viewport.width,height:viewport.height});
    await context.grantPermissions(['clipboard-read','clipboard-write']);
    const account={email:`dns-${randomUUID()}@example.test`,password:'IsolatedTestPassword123!'};
    expect((await page.request.post('/api/auth/signup',{headers:{origin:base},data:account})).status()).toBe(200);
    const domain=`dns-retry-${randomUUID()}.example`;
    const create=await page.request.post('/api/auctions',{headers:{origin:base},data:{
      domain,startingPrice:'0.01',biddingMinutes:2,revealMinutes:2,paymentHours:1,sellerAuthorized:true,
    }});
    expect(create.status()).toBe(201);
    const {id}=await create.json();
    const [auction]=await sql`select dns_challenge from auctions where id=${id}`;
    const endpoint=`/api/auctions/${id}/verify-dns`;
    const anonymous=await browser.newContext();
    expect((await anonymous.request.post(base+endpoint,{headers:{origin:base}})).status()).toBe(401);
    await anonymous.close();
    const stranger=await browser.newContext();
    expect((await stranger.request.post(base+'/api/auth/signup',{headers:{origin:base},data:{email:`dns-stranger-${randomUUID()}@example.test`,password:account.password}})).status()).toBe(200);
    expect((await stranger.request.post(base+endpoint,{headers:{origin:base}})).status()).toBe(404);
    await stranger.close();
    expect((await page.request.post(endpoint,{headers:{origin:'https://attacker.invalid'}})).status()).toBe(403);

    await page.goto(`/auctions/${id}`);
    const panel=page.getByRole('region',{name:'DNS control verification'});
    const retry=panel.getByRole('button',{name:'Check DNS Again',exact:true});
    await expect(retry).toBeEnabled();
    await panel.getByRole('button',{name:'Copy hostname'}).click();
    expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(`_shadowbid.${domain}`);
    await panel.getByRole('button',{name:'Copy TXT value'}).click();
    expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(auction.dns_challenge);
    let documentRequests=0;
    page.on('request',request=>{if(request.resourceType()==='document')documentRequests++;});

    // Actual authenticated endpoint: the reserved example domain cannot pass.
    const failed=page.waitForResponse(response=>response.url().endsWith(endpoint));
    await retry.click();
    expect([409,503]).toContain((await failed).status());
    await expect(panel.getByRole('alert')).toContainText(/DNS|TXT/);
    await expect(retry).toBeEnabled();
    await expect(page.locator('.auction-control-state')).toHaveText('DNS control unverified');

    let releaseLookup!:()=>void;
    const lookupPending=new Promise<void>(resolve=>{releaseLookup=resolve;});
    let outcome='missing';
    await page.route('**'+endpoint,async route=>{
      expect(route.request().method()).toBe('POST');
      if(outcome==='missing'){
        await lookupPending;
        await route.fulfill({status:409,json:{error:'The expected TXT record was not found. DNS propagation may take time.'}});
      }else if(outcome==='network'){
        await route.abort('failed');
      }else if(outcome==='malformed'){
        await route.fulfill({status:200,contentType:'text/html',body:'Temporarily unavailable'});
      }else if(outcome==='unauthorized'){
        await route.fulfill({status:401,json:{error:'Sign in first'}});
      }else if(outcome==='not-confirmed'){
        await route.fulfill({status:200,json:{ok:false}});
      }else{
        // Simulated success in the disposable DB only; no real DNS record is changed.
        await sql`update auctions set dns_verified_at=now() where id=${id}`;
        await route.fulfill({status:200,json:{ok:true}});
      }
    });
    await retry.click();
    await expect(panel.getByRole('button',{name:'Checking DNS…'})).toBeDisabled();
    await expect(panel.getByRole('status').last()).toHaveText('Looking up the TXT record…');
    releaseLookup();
    await expect(retry).toBeEnabled();
    await expect(panel.getByRole('alert')).toContainText('DNS propagation may take time.');
    if(viewport.name==='mobile'){
      await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
      await page.screenshot({path:testInfo.outputPath('dns-retry-mobile.png'),fullPage:true});
    }else{
      await panel.screenshot({path:testInfo.outputPath('dns-retry-desktop.png')});
    }

    for(const [next,message] of [
      ['network','Could not reach the verification service.'],
      ['malformed','DNS verification could not be confirmed.'],
      ['not-confirmed','DNS verification could not be confirmed.'],
      ['unauthorized','Sign in again before checking DNS.'],
    ]){
      outcome=next;
      await retry.click();
      await expect(panel.getByRole('alert')).toContainText(message);
      await expect(retry).toBeEnabled();
      await expect(page.locator('.auction-control-state')).toHaveText('DNS control unverified');
      const [record]=await sql`select dns_verified_at from auctions where id=${id}`;
      expect(record.dns_verified_at).toBeNull();
    }
    expect(documentRequests).toBe(0);
    outcome='success';
    await retry.click();
    await expect(page.locator('.auction-control-state')).toHaveText('DNS control checked');
    await expect(panel).toHaveCount(0);
    expect(documentRequests).toBe(0);

    const banner=page.getByRole('banner');
    if(viewport.name==='desktop'){
      const controls=[banner.getByRole('link',{name:'Account',exact:true}),banner.getByRole('link',{name:'My Auctions',exact:true}),banner.getByRole('link',{name:'My Bids',exact:true}),banner.getByRole('button',{name:'Sign out',exact:true})];
      for(const width of [1440,1024,920]){
        await page.setViewportSize({width,height:1000});
        for(let index=1;index<controls.length;index++){
          const previous=(await controls[index-1].boundingBox())!,current=(await controls[index].boundingBox())!;
          expect(current.x-(previous.x+previous.width)).toBeGreaterThanOrEqual(15);
        }
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      }
      await page.setViewportSize({width:viewport.width,height:viewport.height});
      await banner.screenshot({path:testInfo.outputPath('account-navigation-desktop.png')});
      for(const [name,path] of [['Account','/dashboard'],['My Auctions','/dashboard/auctions'],['My Bids','/dashboard/bids']]){
        await banner.getByRole('link',{name,exact:true}).click();
        await expect(page).toHaveURL(base+path);
      }
      await banner.getByRole('button',{name:'Sign out',exact:true}).click();
    }else{
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await banner.getByRole('button',{name:'Open menu'}).click();
      const mobile=page.getByRole('navigation',{name:'Mobile'});
      for(const name of ['Account','My Auctions','My Bids'])await expect(mobile.getByRole('link',{name,exact:true})).toBeVisible();
      await banner.screenshot({path:testInfo.outputPath('account-navigation-mobile.png')});
      await mobile.getByRole('link',{name:'My Bids',exact:true}).click();
      await expect(page).toHaveURL(base+'/dashboard/bids');
      await banner.getByRole('button',{name:'Open menu'}).click();
      await mobile.getByRole('button',{name:'Sign out',exact:true}).click();
    }
    await expect(banner.getByRole('link',{name:'Sign In',exact:true})).toBeVisible();
    expect((await page.request.get('/dashboard',{maxRedirects:0})).status()).toBe(307);
  });
}
test('a legacy listing without a DNS challenge cannot present an empty TXT value as verifiable',async({page})=>{
  const account={email:`legacy-dns-${randomUUID()}@example.test`,password:'IsolatedTestPassword123!'};
  expect((await page.request.post('/api/auth/signup',{headers:{origin:base},data:account})).status()).toBe(200);
  const response=await page.request.post('/api/auctions',{headers:{origin:base},data:{
    domain:`legacy-${randomUUID()}.example`,startingPrice:'0.01',biddingMinutes:2,revealMinutes:2,paymentHours:1,sellerAuthorized:true,
  }});
  expect(response.status()).toBe(201);
  const {id}=await response.json();
  await sql`update auctions set dns_challenge=null where id=${id}`;
  expect((await page.request.post(`/api/auctions/${id}/verify-dns`,{headers:{origin:base}})).status()).toBe(409);
  await page.goto(`/auctions/${id}`);
  const panel=page.getByRole('region',{name:'DNS control verification'});
  await expect(panel.getByRole('alert')).toContainText('This listing has no DNS verification value.');
  await expect(panel.getByRole('button',{name:'Copy TXT value'})).toBeDisabled();
  await expect(panel.getByRole('button',{name:'Check DNS Again'})).toBeDisabled();
  await expect(page.locator('.auction-control-state')).toHaveText('DNS control unverified');
});
test.afterAll(async()=>{await sql.end();});
