# Judge practice auction

Open `/try` from the homepage or marketplace. The reserved `private-auction.example` name is educational and is never offered for sale. Each visitor gets a random HttpOnly cookie bound to one `judge_sessions` row. `judge_bids` stores the real versioned SHA-256 commitments, trusted database timestamps, and privately revealed exact zatoshis. Neither table joins customer accounts, real auctions, or invoices. The practice route never creates a shielded address, ZIP-321 request, or payment event.

The visitor controls both Bidder A and Bidder B. This teaches the protocol but does not prove privacy against that same person. For independent-person privacy and real checkout authorization, use separate authenticated accounts on a seller-created auction.

## Reproduce

1. Start a practice auction. The database sets a two-minute bidding deadline and a four-minute reveal deadline.
2. Submit one offer as A and one as B. Each browser commitment uses a fresh 32-byte secret. Save **both** downloaded JSON receipts.
3. Try to upload a receipt before bidding closes; the server rejects it. During reveal, change the amount or secret in a copy of a receipt; the original hash must not match.
4. Upload the untouched receipts during the reveal window. Reloading `/try` on the same tab resumes the current session; the secret itself is never stored by ShadowBid.
5. After reveal closes, the shared winner rule chooses the highest eligible amount. Ties use the earlier trusted commitment timestamp, then bid ID. The outcome shows a clearly labeled checkout explanation with **no payment request**.

The browser suite time-shifts **only the isolated test session row** in its disposable PostgreSQL database to test the full flow quickly. Production has no time-shift endpoint. Late and duplicate reveals are rejected by database-time conditions. A second browser without the private cookie receives 404 for the session and cannot submit a bid. Sessions expire after 30 minutes and expired rows are purged in bounded batches when new practice sessions start. New sessions are limited to three per 15 minutes per HMAC-hashed client network identifier. On Vercel that identifier comes from its `x-vercel-forwarded-for` header; no raw IP is stored.

The practice flow depends on `WORKER_SECRET` for the rate-limit HMAC and the additive Drizzle migration `0006`. Do not configure a fake payment callback or put practice bids into the customer auction tables.
