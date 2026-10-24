# Integration status — 2026-10-24

| Component | Status | Evidence / remaining gate |
| --- | --- | --- |
| Auction protocol | Implemented and locally tested | Commit, reveal, deterministic finalization, private invoice, transfer attestations in Playwright |
| PostgreSQL migrations | Implemented and locally tested | Applied migrations 0000–0005 to isolated PostgreSQL 16 |
| Neon `shadowbid` | **Local connection and schema verified** | On 2026-10-24 the pooled `neondb/public` target had no ShadowBid tables. Migrations 0000–0005 were applied without resetting data, and the post-migration check found all required tables/columns. Vercel's environment target has not been independently verified. |
| Z3 regtest RPC compatibility | **Verified against live local Z3** | `getwalletstatus`, `z_getnewaccount`, `z_getaddressforaccount`, `z_listunifiedreceivers`, `z_listunspent` exercised |
| Real regtest receiving payment | **Verified** | Wallet-generated `uregtest` address, real `z_shieldcoinbase` transaction, wallet note, Zebra chain cross-check, three confirmations, ShadowBid invoice confirmed. Regtest txid `7eae6e2684a34d0995c4827e8fabb2f5979336b0223d94008451658d5b782f12`; auction `657c2389-4c4e-4093-8b36-b67e330dea49` in disposable local DB. |
| Regtest sender privacy | **Limited** | Test used a transparent mining source to shield one coinbase output. Its source and amount are public on the regtest chain; receiver is shielded. The note overpaid a 0.02 ZEC invoice. This does not demonstrate a fully shielded sender. |
| Public testnet payment | **Not verified** | Owner must configure/sync testnet Zebra + Zallet and fund a separate shielded wallet; run a low-value exact payment. No public testnet tx has been observed. |
| Email verification provider | Implemented configuration path, **not externally verified** | Production signup is disabled until Resend key, verified sender, and `PUBLIC_APP_URL` are configured. No email was sent in this workspace. |
| Vercel deployment | Existing deployment still errors | The public site returns 500 on `/` and `/api/auctions` after the local Neon migration. Its Function Logs and Production `DATABASE_URL` assignment are inaccessible from this workspace; confirm both and redeploy after environment changes. |

The Z3-packaged Zallet image accepted the receiving RPCs but lacked `z_sendfromaccount` in `rpc.discover`; current [Zallet RPC documentation](https://zcash.github.io/zallet/rpc/index.html) lists that method. In this regtest image, `z_sendmany` from the funded Ironwood address returned insufficient balance, so the integration proof used `z_shieldcoinbase`. Its `z_listunspent` output labeled the shielded pool `ironwood`, and its regtest address used `uregtest`. The worker handles these observed formats. When Zallet temporarily omitted `wallet_tip`, the worker required Zebra chain cross-checking before processing notes; it does not claim full wallet sync in that state.

The worker still uses unspent-note polling. Invoice accounts must remain unspent while monitored. Operator custody, wallet version upgrades, and real public testnet compatibility remain material risks.
