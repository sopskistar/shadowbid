import {loadEnvConfig} from '@next/env';
import postgres from 'postgres';
import {drizzle} from 'drizzle-orm/postgres-js';
import {migrate} from 'drizzle-orm/postgres-js/migrator';

loadEnvConfig(process.cwd());
const connectionString=process.env.DATABASE_URL;
if(!connectionString)throw new Error('DATABASE_URL is missing. Set it in .env.local or the process environment.');
let target:URL;
try{target=new URL(connectionString)}catch{throw new Error('DATABASE_URL is not a valid URL.');}
if(!['postgres:','postgresql:'].includes(target.protocol)||!target.hostname||!target.pathname||target.pathname==='/'||!target.username||!target.password)throw new Error('DATABASE_URL must be a complete PostgreSQL connection URL.');

const required:Record<string,string[]>={
  auctions:['id','domain','sample','bidding_ends_at','reveal_ends_at','finalized_at'],
  bids:['id','auction_id','bidder_id','commitment'],
  invoices:['id','auction_id','status','buyer_received_at','network'],
  users:['id','email','email_verified_at'],
  sessions:['id','user_id'],
  payment_notes:['id','invoice_id'],
  worker_events:['id','nonce'],
  worker_health:['name','state'],
  auth_limits:['key','attempts'],
  email_verification_tokens:['id','user_id'],
  judge_sessions:['id','token_hash','expires_at','bidding_ends_at','reveal_ends_at'],
  judge_bids:['id','session_id','role','commitment','amount_zats'],
  imported_domains:['id','seller_id','domain','status','dns_challenge','auction_id'],
};
const client=postgres(connectionString,{max:1,prepare:false,connect_timeout:30});
async function inspect(){
  const [identity]=await client`select current_database() as database, current_schema() as schema`;
  const columns=await client`select table_name,column_name from information_schema.columns where table_schema=current_schema()`;
  const names=new Set(columns.map(row=>`${row.table_name}.${row.column_name}`));
  const missing=Object.entries(required).flatMap(([table,fields])=>fields.filter(field=>!names.has(`${table}.${field}`)).map(field=>`${table}.${field}`));
  console.log(`Target: ${target.hostname}/${identity.database}, schema ${identity.schema}. ${target.hostname.includes('-pooler')?'Pooled':'Direct'} connection.`);
  console.log(missing.length?`Missing required schema: ${missing.join(', ')}`:'All required ShadowBid tables and columns are present.');
  return missing;
}
async function main(){try{
  const missing=await inspect();
  if(process.argv.includes('--migrate')){
    if(missing.length){
      console.log('Applying checked-in additive Drizzle migrations; no tables or rows will be reset.');
      await migrate(drizzle(client),{migrationsFolder:'./drizzle'});
    }
    if((await inspect()).length)throw new Error('Database schema remains incomplete after migration.');
  }else if(missing.length)process.exitCode=1;
}catch(error){
  const e=error as {code?:string;message?:string};
  console.error(`Database check failed${e.code?` (${e.code})`:''}: ${String(e.message||'unknown error').replace(/postgres(?:ql)?:\/\/\S+/g,'[redacted database URL]')}`);
  process.exitCode=1;
}finally{await client.end({timeout:5});}}
main();
