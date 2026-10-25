# Testing

Use an isolated PostgreSQL 16 database. Set `DATABASE_URL`, `WORKER_SECRET` (32+ characters), `ALLOW_SHORT_AUCTIONS=true`, `LOCAL_AUTH_BYPASS=true` when using `next start` locally, and `ZCASH_NETWORK=testnet`. Apply migrations with `npm run db:migrate`. The Demo Market is static and needs no database seed. Browser tests now require `E2E_ISOLATED_DB=true` **and** loopback PostgreSQL/app URLs; otherwise they refuse database writes. Never point protocol tests or test-user seeding at production Neon.

Run:

```bash
npx tsc --noEmit
npm test
npm run build
# Start the app, then:
E2E_ISOLATED_DB=true npm run test:e2e
```

Playwright accepts `PLAYWRIGHT_BASE_URL` and `PLAYWRIGHT_CHROMIUM_EXECUTABLE` when ports or browser paths differ. The browser suite covers homepage, tours, responsive navigation, auction creation, marketplace search/filters/list, commitment receipt and reveal, two-account winner selection, unauthorized checkout, HMAC replay denial, simulated partial/full payment, manual transfer, and authentication throttling. It also tests the isolated two-role practice flow, tampered/early/late reveals, no practice invoice, and CSV staging without publishing an unverified domain. Protocol tests adjust deadlines only in the disposable database to avoid waiting through each phase.

The real regtest check uses Z3 and `scripts/regtest-e2e.ts`; it refuses non-loopback endpoints and requires `REGTEST_E2E_ENABLED=true`. It produced a real wallet-recognized shielded receiver note and a three-confirmation ShadowBid invoice. The sender was a transparent coinbase UTXO, so it overpaid the invoice; this is not a fully shielded payment or a public testnet proof. See [integration status](INTEGRATION_STATUS.md).

Latest isolated checks (2026-10-25): Vitest **20/20**, Playwright **12/12**, ESLint, TypeScript, and a production build passed. Browser coverage includes public winning-price projection without bidder identity, unsold finalization, seller authority attestation, DNS-gated payment assignment, private response headers, inventory previews, and the existing confidential auction and judge flows. The browser suite used a disposable PostgreSQL 16 container and a loopback-only local auth bypass. Reviewed screenshots at 1440px desktop, 768px tablet, and 390px mobile widths include `screenshots/marketplace-*.png`, `screenshots/dropping-soon-mobile.png`, and `screenshots/pre-release-desktop.png`; mobile tests check horizontal overflow. The local test signup bypass is **never** valid with a Neon URL or in Vercel. Production Resend delivery and a public-testnet Zcash payment still require external verification.
