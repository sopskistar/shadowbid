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

### Public testnet on WSL — owner action required

1. Clone Z3 separately and run `./scripts/setup-network.sh testnet`. Start Zebra: `docker compose --env-file .env.testnet up -d zebra`. Wait for `./scripts/check-zebra-readiness.sh 18080`; initial sync can take hours. Then start the rest with `docker compose --env-file .env.testnet up -d`. [Z3 network setup](https://github.com/ZcashFoundation/z3).
2. Initialize the **testnet** Zallet wallet encryption and mnemonic per [Z3's wallet setup FAQ](https://github.com/ZcashFoundation/z3/blob/main/docs/faq.md). Back up the wallet volume and phrase offline. Never copy spending keys or viewing keys to Vercel. Check `getwalletstatus` until node and wallet tips are synchronized; inspect the image's live `rpc.discover` schema before using it.
3. In ShadowBid's web environment set `ZCASH_NETWORK=testnet`. On the separate worker host set the same `WORKER_SECRET`, `SHADOWBID_APP_URL=<deployed HTTPS origin>`, `ZALLET_RPC_URL` and Zallet credentials, plus `ZEBRA_RPC_URL` and its cookie-derived credentials if using chain cross-checking. Run `npm run worker` under a supervisor. Public testnet RPC host ports differ from regtest; use Z3's `.env.testnet` as the source of truth.
4. Fund a **separate** testnet shielded sender wallet. Create a short local test auction or a normal-duration public testnet auction, commit and reveal from two accounts, finalize, and wait for a unique receiver. Pay the **exact** invoice amount to its ZIP-321 address from the shielded sender. Observe detected status, then three confirmations and confirmed status. Record the txid privately and compare Zallet note `account_uuid`, `valueZat`, and Zebra active-chain confirmation. Only after this may `INTEGRATION_STATUS.md` say public testnet verified.

The worker creates one wallet account per invoice because Zallet's `z_listunspent` address filter can return every note in that account. It validates the UA's Orchard receiver with `z_listunifiedreceivers`, filters out change and transparent notes, and checks Zebra's active chain when configured. It does not spend from invoice accounts. If the wallet is offline or its chain data disagrees, payment status must not be advanced. There is no escrow, automated seller payout, or registrar transfer.

Sources: [Zallet RPC](https://zcash.github.io/zallet/rpc/index.html), [Z3 regtest](https://github.com/ZcashFoundation/z3/blob/main/docs/regtest.md), [ZIP-321](https://zips.z.cash/zip-0321).
