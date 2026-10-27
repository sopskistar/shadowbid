// Release lock: local public-testnet settlement is verified; external hosting is not.
// Production support still requires a separately reviewed and approved release.
export function localPaymentWorkerAllowed(){
  if(process.env.VERCEL||process.env.VERCEL_ENV)return false;
  if(process.env.LOCAL_AUTH_BYPASS!=='true'||process.env.ALLOW_SHORT_AUCTIONS!=='true')return false;
  if(!['testnet','regtest'].includes(process.env.ZCASH_NETWORK||''))return false;
  try{
    const database=new URL(process.env.DATABASE_URL||'');
    const app=new URL(process.env.PUBLIC_APP_URL||'');
    const loopback=['127.0.0.1','localhost','[::1]'];
    return ['postgres:','postgresql:'].includes(database.protocol)&&loopback.includes(database.hostname)
      &&app.protocol==='http:'&&loopback.includes(app.hostname);
  }catch{return false;}
}
