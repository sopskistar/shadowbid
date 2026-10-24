'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {AuctionCard} from './AuctionCard';
import {Countdown} from './Countdown';
import {formatZec} from '@/lib/crypto';
import {filterListings,listingPhase,type MarketPhase,type MarketSort,type PublicListing} from '@/lib/marketplace';

const PAGE_SIZE=12;
const phases:[MarketPhase,string][]=[['all','All auctions'],['active','Active auctions'],['ending','Ending soon'],['reveal','Reveal phase'],['completed','Completed'],['closed','Closed']];
export function MarketplaceGrid({listings,serverNow}:{listings:PublicListing[],serverNow:string}){
  const [query,setQuery]=useState(''),[phase,setPhase]=useState<MarketPhase>('all'),[sort,setSort]=useState<MarketSort>('ending');
  const [extension,setExtension]=useState('all'),[category,setCategory]=useState('all'),[view,setView]=useState<'cards'|'table'>('cards'),[page,setPage]=useState(1),[now,setNow]=useState(Date.parse(serverNow));
  const [favorites,setFavorites]=useState<string[]>([]);
  useEffect(()=>{const initial=setTimeout(()=>{try{setFavorites(JSON.parse(localStorage.getItem('shadowbid-watchlist')||'[]'))}catch{}},0);const timer=setInterval(()=>setNow(Date.now()),15000);return()=>{clearTimeout(initial);clearInterval(timer)}},[]);
  const extensions=useMemo(()=>[...new Set(listings.map(a=>a.domain.split('.').pop()||''))].sort(),[listings]);
  const categories=useMemo(()=>[...new Set(listings.map(a=>a.category))].sort(),[listings]);
  const rows=useMemo(()=>filterListings(listings,{query,phase,extension,category,sort},now),[listings,query,phase,extension,category,sort,now]);
  const pageCount=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));const visible=rows.slice((Math.min(page,pageCount)-1)*PAGE_SIZE,Math.min(page,pageCount)*PAGE_SIZE);
  function update(fn:()=>void){fn();setPage(1)}
  function toggle(id:string){const next=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];setFavorites(next);localStorage.setItem('shadowbid-watchlist',JSON.stringify(next));}
  return <section className="marketplace" aria-label="Domain auction catalog">
    <div className="market-tabs" role="group" aria-label="Auction status">{phases.map(([key,label])=><button key={key} type="button" className={phase===key?'market-tab selected':'market-tab'} onClick={()=>update(()=>setPhase(key))}>{label}</button>)}</div>
    <div className="panel market-toolbar">
      <label>Search domain<input aria-label="Search domains" value={query} onChange={e=>update(()=>setQuery(e.target.value))} placeholder="Try a name or keyword"/></label>
      <label>Extension<select aria-label="Extension" value={extension} onChange={e=>update(()=>setExtension(e.target.value))}><option value="all">All extensions</option>{extensions.map(x=><option key={x} value={x}>.{x}</option>)}</select></label>
      <label>Category<select aria-label="Category" value={category} onChange={e=>update(()=>setCategory(e.target.value))}><option value="all">All categories</option>{categories.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
      <label>Sort by<select aria-label="Sort by" value={sort} onChange={e=>setSort(e.target.value as MarketSort)}><option value="ending">Ending time</option><option value="price-low">Starting price: low</option><option value="price-high">Starting price: high</option><option value="newest">Newest</option><option value="commitments">Commitment count</option></select></label>
    </div>
    <div className="market-results"><p role="status">{rows.length} {rows.length===1?'listing':'listings'} · Public commitment counts only</p><div className="market-view"><button className={view==='cards'?'btn small':'btn secondary small'} onClick={()=>setView('cards')} aria-pressed={view==='cards'}>Cards</button><button className={view==='table'?'btn small':'btn secondary small'} onClick={()=>setView('table')} aria-pressed={view==='table'}>List</button></div></div>
    {visible.length===0?<div className="panel card market-empty"><h2>No domains match this view</h2><p className="muted">No seller-created auctions match these filters. Open the Demo Domain Catalog for read-only examples, or create a real listing.</p><button className="btn secondary" onClick={()=>{setQuery('');setPhase('all');setExtension('all');setCategory('all');setPage(1)}}>Clear filters</button></div>:view==='cards'?<div className="grid3 market-cards">{visible.map(a=><div key={a.id} className="market-card-wrap"><AuctionCard auction={a} serverNow={serverNow}/><button className="watch-button" aria-label={favorites.includes(a.id)?`Remove ${a.domain} from watchlist`:`Save ${a.domain} to watchlist`} aria-pressed={favorites.includes(a.id)} onClick={()=>toggle(a.id)}>{favorites.includes(a.id)?'★ Saved':'☆ Watch'}</button></div>)}</div>:<div className="panel table-wrap"><table className="table market-table"><thead><tr><th>Domain</th><th>Category</th><th>Start</th><th>Commitments</th><th>Status / deadline</th><th>Watch</th></tr></thead><tbody>{visible.map(a=><tr key={a.id}><td><Link href={`/auctions/${a.id}`}><strong>{a.domain}</strong></Link>{a.sample&&<span className="pill sample">DEMO</span>}<small>{a.dnsVerifiedAt?'DNS control checked':'Control unverified'}</small></td><td>{a.category}</td><td>{formatZec(a.startingZats)} ZEC</td><td>{a.commitments}</td><td><span className="pill">{listingPhase(a,now)}</span><Countdown biddingEndsAt={a.biddingEndsAt.toISOString()} revealEndsAt={a.revealEndsAt.toISOString()} serverNow={serverNow}/></td><td><button className="watch-button inline" aria-label={favorites.includes(a.id)?`Remove ${a.domain} from watchlist`:`Save ${a.domain} to watchlist`} aria-pressed={favorites.includes(a.id)} onClick={()=>toggle(a.id)}>{favorites.includes(a.id)?'★':'☆'}</button></td></tr>)}</tbody></table></div>}
    {pageCount>1&&<nav className="market-pagination" aria-label="Catalog pages"><button className="btn secondary small" disabled={page<=1} onClick={()=>setPage(page-1)}>Previous</button><span>Page {page} of {pageCount}</span><button className="btn secondary small" disabled={page>=pageCount} onClick={()=>setPage(page+1)}>Next</button></nav>}
    <p className="muted market-note">Watchlist saves on this device only. It is not synced to your account. Demo names and prices are illustrative; no ownership or availability is asserted.</p>
  </section>;
}
