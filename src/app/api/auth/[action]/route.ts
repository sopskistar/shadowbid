import {NextResponse} from 'next/server';
import {z} from 'zod';
import {db} from '@/lib/db';
import {users} from '@/lib/schema';
import {eq} from 'drizzle-orm';
import {hash,compare} from 'bcryptjs';
import {createSession,endSession,sameOrigin} from '@/lib/auth';
import {takeAuthAttempt} from '@/lib/rate-limit';
import {allowLocalUnverifiedSignup,emailVerificationConfigured,sendVerificationEmail} from '@/lib/email-verification';

const form=z.object({email:z.email().transform(x=>x.toLowerCase()),password:z.string().min(12).max(128)});
const dummyHash='$2b$12$KIXQ4Y2SgqA5bqHBbZV0eO9R2YUs8Fx5hPujyNQHtXvRKxO5s0rQe';
export async function POST(req:Request,{params}:{params:Promise<{action:string}>}){
  if(!sameOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});
  const {action}=await params;
  if(action==='logout'){await endSession();return NextResponse.json({ok:true});}
  if(action!=='login'&&action!=='signup')return NextResponse.json({error:'Not found'},{status:404});
  let body:z.infer<typeof form>;
  try{body=form.parse(await req.json());}catch{return NextResponse.json({error:'Enter a valid email and password of at least 12 characters.'},{status:400});}
  const limit=await takeAuthAttempt(action,body.email);
  if(!limit.allowed)return NextResponse.json({error:'Too many attempts. Try again in 15 minutes.'},{status:429,headers:{'Retry-After':String(limit.retryAfter)}});
  const [existing]=await db.select().from(users).where(eq(users.email,body.email)).limit(1);
  if(action==='signup'){
    if((process.env.NODE_ENV==='production'||process.env.EMAIL_VERIFICATION_MODE==='resend')&&!emailVerificationConfigured()&&!allowLocalUnverifiedSignup())return NextResponse.json({error:'Registration is temporarily unavailable until email verification is configured.'},{status:503});
    if(existing&&emailVerificationConfigured()&&!existing.emailVerifiedAt&&await compare(body.password,existing.passwordHash)){
      try{await sendVerificationEmail(existing.id,existing.email);return NextResponse.json({ok:true,created:false,pendingVerification:true,message:'Check your inbox for a verification link.'});}
      catch{return NextResponse.json({error:'Could not send verification email. Try again later.'},{status:503});}
    }
    if(existing)return NextResponse.json({ok:true,created:false,message:'If this address is already registered, sign in with it.'});
    try{const [user]=await db.insert(users).values({email:body.email,passwordHash:await hash(body.password,12)}).returning();if(emailVerificationConfigured()){await sendVerificationEmail(user.id,user.email);return NextResponse.json({ok:true,created:true,pendingVerification:true,message:'Check your inbox for a verification link.'});}await createSession(user.id);return NextResponse.json({ok:true,created:true});}
    catch{return NextResponse.json({ok:true,created:false,message:'If this address is already registered, sign in with it.'});}
  }
  const valid=await compare(body.password,existing?.passwordHash||dummyHash);
  if(valid&&existing){if(process.env.EMAIL_VERIFICATION_MODE==='resend'&&!existing.emailVerifiedAt)return NextResponse.json({error:'Verify your email before signing in.'},{status:403});await createSession(existing.id);return NextResponse.json({ok:true});}
  return NextResponse.json({error:'Invalid credentials.'},{status:401});
}
