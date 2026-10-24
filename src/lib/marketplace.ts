export type PublicListing={id:string,domain:string,category:string,startingZats:bigint,biddingEndsAt:Date,revealEndsAt:Date,createdAt:Date,sample:boolean,dnsVerifiedAt:Date|null,commitments:number,completedAt:Date|null};
export type MarketPhase='all'|'active'|'ending'|'reveal'|'completed'|'closed';
export type MarketSort='ending'|'price-low'|'price-high'|'newest'|'commitments';
export function listingPhase(a:PublicListing,now:number):Exclude<MarketPhase,'all'|'ending'>{if(a.completedAt)return 'completed';if(a.biddingEndsAt.getTime()>now)return 'active';if(a.revealEndsAt.getTime()>now)return 'reveal';return 'closed';}
export function filterListings(listings:PublicListing[],options:{query:string,phase:MarketPhase,extension:string,category:string,sort:MarketSort},now:number){
  const q=options.query.trim().toLowerCase();
  return listings.filter(a=>{
    // Reserved .example records are used for protocol tests. Keep them searchable,
    // but do not let them crowd the default development catalog.
    if(!q&&a.domain.endsWith('.example'))return false;
    const status=listingPhase(a,now),ending=status==='active'&&a.biddingEndsAt.getTime()-now<=3600000;
    return (!q||a.domain.toLowerCase().includes(q))&&(options.phase==='all'||options.phase===status||(options.phase==='ending'&&ending))&&(options.extension==='all'||a.domain.split('.').pop()===options.extension)&&(options.category==='all'||a.category===options.category);
  }).sort((a,b)=>{
    if(options.sort==='price-low')return a.startingZats<b.startingZats?-1:a.startingZats>b.startingZats?1:0;
    if(options.sort==='price-high')return a.startingZats>b.startingZats?-1:a.startingZats<b.startingZats?1:0;
    if(options.sort==='commitments')return b.commitments-a.commitments;
    if(options.sort==='newest')return b.createdAt.getTime()-a.createdAt.getTime();
    return a.biddingEndsAt.getTime()-b.biddingEndsAt.getTime();
  });
}
