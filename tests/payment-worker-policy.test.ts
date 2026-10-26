import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {randomBytes} from 'node:crypto';
import {localPaymentWorkerAllowed} from '../src/lib/payment-worker-policy';

const {insert}=vi.hoisted(()=>({insert:vi.fn()}));
vi.mock('../src/lib/db',()=>({db:{insert}}));
import {signature,verifyWorker} from '../src/lib/worker-auth';

beforeEach(()=>{
  vi.stubEnv('VERCEL','');vi.stubEnv('VERCEL_ENV','');
  vi.stubEnv('LOCAL_AUTH_BYPASS','true');vi.stubEnv('ALLOW_SHORT_AUCTIONS','true');
  vi.stubEnv('ZCASH_NETWORK','testnet');
  vi.stubEnv('DATABASE_URL','postgres://localhost/shadowbid_test');
  vi.stubEnv('PUBLIC_APP_URL','http://127.0.0.1:3102');
  vi.stubEnv('WORKER_SECRET',randomBytes(32).toString('hex'));
  insert.mockClear();
});
afterEach(()=>vi.unstubAllEnvs());

describe('payment worker release lock',()=>{
  it('allows the isolated testnet and regtest configurations',()=>{
    expect(localPaymentWorkerAllowed()).toBe(true);
    vi.stubEnv('ZCASH_NETWORK','regtest');
    expect(localPaymentWorkerAllowed()).toBe(true);
  });
  it.each([
    ['VERCEL','1'],['VERCEL_ENV','production'],['VERCEL_ENV','preview'],
    ['LOCAL_AUTH_BYPASS',''],['ALLOW_SHORT_AUCTIONS',''],['ZCASH_NETWORK','mainnet'],
    ['DATABASE_URL','postgres://production.example/shadowbid'],['DATABASE_URL',''],
    ['PUBLIC_APP_URL','https://shadowbid-ashy.vercel.app'],['PUBLIC_APP_URL',''],
  ])('rejects %s=%s even when other local flags are set',(key,value)=>{
    vi.stubEnv(key,value);
    expect(localPaymentWorkerAllowed()).toBe(false);
  });
  it('rejects a correctly signed production request before any database write',async()=>{
    vi.stubEnv('VERCEL_ENV','production');
    const time=String(Date.now()),nonce=randomBytes(16).toString('hex');
    const path='/api/worker/observe',body=JSON.stringify({notes:[]});
    const req=new Request('https://shadowbid-ashy.vercel.app'+path,{
      method:'POST',body,headers:{'x-sb-time':time,'x-sb-nonce':nonce,
        'x-sb-signature':signature(time,nonce,'POST',path,body)},
    });
    expect(await verifyWorker(req,body)).toBe(false);
    expect(insert).not.toHaveBeenCalled();
  });
});
