import {describe,expect,it} from 'vitest';
import {canonicalBid,sha256,parseZec} from '../src/lib/crypto';
import {selectHighestReveal} from '../src/lib/auction-rules';

describe('isolated judge auction rules',()=>{
  it('uses the same versioned commitment as real bids and rejects changed receipt values',async()=>{
    const id='00000000-0000-4000-8000-000000000001';const bidder=`judge:${id}:A`;const amount=parseZec('0.02').toString();const secret='ab'.repeat(32);
    const commitment=await sha256(canonicalBid(id,bidder,amount,secret));
    expect(commitment).toMatch(/^[a-f0-9]{64}$/);
    expect(await sha256(canonicalBid(id,bidder,parseZec('0.03').toString(),secret))).not.toBe(commitment);
    expect(await sha256(canonicalBid(id,`judge:${id}:B`,amount,secret))).not.toBe(commitment);
    expect(await sha256(canonicalBid(id,bidder,amount,'cd'.repeat(32)))).not.toBe(commitment);
  });
  it('chooses highest eligible reveal and breaks ties by trusted commit time then id',()=>{
    const at=new Date('2026-10-24T00:00:00Z');const later=new Date('2026-10-24T00:00:01Z');
    const entries=[{id:'b',amountZats:3n,createdAt:at},{id:'a',amountZats:3n,createdAt:at},{id:'c',amountZats:4n,createdAt:later}];
    expect(selectHighestReveal(entries,1n)?.id).toBe('c');
    expect(selectHighestReveal(entries,1n,5n)).toBeUndefined();
    expect(selectHighestReveal(entries.slice(0,2),1n)?.id).toBe('a');
    expect(selectHighestReveal([{id:'x',amountZats:1n,createdAt:at}],2n)).toBeUndefined();
  });
});
