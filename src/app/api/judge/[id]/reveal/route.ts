import {NextResponse} from 'next/server';
import {and,eq,sql} from 'drizzle-orm';
import {db} from '@/lib/db';
import {judgeBids} from '@/lib/schema';
import {sameOrigin} from '@/lib/auth';
import {authorizedJudgeSession,judgeBidderId} from '@/lib/judge';
import {canonicalBid,parseZec,sha256,formatZec} from '@/lib/crypto';

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  if(!sameOrigin(req))return NextResponse.json({error:'Invalid origin.'},{status:403});
  const {id}=await params;
  const session=await authorizedJudgeSession(id);
  if(!session)return NextResponse.json({error:'Practice auction not found or expired.'},{status:404});
  const receipt=await req.json().catch(()=>null);
  if(!receipt||receipt.version!==1||receipt.auctionId!==id||!['A','B'].includes(receipt.role)||receipt.bidderId!==judgeBidderId(id,receipt.role)||typeof receipt.amountZats!=='string'||!/^([a-f0-9]{2}){32,}$/.test(receipt.secret||'')||typeof receipt.receiptId!=='string')return NextResponse.json({error:'Receipt has invalid or mismatched auction details.'},{status:400});
  let amount:bigint;
  try{amount=BigInt(receipt.amountZats);if(amount<=0n||parseZec(formatZec(amount))!==amount)throw Error();}catch{return NextResponse.json({error:'Receipt amount is invalid.'},{status:400});}
  const [bid]=await db.select().from(judgeBids).where(and(eq(judgeBids.sessionId,id),eq(judgeBids.role,receipt.role)));
  if(!bid||bid.receiptId!==receipt.receiptId)return NextResponse.json({error:'No matching commitment for this receipt.'},{status:404});
  const expected=await sha256(canonicalBid(id,receipt.bidderId,amount.toString(),receipt.secret));
  if(expected!==bid.commitment||receipt.commitment!==bid.commitment)return NextResponse.json({error:'Receipt does not match the original sealed commitment.'},{status:400});
  const rows=await db.execute(sql`update judge_bids set amount_zats=${amount},revealed_at=now() where id=${bid.id}::uuid and revealed_at is null and exists(select 1 from judge_sessions where id=${id}::uuid and bidding_ends_at<=now() and reveal_ends_at>now() and expires_at>now()) returning receipt_id`);
  if(!rows.length){
    const [clock]=await db.execute(sql`select now() as now`);const now=new Date(clock.now as string);
    const error=bid.revealedAt?'This receipt was already revealed.':now<session.biddingEndsAt?'Reveal opens after bidding closes.':'The reveal deadline has passed.';
    return NextResponse.json({error},{status:409});
  }
  return NextResponse.json({ok:true,receiptId:bid.receiptId,eligible:amount>=session.startingZats});
}
