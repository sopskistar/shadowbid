# Zcash wallet setup on Ubuntu WSL

**Current evidence:** A real local Z3 **regtest** receiving transaction reached a ShadowBid invoice with three confirmations. A public **testnet** transaction has not been run. Regtest coins have no monetary value. Never send a seed phrase, wallet cookie, or database password in chat.

## Recommended stack: Z3

[Z3](https://github.com/ZcashFoundation/z3) packages Zebra and Zallet with separate regtest and public testnet Compose projects. This is simpler than compiling the Zebra indexer and Zallet backend separately. Use Ubuntu 24.04 WSL, Docker Engine/Compose v2.24.4+, Git, and enough SSD space for a public testnet sync. Keep wallet volumes backed up and RPC ports on loopback. The wallet RPC has spending authority.

### Local regtest (isolated, repeatable)

```bash
git clone https://github.com/ZcashFoundation/z3.git
cd z3
./scripts/regtest-init.sh
docker compose --env-file .env.regtest up -d zebra zallet
```

The optional RPC router is unnecessary for ShadowBid. Direct Zallet RPC is at `http://127.0.0.1:50232`; direct Zebra RPC is at `http://127.0.0.1:29232`. The Z3 regtest default RPC credentials are `zebra` / `zebra`; keep these loopback-only. Check `getwalletstatus`, `rpc.discover`, and `z_listunspent` against the installed image. The image tested here returned `uregtest` addresses and `ironwood` note pools, and omitted `wallet_tip` briefly during scanning.

To fund a regtest send source, create a Zallet account with `z_getnewaccount`, derive a UA with `z_getaddressforaccount` using `["p2pkh","orchard"]`, then call `z_listunifiedreceivers` and record its `p2pkh` address. Recreate Zebra with that address as `ZEBRA_MINING__MINER_ADDRESS` and mine at least 103 blocks with Zebra's regtest `generate` RPC. Wait until `z_getbalanceforaccount` reports mature transparent funds. The regtest script below shields one coinbase output to the invoice; this **overpays** its 0.02 ZEC invoice and exposes the transparent source on the regtest chain. It tests authentic receiver recognition and three-confirmation accounting, not a fully shielded sender or exact payer amount.

Run ShadowBid locally with a **separate local PostgreSQL database**, `ZCASH_NETWORK=regtest`, and a random local `WORKER_SECRET`; set `ALLOW_SHORT_AUCTIONS=true` and `LOCAL_AUTH_BYPASS=true` only for a loopback database. Run the worker separately with the same secret, `SHADOWBID_APP_URL`, `ZALLET_RPC_URL=http://127.0.0.1:50232`, `ZEBRA_RPC_URL=http://127.0.0.1:29232`, and local RPC credentials. Then set `REGTEST_E2E_ENABLED=true`, `REGTEST_COINBASE_ADDRESS=<wallet-owned t-address>`, and run:

```bash
npx tsx scripts/regtest-e2e.ts
```

The script refuses non-loopback app, RPC, or PostgreSQL URLs. It creates disposable accounts and an auction, performs a real commitment and reveal, waits for wallet receiver assignment, shields one coinbase UTXO, mines three blocks, and checks the wallet note, Zebra chain record, exact recorded zatoshis, and invoice status. Stop Z3 with `docker compose --env-file .env.regtest --profile '*' down` to preserve volumes. Do not use `down -v` unless intentionally erasing regtest wallet data.

### Public testnet on WSL — isolated receiver experiment

Z3's existing Zebra 7.0.0 testnet node uses the preserved chain volume and loopback-only management RPC. The Z3-pinned Zallet beta.1 fails to parse post-NU7 mempool transactions (`invalid consensus branch id`) and remains stopped. Keep the `Z3_ZEBRA_IMAGE=zfnd/zebra:7.0.0` override and the loopback Compose override; do not recreate wallets or delete volumes. See [the NU7 operator record](TESTNET_NU7.md).

The standalone Zingolib receiver now scans public testnet through `https://testnet.zec.rocks:443`. Its Docker container has no published ports; wallet data and a backup remain local in protected directories. Run `python3 scripts/receiver-observe.py` on the owner-controlled host to pause the scanner, take an offline wallet snapshot, compare Zebra's authenticated testnet tip, verify the existing Unified receiver is still wallet-controlled, append a private observation, and restart the scanner. The observer prints only public chain heights and note identifiers/values, never seed, viewing key, memo, or wallet file contents. Its protected `.env.nu7-receiver/observations.jsonl` is the persistent evidence log.

The separate Zingo PC sender previously displayed 3.1400 TAZ but now reports a server error. Restore its public-testnet server health and verify a fresh spendable shielded balance before asking it to send about 0.01 TAZ to the existing receiver. A normal ZIP 317 transaction may add a 0.0001 TAZ fee for a simple transfer; accept the fee shown by Zingo PC before sending. The receiver note must then show the exact integer amount, real transaction ID, confirmed height, and three confirmations on Zebra's active public-testnet chain. No payment or three confirmations have been observed yet. This isolated deposit is not a ShadowBid customer invoice.

Only after that deposit succeeds should per-invoice wallet-controlled receiver association be implemented and tested. Zingolib's current `notes` command provides value, transaction ID, output index, and height but not a destination Unified address or diversifier, so its output alone cannot safely map notes to invoices. The production payment worker stays disabled until an SDK-backed mapping is demonstrated.

Sources: [Zallet RPC](https://zcash.github.io/zallet/rpc/index.html), [Z3 regtest](https://github.com/ZcashFoundation/z3/blob/main/docs/regtest.md), [ZIP-321](https://zips.z.cash/zip-0321).
