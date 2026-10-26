# Deployment readiness

**2026-10-26 release lock:** Production payments remain disabled. The pending recovery changes reject worker authorization on Vercel or remote targets and hide checkout payment instructions even if a connected heartbeat exists. The isolated server requires loopback `DATABASE_URL` and HTTP `PUBLIC_APP_URL`, `LOCAL_AUTH_BYPASS=true`, `ALLOW_SHORT_AUCTIONS=true`, and testnet/regtest. No environment toggle enables production; removing this lock requires a reviewed source change after a genuine assigned-invoice payment, three confirmations, paid recovery, and production integration review. Preserve `WORKER_SECRET`: it also encrypts existing invoice tokens.

The Next.js application builds for Vercel. The configured local Neon `shadowbid` connection was migrated and verified. After a fresh deployment, the public homepage, marketplace, roadmap, login, and auctions API passed a route smoke check. The Production `DATABASE_URL` value and authenticated flows still require owner inspection before declaring the deployment fully ready.

1. In Neon, copy the **pooled** connection string into Vercel `DATABASE_URL` and a private local migration environment. Never paste it into chat or Git. Run `npm ci`, then `npm run db:check` to display the database target and missing schema without credentials. Run `npm run db:migrate` only after confirming that target. The migration command loads `.env.local` through Next's environment loader, applies the checked-in Drizzle migrations, and checks the resulting tables and columns. Migrations 0006 and 0007 must be present for judge practice and seller CSV staging.
2. Set Vercel server variables `DATABASE_URL`, `WORKER_SECRET` (random, at least 32 characters), `ZCASH_NETWORK=testnet`, `EMAIL_VERIFICATION_MODE=resend`, `RESEND_API_KEY`, `EMAIL_FROM` (a verified sender), and `PUBLIC_APP_URL` (the HTTPS site origin). Configure these before opening registration. Use the same `WORKER_SECRET` on the wallet worker. Rotation of that secret requires a checkout-token migration plan.
3. Do not set `ALLOW_SHORT_AUCTIONS`, `TEST_USER_SEED_ENABLED`, `LOCAL_AUTH_BYPASS`, wallet RPC credentials, or regtest variables in Vercel production. The Demo Market is static and `npm run seed:samples` performs no database write. The test-user seed rejects production mode and requires a loopback PostgreSQL URL. Legacy `sample=true` auction rows are preserved but excluded from the public real-auction query.
4. Deploy the repository to Vercel only after owner approval. Build command: `npm run build`. There is no long-running wallet daemon in Vercel. In Vercel Project Settings, verify `DATABASE_URL` is assigned to the **Production** environment of the ShadowBid project and points to the same Neon branch migrated above. Redeploy after adding or changing environment variables; existing deployments retain their earlier variable snapshot. Inspect Vercel Function Logs for any remaining server error rather than relying on an HTTP 200 alone, because a streamed Next.js response may include an error after headers are sent.
5. On an always-on trusted host, configure testnet Zebra and a **verified post-NU7-compatible receiving wallet**, set `SHADOWBID_APP_URL` to the HTTPS site, `WORKER_SECRET`, `ZCASH_NETWORK=testnet`, `ZALLET_RPC_URL`, `ZALLET_RPC_USER`, `ZALLET_RPC_PASSWORD`, and preferably `ZEBRA_RPC_URL` plus Zebra RPC credentials. Keep both RPC ports on loopback; this host's [tracked testnet override](../ops/z3-testnet-loopback.yml) and `.env.testnet` `COMPOSE_FILE` do so without exposing credentials. The separate [regtest override](../ops/z3-regtest-loopback.yml) secures its own RPC and optional management endpoints. The worker can reach the services from the same WSL host. A remote worker needs a private tunnel or secured interface. The worker currently refuses non-loopback app URLs and redirects. Do not start a production supervisor: wallet RPC readiness alone is insufficient; the release lock and invoice-specific evidence gate above must first be satisfied. The pinned Z3 Zallet beta.1 currently fails on post-NU7 transactions; see [the operator record](TESTNET_NU7.md).
6. Smoke test signup email delivery and link redemption, two separate accounts, auction creation, commitment receipt, reveal, finalization, winner-only checkout, worker health, a low-value **public testnet** shielded payment, three confirmations, loser denial, and manual transfer attestations. Confirm sample names never imply ownership.

`WORKER_SECRET` authenticates signed requests and encrypts checkout tokens; losing it blocks token recovery. Do not expose the worker secret or wallet credentials through `NEXT_PUBLIC_` variables. The app remains unsuitable for mainnet funds without a custody, payout, recovery, and independent security review.

## Owner deployment checklist

From `/home/sopski/projects/shadowbid`, with the private local `.env.local` pointing to the intended Neon branch:

```bash
npm ci
npm run db:check
# Run only if required schema is missing and the printed target is correct:
npm run db:migrate
npm run lint
npx tsc --noEmit --incremental false
npm test
npm run build
git status --short
```

The configured pooled Neon target was migrated through 0007. The owner must compare Vercel's Production `DATABASE_URL` assignment to that target **without posting the value**. In Vercel Project Settings → Environment Variables, check the names and Production scope of `DATABASE_URL`, `WORKER_SECRET`, `ZCASH_NETWORK`, `EMAIL_VERIFICATION_MODE`, `RESEND_API_KEY`, `EMAIL_FROM`, and `PUBLIC_APP_URL`. The necessary production values are `ZCASH_NETWORK=testnet` and `EMAIL_VERIFICATION_MODE=resend`; `EMAIL_FROM` must belong to a verified sending domain. The owner reports that these variables and Resend sending DNS are configured; this workspace cannot independently inspect that assignment or prove inbox delivery. If the email provider is absent, production signup intentionally returns 503. Password recovery is not implemented.

### Verify the email-sending domain

1. In [Resend Domains](https://resend.com/domains), add a domain or sending subdomain controlled by the owner. Copy the exact DNS records Resend shows into that domain's authoritative DNS provider. Resend's verification UI checks DKIM and any sending-specific SPF/MX records; add the recommended DMARC record as appropriate. Wait until **sending** is verified in Resend. Do not assume a domain verified only for receiving can send.
2. Create a Resend API key with **sending** permission, scoped to that domain where available. Store it only as Vercel's server-side `RESEND_API_KEY`; never use a `NEXT_PUBLIC_` name. Set `EMAIL_FROM` to an address on the verified sending domain, for example `ShadowBid <verify@your-verified-domain>`. Optionally set `EMAIL_REPLY_TO` to a monitored support mailbox. Set `PUBLIC_APP_URL` to the exact HTTPS production origin with no path.
3. For Gmail Spam reports, inspect a delivered message with **Show original** and record only the SPF, DKIM, and DMARC pass/fail and alignment domains. Compare them with Resend's verified sending domain and the configured `EMAIL_FROM`; check that `EMAIL_REPLY_TO`, if set, is a real monitored mailbox. In authoritative DNS, preserve Zoho MX/TXT records, keep a single SPF policy per hostname, and edit the existing DMARC TXT policy instead of adding a duplicate. Use the exact Resend DKIM and sending records shown for this domain. Start with low-volume expected transactional mail and investigate bounces or complaints; do not use artificial warm-up traffic or domain rotation.
3. Redeploy after changing Production variables. Register a new account using an inbox the owner controls. Check the Resend Emails activity and the mailbox, open the received link, then sign in. Inspect Vercel Function Logs for delivery or redemption errors. An API acceptance response alone does not prove inbox delivery.

The [Resend domain workflow](https://resend.com/changelog/domain-verification-events) reports separate sending/receiving verification and missing DNS records. [Resend API key permissions](https://resend.com/changelog/new-api-key-permissions) allow a sending-only key. No Resend credentials or inbox access were available for a live delivery test in this review.

### Production signup acceptance test

Use a new inbox controlled by the owner. On the deployed `/signup`, register once and confirm the page says to check email; confirm the account has **no session** yet by opening `/dashboard`. Check Resend's message activity and the inbox, then open the verification link. Sign in and confirm `/dashboard`, `/auctions/new`, and the seller dashboard work. Before redeeming the link, correct credentials must receive “Verify your email before signing in.” An invalid or reused link must fail. If Resend rejects a send, signup must show a delivery error and must not silently sign the account in. No live delivery is claimed until the owner performs this test after deployment.

### Bulk seller listing

The authenticated seller dashboard accepts 1–20 CSV rows with `domain,opening_price_zec,bidding_end,reveal_end,description`. Dates must be timezone-aware ISO 8601 strings. Preview validates amounts, names, duplicate rows, and deadlines; a separate authorization checkbox is required to stage the rows. Staged rows stay private. For each domain, create the exact displayed TXT value at `_shadowbid.<domain>` and click **Verify DNS & activate**. Only a successful public DNS response creates a real auction. If the deadline becomes too close, cancel the pending row and import it again with a later close. DNS proves limited control, not legal title.

Manual Owner Auctions also require an authority attestation. They may appear publicly before DNS verification with an unverified badge and may receive sealed commitments, but production payment receiver assignment and checkout instructions stay locked until the seller passes the TXT check. This gate does not prove legal ownership or registrar transfer ability. A disposable loopback regtest database has a narrowly scoped test override for the existing wallet integration test.

Review and commit the changed source, docs, tests, and screenshot artifacts listed by `git status`; do not add `.env.local`, `.env.testnet`, wallet files, chain backups, or credentials. After pushing, wait for Vercel's new deployment and verify:

```bash
curl -fSs https://shadowbid-ashy.vercel.app/ >/dev/null
curl -fSs https://shadowbid-ashy.vercel.app/auctions >/dev/null
curl -fSs https://shadowbid-ashy.vercel.app/roadmap >/dev/null
curl -fSs https://shadowbid-ashy.vercel.app/login >/dev/null
curl -fSs https://shadowbid-ashy.vercel.app/api/auctions
```

Open `/try` and `/auctions` in a browser. The Demo Market should show 12 clearly labeled illustrative names when the real auction count is zero. Test search, `.ai` and `.org` filters, sorting, list/card views, watchlist, the tour, and the Real auctions tab. In `/try`, submit two genuine commitments, download receipts, reveal them within the window, and observe the result. It must never request funds or create an invoice. Then test account signup/email verification, a seller listing, one commitment and reveal, and private checkout with independently authenticated test accounts; only actual wallet evidence may confirm a payment. Staged CSV imports must stay off the public market until DNS TXT verification activates them. A streamed Next.js route can return HTTP 200 while embedding a server error, so inspect visible content and Vercel Function Logs as well as status codes. No demo entry should appear in `/api/auctions` or accept a commitment.
