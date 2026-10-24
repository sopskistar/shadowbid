import {createHash} from 'node:crypto';
import {sql} from 'drizzle-orm';
import {db} from './db';

const WINDOW_SECONDS=15*60;
export async function takeAuthAttempt(action:'login'|'signup',email:string){
  const key=createHash('sha256').update(`${action}:${email}`).digest('hex');
  const rows=await db.execute(sql`
    insert into auth_limits (key,attempts,window_started_at) values (${key},1,now())
    on conflict (key) do update set
      attempts=case when auth_limits.window_started_at < now() - interval '15 minutes' then 1 else auth_limits.attempts+1 end,
      window_started_at=case when auth_limits.window_started_at < now() - interval '15 minutes' then now() else auth_limits.window_started_at end
    returning attempts`);
  return {allowed:Number(rows[0].attempts)<= (action==='login'?8:5),retryAfter:WINDOW_SECONDS};
}
