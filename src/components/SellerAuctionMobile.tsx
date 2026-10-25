import Link from 'next/link';
import {myAuctions} from '@/lib/queries';
import {phase} from '@/lib/auction';
import {formatZec} from '@/lib/crypto';
export function SellerAuctionMobile({rows}:{rows:Awaited<ReturnType<typeof myAuctions>>}){return <div className="seller-auction-mobile">{rows.map(a=><Link href={`/auctions/${a.id}`} key={a.id}><strong>{a.domain}</strong><span>{formatZec(a.startingZats)} ZEC · {phase(a,a.invoice)}</span><small>Review listing →</small></Link>)}</div>}
