import {NextResponse} from 'next/server';
import {createHash} from 'node:crypto';
import {db} from '@/lib/db';
import {emailVerificationTokens,users} from '@/lib/schema';
import {eq,and,gt,isNull} from 'drizzle-orm';
export async function GET(req:Request){
  const token=new URL(req.url).searchParams.get('token')||'';
  if(!/^[A-Za-z0-9_-]{43}$/.test(token))return NextResponse.json({error:'Invalid verification link'},{status:400});
  const hash=createHash('sha256').update(token).digest('hex');
  const [record]=await db.select().from(emailVerificationTokens).where(and(eq(emailVerificationTokens.tokenHash,hash),gt(emailVerificationTokens.expiresAt,new Date()),isNull(emailVerificationTokens.usedAt))).limit(1);
  if(!record)return NextResponse.json({error:'Verification link expired or already used'},{status:410});
  await db.transaction(async tx=>{await tx.update(users).set({emailVerifiedAt:new Date()}).where(eq(users.id,record.userId));await tx.update(emailVerificationTokens).set({usedAt:new Date()}).where(and(eq(emailVerificationTokens.id,record.id),isNull(emailVerificationTokens.usedAt)));});
  const url=new URL('/login?verified=1',req.url);return NextResponse.redirect(url);
}
