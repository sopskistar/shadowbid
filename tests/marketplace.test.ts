import {describe,it,expect} from 'vitest';
import {filterListings,listingPhase,type PublicListing} from '../src/lib/marketplace';
const now=Date.parse('2026-10-24T12:00:00Z');
const listing=(id:string,domain:string,category:string,minutes:number,price:bigint,commitments=0):PublicListing=>({id,domain,category,startingZats:price,commitments,biddingEndsAt:new Date(now+minutes*60000),revealEndsAt:new Date(now+(minutes+2)*60000),createdAt:new Date(now-minutes*1000),sample:true,dnsVerifiedAt:null,completedAt:null});
const rows=[listing('a','veltrix.com','Brandable',2,10n,2),listing('b','cloudharbor.ai','Technology / AI',30,20n,4),listing('c','opencanvas.org','Organizations',-1,5n,1)];
describe('marketplace browsing',()=>{
  it('searches names without exposing amounts or identities',()=>expect(filterListings(rows,{query:'cloud',phase:'all',extension:'all',category:'all',sort:'ending'},now).map(x=>x.id)).toEqual(['b']));
  it('hides reserved test domains until searched',()=>{const fixture=listing('t','protocol-test.example','Technology',1,1n);expect(filterListings([...rows,fixture],{query:'',phase:'all',extension:'all',category:'all',sort:'ending'},now).map(x=>x.id)).not.toContain('t');expect(filterListings([...rows,fixture],{query:'protocol-test',phase:'all',extension:'all',category:'all',sort:'ending'},now).map(x=>x.id)).toContain('t');});
  it('filters extension, category, and actual phase',()=>{expect(filterListings(rows,{query:'',phase:'active',extension:'ai',category:'Technology / AI',sort:'ending'},now).map(x=>x.id)).toEqual(['b']);expect(listingPhase(rows[2],now)).toBe('reveal');});
  it('sorts by price, deadline, newest, and commitments',()=>{const options={query:'',phase:'all' as const,extension:'all',category:'all'};expect(filterListings(rows,{...options,sort:'price-low'},now).map(x=>x.id)).toEqual(['c','a','b']);expect(filterListings(rows,{...options,sort:'commitments'},now).map(x=>x.id)).toEqual(['b','a','c']);expect(filterListings(rows,{...options,sort:'ending'},now).map(x=>x.id)).toEqual(['c','a','b']);});
});
