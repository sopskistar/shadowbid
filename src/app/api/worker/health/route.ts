import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {workerHealth} from '@/lib/schema';
import {eq} from 'drizzle-orm';
import {verifyWorker} from '@/lib/worker-auth';
const network=()=>process.env.ZCASH_NETWORK==='regtest'?'regtest':'testnet';
export async function GET(){const [health]=await db.select().from(workerHealth).where(eq(workerHealth.name,`zallet:${network()}`));const fresh=!!health&&Date.now()-health.lastSeenAt.getTime()<=60000;return NextResponse.json({state:!health?'unconfigured':!fresh?'offline':health.state,lastSeenAt:health?.lastSeenAt||null,network:network(),walletReportedSynced:fresh&&health.state==='connected'&&health.details==='Wallet tip synchronized',chainCrossChecked:fresh&&health.state==='connected'&&health.details==='Zebra chain cross-check enabled'});}
export async function POST(req:Request){const raw=await req.text();if(!await verifyWorker(req,raw))return NextResponse.json({error:'Unauthorized'},{status:401});let body;try{body=JSON.parse(raw)}catch{return NextResponse.json({error:'Invalid body'},{status:400})}if(!['connected','error'].includes(body.state))return NextResponse.json({error:'Invalid state'},{status:400});const name=`zallet:${network()}`,details=String(body.details||'').slice(0,200);await db.insert(workerHealth).values({name,state:body.state,details,lastSeenAt:new Date()}).onConflictDoUpdate({target:workerHealth.name,set:{state:body.state,details,lastSeenAt:new Date()}});return NextResponse.json({ok:true});}
