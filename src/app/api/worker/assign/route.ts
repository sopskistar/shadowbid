import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {invoices,auctions} from '@/lib/schema';
import {eq,and,isNull,gt,sql} from 'drizzle-orm';
import {verifyWorker} from '@/lib/worker-auth';
import {validateShieldedAddress} from '@/lib/crypto';
import {localRegtestOnly} from '@/lib/settlement-policy';
import {z} from 'zod';
const assignment=z.object({id:z.uuid(),walletAccount:z.uuid(),address:z.string().max(2048)});
export async function POST(req:Request){const raw=await req.text();if(!await verifyWorker(req,raw))return NextResponse.json({error:'Unauthorized'},{status:401});let b:z.infer<typeof assignment>;try{b=assignment.parse(JSON.parse(raw));}catch{return NextResponse.json({error:'Invalid assignment'},{status:400});}const network=process.env.ZCASH_NETWORK==='regtest'?'regtest':'testnet';if(!validateShieldedAddress(b.address,network))return NextResponse.json({error:'Invalid shielded address for configured network'},{status:400});try{const controlCheck=localRegtestOnly()?sql`true`:sql`exists(select 1 from ${auctions} where ${auctions.id}=${invoices.auctionId} and ${auctions.dnsVerifiedAt} is not null)`;const rows=await db.update(invoices).set({address:b.address,walletAccount:b.walletAccount,status:'awaiting'}).where(and(eq(invoices.id,b.id),isNull(invoices.address),gt(invoices.deadline,new Date()),eq(invoices.network,network),controlCheck)).returning();return NextResponse.json({ok:!!rows.length},{status:rows.length?200:409});}catch{return NextResponse.json({error:'Receiver already assigned'},{status:409});}}
