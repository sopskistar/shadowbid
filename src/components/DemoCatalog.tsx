'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import {motion} from 'motion/react';
import {formatZec} from '@/lib/crypto';
import {demoDomains,filterDemoDomains,type DemoDomain,type DemoSort} from '@/lib/demo-catalog';

export function DemoDomainCard({item}:{item:DemoDomain}){
  return <motion.article className="panel card demo-domain-card" whileHover={{y:-4}}>
    <div className="row"><span className="pill">{item.category}</span><span className="pill sample">EDUCATIONAL SAMPLE</span></div>
    <h3>{item.domain}</h3>
    <p className="muted">{item.description}</p>
    <div className="row"><span>Extension</span><strong>.{item.domain.split('.').pop()?.toLowerCase()}</strong></div>
    <div className="row"><span>Illustrative opening amount</span><strong>{formatZec(item.illustrativeZats)} ZEC</strong></div>
    <p className="demo-disclaimer">No ownership, availability, bids, deadline, or payment is claimed.</p>
    <Link className="btn secondary" href="/docs#bidding">Learn the real auction flow →</Link>
  </motion.article>;
}

export function DemoCatalog(){
  const [query,setQuery]=useState(''),[extension,setExtension]=useState('all'),[category,setCategory]=useState('all'),[sort,setSort]=useState<DemoSort>('name'),[view,setView]=useState<'cards'|'table'>('cards');
  const extensions=useMemo(()=>[...new Set(demoDomains.map(item=>item.domain.split('.').pop()!.toLowerCase()))].sort(),[]);
  const categories=useMemo(()=>[...new Set(demoDomains.map(item=>item.category))].sort(),[]);
  const rows=filterDemoDomains({query,extension,category,sort});
  return <section className="marketplace" aria-label="Demo Domain Catalog">
    <div className="panel demo-intro"><span className="eyebrow">READ-ONLY DEMONSTRATION</span><h2>Demo Domain Catalog</h2><p>Explore how domains are presented before a seller creates a real auction. These names and amounts are fictional examples. ShadowBid does not claim to own them or offer them for sale.</p><Link href="/auctions/new" className="btn gold">Create a real auction →</Link></div>
    <div className="panel market-toolbar">
      <label>Search domain<input aria-label="Search demo domains" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Name or keyword"/></label>
      <label>Extension<select aria-label="Demo extension" value={extension} onChange={event=>setExtension(event.target.value)}><option value="all">All extensions</option>{extensions.map(value=><option key={value} value={value}>.{value}</option>)}</select></label>
      <label>Category<select aria-label="Demo category" value={category} onChange={event=>setCategory(event.target.value)}><option value="all">All categories</option>{categories.map(value=><option key={value} value={value}>{value}</option>)}</select></label>
      <label>Sort by<select aria-label="Sort demo domains" value={sort} onChange={event=>setSort(event.target.value as DemoSort)}><option value="name">Domain name</option><option value="price-low">Example amount: low</option><option value="price-high">Example amount: high</option><option value="category">Category</option></select></label>
    </div>
    <div className="market-results"><p role="status">{rows.length} educational {rows.length===1?'example':'examples'} · No real auction activity</p><div className="market-view"><button type="button" className={view==='cards'?'btn small':'btn secondary small'} onClick={()=>setView('cards')} aria-pressed={view==='cards'}>Cards</button><button type="button" className={view==='table'?'btn small':'btn secondary small'} onClick={()=>setView('table')} aria-pressed={view==='table'}>List</button></div></div>
    {!rows.length?<div className="panel card market-empty"><h3>No demo domains match</h3><p className="muted">Try a different name, extension, or category.</p><button className="btn secondary" onClick={()=>{setQuery('');setExtension('all');setCategory('all')}}>Clear filters</button></div>:view==='cards'?<div className="grid3 market-cards">{rows.map(item=><DemoDomainCard key={item.slug} item={item}/>)}</div>:<div className="panel table-wrap"><table className="table market-table"><thead><tr><th>Illustrative domain</th><th>Category</th><th>Extension</th><th>Example opening amount</th><th>Next step</th></tr></thead><tbody>{rows.map(item=><tr key={item.slug}><td><strong>{item.domain}</strong><small>EDUCATIONAL SAMPLE · no ownership claimed</small></td><td>{item.category}</td><td>.{item.domain.split('.').pop()?.toLowerCase()}</td><td>{formatZec(item.illustrativeZats)} ZEC</td><td><Link href="/docs#bidding">Auction guide →</Link></td></tr>)}</tbody></table></div>}
  </section>;
}
