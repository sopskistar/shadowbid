# Deployment readiness

The Next.js application builds for Vercel. Neon `shadowbid` credentials were not available here, so the deployed database remains unconnected. No deployment or Git push was performed.

1. In Neon, copy the **pooled** connection string into Vercel `DATABASE_URL` and a private local migration environment. Never paste it into chat or Git. Run `npm ci` and `npm run db:migrate` against Neon. Check migration 0005 is present.
2. Set Vercel server variables `DATABASE_URL`, `WORKER_SECRET` (random, at least 32 characters), `ZCASH_NETWORK=testnet`, `EMAIL_VERIFICATION_MODE=resend`, `RESEND_API_KEY`, `EMAIL_FROM` (a verified sender), and `PUBLIC_APP_URL` (the HTTPS site origin). Configure these before opening registration. Use the same `WORKER_SECRET` on the wallet worker. Rotation of that secret requires a checkout-token migration plan.
3. Do not set `ALLOW_SHORT_AUCTIONS`, `SAMPLE_SEED_ENABLED`, `TEST_USER_SEED_ENABLED`, `LOCAL_AUTH_BYPASS`, wallet RPC credentials, or regtest variables in Vercel production. The sample and test-user scripts reject `VERCEL_ENV=production` or `NODE_ENV=production` and require a loopback PostgreSQL URL.
4. Deploy the repository to Vercel only after owner approval. Build command: `npm run build`. There is no long-running wallet daemon in Vercel.
5. On an always-on trusted host, configure testnet Zebra/Zallet, set `SHADOWBID_APP_URL` to the HTTPS site, `WORKER_SECRET`, `ZCASH_NETWORK=testnet`, `ZALLET_RPC_URL`, `ZALLET_RPC_USER`, `ZALLET_RPC_PASSWORD`, and preferably `ZEBRA_RPC_URL` plus Zebra RPC credentials. Keep both RPC ports on loopback. Run `npm run worker` under a supervisor.
6. Smoke test signup email delivery and link redemption, two separate accounts, auction creation, commitment receipt, reveal, finalization, winner-only checkout, worker health, a low-value **public testnet** shielded payment, three confirmations, loser denial, and manual transfer attestations. Confirm sample names never imply ownership.

`WORKER_SECRET` authenticates signed requests and encrypts checkout tokens; losing it blocks token recovery. Do not expose the worker secret or wallet credentials through `NEXT_PUBLIC_` variables. The app remains unsuitable for mainnet funds without a custody, payout, recovery, and independent security review.
