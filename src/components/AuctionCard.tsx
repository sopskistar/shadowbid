'use client';
import Link from 'next/link';
import {motion} from 'motion/react';
import {formatZec} from '@/lib/crypto';
import {Countdown} from './Countdown';
import {listingPhase,type PublicListing} from '@/lib/marketplace';
export function AuctionCard({auction:a,serverNow}:{auction:PublicListing,serverNow?:string}){
  const state=listingPhase(a,serverNow?Date.parse(serverNow):a.createdAt.getTime());
  return <motion.article className="panel card auction-card" whileHover={{y:-4}}>
    <div className="row"><span className="pill">{a.category}</span>{a.sample&&<span className="pill sample">DEMO AUCTION</span>}</div>
    <h3><Link href={`/auctions/${a.id}`}>{a.domain}</Link></h3>
    <p className="muted">.{a.domain.split('.').pop()} · {a.dnsVerifiedAt?'DNS control checked':'Domain control unverified'}</p>
    <div className="row"><span>Starting price</span><strong>{formatZec(a.startingZats)} ZEC</strong></div>
    <div className="row"><span>Sealed commitments</span><strong>{a.commitments}</strong></div>
    <div className="row"><span>Phase</span><strong className="pill">{a.sample&&state==='active'?'Demo auction — live countdown':state}</strong></div>
    <div className="row"><span>{state==='active'?'Bidding ends':state==='reveal'?'Reveal ends':'Deadline'}</span><Countdown biddingEndsAt={a.biddingEndsAt.toISOString()} revealEndsAt={a.revealEndsAt.toISOString()} serverNow={serverNow}/></div>
    <Link className="btn secondary" href={`/auctions/${a.id}`}>View auction →</Link>
  </motion.article>;
}
