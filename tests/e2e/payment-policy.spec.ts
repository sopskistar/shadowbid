// Synthetic worker events in the disposable test DB; never chain evidence.
import {test,expect} from '@playwright/test';
import {createHmac,randomBytes,randomUUID} from 'node:crypto';
import {loadEnvConfig} from '@next/env';
import postgres from 'postgres';
import {safeE2eDatabaseUrl} from './safe-db';

loadEnvConfig(process.cwd());
const sql=postgres(safeE2eDatabaseUrl());
function signed(body:unknown){
  const raw=JSON.stringify(body),time=String(Date.now()),nonce=randomBytes(16).toString('hex');
  const signature=createHmac('sha256',process.env.WORKER_SECRET!).update(`${time}\n${nonce}\nPOST\n/api/worker/observe\n${raw}`).digest('hex');
  return {data:raw,headers:{'content-type':'application/json','x-sb-time':time,'x-sb-nonce':nonce,'x-sb-signature':signature}};
}
test('synthetic invoice snapshots handle excess, duplicate, replay, cross-invoice and reorg events',async({request})=>{
  const [user]=await sql`insert into users(email,password_hash) values(${`policy-${randomUUID()}@example.test`},'unusable-test-hash') returning id`;
  async function fixture(){
    const [auction]=await sql`insert into auctions(seller_id,domain,starting_zats,bidding_ends_at,reveal_ends_at,dns_verified_at) values(${user.id},'policy-fixture.example',1000,now(),now(),now()) returning id`;
    const [bid]=await sql`insert into bids(auction_id,bidder_id,commitment,amount_zats,revealed_at) values(${auction.id},${user.id},${randomBytes(32).toString('hex')},1000,now()) returning id`;
    const walletAccount=randomUUID();
    const [invoice]=await sql`insert into invoices(auction_id,bid_id,winner_id,token_hash,token_ciphertext,amount_zats,network,address,wallet_account,status,deadline) values(${auction.id},${bid.id},${user.id},${randomBytes(32).toString('hex')},'unusable-test-token',1000,'testnet',${`synthetic-${randomUUID()}`},${walletAccount},'awaiting',now()+interval '1 hour') returning id`;
    return {id:invoice.id,walletAccount};
  }
  const first=await fixture(),second=await fixture();
  const note={txid:randomBytes(32).toString('hex'),outIndex:0,amountZats:'400',confirmations:3};
  const rest={...note,txid:randomBytes(32).toString('hex'),amountZats:'600'};
  const extra={...note,txid:randomBytes(32).toString('hex'),amountZats:'1'};
  const send=(body:unknown)=>request.post('/api/worker/observe',signed(body));
  const unauthorized={...first,notes:[note]};
  expect((await request.post('/api/worker/observe',{data:unauthorized})).status()).toBe(401);
  const tampered=signed(unauthorized);
  tampered.data=JSON.stringify({...first,notes:[{...note,amountZats:'1000'}]});
  expect((await request.post('/api/worker/observe',tampered)).status()).toBe(401);
  const stale=signed(unauthorized);
  stale.headers['x-sb-time']=String(Date.now()-120000);
  stale.headers['x-sb-signature']=createHmac('sha256',process.env.WORKER_SECRET!).update(`${stale.headers['x-sb-time']}\n${stale.headers['x-sb-nonce']}\nPOST\n/api/worker/observe\n${stale.data}`).digest('hex');
  expect((await request.post('/api/worker/observe',stale)).status()).toBe(401);
  const [unpaid]=await sql`select status,paid_zats from invoices where id=${first.id}`;
  expect(unpaid.status).toBe('awaiting');expect(String(unpaid.paid_zats)).toBe('0');
  expect(await (await send({...first,notes:[note]})).json()).toMatchObject({status:'detected',confirmedZats:'400'});
  expect(await (await send({...first,notes:[note,{...rest,confirmations:2}]})).json()).toMatchObject({status:'detected',confirmedZats:'400'});
  expect(await (await send({...first,notes:[note,rest]})).json()).toMatchObject({status:'confirmed',confirmedZats:'1000'});
  const full={...first,notes:[note,rest,extra]};
  expect(await (await send(full)).json()).toMatchObject({status:'confirmed',confirmedZats:'1001'});
  expect((await send({...first,notes:[note,note]})).status()).toBe(400);
  expect((await send({...first,notes:[{...note,amountZats:'401'}]})).status()).toBe(409);
  expect((await send({...second,notes:[note]})).status()).toBe(409);
  expect((await send({...first,notes:[{...note,amountZats:'2100000000000001'}]})).status()).toBe(400);
  expect((await send({...first,notes:[{...note,outIndex:2147483648}]})).status()).toBe(400);
  const replay=signed(full);
  expect((await request.post('/api/worker/observe',replay)).status()).toBe(200);
  expect((await request.post('/api/worker/observe',replay)).status()).toBe(401);
  expect(await (await send({...first,notes:[]})).json()).toMatchObject({status:'awaiting',confirmedZats:'0'});
  const rolledBack=await sql`select confirmations from payment_notes where invoice_id=${first.id}`;
  expect(rolledBack.every(n=>n.confirmations===0)).toBe(true);
  expect(await (await send(full)).json()).toMatchObject({status:'confirmed',confirmedZats:'1001'});
  const [count]=await sql`select count(*)::int as total from payment_notes where invoice_id=${first.id}`;
  expect(count.total).toBe(3);
  const [untouched]=await sql`select status,paid_zats from invoices where id=${second.id}`;
  expect(untouched.status).toBe('awaiting');expect(String(untouched.paid_zats)).toBe('0');
  // A note first detected before expiry may acquire confirmations afterward.
  // New late notes cannot unlock the invoice or top up an earlier partial.
  const expiring=await fixture();
  const pending={...note,txid:randomBytes(32).toString('hex'),amountZats:'1000',confirmations:0};
  expect(await (await send({...expiring,notes:[pending]})).json()).toMatchObject({status:'detected',confirmedZats:'0'});
  await sql`update invoices set deadline=now()-interval '1 second' where id=${expiring.id}`;
  const late={...pending,txid:randomBytes(32).toString('hex'),confirmations:3};
  expect(await (await send({...expiring,notes:[pending,late]})).json()).toMatchObject({status:'detected',confirmedZats:'0'});
  expect(await (await send({...expiring,notes:[{...pending,confirmations:3},late]})).json()).toMatchObject({status:'confirmed',confirmedZats:'1000'});
  const [lateCount]=await sql`select count(*)::int as total from payment_notes where invoice_id=${expiring.id}`;
  expect(lateCount.total).toBe(1);
  await sql`update invoices set deadline=now()-interval '1 second' where id=${second.id}`;
  expect(await (await send({...second,notes:[late]})).json()).toMatchObject({status:'awaiting',confirmedZats:'0'});
});
test.afterAll(async()=>{await sql.end();});
