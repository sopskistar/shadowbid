import Link from 'next/link';
import {MarketplaceBrowser} from '@/components/MarketplaceBrowser';
import {InventoryNav} from '@/components/InventoryNav';
import {publicAuctions} from '@/lib/queries';
import {Tour} from '@/components/Tour';

export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{view?:string}>}){
  const [rows,params]=await Promise.all([publicAuctions(),searchParams]);
  return <main className="container marketplace-page">
    <div className="marketplace-heading"><div><span className="eyebrow">PRIVATE DOMAIN AFTERMARKET</span><h1>Domain Auctions<span>.</span></h1><p>Discover valuable names. Bid confidentially. Settle in shielded ZEC.</p></div><div className="marketplace-heading-actions"><Link className="btn secondary" href="/try">Try a Private Auction</Link><Tour kind="bidder"/><Link className="btn gold" href="/auctions/new">List a domain →</Link></div></div>
    <InventoryNav active="owner"/>
    <MarketplaceBrowser listings={rows} serverNow={new Date().toISOString()} initialScope={params.view==='owner'?'real':undefined}/>
  </main>;
}
