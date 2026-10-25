'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';

export function NewAuctionForm({shortAuctionsEnabled=false}:{shortAuctionsEnabled?:boolean}){
  const [error,setError]=useState(''),[busy,setBusy]=useState(false),[closeAt,setCloseAt]=useState('');
  const router=useRouter();
  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setError('');
    const fd=new FormData(e.currentTarget);
    const data={domain:fd.get('domain'),description:fd.get('description'),category:fd.get('category'),startingPrice:fd.get('startingPrice'),reservePrice:fd.get('reservePrice')||undefined,biddingMinutes:Number(fd.get('biddingMinutes')),biddingClosesAt:closeAt?new Date(closeAt).toISOString():undefined,revealMinutes:Number(fd.get('revealMinutes')),paymentHours:Number(fd.get('paymentHours'))};
    try{const r=await fetch('/api/auctions',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});const j=await r.json();if(!r.ok)throw Error(j.error);router.push(`/auctions/${j.id}`,{scroll:true});window.scrollTo(0,0)}
    catch(e){setError(e instanceof Error?e.message:'Unable to create auction')}
    finally{setBusy(false)}
  }
  return <form className="form panel card seller-form" onSubmit={submit}>
    <div className="seller-form-section"><span className="eyebrow">01 / THE DOMAIN</span><label>Domain name<input name="domain" placeholder="yourdomain.com" autoComplete="off" required/></label><label>Category<select name="category"><option>Premium domain</option><option>Brandable</option><option>Technology / AI</option><option>Exact Match</option><option>Geo Domains</option><option>Startup</option><option>Organizations</option><option>Other</option></select></label><label>Description (optional)<textarea name="description" rows={3} placeholder="Describe the name and any transfer conditions"/></label></div>
    <div className="seller-form-section"><span className="eyebrow">02 / OPENING TERMS</span><div className="grid2"><label>Opening bid (ZEC)<input name="startingPrice" type="text" inputMode="decimal" defaultValue="0.01" required/></label><label>Reserve (optional, ZEC)<input name="reservePrice" type="text" inputMode="decimal" placeholder="No reserve"/></label></div><p className="seller-form-hint">Offers remain sealed during bidding. A reserve is stored privately and only eligible reveals can win.</p></div>
    <div className="seller-form-section"><span className="eyebrow">03 / AUCTION CLOCK</span><div className="seller-open-note"><strong>Opens immediately</strong><span>Closing times are enforced by the server.</span></div><label>Bidding closes at (your local time, optional)<input aria-label="Bidding closes at" type="datetime-local" value={closeAt} onChange={e=>setCloseAt(e.target.value)}/></label><p className="seller-form-hint">Choose a precise closing time, or use the duration below.</p><div className="grid2"><label>Bidding duration (minutes)<input name="biddingMinutes" type="number" min="1" defaultValue={shortAuctionsEnabled?2:1440} disabled={!!closeAt} required={!closeAt}/></label><label>Reveal window (minutes)<input name="revealMinutes" type="number" min="1" defaultValue={shortAuctionsEnabled?2:120} required/></label></div><label>Payment deadline after reveal (hours)<input name="paymentHours" type="number" min="1" max="168" defaultValue="24" required/></label></div>
    <div className="seller-form-section"><span className="eyebrow">04 / VERIFY CONTROL</span><p className="seller-form-hint">After listing, ShadowBid provides a DNS TXT challenge. Passing it checks limited DNS control; it does not prove legal title or registrar ownership.</p></div>
    <div className="notice">Auction terms lock after the first sealed commitment. Production requires at least 60 minutes of bidding and 30 minutes of reveal.{shortAuctionsEnabled?' This local environment allows short test auctions.':''}</div>
    {error&&<div className="notice error" role="alert">{error}</div>}<button className="btn gold" disabled={busy}>{busy?'Creating auction…':'Create auction →'}</button>
  </form>;
}
