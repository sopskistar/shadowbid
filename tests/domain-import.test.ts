import {describe,expect,it} from 'vitest';
import {parseDomainCsv} from '../src/lib/domain-import';
const now=new Date('2026-10-24T12:00:00Z');
const header='domain,opening_price_zec,bidding_end,reveal_end,description';
describe('seller CSV staging validation',()=>{
  it('parses quoted descriptions, exact zatoshis and optional reveal deadline',()=>{
    const rows=parseDomainCsv(`${header}\nVeltrix.com,0.01000001,2026-10-26T15:00:00Z,,"Good, short name"`,now);
    expect(rows).toHaveLength(1);expect(rows[0].domain).toBe('veltrix.com');expect(rows[0].startingZats).toBe(1_000_001n);expect(rows[0].description).toBe('Good, short name');expect(rows[0].revealEndsAt.toISOString()).toBe('2026-10-26T15:30:00.000Z');
  });
  it('rejects duplicates, reserved names, invalid precision, and ambiguous dates',()=>{
    expect(()=>parseDomainCsv(`${header}\na.com,1,2026-10-26T15:00:00Z,,\nA.com,1,2026-10-26T15:00:00Z,,`,now)).toThrow(/Duplicate/);
    expect(()=>parseDomainCsv(`${header}\nreserved.example,1,2026-10-26T15:00:00Z,,`,now)).toThrow(/reserved/);
    expect(()=>parseDomainCsv(`${header}\nending-.com,1,2026-10-26T15:00:00Z,,`,now)).toThrow(/invalid/);
    expect(()=>parseDomainCsv(`${header}\nstarting.-com,1,2026-10-26T15:00:00Z,,`,now)).toThrow(/invalid/);
    expect(()=>parseDomainCsv(`${header}\na.com,0.000000001,2026-10-26T15:00:00Z,,`,now)).toThrow(/price/);
    expect(()=>parseDomainCsv(`${header}\na.com,1,2026-10-26T15:00:00,,`,now)).toThrow(/timezone/);
  });
});
