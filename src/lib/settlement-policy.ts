export function localRegtestOnly(){
  try{
    return process.env.ZCASH_NETWORK==='regtest'&&process.env.LOCAL_AUTH_BYPASS==='true'&&process.env.ALLOW_SHORT_AUCTIONS==='true'&&['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL||'').hostname);
  }catch{return false;}
}

export function paymentControlChecked(dnsVerifiedAt:Date|null){return !!dnsVerifiedAt||localRegtestOnly();}
