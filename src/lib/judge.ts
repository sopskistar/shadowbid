import {cookies} from 'next/headers';
import {createHash} from 'node:crypto';
import {and,eq,gt} from 'drizzle-orm';
import {db} from './db';
import {judgeSessions} from './schema';

export const JUDGE_COOKIE='sb_judge';
export const JUDGE_DOMAIN='private-auction.example';
export const JUDGE_STARTING_ZATS=1_000_000n;
export function judgeBidderId(sessionId:string,role:'A'|'B'){return `judge:${sessionId}:${role}`;}
export function hashJudgeToken(token:string){return createHash('sha256').update(token).digest('hex');}
export async function authorizedJudgeSession(id:string){
  if(!/^[0-9a-f-]{36}$/.test(id))return null;
  const token=(await cookies()).get(JUDGE_COOKIE)?.value;
  if(!token||!/^[a-f0-9]{64}$/.test(token))return null;
  const [session]=await db.select().from(judgeSessions).where(and(eq(judgeSessions.id,id),eq(judgeSessions.tokenHash,hashJudgeToken(token)),gt(judgeSessions.expiresAt,new Date()))).limit(1);
  return session||null;
}
