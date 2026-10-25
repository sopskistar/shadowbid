import {NextResponse} from 'next/server';
import {randomBytes,createHmac} from 'node:crypto';
import {sql} from 'drizzle-orm';
import {db} from '@/lib/db';
import {sameOrigin} from '@/lib/auth';
import {hashJudgeToken,JUDGE_COOKIE,JUDGE_DOMAIN,JUDGE_STARTING_ZATS} from '@/lib/judge';

export async function POST(req:Request){
  if(!sameOrigin(req))return NextResponse.json({error:'Invalid origin.'},{status:403});
  const secret=process.env.WORKER_SECRET;
  if(!secret||secret.length<32)return NextResponse.json({error:'Judge practice is temporarily unavailable.'},{status:503});
  // A hashed network identifier bounds anonymous session creation without retaining an IP address.
  const address=(process.env.NODE_ENV==='production'?req.headers.get('x-vercel-forwarded-for')?.split(',')[0]:req.headers.get('x-real-ip')||req.headers.get('x-forwarded-for')?.split(',')[0])?.trim()||'unknown';
  const key='judge:'+createHmac('sha256',secret).update(address).digest('hex');
  const [limit]=await db.execute(sql`insert into auth_limits (key,attempts,window_started_at) values (${key},1,now()) on conflict (key) do update set attempts=case when auth_limits.window_started_at<now()-interval '15 minutes' then 1 else auth_limits.attempts+1 end, window_started_at=case when auth_limits.window_started_at<now()-interval '15 minutes' then now() else auth_limits.window_started_at end returning attempts`);
  if(Number(limit.attempts)>3)return NextResponse.json({error:'Too many practice auctions. Try again in 15 minutes.'},{status:429,headers:{'Retry-After':'900'}});
  await db.execute(sql`delete from judge_sessions where id in (select id from judge_sessions where expires_at<now() limit 100)`); // judge rows only; cascades their bids
  const token=randomBytes(32).toString('hex');
  const [row]=await db.execute(sql`insert into judge_sessions (token_hash,domain,starting_zats,bidding_ends_at,reveal_ends_at,expires_at) values (${hashJudgeToken(token)},${JUDGE_DOMAIN},${JUDGE_STARTING_ZATS},now()+interval '2 minutes',now()+interval '4 minutes',now()+interval '30 minutes') returning id`);
  const response=NextResponse.json({id:row.id},{status:201});
  response.cookies.set(JUDGE_COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/api/judge',maxAge:30*60});
  return response;
}
