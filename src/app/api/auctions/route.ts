import {NextResponse} from 'next/server';
import {z} from 'zod';
import {randomBytes} from 'node:crypto';
import {db} from '@/lib/db';
import {auctions} from '@/lib/schema';
import {currentUser,sameOrigin} from '@/lib/auth';
import {parseZec} from '@/lib/crypto';
import {publicAuctions} from '@/lib/queries';
import {validDomainName} from '@/lib/domain';

const listingInput=z.object({
  domain:z.string().toLowerCase().refine(validDomainName,{message:'Enter a valid domain name.'}),
  description:z.string().max(2000).default(''),
  category:z.string().max(60).default('Premium domain'),
  startingPrice:z.string(),reservePrice:z.string().optional(),
  biddingMinutes:z.number().int().nonnegative(),
  biddingClosesAt:z.string().datetime({offset:true}).optional(),
  revealMinutes:z.number().int().positive(),
  paymentHours:z.number().int().min(1).max(168),
});

export async function GET(){
  const rows=await publicAuctions();
  return NextResponse.json(rows.map(a=>({...a,startingZats:String(a.startingZats)})));
}

export async function POST(req:Request){
  if(!sameOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});
  const user=await currentUser();
  if(!user)return NextResponse.json({error:'Sign in first.'},{status:401});
  try{
    const body=listingInput.parse(await req.json());
    if(process.env.ALLOW_SHORT_AUCTIONS!=='true'&&/\.(example|test|invalid|localhost)$/.test(body.domain))throw Error('Reserved test domains cannot be listed publicly.');
    const now=new Date();
    const biddingEndsAt=body.biddingClosesAt?new Date(body.biddingClosesAt):new Date(now.getTime()+body.biddingMinutes*60_000);
    const biddingMinutes=(biddingEndsAt.getTime()-now.getTime())/60_000;
    if(!Number.isFinite(biddingMinutes)||biddingMinutes<=0)throw Error('Choose a future bidding deadline.');
    if(process.env.ALLOW_SHORT_AUCTIONS!=='true'&&(biddingMinutes<60||body.revealMinutes<30))throw Error('Production deadlines must be at least 60 and 30 minutes.');
    if(biddingMinutes>43200||body.revealMinutes>10080)throw Error('Duration too long.');
    const startingZats=parseZec(body.startingPrice);
    const reserveZats=body.reservePrice?parseZec(body.reservePrice):null;
    if(reserveZats&&reserveZats<startingZats)throw Error('Reserve must meet the opening bid.');
    const [auction]=await db.insert(auctions).values({
      sellerId:user.id,domain:body.domain,description:body.description,category:body.category,
      startingZats,reserveZats,biddingEndsAt,
      revealEndsAt:new Date(biddingEndsAt.getTime()+body.revealMinutes*60_000),
      paymentHours:body.paymentHours,dnsChallenge:`shadowbid=${randomBytes(16).toString('hex')}`,
    }).returning();
    return NextResponse.json({id:auction.id},{status:201});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:'Invalid auction details.'},{status:400});
  }
}
