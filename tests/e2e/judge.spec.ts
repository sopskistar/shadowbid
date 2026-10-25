import {loadEnvConfig} from '@next/env';
import postgres from 'postgres';
import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

test('judge practice uses two genuine receipts, rejects tampering, and selects winner without invoice',async({page,browser})=>{
  test.setTimeout(240000);
  loadEnvConfig(process.cwd());
  const client=postgres(process.env.DATABASE_URL!,{max:1,prepare:false});
  try{
    await page.setViewportSize({width:390,height:844});
    await page.setExtraHTTPHeaders({'x-vercel-forwarded-for':`192.0.2.${Math.floor(Math.random()*240)+10}`});
    await page.goto('/try');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading',{name:'Try a Private Auction'})).toBeVisible();
    await page.screenshot({path:'screenshots/judge-mobile.png',fullPage:true});
    await page.getByRole('button',{name:'Start practice auction'}).click();
    await expect(page.getByRole('heading',{name:'private-auction.example'})).toBeVisible({timeout:90000});
    const id=await page.evaluate(()=>sessionStorage.getItem('sb-judge-id'));
    expect(id).toMatch(/^[a-f0-9-]{36}$/);
    const outsider=await browser.newContext();
    const denied=await outsider.request.get(new URL(`/api/judge/${id}`,page.url()).toString());
    expect(denied.status()).toBe(404);
    const outsiderWrite=await outsider.request.post(new URL(`/api/judge/${id}/commit`,page.url()).toString(),{headers:{origin:new URL(page.url()).origin},data:{role:'A',commitment:'a'.repeat(64)}});
    expect(outsiderWrite.status()).toBe(404);
    await outsider.close();
    const receipts=[];
    for(const role of ['A','B'] as const){
      const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Seal bid & download receipt'}).first().click()]);
      receipts.push(JSON.parse(await readFile(await download.path()!,'utf8')));
      await expect(page.getByText(`Bidder ${role} sealed a real commitment.`,{exact:false})).toBeVisible();
    }
    const origin=new URL(page.url()).origin;
    const early=await page.request.post(`${origin}/api/judge/${id}/reveal`,{data:receipts[0],headers:{origin}});
    expect(early.status()).toBe(409);
    await client`update judge_sessions set bidding_ends_at=now()-interval '1 second',reveal_ends_at=now()+interval '2 minutes' where id=${id}`;
    await expect(page.getByRole('heading',{name:'Import saved receipt'}).first()).toBeVisible({timeout:12000});
    const changed={...receipts[0],amountZats:'999999999'};
    const rejected=await page.request.post(`${origin}/api/judge/${id}/reveal`,{data:changed,headers:{origin}});
    expect(rejected.status()).toBe(400);
    for(const receipt of receipts){
      await page.getByLabel(`Import Bidder ${receipt.role} receipt`).setInputFiles({name:'receipt.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(receipt))});
      await expect(page.getByText(`Bidder ${receipt.role} reveal accepted`,{exact:false})).toBeVisible();
    }
    await client`update judge_sessions set reveal_ends_at=now()-interval '1 second' where id=${id}`;
    await expect(page.getByRole('heading',{name:'Bidder B wins'})).toBeVisible({timeout:12000});
    const late=await page.request.post(`${origin}/api/judge/${id}/reveal`,{data:receipts[0],headers:{origin}});
    expect(late.status()).toBe(409);
    const [invoiceCount]=await client`select count(*)::int as count from invoices where auction_id=${id}::uuid`;
    expect(invoiceCount.count).toBe(0);
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:'screenshots/judge-outcome-mobile.png',fullPage:true});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
    await page.setViewportSize({width:768,height:1024});
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:'screenshots/judge-tablet.png',fullPage:true});
    await page.setViewportSize({width:1440,height:900});
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:'screenshots/judge-desktop.png',fullPage:true});
  }finally{await client.end()}
});
