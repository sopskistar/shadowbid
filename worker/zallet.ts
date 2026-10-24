import {loadEnvConfig} from '@next/env';
loadEnvConfig(process.cwd());
import {createHmac,randomBytes} from 'node:crypto';
import {validateShieldedAddress} from '../src/lib/crypto';
import {walletSynced} from '../src/lib/zallet-status';

const app=process.env.SHADOWBID_APP_URL||'http://localhost:3000';
const secret=process.env.WORKER_SECRET||'';
const configuredNetwork=process.env.ZCASH_NETWORK;
const network:'testnet'|'regtest'=configuredNetwork==='regtest'?'regtest':'testnet';
const rpcUrl=process.env.ZALLET_RPC_URL||(network==='regtest'?'http://127.0.0.1:50232':'http://127.0.0.1:28232');
const zebraUrl=process.env.ZEBRA_RPC_URL||'';
if(secret.length<32)throw Error('WORKER_SECRET must contain at least 32 characters');
if(configuredNetwork!=='testnet'&&configuredNetwork!=='regtest')throw Error('Worker supports testnet and local regtest only');
if(!['127.0.0.1','localhost','::1'].includes(new URL(rpcUrl).hostname))throw Error('Zallet RPC must use loopback');
if(!process.env.ZALLET_RPC_USER||!process.env.ZALLET_RPC_PASSWORD)throw Error('Zallet RPC credentials are required');
if(network==='regtest'&&!zebraUrl)throw Error('ZEBRA_RPC_URL is required for regtest chain cross-checking');
if(zebraUrl&&!['127.0.0.1','localhost','::1'].includes(new URL(zebraUrl).hostname))throw Error('Zebra RPC must use loopback');

async function call(method:string,params:unknown[]=[]):Promise<any>{
  const response=await fetch(rpcUrl,{method:'POST',signal:AbortSignal.timeout(12000),headers:{'content-type':'application/json',authorization:'Basic '+Buffer.from(`${process.env.ZALLET_RPC_USER}:${process.env.ZALLET_RPC_PASSWORD}`).toString('base64')},body:JSON.stringify({jsonrpc:'2.0',id:'shadowbid',method,params})});
  if(!response.ok)throw Error(`Zallet RPC HTTP ${response.status}`);
  const data=await response.json();if(data.error)throw Error(`${method}: ${data.error.message}`);return data.result;
}
async function zebra(method:string,params:unknown[]=[]):Promise<any>{
  if(!zebraUrl)throw Error('Zebra RPC unavailable');
  const authorization=process.env.ZEBRA_RPC_USER&&process.env.ZEBRA_RPC_PASSWORD?'Basic '+Buffer.from(`${process.env.ZEBRA_RPC_USER}:${process.env.ZEBRA_RPC_PASSWORD}`).toString('base64'):'';
  const response=await fetch(zebraUrl,{method:'POST',signal:AbortSignal.timeout(12000),headers:{'content-type':'application/json',...(authorization?{authorization}:{})},body:JSON.stringify({jsonrpc:'2.0',id:'shadowbid',method,params})});
  if(!response.ok)throw Error(`Zebra RPC HTTP ${response.status}`);
  const data=await response.json();if(data.error)throw Error(`${method}: ${data.error.message}`);return data.result;
}
async function api(path:string,body?:unknown){
  const method=body?'POST':'GET',raw=body?JSON.stringify(body):'',ts=String(Date.now()),nonce=randomBytes(16).toString('hex');
  const sig=createHmac('sha256',secret).update(`${ts}\n${nonce}\n${method}\n${path}\n${raw}`).digest('hex');
  const r=await fetch(app+path,{method,signal:AbortSignal.timeout(15000),headers:{'content-type':'application/json','x-sb-time':ts,'x-sb-nonce':nonce,'x-sb-signature':sig},body:body?raw:undefined});
  if(!r.ok)throw Error(`${path}: HTTP ${r.status}`);return r.json();
}
async function tick(){
  const wallet=await call('getwalletstatus');
  const fullySynced=walletSynced(wallet);
  if(!fullySynced){
    if(!zebraUrl||!wallet?.node_tip?.height||wallet.wallet_tip)throw Error('Wallet scan is behind node tip or status format is unknown');
    const chain=await zebra('getblockchaininfo');
    if(chain.chain!=='test'||Math.abs(Number(chain.blocks)-Number(wallet.node_tip.height))>2)throw Error('Zebra and Zallet node tips disagree');
  }
  await api('/api/worker/finalize');
  const invoices=await api('/api/worker/invoices');
  for(const invoice of invoices){
    try{
      let account=invoice.walletAccount;
      if(!invoice.address){
        if(new Date(invoice.deadline)<new Date())continue;
        const created=await call('z_getnewaccount',[`shadowbid-${invoice.id}`]);account=created.account_uuid;
        if(!/^[a-f0-9-]{36}$/i.test(account||''))throw Error('Zallet account UUID missing');
        const addr=await call('z_getaddressforaccount',[account,['orchard']]);const address=addr.address||addr.ua;
        if(!validateShieldedAddress(address,network))throw Error('Invalid shielded address for configured network');
        const receivers=await call('z_listunifiedreceivers',[address]);
        if(!receivers?.orchard)throw Error('Address has no Orchard receiver');
        await api('/api/worker/assign',{id:invoice.id,walletAccount:account,address});
      }else{
        const rawNotes=await call('z_listunspent',[0,9999999,false,[invoice.address]]);
        if(!Array.isArray(rawNotes))throw Error('Unexpected z_listunspent response');
        const received=rawNotes.filter((n:any)=>n.account_uuid===account&&['orchard','ironwood','sapling'].includes(n.pool)&&!n.walletInternal);
        if(received.some((n:any)=>!Number.isSafeInteger(n.valueZat)||n.valueZat<=0))throw Error('Wallet note amount exceeds exact JavaScript integer range');
        const notes=received.map((n:any)=>({txid:n.txid,outIndex:Number(n.outindex??n.outIndex),amountZats:String(n.valueZat),confirmations:Number(n.confirmations)}));
        if(notes.some((n:any)=>!/^[a-f0-9]{64}$/i.test(n.txid)||!Number.isSafeInteger(n.outIndex)||n.outIndex<0||!/^\d+$/.test(n.amountZats)||BigInt(n.amountZats)<=0n||!Number.isSafeInteger(n.confirmations)||n.confirmations<0))throw Error('Unexpected note format');
        const verified=[];
        for(const n of notes){
          if(zebraUrl){const tx=await zebra('getrawtransaction',[n.txid,1]);const chainConf=Number(tx.confirmations||0);if(tx.txid!==n.txid||(chainConf>0&&tx.in_active_chain!==true))continue;verified.push({...n,confirmations:Math.min(n.confirmations,chainConf)});}
          else verified.push(n);
        }
        await api('/api/worker/observe',{id:invoice.id,walletAccount:account,notes:verified});
      }
    }catch(e){console.error(`Invoice ${invoice.id}:`,e instanceof Error?e.message:'Wallet processing failed');}
  }
}
async function main(){for(;;){try{await tick();await api('/api/worker/health',{state:'connected',details:zebraUrl?'Zebra chain cross-check enabled':'Wallet tip synchronized'});console.log('Wallet scan completed',new Date().toISOString());}catch(e){console.error('Wallet monitor unavailable:',e instanceof Error?e.message:'Unknown error');try{await api('/api/worker/health',{state:'error'})}catch{}}await new Promise(r=>setTimeout(r,15000));}}
if(import.meta.url===`file://${process.argv[1]}`)main();
