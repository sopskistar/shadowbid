# ShadowBid

**Private auctions. Public outcomes.** A public domain bid can reveal your budget, competitive interest and next business move. ShadowBid lets sellers list real domains and buyers submit confidential sealed bids, with a public winning price and a private winner invoice.

Built for **Zecathon 2026 · Private Markets**. Invoice-specific shielded settlement is verified on public testnet in a controlled local experiment. **Production payment collection is disabled.**

## Judge? Start Here

| Explore | Link |
| --- | --- |
| Live marketplace | [Browse ShadowBid](https://shadowbid-ashy.vercel.app) |
| Four-minute interactive auction | [Try a Private Auction — no account or funds needed](https://shadowbid-ashy.vercel.app/try) |
| Detailed instructions | [Judge walkthrough](docs/JUDGE_WALKTHROUGH.md) |
| Genuine Zcash evidence | [Verified invoice payment](docs/INVOICE_PAYMENT_PROOF.md) |
| Real finalized auction | [domscout.xyz — 0.12 ZEC final price](https://shadowbid-ashy.vercel.app/auctions/3def1e14-06e7-41a1-8d25-ebf4d3133b76) |
| Two-minute demo video | [Watch the final 117-second demo on YouTube](https://youtu.be/K3JkEqG3q1Y) |

## Verify ShadowBid in Four Minutes

Allow two minutes to commit and two minutes to reveal, plus interaction time. Keep this browser tab open and both downloaded receipts private.

1. Open the [judge sandbox](https://shadowbid-ashy.vercel.app/try).
2. Press **Start practice auction →**. The reserved practice domain is not for sale.
3. Under **BIDDER A**, keep the default **0.02** offer and press **Seal bid & download receipt**. The browser submits a SHA-256 commitment.
4. Save `shadowbid-practice-A-receipt.json` — it contains the secret needed to reveal.
5. Under **BIDDER B**, keep **0.03** and press **Seal bid & download receipt**.
6. Save `shadowbid-practice-B-receipt.json` separately.
7. Wait until the real server-enforced reveal phase shows **Import saved receipt**.
8. Check tamper rejection: copy A's receipt, change only `amountZats`, and upload the altered copy under **BIDDER A**. Expect **Receipt does not match the original sealed commitment.**
9. Upload the unchanged originals using **Import Bidder A receipt** and **Import Bidder B receipt**. Each panel shows **Reveal verified**. Test the altered copy first because an accepted reveal removes that role's upload control.
10. At the reveal deadline, observe **Bidder B wins** and **0.03 practice ZEC**. The highest eligible reveal wins; equal offers use commitment time, then bid ID.

This sandbox uses the real commitment/reveal rules and server deadlines. It creates **no payable invoice, address, QR code or payment request**. You control both practice roles on one device; real auctions separate authenticated accounts. [Full walkthrough and troubleshooting](docs/JUDGE_WALKTHROUGH.md).

## Real Auction. Real Payment Evidence.

These are **two separate demonstrations**, not one completed domain sale.

| Evidence | What it establishes |
| --- | --- |
| [domscout.xyz auction](https://shadowbid-ashy.vercel.app/auctions/3def1e14-06e7-41a1-8d25-ebf4d3133b76) | Three sealed commitments; finalization from verified eligible reveals; public **0.12 ZEC** winning price. Bidder identities and losing offers are hidden from other participants. Winner payment details require the winning account; the seller has a restricted settlement view. **No paid sale or completed domain transfer is claimed.** |
| [Public-testnet invoice experiment](docs/INVOICE_PAYMENT_PROOF.md) | Exact shielded **0.01 TAZ / 1,000,000 zatoshis**, wallet-decrypted recipient attribution, genuine confirmations, **Invoice A Paid / Invoice B Unpaid**, persisted payment and replay protection. A **wallet-controlled self-transfer**, not an independent buyer purchase or payment for domscout.xyz. |

Transaction: `8cbffc50de4acdf7d9705a940c5cb8adad932715f96f275e0300e96f3e5a5206`.

The original online acceptance recorded ten confirmations; a later active-chain recheck recorded 584. [Sanitized auction screenshot](demo-video/public/captures/production-detail.png) · [Payment proof JSON](docs/INVOICE_PAYMENT_PROOF.json) · [Later recheck](docs/INVOICE_PAYMENT_RECHECK.json).

**Production wallet monitoring is not externally hosted or enabled.** Recorded payment proof is distinct from current scanner availability. No mainnet settlement is claimed. [Release validation](docs/RELEASE_VALIDATION.md).

## Privacy and Trust Model

| Boundary | What judges should know |
| --- | --- |
| Public | Domain listings, commitment hashes, deadlines and the final winning price. |
| Private from other bidders | Account identities, sealed offer amounts and winner invoice details. Losing offers are not published. |
| Buyer and seller access | Each bidder keeps their own secret receipt. The winner has account-protected checkout and payment records; the seller has a restricted settlement view. Other bidders cannot access either party's private invoice details. |
| Trusted operator | Can access accounts and valid revealed bids; runs winner selection, the database and wallet observations. The server receives the amount and secret at reveal. |
| Zcash protection | Shielded recipient and amount are hidden from public chain observers. The recipient wallet can decrypt them; network metadata is not eliminated. The test voluntarily discloses its amount/receiver as evidence. |
| Not implemented or demonstrated | Trustless escrow, automatic registrar transfer, independently verifiable winner selection and mainnet settlement. Domain delivery is manual. |

## For Technical Judges

These commands exist in this repository. Unit tests use synthetic fixtures; the recorded public-testnet evidence is a separate real experiment.

```bash
npm ci
# SHA-256 binding, altered receipt rejection, deterministic winner/tie-break:
npm test -- tests/crypto.test.ts tests/judge-rules.test.ts
# Production payment lock and authenticated worker policy:
npm test -- tests/payment-worker-policy.test.ts
# Recipient attribution, duplicate/isolation, stale/reorg and restart acceptance:
python3 -m unittest discover -s tests -p 'test_receiver_monitor.py' -v
```

With the [documented disposable loopback database/app](docs/TESTING.md) running, test private invoice access, HMAC replay, payment-note reconciliation and reorg recovery:

```bash
E2E_ISOLATED_DB=true npm run test:e2e -- tests/e2e/protocol.spec.ts tests/e2e/payment-policy.spec.ts tests/e2e/judge.spec.ts --workers=1
```

The browser suite accelerates deadlines only in its disposable database; the live `/try` flow uses real two-minute windows. A preserved, healthy wallet host can run `python3 scripts/check-invoice-settlement.py` for genuine recipient attribution and fresh-worker payment persistence. That command needs protected operator configuration, is not a public-clone demo, and sends no funds. **Do not rerun the sender or prover.**

[Full test instructions](docs/TESTING.md) · [Architecture](docs/ARCHITECTURE.md) · [Owner submission packet](docs/ZECATHON_SUBMISSION.md)

## Architecture

The Next.js application serves seller listings, DNS TXT verification, authenticated bidders, and winner-only checkout. The browser creates a SHA-256 commitment and a private JSON reveal receipt. PostgreSQL stores commitments, server-verified reveals, deterministic outcomes, private invoices, payment notes, and worker replay nonces. Public APIs expose the final winning price without bidder identities or losing bids. The operator is trusted and sees reveals.

A separate receiving worker keeps wallet material outside Vercel. Zallet receiving has passed a local regtest test. The pinned NU7-compatible Zingolib experiment decrypts public-testnet notes, resolves each recipient against wallet-controlled Unified receivers, cross-checks the active chain through Zebra, and authenticates observations to the app with HMAC. Two distinct local invoice receivers were tested: A received exactly 0.01 TAZ, B received nothing, and paid recovery passed. The production release lock remains closed. See [architecture](docs/ARCHITECTURE.md) and [invoice adapter](docs/ZINGOLIB_INVOICE_ADAPTER.md).

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
| Real public testnet receiving recognized | **Yes, isolated faucet deposit:** NU7-compatible Zingolib decrypted a 1 TAZ Ironwood note at block 4,541,930; Zebra verified the transaction in the active chain with over three confirmations. **Invoice-specific public-testnet settlement and worker restart are now verified; see [sanitized proof](docs/INVOICE_PAYMENT_PROOF.md).** Zallet beta.1 remains stopped. See [demo evidence](docs/DEMO_EVIDENCE.md). |
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
