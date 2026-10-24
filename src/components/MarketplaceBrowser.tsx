'use client';
import {useState} from 'react';
import {MarketplaceGrid} from './MarketplaceGrid';
import {DemoCatalog} from './DemoCatalog';
import type {PublicListing} from '@/lib/marketplace';

export function MarketplaceBrowser({listings,serverNow}:{listings:PublicListing[];serverNow:string}){
  const [scope,setScope]=useState<'real'|'demo'>(listings.length?'real':'demo');
  return <>
    <div className="market-scope" role="group" aria-label="Marketplace view">
      <button type="button" className={scope==='real'?'market-scope-tab selected':'market-scope-tab'} onClick={()=>setScope('real')}>Real auctions <span>{listings.length}</span></button>
      <button type="button" className={scope==='demo'?'market-scope-tab selected':'market-scope-tab'} onClick={()=>setScope('demo')}>Demo Domain Catalog <span>12</span></button>
    </div>
    {scope==='real'?<><div className="market-scope-note">Seller-created auctions stored in PostgreSQL. Bids and settlement are available only on eligible real listings.</div><MarketplaceGrid listings={listings} serverNow={serverNow}/></>:<DemoCatalog/>}
  </>;
}
