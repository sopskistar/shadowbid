# ShadowBid

**Bid privately. Win confidently. Pay shielded.** ShadowBid is a seller-created **domain auction** MVP for Zecathon's Private Markets track. Buyers submit SHA-256 commitments, reveal privately after bidding closes, and the winner receives an access-controlled Zcash invoice. Domain transfer is manual. There is no drop-catching, registrar integration, escrow, or automated payout.

| Critical feature | Actual status |
| --- | --- |
| Auction creation, seller authority attestation, server deadlines, commitment receipt, reveal, tie-break, invoice, manual transfer attestations | Implemented and locally tested; production payment receiver requires DNS TXT control check |
| Owner Auction marketplace and separate read-only Demo Market | Search, advanced filters, sorting, watchlist, list/card views; final winning price only after valid finalization; no demo records or payments in PostgreSQL |
| Dropping Soon and Pre-Release | Clearly labeled previews only; no live feed, deletion dates, registrar partnership, bids, or payments |
| Judge practice auction | Isolated PostgreSQL session, two genuine browser commitments and downloaded receipts, server deadlines, valid reveals, deterministic winner; **no invoice or payment request**. Browser tested |
| Seller CSV import | Preview and attestation, 1–20 privately staged names, DNS TXT activation, cancellation; browser tested for staging and failed DNS. External positive DNS check remains unverified |
| PostgreSQL schema and migrations | Migrations 0000–0007 applied to isolated PostgreSQL 16 and the configured Neon `neondb/public` target. Vercel's Production database assignment has not been independently inspected |
| Login/session and email-specific rate limiting | Implemented and locally tested |
| Email verification | Resend signup and rate-limited resend implemented; owner reports live delivery and Gmail SPF/DKIM/DMARC PASS, with some Spam placement |
| Zallet receiver assignment and wallet note monitoring | Implemented; tested against real local Z3 regtest RPC |
| Real regtest payment recognized | **Yes:** shielded receiver note, Zebra chain check, three confirmations. Transparent coinbase source and overpayment; see status report |
| Real public testnet receiving recognized | **Yes, isolated faucet deposit:** NU7-compatible Zingolib decrypted a 1 TAZ Ironwood note at block 4,541,930; Zebra verified the transaction in the active chain with over three confirmations. **Invoice-specific settlement remains unverified.** Zallet beta.1 remains stopped. See [demo evidence](docs/DEMO_EVIDENCE.md). |
| DNS TXT control check | Implemented; external DNS evidence test pending |
| Vercel, registrar automation, escrow, NFTs/art/real estate | Public Vercel routes pass a smoke check; its exact Production database target and authenticated flows remain unverified. Other features are planned only |

Commitments hide amounts during bidding, but the application server sees valid reveals. The operator/database can access application records and remains trusted for availability and winner selection. An access-controlled invoice is not an encrypted Zcash transaction. Shielded receiving protects the recipient from public chain observers; it does not erase network metadata or guarantee transfer of the domain. Do not use mainnet or high-value assets.

## Local setup

Requires Node 22+, PostgreSQL 16+, npm. Copy [.env.example](.env.example) to `.env.local` and set a **private** `DATABASE_URL` and random `WORKER_SECRET` (at least 32 characters). Never send secrets in chat or commit `.env.local`.

```bash
npm ci
npm run db:check # confirms the target and reports missing schema; exits nonzero until migrated
npm run db:migrate
npm run dev
```

Open `http://localhost:3000` (or the port Next.js reports). The twelve illustrative `.com`, `.ai`, `.xyz`, and `.org` names are bundled as a read-only **Demo Market**; no seed, database auction, bid, deadline, or invoice is created for them. The desktop marketplace defaults to a compact list; filters, watchlist, and card view are optional. The legacy `npm run seed:samples` command is a no-op. Existing sample rows are preserved in PostgreSQL but excluded from the public real-auction query. Reserved `.example`, `.test`, `.invalid`, and `.localhost` protocol-test listings are also excluded from public auction results. To test a live two-minute auction, create a seller listing with `ALLOW_SHORT_AUCTIONS=true` in a disposable local database. The test-user seed requires a loopback PostgreSQL URL and explicit `TEST_USER_SEED_ENABLED=true`.

Production signup requires a real verified Resend sender and `EMAIL_VERIFICATION_MODE=resend`; without that configuration the API returns 503 instead of pretending to send email. Local development may sign up unverified accounts without labeling their email verified. Password recovery is not implemented.

## Neon and Vercel

The owner created a Neon resource named `shadowbid` in Washington, D.C. East. The configured pooled URL now has migrations 0000–0007; use `npm run db:check` to confirm it. The owner reports that production Resend delivery works and Gmail SPF, DKIM, and DMARC checks pass; the workspace has not inspected those account settings or headers. Keep wallet RPC credentials and wallet keys off Vercel. The wallet worker runs separately on WSL or an always-on host. See [deployment](docs/DEPLOYMENT.md) and [Zcash setup](docs/ZCASH_SETUP.md).

## Explore and verify

Start the 60-second tour and open **Try a Private Auction** for an isolated two-bidder commit/reveal practice using real protocol code and no payment request. Browse the read-only Demo Market, then switch to Owner Auctions for seller-created names. Dropping Soon and Pre-Release are source-free previews. Separate authenticated seller and bidder accounts are required to test real authorization, winner checkout, and manual transfer. Sellers can enter owned domains directly or stage a CSV on their dashboard; CSV names activate only after individual DNS TXT checks. `E2E_ISOLATED_DB=true npm run test:e2e` exercises a fast two-bidder path against a disposable **loopback** PostgreSQL database and loopback app. `npx tsx scripts/regtest-e2e.ts` can repeat the genuine local Z3 regtest receiving test after its explicit local-only setup. Fixture payment tests and the regtest test are **not** evidence of a public testnet transaction. See [judge practice](docs/JUDGE_SANDBOX.md).

Read [hackathon demo evidence](docs/DEMO_EVIDENCE.md), [auction protocol](docs/AUCTION_PROTOCOL.md), [Private Markets audit](docs/PRIVATE_MARKETS_AUDIT.md), [privacy](docs/PRIVACY.md), [security](docs/SECURITY.md), [testing](docs/TESTING.md), [integration status](docs/INTEGRATION_STATUS.md), and the [owner acceptance checklist](docs/GO_NO_GO.md). The repository uses original ShadowBid code and the owner's supplied brand images; hackathon submission and final video remain owner actions.
