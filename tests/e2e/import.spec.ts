import {loadEnvConfig} from '@next/env';
import postgres from 'postgres';
import {test,expect} from '@playwright/test';

test('seller previews and stages CSV without publishing unverified domains',async({page,browser})=>{
  loadEnvConfig(process.cwd());const sql=postgres(process.env.DATABASE_URL!,{max:1,prepare:false});
  try{
    const name=`owner-${Date.now()}.com`,email=`import-${Date.now()}@example.test`;
    const end=new Date(Date.now()+4*3600000).toISOString().slice(0,19)+'Z';
    const csv=`domain,opening_price_zec,bidding_end,reveal_end,description\n${name},0.025,${end},,"A good, short name"`;
    await page.goto('/signup');await page.getByLabel('Email').fill(email);await page.getByLabel('Password').fill('SecureTestingPassword123!');await page.getByRole('button',{name:'Create account'}).click();await expect(page).toHaveURL(/dashboard/);
    await page.goto('/dashboard/auctions');
    await page.getByLabel('Choose CSV').setInputFiles({name:'domains.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});
    await page.getByRole('button',{name:'Preview import'}).click();
    await expect(page.getByRole('heading',{name:'Review 1 pending domains'})).toBeVisible();
    await expect(page.getByText(name)).toBeVisible();
    await expect(page.getByRole('button',{name:'Confirm and stage 1 domains'})).toBeDisabled();
    await page.getByRole('checkbox',{name:/I own or am authorized/}).check();
    await page.getByRole('button',{name:'Confirm and stage 1 domains'}).click();
    await expect(page.getByText('Saved as pending.',{exact:false})).toBeVisible();
    await expect(page.getByText(`_shadowbid.${name}`)).toBeVisible();
    const outsider=await browser.newContext();
    expect((await outsider.request.get(new URL('/api/imports',page.url()).toString())).status()).toBe(401);
    await outsider.close();
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:'screenshots/import-desktop.png',fullPage:true});
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:'screenshots/import-mobile.png',fullPage:true});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
    const [count]=await sql`select count(*)::int as count from auctions where domain=${name}`;
    expect(count.count).toBe(0);
    await page.getByRole('button',{name:'Verify DNS & activate'}).click();
    await expect(page.getByRole('alert')).toBeVisible();
    const [still]=await sql`select count(*)::int as count from auctions where domain=${name}`;
    expect(still.count).toBe(0);
  }finally{await sql.end()}
});
