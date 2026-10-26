// Creates owner-controlled test invoices only in the named loopback experiment DB.
// No genuine DNS claim or production auction is created by this fixture.
import {readFile,writeFile,stat} from 'node:fs/promises';
import {createHash,randomBytes} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import postgres from 'postgres';
import {canonicalBid} from '../src/lib/crypto';

async function main(){
const directory=pathToFileURL(resolve('.env.invoice-experiment')+'/');
const configPath=new URL('worker.json',directory);
const permissions=await stat(configPath);
if((permissions.mode&0o077)!==0||permissions.uid!==process.getuid?.())throw Error('Private experiment config required');
const config=JSON.parse(await readFile(configPath,'utf8'));
const app=new URL(config.app_url),database=new URL(config.database_url);
if(app.protocol!=='http:'||app.hostname!=='127.0.0.1'||database.hostname!=='127.0.0.1'||database.pathname!=='/shadowbid_invoice_experiment')throw Error('Refusing non-experiment target');
const sql=postgres(config.database_url,{max:1});
const fixturePath=new URL('fixture.json',directory);
let previous;
try{previous=JSON.parse(await readFile(fixturePath,'utf8'));}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
if(previous){
  const rows=await sql`select id from invoices where id in ${sql(previous.invoices.map((i:{id:string})=>i.id))}`;
  if(rows.length!==previous.invoices.length)throw Error('Protected fixture no longer matches persistent experiment DB');
  console.log('Existing local receiver invoices preserved.');
  await sql.end();
}else{
  async function post(path:string,body:unknown,cookie=''){
    const response=await fetch(new URL(path,app),{method:'POST',redirect:'error',headers:{origin:app.origin,'content-type':'application/json',...(cookie?{cookie}:{})},body:JSON.stringify(body)});
    if(!response.ok)throw Error(`Local fixture request failed: HTTP ${response.status}`);
    return response;
  }
  async function account(role:string){
    const email=`receiver-${role}-${randomBytes(8).toString('hex')}@example.test`,password=randomBytes(24).toString('base64url');
    const response=await post('/api/auth/signup',{email,password});
    const cookie=response.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');
    if(!cookie)throw Error('Local experiment signup did not establish a session');
    const [user]=await sql`select id from users where email=${email}`;
    return {email,password,cookie,id:user.id as string};
  }
  try{
    const seller=await account('seller'),owner=await account('owner');
    const invoices=[];
    for(const amount of ['0.01','0.02']){
      const domain=`receiver-${randomBytes(6).toString('hex')}.example`;
      const response=await post('/api/auctions',{domain,description:'Owner-controlled local public-testnet receiving experiment. Reserved example domain; no domain is for sale. DNS gate is a local fixture.',category:'Technology',startingPrice:amount,biddingMinutes:2,revealMinutes:2,paymentHours:72,sellerAuthorized:true},seller.cookie);
      const {id}=await response.json();
      const amountZats=amount==='0.01'?'1000000':'2000000',secret=randomBytes(32).toString('hex');
      const commitment=createHash('sha256').update(canonicalBid(id,owner.id,amountZats,secret)).digest('hex');
      await post(`/api/auctions/${id}/commit`,{commitment},owner.cookie);
      await sql`update auctions set bidding_ends_at=now()-interval '1 minute',reveal_ends_at=now()+interval '1 minute' where id=${id}`;
      await post(`/api/auctions/${id}/reveal`,{amount,secret},owner.cookie);
      await sql`update auctions set reveal_ends_at=now()-interval '1 second',dns_verified_at=now() where id=${id}`;
      await post(`/api/auctions/${id}/finalize`,{},seller.cookie);
      const [invoice]=await sql`select id,amount_zats,network from invoices where auction_id=${id}`;
      if(invoice.network!=='testnet'||String(invoice.amount_zats)!==amountZats)throw Error('Invoice network/amount mismatch');
      invoices.push({id:invoice.id,amount_zats:amountZats,domain});
    }
    await writeFile(new URL('accounts.json',directory),JSON.stringify({owner:{email:owner.email,password:owner.password},seller:{email:seller.email,password:seller.password}}),{mode:0o600,flag:'wx'});
    await writeFile(fixturePath,JSON.stringify({network:'testnet',local_fixture:true,invoices}),{mode:0o600,flag:'wx'});
    console.log('Prepared two persistent local testnet invoices: 1000000 and 2000000 zatoshis. Credentials and associations are private.');
  }finally{await sql.end();}
}
}
main().catch(()=>{console.error('Local invoice fixture preparation failed; inspect protected experiment state.');process.exitCode=1;});
