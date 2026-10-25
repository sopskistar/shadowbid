import {NextResponse} from 'next/server';
import {resolveTxt} from 'node:dns/promises';
import {and,eq,sql} from 'drizzle-orm';
import {db} from '@/lib/db';
import {auctions,importedDomains} from '@/lib/schema';
import {currentUser,sameOrigin} from '@/lib/auth';

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  if(!sameOrigin(req))return NextResponse.json({error:'Invalid origin.'},{status:403});
  const user=await currentUser();if(!user)return NextResponse.json({error:'Sign in first.'},{status:401});
  const {id}=await params;if(!/^[0-9a-f-]{36}$/.test(id))return NextResponse.json({error:'Import not found.'},{status:404});
  const [row]=await db.select().from(importedDomains).where(and(eq(importedDomains.id,id),eq(importedDomains.sellerId,user.id)));
  if(!row||row.status!=='pending')return NextResponse.json({error:'Pending import not found.'},{status:404});
  let txt:string[][];
  try{txt=await resolveTxt(`_shadowbid.${row.domain}`)}catch{return NextResponse.json({error:'DNS TXT lookup failed. Check the record and try again.'},{status:503})}
  if(!txt.some(parts=>parts.join('')===row.dnsChallenge))return NextResponse.json({error:'The matching DNS TXT record was not found.'},{status:409});
  try{
    const result=await db.transaction(async tx=>{
      const [locked]=await tx.select().from(importedDomains).where(and(eq(importedDomains.id,id),eq(importedDomains.sellerId,user.id))).for('update');
      if(!locked||locked.status!=='pending')throw Error('This import was already activated.');
      const minimum=(process.env.ALLOW_SHORT_AUCTIONS==='true'?2:60)*60_000;
      const [clock]=await tx.execute(sql`select now() as now`);
      if(locked.biddingEndsAt.getTime()-new Date(clock.now as string).getTime()<minimum)throw Error('The bidding deadline is too close. Reimport this domain with a later deadline.');
      const [auction]=await tx.insert(auctions).values({sellerId:user.id,domain:locked.domain,description:locked.description,category:'Premium domain',startingZats:locked.startingZats,biddingEndsAt:locked.biddingEndsAt,revealEndsAt:locked.revealEndsAt,paymentHours:24,dnsChallenge:locked.dnsChallenge,dnsVerifiedAt:new Date(clock.now as string)}).returning({id:auctions.id});
      await tx.update(importedDomains).set({status:'activated',auctionId:auction.id}).where(eq(importedDomains.id,id));return auction;
    });
    return NextResponse.json({ok:true,auctionId:result.id});
  }catch(error){const message=error instanceof Error&&/^(This import was already activated|The bidding deadline is too close)/.test(error.message)?error.message:'Activation failed. Try again later.';return NextResponse.json({error:message},{status:409})}
}
