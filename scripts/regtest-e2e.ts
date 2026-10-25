import {loadEnvConfig} from '@next/env';
loadEnvConfig(process.cwd());
import {createHash,randomBytes} from 'node:crypto';
import postgres from 'postgres';
import {canonicalBid} from '../src/lib/crypto';

const app=process.env.SHADOWBID_APP_URL||'',walletUrl=process.env.ZALLET_RPC_URL||'',zebraUrl=process.env.ZEBRA_RPC_URL||'';
function local(url:string){try{return ['127.0.0.1','localhost','::1'].includes(new URL(url).hostname)}catch{return false}}
if(process.env.REGTEST_E2E_ENABLED!=='true'||process.env.ZCASH_NETWORK!=='regtest'||!local(app)||!local(walletUrl)||!local(zebraUrl)||!process.env.REGTEST_COINBASE_ADDRESS||!process.env.DATABASE_URL?.includes('127.0.0.1'))throw Error('Regtest integration test requires explicit local-only configuration.');
const sql=postgres(process.env.DATABASE_URL);
async function rpc(url:string,method:string,params:unknown[],auth=false){const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json',...(auth?{authorization:'Basic '+Buffer.from(`${process.env.ZALLET_RPC_USER}:${process.env.ZALLET_RPC_PASSWORD}`).toString('base64')}:{})},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});const body=await response.json();if(!response.ok||body.error)throw Error(`${method} failed: ${body.error?.message||response.status}`);return body.result;}
async function account(){const email=`regtest-${randomBytes(8).toString('hex')}@example.test`;const response=await fetch(app+'/api/auth/signup',{method:'POST',headers:{origin:app,'content-type':'application/json'},body:JSON.stringify({email,password:randomBytes(24).toString('hex')})});if(!response.ok)throw Error('Local signup failed');const cookie=response.headers.get('set-cookie')?.split(';')[0];if(!cookie)throw Error('No session cookie');const [row]=await sql`select id from users where email=${email}`;return {id:row.id as string,cookie};}
async function post(path:string,cookie:string,body:unknown){const response=await fetch(app+path,{method:'POST',headers:{origin:app,cookie,'content-type':'application/json'},body:JSON.stringify(body)});const result=await response.json();if(!response.ok)throw Error(`${path}: ${response.status} ${result.error}`);return result;}
async function waitFor<T>(fn:()=>Promise<T|undefined>,seconds=120){const end=Date.now()+seconds*1000;while(Date.now()<end){const found=await fn();if(found)return found;await new Promise(r=>setTimeout(r,3000));}throw Error('Timed out waiting for wallet/app state');}
async function main(){
  const seller=await account(),buyer=await account();
  const created=await post('/api/auctions',seller.cookie,{domain:'wallet-regtest.example',description:'Isolated local wallet integration test',category:'Technology / AI',startingPrice:'0.01',biddingMinutes:2,revealMinutes:2,paymentHours:1,sellerAuthorized:true});
  const id=created.id as string,secret=randomBytes(32).toString('hex'),amountZats='2000000';
  const commitment=createHash('sha256').update(canonicalBid(id,buyer.id,amountZats,secret)).digest('hex');
  await post(`/api/auctions/${id}/commit`,buyer.cookie,{commitment});
  await sql`update auctions set bidding_ends_at=now()-interval '1 second', reveal_ends_at=now()+interval '2 minutes' where id=${id}`;
  await post(`/api/auctions/${id}/reveal`,buyer.cookie,{amount:'0.02',secret});
  await sql`update auctions set reveal_ends_at=now()-interval '1 second' where id=${id}`;
  await post(`/api/auctions/${id}/finalize`,seller.cookie,{});
  const invoice=await waitFor(async()=>{const [row]=await sql`select id,address,network,amount_zats from invoices where auction_id=${id}`;return row?.address?row:undefined});
  if(invoice.network!=='regtest'||String(invoice.amount_zats)!==amountZats)throw Error('Invoice network or amount mismatch');
  console.log('Regtest invoice receiver assigned by real Zallet account.');
  const shielding=await rpc(walletUrl,'z_shieldcoinbase',[process.env.REGTEST_COINBASE_ADDRESS,invoice.address,null,1],true);
  const opid=shielding?.opid;if(typeof opid!=='string')throw Error('Unexpected shielding operation ID');
  const operation=await waitFor(async()=>{const results=await rpc(walletUrl,'z_getoperationstatus',[[opid]],true);const entry=results?.[0];if(entry?.status==='failed')throw Error('Wallet send failed: '+entry.error?.message);return entry?.status==='success'?entry:undefined},150);
  const txid=operation.result?.txid;if(typeof txid!=='string')throw Error('No broadcast transaction ID');
  console.log('Wallet broadcast regtest shielded transaction:',txid);
  await rpc(zebraUrl,'generate',[3]);
  const confirmed=await waitFor(async()=>{const [row]=await sql`select status,paid_zats from invoices where id=${invoice.id}`;return row?.status==='confirmed'?row:undefined},150);
  if(BigInt(confirmed.paid_zats)<BigInt(amountZats))throw Error('Confirmed amount below invoice');
  const notes=await sql`select txid,confirmations,amount_zats from payment_notes where invoice_id=${invoice.id}`;
  if(!notes.some(n=>n.txid===txid&&Number(n.confirmations)>=3&&BigInt(n.amount_zats)>=BigInt(amountZats)))throw Error('Confirmed wallet note not recorded');
  console.log('PASS: real regtest Zallet note detected and confirmed three times (coinbase shielding overpays invoice). Auction:',id);
}
main().catch(e=>{console.error(e instanceof Error?e.message:'Regtest test failed');process.exitCode=1}).finally(()=>sql.end());
