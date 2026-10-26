'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';

export function CheckoutActions({token,address,uri,amount,canTransfer}:{
  token:string;
  address:string;
  uri:string;
  amount?:string;
  canTransfer:string|null;
  role:'winner'|'seller';
}){
  const [copied,setCopied]=useState(''),[error,setError]=useState('');
  const router=useRouter();
  async function copy(value:string,label:string){
    try{
      await navigator.clipboard.writeText(value);
      setError('');setCopied(label);
      setTimeout(()=>setCopied(''),2500);
    }catch{setError('Could not copy. Select and copy the displayed payment details.');}
  }
  async function attest(){
    if(!canTransfer)return;
    const response=await fetch(`/api/checkout/${token}/transfer`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:canTransfer})});
    if(!response.ok){setError((await response.json()).error);return;}
    router.refresh();
  }
  return <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
    {address&&<button className="btn secondary small" onClick={()=>copy(address,'Address')}>{copied==='Address'?'Address copied':'Copy address'}</button>}
    {address&&amount&&<button className="btn secondary small" onClick={()=>copy(amount,'Amount')}>{copied==='Amount'?'Amount copied':'Copy amount'}</button>}
    {uri&&<button className="btn secondary small" onClick={()=>copy(uri,'Payment link')}>{copied==='Payment link'?'Link copied':'Copy payment link'}</button>}
    {canTransfer&&<button className="btn small" onClick={attest}>{canTransfer==='acknowledge'?'Acknowledge confirmed payment':canTransfer==='initiate'?'Mark transfer initiated':'Mark domain received'}</button>}
    {error&&<span className="notice error" role="status">{error}</span>}
  </div>;
}
