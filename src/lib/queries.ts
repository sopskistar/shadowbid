import {db} from './db';
import {auctions,bids,invoices} from './schema';
import {eq,desc,sql} from 'drizzle-orm';

export async function publicAuctions(){
  const rows=await db.select({
    id:auctions.id,domain:auctions.domain,description:auctions.description,category:auctions.category,
    startingZats:auctions.startingZats,biddingEndsAt:auctions.biddingEndsAt,revealEndsAt:auctions.revealEndsAt,
    createdAt:auctions.createdAt,sample:auctions.sample,dnsVerifiedAt:auctions.dnsVerifiedAt,
    commitments:sql<number>`count(distinct ${bids.id})::int`,
    completedAt:sql<Date|null>`max(case when ${invoices.status} = 'confirmed' then ${invoices.buyerReceivedAt} end)`
  }).from(auctions).leftJoin(bids,eq(bids.auctionId,auctions.id)).leftJoin(invoices,eq(invoices.auctionId,auctions.id)).where(eq(auctions.sample,false)).groupBy(auctions.id).orderBy(desc(auctions.createdAt)).limit(500);
  return rows;
}
export async function myAuctions(userId:string){const rows=await db.select({auction:auctions,invoice:invoices}).from(auctions).leftJoin(invoices,eq(invoices.auctionId,auctions.id)).where(eq(auctions.sellerId,userId)).orderBy(desc(auctions.createdAt));return rows.map(({auction,invoice})=>({...auction,invoice}));}
export async function myBids(userId:string){return db.select({bid:bids,auction:auctions}).from(bids).innerJoin(auctions,eq(bids.auctionId,auctions.id)).where(eq(bids.bidderId,userId)).orderBy(desc(bids.createdAt));}
export async function myInvoices(userId:string){return db.select({invoice:invoices,auction:auctions}).from(invoices).innerJoin(auctions,eq(invoices.auctionId,auctions.id)).where(eq(invoices.winnerId,userId)).orderBy(desc(invoices.createdAt));}
