import {NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {sql} from 'drizzle-orm';
import {db} from '@/lib/db';
import {sameOrigin} from '@/lib/auth';
import {authorizedJudgeSession} from '@/lib/judge';

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  if(!sameOrigin(req))return NextResponse.json({error:'Invalid origin.'},{status:403});
  const {id}=await params;
  if(!await authorizedJudgeSession(id))return NextResponse.json({error:'Practice auction not found or expired.'},{status:404});
  const body=await req.json().catch(()=>null);
  if(!['A','B'].includes(body?.role)||!/^([a-f0-9]{64})$/.test(body?.commitment||''))return NextResponse.json({error:'Invalid sealed commitment.'},{status:400});
  const bidId=randomUUID(),receiptId=randomUUID();
  try{
    const rows=await db.execute(sql`insert into judge_bids (id,session_id,role,commitment,receipt_id) select ${bidId}::uuid,id,${body.role},${body.commitment},${receiptId}::uuid from judge_sessions where id=${id}::uuid and bidding_ends_at>now() and expires_at>now() returning receipt_id,created_at`);
    if(!rows.length)return NextResponse.json({error:'The bidding window has closed.'},{status:409});
    return NextResponse.json({receiptId:rows[0].receipt_id,committedAt:rows[0].created_at},{status:201});
  }catch{return NextResponse.json({error:'This role already has a sealed bid.'},{status:409});}
}
