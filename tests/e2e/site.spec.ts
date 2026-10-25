import {loadEnvConfig} from '@next/env';import postgres from 'postgres';
import {test,expect} from '@playwright/test';
test('homepage, tours, responsive navigation and screenshots',async({page})=>{for(const [name,width,height] of [['desktop',1440,900],['tablet',768,1024],['mobile',390,844]] as const){await page.setViewportSize({width,height});await page.goto('/');await expect(page.getByRole('heading',{name:/The highest bid wins/})).toBeVisible();await page.waitForTimeout(700);await page.screenshot({path:`screenshots/home-${name}.png`,fullPage:true});await page.screenshot({path:`screenshots/home-${name}-viewport.png`});if(name==='mobile'){await page.getByRole('button',{name:'Open menu'}).click();await expect(page.getByRole('navigation',{name:'Mobile'})).toBeVisible();}}if(!await page.getByRole('dialog').isVisible())await page.getByRole('button',{name:'Take a 60-second Tour'}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Next'}).click();await page.getByRole('button',{name:'Skip / close'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await page.goto('/faq');await page.getByRole('button',{name:'What is ShadowBid?'}).click();await expect(page.getByText('A domain marketplace')).toBeVisible();});
test('account creates an auction and marketplace shows it',async({page})=>{const email=`seller-${Date.now()}@example.test`,domain=`test-owned-${Date.now()}.com`;await page.goto('/signup');await page.getByLabel('Email').fill(email);await page.getByLabel('Password').fill('SecureTestingPassword123!');await page.getByRole('button',{name:'Create account'}).click();await expect(page).toHaveURL(/dashboard/,{timeout:20000});await page.goto('/auctions/new');await page.getByLabel('Domain name').fill(domain);await page.getByLabel('Opening bid (ZEC)').fill('0.01');await page.getByLabel('Bidding closes at').fill(new Date(Date.now()+4*3600000).toISOString().slice(0,16));await expect(page.getByLabel('Bidding duration (minutes)')).toBeDisabled();await page.getByRole('button',{name:'Create auction'}).click();await expect(page.getByRole('heading',{name:domain})).toBeVisible();await expect(page.getByRole('navigation',{name:'Primary'})).toBeVisible();await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'screenshots/auction-desktop.png',fullPage:true});await page.goto('/auctions');await page.getByRole('group',{name:'Marketplace view'}).getByRole('button',{name:/Real auctions/}).click();await page.getByLabel('Search domains').fill(domain);await expect(page.getByRole('link',{name:domain,exact:true})).toBeVisible();});

test('bidder downloads a receipt and reveals it through the interface',async({page})=>{loadEnvConfig(process.cwd());const sql=postgres(process.env.DATABASE_URL!);const password='SecureTestingPassword123!';const sellerEmail=`ui-seller-${Date.now()}@example.test`,buyerEmail=`ui-buyer-${Date.now()}@example.test`;await page.goto('/signup');await page.getByLabel('Email').fill(sellerEmail);await page.getByLabel('Password').fill(password);await page.getByRole('button',{name:'Create account'}).click();await expect(page).toHaveURL(/dashboard/);await page.goto('/auctions/new');await page.getByLabel('Domain name').fill('receipt-test.example');await page.getByRole('button',{name:'Create auction'}).click();await expect(page.getByRole('heading',{name:'receipt-test.example'})).toBeVisible();const id=page.url().split('/').pop()!;await page.goto('/dashboard');await page.getByRole('button',{name:'Sign out'}).click();await page.goto('/signup');await page.getByLabel('Email').fill(buyerEmail);await page.getByLabel('Password').fill(password);await page.getByRole('button',{name:'Create account'}).click();await expect(page).toHaveURL(/dashboard/);await page.goto(`/auctions/${id}`);await page.getByLabel('Offer in ZEC').fill('0.03');const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Seal bid and download receipt'}).click()]);const receiptPath=await download.path();expect(receiptPath).toBeTruthy();const receipt=JSON.parse(await (await import('node:fs/promises')).readFile(receiptPath!,'utf8'));expect(receipt.amountZats).toBe('3000000');await sql`update auctions set bidding_ends_at=now()-interval '1 second',reveal_ends_at=now()+interval '2 minutes' where id=${id}`;await page.goto(`/auctions/${id}/reveal`);await page.getByLabel('Import your saved receipt').setInputFiles({name:'receipt.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(receipt))});await expect(page.getByRole('button',{name:'Verify and reveal bid'})).toBeEnabled();await page.getByRole('button',{name:'Verify and reveal bid'}).click();await expect(page.getByText('Reveal verified.')).toBeVisible();await page.goto('/verify');await page.getByLabel('Choose your reveal receipt').setInputFiles({name:'receipt.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(receipt))});await expect(page.getByText(/Verified: this receipt matches/)).toBeVisible();await sql.end();});
test('demo market is separate, searchable, filtered, and read-only',async({page})=>{
  await page.setViewportSize({width:1440,height:900});await page.goto('/auctions');
  await page.getByRole('group',{name:'Marketplace view'}).getByRole('button',{name:/Demo Market/}).click();
  await expect(page.getByText('Demo Market — illustrative listings, not real assets or payment requests.')).toBeVisible();
  await expect(page.getByRole('table',{name:'Demo market listings'})).toBeVisible();
  await expect(page.getByText('Veltrix.com')).toBeVisible();
  await expect(page.getByText('EDUCATIONAL SAMPLE')).toHaveCount(0);
  await page.screenshot({path:'screenshots/marketplace-desktop.png',fullPage:true});
  await page.setViewportSize({width:768,height:1024});await page.screenshot({path:'screenshots/marketplace-tablet.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'screenshots/marketplace-mobile.png',fullPage:true});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
  await page.getByLabel('Search demo domains').fill('veltrix');
  await expect(page.getByText('Veltrix.com')).toBeVisible();
  await page.getByRole('button',{name:/Filters/}).click();
  await page.getByLabel('Demo extension').selectOption('ai');
  await expect(page.getByRole('heading',{name:'No domains match this view.'})).toBeVisible();
  await page.getByLabel('Search demo domains').fill('');
  await page.getByLabel('Demo category').selectOption('Technology / AI');
  await expect(page.getByText('CloudHarbor.ai')).toBeVisible();
  await page.getByRole('button',{name:'Done'}).click();
  await page.getByRole('button',{name:'Save CloudHarbor.ai to watchlist'}).click();
  await page.getByRole('button',{name:'Watchlist',exact:true}).click();
  await expect(page.getByText('CloudHarbor.ai')).toBeVisible();
  await page.getByRole('button',{name:'Card view'}).click();
  await expect(page.getByRole('table')).toHaveCount(0);
  await page.getByRole('button',{name:/Real auctions/}).click();
  await expect(page.getByText('Demo Market — illustrative listings, not real assets or payment requests.')).toHaveCount(0);
  await expect(page.getByText('receipt-test.example')).toHaveCount(0);
});

test('reduced motion keeps marketplace and FAQ controls usable',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/auctions');
  await page.getByRole('group',{name:'Marketplace view'}).getByRole('button',{name:/Demo Market/}).click();
  await page.getByRole('button',{name:/Filters/}).click();
  await expect(page.getByLabel('Demo extension')).toBeVisible();
  const duration=await page.locator('.exchange-row').first().evaluate(element=>getComputedStyle(element).transitionDuration);
  expect(parseFloat(duration)).toBeLessThan(.01);
  await page.goto('/faq');
  await page.getByRole('button',{name:'What is ShadowBid?'}).click();
  await expect(page.getByText('A domain marketplace')).toBeVisible();
});
