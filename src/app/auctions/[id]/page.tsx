import Link from 'next/link';
import {notFound} from 'next/navigation';
import {eq,sql} from 'drizzle-orm';
import {db} from '@/lib/db';
import {auctions,bids,invoices} from '@/lib/schema';
import {currentUser} from '@/lib/auth';
import {decryptToken,phase} from '@/lib/auction';
import {formatZec} from '@/lib/crypto';
import {BidForm} from '@/components/BidForm';
import {Countdown} from '@/components/Countdown';
import {FinalizeButton} from '@/components/FinalizeButton';
import {VerifyDns} from '@/components/VerifyDns';
import {PhaseTimeline} from '@/components/PhaseTimeline';
import {LocalDeadline} from '@/components/LocalDeadline';

export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const [auction]=await db.select().from(auctions).where(eq(auctions.id,id));
  if(!auction)notFound();
  const user=await currentUser();
  const ledger=await db.select({receiptId:bids.receiptId,commitment:bids.commitment,createdAt:bids.createdAt}).from(bids).where(eq(bids.auctionId,id));
  const [own]=user?await db.select().from(bids).where(sql`${bids.auctionId}=${id} and ${bids.bidderId}=${user.id}`):[];
  const [invoice]=await db.select().from(invoices).where(eq(invoices.auctionId,id));
  const state=phase(auction,invoice),now=new Date().toISOString();
  const settlementAuthorized=invoice&&(user?.id===invoice.winnerId||user?.id===auction.sellerId);
  return <main className="container auction-detail">
    <div className="auction-detail-crumb"><Link href="/auctions">← All auctions</Link><span>/</span><span>{auction.domain}</span></div>
    <header className="auction-detail-header"><div><span className="eyebrow">CONFIDENTIAL DOMAIN AUCTION</span><h1>{auction.domain}</h1><div className="auction-detail-badges"><span className="exchange-status-pill is-live">{state}</span><span className="auction-control-state">{auction.dnsVerifiedAt?'DNS control checked':'DNS control unverified'}</span>{auction.sample&&<span className="pill sample">SAMPLE — not offered for sale</span>}</div>{auction.description&&<p>{auction.description}</p>}</div>{settlementAuthorized&&<Link className="btn gold" href={`/checkout/${decryptToken(invoice.tokenCiphertext)}`}>{user?.id===invoice.winnerId?'Open winning invoice':'Review settlement'} →</Link>}</header>
    {!auction.sample&&auction.finalizedAt&&<div className="notice" role="status">{invoice?<>Final winning price: <strong>{formatZec(invoice.amountZats)} ZEC</strong>. The winning bidder remains private; payment and manual transfer are separate.</>:"Unsold — no eligible revealed bid met the auction terms."}</div>}
    {user?.id===auction.sellerId&&!auction.dnsVerifiedAt&&!auction.sample&&<VerifyDns id={id} domain={auction.domain} challenge={auction.dnsChallenge}/>}
    {auction.sample&&<div className="notice">This is a legacy sample listing. It cannot accept bids or payments. <Link href="/auctions/new">Create a real auction</Link>.</div>}
    <div className="auction-detail-overview"><div><span>Opening bid</span><strong>{formatZec(auction.startingZats)} <small>ZEC</small></strong></div><div><span>Sealed offers</span><strong>{ledger.length}</strong></div><div><span>{state==='Reveal open'?'Reveal closes in':'Bidding closes in'}</span><Countdown biddingEndsAt={auction.biddingEndsAt.toISOString()} revealEndsAt={auction.revealEndsAt.toISOString()} serverNow={now}/></div><div><span>Reserve</span><strong>{auction.reserveZats?'Private':'None'}</strong></div></div>
    <PhaseTimeline biddingEndsAt={auction.biddingEndsAt.toISOString()} revealEndsAt={auction.revealEndsAt.toISOString()} serverNow={now}/>
    <div className="auction-detail-columns"><section className="panel card auction-detail-terms"><span className="eyebrow">THE TERMS</span><h2>Know the clock.</h2><div className="step"><span>Bidding closes</span><strong><LocalDeadline iso={auction.biddingEndsAt.toISOString()}/></strong></div><div className="step"><span>Reveal closes</span><strong><LocalDeadline iso={auction.revealEndsAt.toISOString()}/></strong></div><div className="step"><span>Payment deadline</span><strong>{auction.paymentHours} hours after reveal</strong></div><p className="muted">Bidding requires an account, but no cryptocurrency or wallet connection. Your bid amount remains on your device during bidding. Keep the downloaded secret reveal receipt private; it is not a payment invoice. Losing it can prevent you from revealing your bid; sharing it before reveal compromises bid confidentiality. The server receives the amount and secret during reveal, and the auction operator can view valid reveals after submission.</p><p className="muted">Domain transfer is manual. A DNS challenge checks limited control, not legal ownership.</p></section>
    <section className="auction-detail-action">
      {state==='Bidding open'&&!auction.sample&&user&&user.id!==auction.sellerId&&!own?<BidForm auctionId={id} bidderId={user.id}/>
      :state==='Bidding open'&&own?<div className="panel card notice success"><span className="eyebrow">COMMITMENT RECORDED</span><h2>Your bid is sealed.</h2><p>Keep your downloaded receipt. Return during the reveal window to keep your offer eligible.</p></div>
      :state==='Bidding open'&&user?.id===auction.sellerId&&!auction.sample?<div className="panel card"><span className="eyebrow">SELLER WORKSPACE</span><h2>Manage this listing.</h2><p>Share this page with bidders and monitor the sealed commitment count. Terms are locked after the first commitment.</p><p><Link className="btn secondary" href="/dashboard/auctions">Seller dashboard →</Link></p></div>
      :state==='Bidding open'&&!auction.sample&&!user?<div className="panel card"><span className="eyebrow">YOUR NEXT STEP</span><h2>Ready to bid?</h2><p>Sign in to submit one confidential offer. The amount stays private until you reveal it.</p><Link className="btn" href="/login">Sign in to bid →</Link></div>
      :state==='Reveal open'&&own?<div className="panel card"><span className="eyebrow">ACTION REQUIRED</span><h2>Reveal your offer.</h2><p>Upload your private bid receipt before the reveal deadline.</p><Link className="btn gold" href={`/auctions/${id}/reveal`}>Upload Bid Receipt →</Link></div>
      :<div className="panel card"><span className="eyebrow">WHAT HAPPENS NEXT</span><h2>{state==='Reveal open'?'Reveal window open.':state==='Awaiting finalization'?'Ready to finalize.':'Follow this auction.'}</h2><p className="muted">{state==='Reveal open'?'Only bidders with a saved commitment can reveal.':'The highest valid eligible reveal wins. The winner alone receives a private payment request.'}</p>{state==='Awaiting finalization'&&user&&<FinalizeButton id={id}/>}</div>}
    </section></div>
    <section className="auction-ledger"><div><span className="eyebrow">PUBLIC AUDIT TRAIL</span><h2>Commitment ledger</h2><p>Hashes and timestamps show which offers were recorded without revealing amounts or identities. This operator-controlled ledger is not a trustless winner proof.</p></div><div className="panel card table-wrap"><table className="table"><thead><tr><th>Receipt ID</th><th>SHA-256 commitment</th><th>Accepted at</th></tr></thead><tbody>{ledger.map(b=><tr key={b.receiptId}><td>{b.receiptId}</td><td className="auction-ledger-hash">{b.commitment}</td><td>{b.createdAt.toISOString()}</td></tr>)}</tbody></table>{!ledger.length&&<p>No commitments yet.</p>}</div></section>
  </main>;
}
