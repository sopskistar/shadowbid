import {NextResponse} from 'next/server';
import {and,eq} from 'drizzle-orm';
import {db} from '@/lib/db';
import {importedDomains} from '@/lib/schema';
import {currentUser,sameOrigin} from '@/lib/auth';
export async function DELETE(req:Request,{params}:{params:Promise<{id:string}>}){
  if(!sameOrigin(req))return NextResponse.json({error:'Invalid origin.'},{status:403});
  const user=await currentUser();if(!user)return NextResponse.json({error:'Sign in first.'},{status:401});
  const {id}=await params;if(!/^[0-9a-f-]{36}$/.test(id))return NextResponse.json({error:'Pending import not found.'},{status:404});
  const rows=await db.update(importedDomains).set({status:'cancelled'}).where(and(eq(importedDomains.id,id),eq(importedDomains.sellerId,user.id),eq(importedDomains.status,'pending'))).returning({id:importedDomains.id});
  return rows.length?NextResponse.json({ok:true}):NextResponse.json({error:'Pending import not found.'},{status:404});
}
