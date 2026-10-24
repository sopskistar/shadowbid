# Testing

Use an isolated PostgreSQL 16 database. Set `DATABASE_URL`, `WORKER_SECRET` (32+ characters), `ALLOW_SHORT_AUCTIONS=true`, `LOCAL_AUTH_BYPASS=true` when using `next start` locally, and `ZCASH_NETWORK=testnet`. Apply migrations with `npm run db:migrate`. The Demo Domain Catalog is static and needs no database seed. Never point protocol tests or test-user seeding at production Neon.

Run:

```bash
npx tsc --noEmit
npm test
npm run build
# Start the app, then:
npm run test:e2e
```

Playwright accepts `PLAYWRIGHT_BASE_URL` and `PLAYWRIGHT_CHROMIUM_EXECUTABLE` when ports or browser paths differ. The browser suite covers homepage, tours, responsive navigation, auction creation, marketplace search/filters/list, commitment receipt and reveal, two-account winner selection, unauthorized checkout, HMAC replay denial, simulated partial/full payment, manual transfer, and authentication throttling. Protocol tests adjust deadlines only in the disposable database to avoid waiting through each phase.

The real regtest check uses Z3 and `scripts/regtest-e2e.ts`; it refuses non-loopback endpoints and requires `REGTEST_E2E_ENABLED=true`. It produced a real wallet-recognized shielded receiver note and a three-confirmation ShadowBid invoice. The sender was a transparent coinbase UTXO, so it overpaid the invoice; this is not a fully shielded payment or a public testnet proof. See [integration status](INTEGRATION_STATUS.md).

Latest local checks (2026-10-24): Vitest **15/15**, Playwright **6/6**, ESLint, standalone TypeScript, and the Next.js production build passed. The first Playwright run found that the hero illustration intercepted tour controls; the tour was moved into a document-level portal and the complete six-test suite passed against the rebuilt app. The browser protocol tests used an isolated PostgreSQL 16 database and local email-verification bypass. Screenshots were visually inspected at desktop, tablet, and mobile widths: `screenshots/home-desktop.png`, `home-tablet.png`, `home-mobile.png`, `marketplace-desktop.png`, `marketplace-mobile.png`, and `auction-desktop.png`. Demo listings are static and cannot issue invoices; create an actual seller auction for the bid/reveal flow.
