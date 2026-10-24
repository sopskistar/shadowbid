# Deployment readiness

The Next.js application builds for Vercel. The configured local Neon `shadowbid` connection was migrated and verified. After a fresh deployment, the public homepage, marketplace, roadmap, login, and auctions API passed a route smoke check. The Production `DATABASE_URL` value and authenticated flows still require owner inspection before declaring the deployment fully ready.

1. In Neon, copy the **pooled** connection string into Vercel `DATABASE_URL` and a private local migration environment. Never paste it into chat or Git. Run `npm ci`, then `npm run db:check` to display the database target and missing schema without credentials. Run `npm run db:migrate` only after confirming that target. The migration command loads `.env.local` through Next's environment loader, applies the checked-in Drizzle migrations, and checks the resulting tables and columns. Migration 0005 must be present.
2. Set Vercel server variables `DATABASE_URL`, `WORKER_SECRET` (random, at least 32 characters), `ZCASH_NETWORK=testnet`, `EMAIL_VERIFICATION_MODE=resend`, `RESEND_API_KEY`, `EMAIL_FROM` (a verified sender), and `PUBLIC_APP_URL` (the HTTPS site origin). Configure these before opening registration. Use the same `WORKER_SECRET` on the wallet worker. Rotation of that secret requires a checkout-token migration plan.
3. Do not set `ALLOW_SHORT_AUCTIONS`, `TEST_USER_SEED_ENABLED`, `LOCAL_AUTH_BYPASS`, wallet RPC credentials, or regtest variables in Vercel production. The Demo Domain Catalog is static and `npm run seed:samples` performs no database write. The test-user seed rejects production mode and requires a loopback PostgreSQL URL. Legacy `sample=true` auction rows are preserved but excluded from the public real-auction query.
4. Deploy the repository to Vercel only after owner approval. Build command: `npm run build`. There is no long-running wallet daemon in Vercel. In Vercel Project Settings, verify `DATABASE_URL` is assigned to the **Production** environment of the ShadowBid project and points to the same Neon branch migrated above. Redeploy after adding or changing environment variables; existing deployments retain their earlier variable snapshot. Inspect Vercel Function Logs for any remaining server error rather than relying on an HTTP 200 alone, because a streamed Next.js response may include an error after headers are sent.
5. On an always-on trusted host, configure testnet Zebra/Zallet, set `SHADOWBID_APP_URL` to the HTTPS site, `WORKER_SECRET`, `ZCASH_NETWORK=testnet`, `ZALLET_RPC_URL`, `ZALLET_RPC_USER`, `ZALLET_RPC_PASSWORD`, and preferably `ZEBRA_RPC_URL` plus Zebra RPC credentials. Keep both RPC ports on loopback. Run `npm run worker` under a supervisor.
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

The local pooled Neon target was already migrated through 0005. The owner must compare Vercel's Production `DATABASE_URL` assignment to that target **without posting the value**. In Vercel Project Settings → Environment Variables, check the names and Production scope of `DATABASE_URL`, `WORKER_SECRET`, `ZCASH_NETWORK`, `EMAIL_VERIFICATION_MODE`, `RESEND_API_KEY`, `EMAIL_FROM`, and `PUBLIC_APP_URL`. The necessary production values are `ZCASH_NETWORK=testnet` and `EMAIL_VERIFICATION_MODE=resend`; `EMAIL_FROM` must belong to a verified sending domain. No Vercel configuration access is available in this workspace, so the presence of `WORKER_SECRET` and the email variables is **not confirmed**. If the email provider is absent, production signup intentionally returns 503; do not claim email verification works. Password recovery is not implemented.

Review and commit the changed source, docs, tests, and screenshot artifacts listed by `git status`; do not add `.env.local`, `.env.testnet`, wallet files, chain backups, or credentials. After pushing, wait for Vercel's new deployment and verify:

```bash
curl -fSs https://shadowbid-ashy.vercel.app/ >/dev/null
curl -fSs https://shadowbid-ashy.vercel.app/auctions >/dev/null
curl -fSs https://shadowbid-ashy.vercel.app/roadmap >/dev/null
curl -fSs https://shadowbid-ashy.vercel.app/login >/dev/null
curl -fSs https://shadowbid-ashy.vercel.app/api/auctions
```

Open `/auctions` in a browser: the Demo Domain Catalog should show 12 clearly labeled examples even when the real auction count is zero. Test search, `.ai` and `.org` filters, sorting, card/list views, the tour, and the Real auctions tab. Then test account signup/email verification, a seller listing, one commitment and reveal, and private checkout with test accounts; only actual wallet evidence may confirm a payment. A Next.js streamed route can return HTTP 200 while embedding a server error, so inspect visible content and Vercel Function Logs as well as status codes. No demo entry should appear in `/api/auctions` or accept a commitment.
