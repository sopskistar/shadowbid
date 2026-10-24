import {describe,it,expect} from 'vitest';
import {walletSynced} from '../src/lib/zallet-status';
describe('wallet scan gate',()=>{
  it('accepts a fully synced wallet',()=>expect(walletSynced({node_tip:{height:100},wallet_tip:{height:100},fully_synced_height:100})).toBe(true));
  it('accepts Z3 regtest status only when the tips and hashes match',()=>{expect(walletSynced({node_tip:{height:2,blockhash:'abc'},wallet_tip:{height:2,blockhash:'abc'}})).toBe(true);expect(walletSynced({node_tip:{height:2,blockhash:'abc'},wallet_tip:{height:2,blockhash:'def'}})).toBe(false);});
  it('rejects a lagging or unknown wallet',()=>{expect(walletSynced({node_tip:100,wallet_tip:90,fully_synced_height:90})).toBe(false);expect(walletSynced({})).toBe(false);});
});
