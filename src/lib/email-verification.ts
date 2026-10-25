import {createHash,randomBytes} from 'node:crypto';
import {db} from './db';
import {emailVerificationTokens} from './schema';

export function emailVerificationConfigured(){return process.env.EMAIL_VERIFICATION_MODE==='resend'&&!!process.env.RESEND_API_KEY&&!!process.env.EMAIL_FROM&&!!process.env.PUBLIC_APP_URL;}
export function allowLocalUnverifiedSignup(){try{return process.env.LOCAL_AUTH_BYPASS==='true'&&process.env.ALLOW_SHORT_AUCTIONS==='true'&&!process.env.VERCEL_ENV&&['127.0.0.1','localhost','::1'].includes(new URL(process.env.DATABASE_URL||'').hostname)}catch{return false}}
export async function sendVerificationEmail(userId:string,email:string){
  if(!emailVerificationConfigured())throw Error('Email provider unavailable');
  const origin=new URL(process.env.PUBLIC_APP_URL!);
  if(process.env.NODE_ENV==='production'&&origin.protocol!=='https:')throw Error('PUBLIC_APP_URL must use HTTPS');
  const token=randomBytes(32).toString('base64url');
  await db.insert(emailVerificationTokens).values({userId,tokenHash:createHash('sha256').update(token).digest('hex'),expiresAt:new Date(Date.now()+24*3600000)});
  const link=new URL('/api/auth/verify-email',origin);link.searchParams.set('token',token);
  const response=await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(10000),headers:{authorization:`Bearer ${process.env.RESEND_API_KEY}`,'content-type':'application/json'},body:JSON.stringify({from:process.env.EMAIL_FROM,...(process.env.EMAIL_REPLY_TO?{reply_to:process.env.EMAIL_REPLY_TO}:{}),to:[email],subject:'Verify your ShadowBid account',text:`You requested a ShadowBid account for ${email}. Open this link to verify your address within 24 hours:\n\n${link.toString()}\n\nIf you did not sign up, you can ignore this message.`})});
  if(!response.ok)throw Error('Email provider did not accept verification message');
}
