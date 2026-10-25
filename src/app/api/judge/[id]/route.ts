import {NextResponse} from 'next/server';
import {eq,sql} from 'drizzle-orm';
import {db} from '@/lib/db';
import {judgeBids} from '@/lib/schema';
import {authorizedJudgeSession} from '@/lib/judge';
import {selectHighestReveal} from '@/lib/auction-rules';

export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const session=await authorizedJudgeSession(id);
  if(!session)return NextResponse.json({error:'Practice auction not found or expired.'},{status:404});
  const [clock]=await db.execute(sql`select now() as now`);
  const now=new Date(clock.now as string);
  const entries=await db.select().from(judgeBids).where(eq(judgeBids.sessionId,id));
  const phase=now<session.biddingEndsAt?'bidding':now<session.revealEndsAt?'reveal':'final';
  const eligible=entries.filter((b):b is typeof b & {amountZats:bigint}=>b.revealedAt!==null&&b.amountZats!==null);
  const winner=phase==='final'?selectHighestReveal(eligible,session.startingZats):undefined;
  return NextResponse.json({id:session.id,domain:session.domain,startingZats:String(session.startingZats),biddingEndsAt:session.biddingEndsAt,revealEndsAt:session.revealEndsAt,serverNow:now,phase,roles:(['A','B'] as const).map(role=>{const bid=entries.find(b=>b.role===role);return {role,bidderId:`judge:${id}:${role}`,committed:!!bid,revealed:!!bid?.revealedAt,receiptId:bid?.receiptId||null,commitment:bid?.commitment||null}}),winner:phase==='final'&&winner?{role:winner.role,amountZats:String(winner.amountZats),receiptId:winner.receiptId}:null,settlement:'Practice only. No invoice, payment address, or wallet event is created.'},{headers:{'Cache-Control':'no-store'}});
}
