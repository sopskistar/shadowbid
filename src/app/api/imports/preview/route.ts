import {NextResponse} from 'next/server';
import {currentUser,sameOrigin} from '@/lib/auth';
import {parseDomainCsv} from '@/lib/domain-import';
import {formatZec} from '@/lib/crypto';

export async function POST(req:Request){
  if(!sameOrigin(req))return NextResponse.json({error:'Invalid origin.'},{status:403});
  if(!await currentUser())return NextResponse.json({error:'Sign in first.'},{status:401});
  try{const body=await req.json();const rows=parseDomainCsv(body.csv,new Date(),process.env.ALLOW_SHORT_AUCTIONS==='true');return NextResponse.json({rows:rows.map(row=>({...row,startingZats:String(row.startingZats),openingPrice:formatZec(row.startingZats)}))});}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Invalid CSV.'},{status:400})}
}
