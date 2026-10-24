import {describe,it,expect} from 'vitest';
import {demoDomains,filterDemoDomains} from '../src/lib/demo-catalog';

describe('read-only demo domain catalog',()=>{
  it('contains original examples across the supported extensions without auction identifiers',()=>{
    expect(demoDomains).toHaveLength(12);
    expect(new Set(demoDomains.map(item=>item.domain.split('.').pop()?.toLowerCase()))).toEqual(new Set(['com','ai','xyz','org']));
    expect(demoDomains.every(item=>!('auctionId' in item)&&!('address' in item))).toBe(true);
  });
  it('searches names and descriptions, filters extension and category, and sorts illustrative amounts',()=>{
    expect(filterDemoDomains({query:'harbor',extension:'all',category:'all',sort:'name'}).map(item=>item.domain)).toEqual(['CloudHarbor.ai','PixelHarbor.com']);
    expect(filterDemoDomains({query:'',extension:'ai',category:'Technology / AI',sort:'name'}).map(item=>item.domain)).toEqual(['CloudHarbor.ai','QuantumForge.ai']);
    const highest=filterDemoDomains({query:'',extension:'all',category:'all',sort:'price-high'});
    expect(highest[0].illustrativeZats).toBe(11_000_000n);
    expect(highest.at(-1)?.illustrativeZats).toBe(1_000_000n);
  });
});
