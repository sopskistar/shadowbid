# Zecathon owner acceptance — GO / NO-GO

Snapshot: 2026-10-25. **GO for judge practice and local protocol review. NO-GO for claiming public-testnet settlement or a production seller/bidder journey until the checks below pass.** Pushing, deploying, and submitting remain owner decisions.

## Verified here

- Public `/`, `/auctions`, `/try`, `/signup`, `/login`, and `/api/auctions` returned HTTP 200. `/try` created and read one expiring production practice session. No payment request was created.
- The configured local Neon `neondb/public` database passed `npm run db:check` through migration 0007. Vercel's exact Production connection value and Resend delivery were not visible here.
- Local disposable-PostgreSQL browser tests exercised the actual seller, bidder, practice, invoice-authorization, and fixture payment paths. Browser payment fixtures are not live chain evidence.

## Owner browser steps

1. In Vercel Project Settings, check **Production scope** for `DATABASE_URL`, `WORKER_SECRET`, `ZCASH_NETWORK=testnet`, `EMAIL_VERIFICATION_MODE=resend`, `RESEND_API_KEY`, `EMAIL_FROM`, and `PUBLIC_APP_URL`. Compare the database **target**, not the password, with the intended Neon branch. Never paste secrets in chat. If variables changed, deploy a new revision before testing.
2. Open `/try` in a fresh browser. Create a session, submit A and B commitments, download both receipts, attempt a changed receipt (must fail), reveal within the real server deadlines, and verify the highest valid amount wins. Confirm this screen offers no address, QR, invoice, or payment button.
3. Open `/auctions`. Check **Owner Auctions** against `/api/auctions`; illustrative Demo Market names must not appear in that API. Search/filter/sort and inspect phone layout. Check Dropping Soon and Pre-Release labels if those preview routes are present in the deployment.
4. Register with an inbox you control. Confirm Resend shows an accepted send **and the message arrives**. Before opening the link, login must refuse with a verification prompt. Redeem the link once, then sign in and open the seller dashboard. A reused/invalid link must fail. A provider failure must not sign the user in. Check Vercel Function Logs without sharing tokens or addresses.
5. Using a domain you own or are authorized to list, create an Owner Auction (or preview/stage 1–20 CSV rows). Publish the displayed `_shadowbid.<domain>` TXT value and verify DNS. Check the real listing, opening price, deadline, commitment count, and public link. DNS evidence proves limited control, not legal title.
6. With two **independently authenticated** bidder accounts, commit different amounts and download receipts. During bidding, neither account nor a logged-out browser may see the other's amount or identity. Test early and modified reveals, then valid reveals within the window. After finalization, verify the public winning price has no bidder ID/email and losing amounts stay private. An auction with no eligible reveal must read **Unsold** and have no invoice.
7. Confirm the losing bidder and logged-out browser receive denial for the winner checkout and payment receipt. The winner and seller may view authorized settlement details; only the winner sees the receiving address. Do not send TAZ until the separate wallet monitor is compatible and healthy.
8. For wallet acceptance, use a genuinely compatible testnet receiving wallet and funded testnet sender. Verify account ownership, exact integer zatoshis, recipient, three active-chain confirmations, signed worker notification, partial/duplicate protection, and rollback. Record evidence privately. Regtest success alone does not satisfy public-testnet acceptance.

## Release decision

| Gate | Current result |
| --- | --- |
| Judge sandbox, real cryptography, no financial path | GO: production session and local browser journey verified |
| Public final winning price without public identity | GO locally after this change; requires owner deployment and smoke test |
| Production signup and verified email | NO-GO until owner-controlled inbox test |
| Production owned-domain auction and DNS activation | NO-GO until owner-authorized domain test |
| Public testnet payment | NO-GO: pinned Zallet beta.1 cannot parse post-NU7 data; no TAZ or wallet-backed payment observed |
| Mainnet money, escrow, registrar transfer automation | Out of scope; do not claim or use |
