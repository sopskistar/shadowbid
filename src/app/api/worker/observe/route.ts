import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {invoices,paymentNotes} from '@/lib/schema';
import {eq,and,sql} from 'drizzle-orm';
import {verifyWorker} from '@/lib/worker-auth';
import {z} from 'zod';

const note=z.object({txid:z.string().regex(/^[a-f0-9]{64}$/),outIndex:z.number().int().min(0).max(2147483647),amountZats:z.string().max(16).regex(/^[1-9]\d*$/).refine(value=>BigInt(value)<=2100000000000000n),confirmations:z.number().int().min(0).max(2147483647)});
const payload=z.object({id:z.uuid(),walletAccount:z.uuid(),notes:z.array(note).max(1000)});
export async function POST(req:Request){
  const raw=await req.text();if(!await verifyWorker(req,raw))return NextResponse.json({error:'Unauthorized'},{status:401});
  let b:z.infer<typeof payload>;try{b=payload.parse(JSON.parse(raw));}catch{return NextResponse.json({error:'Invalid observation'},{status:400});}
  const unique=new Set(b.notes.map(n=>`${n.txid}:${n.outIndex}`));if(unique.size!==b.notes.length)return NextResponse.json({error:'Duplicate note in observation'},{status:400});
  try{const result=await db.transaction(async tx=>{
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${b.id}))`);
    const [i]=await tx.select().from(invoices).where(eq(invoices.id,b.id));
    if(!i||i.walletAccount!==b.walletAccount||!i.address||i.network!==(process.env.ZCASH_NETWORK==='regtest'?'regtest':'testnet'))return {error:'Receiver mismatch'};
    const now=new Date();
    for(const n of b.notes){
      const [stored]=await tx.select().from(paymentNotes).where(and(eq(paymentNotes.txid,n.txid),eq(paymentNotes.outIndex,n.outIndex)));
      if(!stored&&now>i.deadline)continue;
      if(!stored){await tx.insert(paymentNotes).values({invoiceId:i.id,txid:n.txid,outIndex:n.outIndex,amountZats:BigInt(n.amountZats),confirmations:n.confirmations}).onConflictDoNothing();}
      const [record]=await tx.select().from(paymentNotes).where(and(eq(paymentNotes.txid,n.txid),eq(paymentNotes.outIndex,n.outIndex)));
      if(!record||record.invoiceId!==i.id||record.amountZats!==BigInt(n.amountZats))throw Error('Conflicting note');
      await tx.update(paymentNotes).set({confirmations:n.confirmations,lastSeenAt:now}).where(eq(paymentNotes.id,record.id));
    }
    const records=await tx.select().from(paymentNotes).where(eq(paymentNotes.invoiceId,i.id));
    let confirmed=0n,detected=0n;
    for(const n of records){
      if(!unique.has(`${n.txid}:${n.outIndex}`)){
        // Preserve the immutable note identity for replay/conflict detection,
        // but revoke its chain credit when it disappears from the snapshot.
        await tx.update(paymentNotes).set({confirmations:0}).where(eq(paymentNotes.id,n.id));
        continue;
      }
      detected+=n.amountZats;if(n.confirmations>=3)confirmed+=n.amountZats;
    }
    const status=confirmed>=i.amountZats?'confirmed':detected>0n?'detected':'awaiting';
    await tx.update(invoices).set({status,paidZats:confirmed}).where(eq(invoices.id,i.id));
    return {ok:true,status,confirmedZats:String(confirmed),detectedZats:String(detected)};
  });return NextResponse.json(result,{status:'error'in result?409:200});}
  catch{return NextResponse.json({error:'Conflicting payment observation.'},{status:409});}
}
