# ShadowBid

**Bid privately. Win confidently. Pay shielded.** ShadowBid is a seller-created **domain auction** MVP for Zecathon's Private Markets track. Buyers submit SHA-256 commitments, reveal privately after bidding closes, and the winner receives an access-controlled Zcash invoice. Domain transfer is manual. There is no drop-catching, registrar integration, escrow, or automated payout.

| Critical feature | Actual status |
| --- | --- |
| Auction creation, server deadlines, commitment receipt, reveal, tie-break, invoice, manual transfer attestations | Implemented and locally tested |
| Marketplace search, phase/extension/category filters, sorting, table/cards, pagination, local watchlist | Implemented and browser tested |
| PostgreSQL schema and migrations | Implemented; applied to local PostgreSQL 16 and the configured Neon `neondb/public` target. Vercel's Production database environment is not verified |
| Login/session and email-specific rate limiting | Implemented and locally tested |
| Email verification | Resend integration implemented; **delivery unverified**. Production signup disabled until configured |
| Zallet receiver assignment and wallet note monitoring | Implemented; tested against real local Z3 regtest RPC |
| Real regtest payment recognized | **Yes:** shielded receiver note, Zebra chain check, three confirmations. Transparent coinbase source and overpayment; see status report |
| Real public testnet payment recognized | **No:** owner wallet, sync, and funding still required |
| DNS TXT control check | Implemented; external DNS evidence test pending |
| Vercel, registrar automation, escrow, NFTs/art/real estate | Public Vercel routes pass a smoke check; its exact Production database target and authenticated flows remain unverified. Other features are planned only |

Commitments hide amounts during bidding, but the application server sees valid reveals. The operator/database can access application records and remains trusted for availability and winner selection. An access-controlled invoice is not an encrypted Zcash transaction. Shielded receiving protects the recipient from public chain observers; it does not erase network metadata or guarantee transfer of the domain. Do not use mainnet or high-value assets.

## Local setup

Requires Node 22+, PostgreSQL 16+, npm. Copy [.env.example](.env.example) to `.env.local` and set a **private** `DATABASE_URL` and random `WORKER_SECRET` (at least 32 characters). Never send secrets in chat or commit `.env.local`.

```bash
npm ci
npm run db:check # confirms the target and reports missing schema; exits nonzero until migrated
npm run db:migrate
# Only in local short-auction mode, with SAMPLE_SEED_ENABLED=true:
npm run seed:samples
npm run dev
```

Open `http://localhost:3000` (or the port Next.js reports). The safe seed creates or refreshes twelve illustrative `.com`, `.ai`, `.xyz`, and `.org` listings with two-minute bidding and reveal windows. They are marked **DEMO**, are browse-only, and cannot accept commitments or create invoices; no ownership, availability, or real sale is asserted. Re-running while active creates no duplicates; expired sample records with bids are preserved. Reserved `.example` protocol-test records remain searchable but do not crowd the default catalog. Set `SAMPLE_SEED_ENABLED=true` and `ALLOW_SHORT_AUCTIONS=true` only in nonproduction. Both seed scripts require a loopback PostgreSQL URL, refuse production mode, and never edit real auctions. For local walkthrough users, set private `TEST_*` credentials and `TEST_USER_SEED_ENABLED=true`, then run `npm run seed:test-users`.

Production signup requires a real verified Resend sender and `EMAIL_VERIFICATION_MODE=resend`; without that configuration the API returns 503 instead of pretending to send email. Local development may sign up unverified accounts without labeling their email verified. Password recovery is not implemented.

## Neon and Vercel

The owner created a Neon resource named `shadowbid` in Washington, D.C. East. The configured local pooled URL now has migrations 0000–0005; use `npm run db:check` to confirm it. In Vercel, set `DATABASE_URL`, `WORKER_SECRET`, `ZCASH_NETWORK=testnet`, `EMAIL_VERIFICATION_MODE=resend`, `RESEND_API_KEY`, `EMAIL_FROM`, and `PUBLIC_APP_URL`, then redeploy so the function receives the current environment. Keep wallet RPC credentials and wallet keys off Vercel. The wallet worker runs separately on WSL or an always-on host. See [deployment](docs/DEPLOYMENT.md) and [Zcash setup](docs/ZCASH_SETUP.md).

## Explore and verify

Start the 60-second tour, browse the sample catalog, create separate seller/bidder accounts, save a bid receipt, reveal during the next phase, and inspect the authorized winner checkout. `npm run test:e2e` exercises a fast two-bidder path against a disposable local PostgreSQL database. `npx tsx scripts/regtest-e2e.ts` can repeat the genuine local Z3 regtest receiving test after its explicit local-only setup. Fixture payment tests and the regtest test are **not** evidence of a public testnet transaction.

Read [auction protocol](docs/AUCTION_PROTOCOL.md), [privacy](docs/PRIVACY.md), [security](docs/SECURITY.md), [testing](docs/TESTING.md), and [integration status](docs/INTEGRATION_STATUS.md). The repository uses original ShadowBid code and the owner's supplied brand images; hackathon submission and final video remain owner actions.
