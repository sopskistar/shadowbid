import {NextResponse} from 'next/server';
import {randomBytes} from 'node:crypto';
import {and,eq,ne,inArray,sql} from 'drizzle-orm';
import {db} from '@/lib/db';
import {auctions,importedDomains} from '@/lib/schema';
import {currentUser,sameOrigin} from '@/lib/auth';
import {parseDomainCsv,type ImportedDomainInput} from '@/lib/domain-import';

export async function GET(){const user=await currentUser();if(!user)return NextResponse.json({error:'Sign in first.'},{status:401});const rows=await db.select().from(importedDomains).where(and(eq(importedDomains.sellerId,user.id),ne(importedDomains.status,'cancelled')));return NextResponse.json(rows.map(r=>({...r,startingZats:String(r.startingZats)})),{headers:{'Cache-Control':'no-store'}})}
export async function POST(req:Request){
  if(!sameOrigin(req))return NextResponse.json({error:'Invalid origin.'},{status:403});
  const user=await currentUser();if(!user)return NextResponse.json({error:'Sign in first.'},{status:401});
  let rows:ImportedDomainInput[];
  try{
    const body=await req.json();
    if(body.authorized!==true)return NextResponse.json({error:'Confirm that you own or are authorized to offer every domain.'},{status:400});
    rows=parseDomainCsv(body.csv,new Date(),process.env.ALLOW_SHORT_AUCTIONS==='true');
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Invalid CSV.'},{status:400})}
  try{
    const names=rows.map(r=>r.domain);
    const existing=await db.select({domain:importedDomains.domain}).from(importedDomains).where(and(eq(importedDomains.sellerId,user.id),eq(importedDomains.status,'pending'),inArray(importedDomains.domain,names)));
    const live=await db.select({domain:auctions.domain}).from(auctions).where(and(eq(auctions.sellerId,user.id),inArray(auctions.domain,names),sql`${auctions.cancelledAt} is null and ${auctions.revealEndsAt}>now()`));
    if(existing.length||live.length)return NextResponse.json({error:`Already pending or active: ${[...existing,...live].map(x=>x.domain).join(', ')}.`},{status:409});
    const inserted=await db.insert(importedDomains).values(rows.map(row=>({...row,sellerId:user.id,dnsChallenge:`shadowbid=${randomBytes(16).toString('hex')}`}))).returning({id:importedDomains.id,domain:importedDomains.domain,dnsChallenge:importedDomains.dnsChallenge});
    return NextResponse.json({rows:inserted,message:'Saved as pending. Each domain activates only after its DNS TXT challenge passes.'},{status:201});
  }catch{return NextResponse.json({error:'Import could not be staged. Check for a concurrent duplicate and try again.'},{status:409})}
}
