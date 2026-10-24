import {db} from '../src/lib/db';
import {auctions,bids} from '../src/lib/schema';
import {and,eq,sql} from 'drizzle-orm';

const catalog:[string,string,string][]=[
  ['veltrix.com','Brandable','A memorable name for an ambitious new brand.'],
  ['cloudharbor.ai','Technology / AI','An illustrative AI infrastructure brand.'],
  ['bestcontractor.com','Exact Match','A direct phrase for contractor discovery.'],
  ['austintailors.com','Geo Domains','A city-focused service name.'],
  ['novagrid.xyz','Startup','A concise name for a network or energy startup.'],
  ['opencanvas.org','Organizations','A creative community name.'],
  ['brandpulse.com','Premium','A compact name for brand analytics.'],
  ['quantumforge.ai','Technology / AI','An illustrative advanced-computing brand.'],
  ['brightnest.com','Brandable','A warm consumer brand name.'],
  ['urbancraft.xyz','Startup','A name for design and city-making.'],
  ['summitlabs.org','Organizations','A research collective name.'],
  ['pixelharbor.com','Premium','A creative technology brand name.'],
];
async function main(){
  if(process.env.NODE_ENV==='production'||process.env.VERCEL_ENV==='production'||process.env.SAMPLE_SEED_ENABLED!=='true'||process.env.ALLOW_SHORT_AUCTIONS!=='true')throw Error('Refusing sample seed. Require nonproduction environment, SAMPLE_SEED_ENABLED=true, and ALLOW_SHORT_AUCTIONS=true.');
  if(!["127.0.0.1","localhost","::1"].includes(new URL(process.env.DATABASE_URL||"").hostname))throw Error("Sample seeding requires a loopback PostgreSQL database.");
  const now=Date.now();let inserted=0,refreshed=0,kept=0;
  for(const [domain,category,description] of catalog){
    const [latest]=await db.select({auction:auctions,bidCount:sql<number>`count(${bids.id})::int`}).from(auctions).leftJoin(bids,eq(bids.auctionId,auctions.id)).where(and(eq(auctions.domain,domain),eq(auctions.sample,true))).groupBy(auctions.id).orderBy(sql`${auctions.createdAt} desc`).limit(1);
    if(latest&&latest.auction.biddingEndsAt.getTime()>now){kept++;continue;}
    const values={category,description:`DEMO / SAMPLE ONLY. ${description} Ownership, availability, and sale rights are not asserted.`,startingZats:BigInt(1000000+(catalog.findIndex(x=>x[0]===domain)%5)*2500000),biddingEndsAt:new Date(now+120000),revealEndsAt:new Date(now+240000),paymentHours:1,sample:true};
    if(latest&&latest.bidCount===0){await db.update(auctions).set(values).where(eq(auctions.id,latest.auction.id));refreshed++;}
    else{await db.insert(auctions).values({domain,...values});inserted++;}
  }
  console.log(`Demo catalog ready: ${inserted} created, ${refreshed} refreshed, ${kept} already active. Existing bids and real auctions untouched.`);
  process.exit(0);
}
main().catch(e=>{console.error(e instanceof Error?e.message:'Sample seed failed');process.exit(1)});
