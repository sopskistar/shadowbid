# Testing

Use an isolated PostgreSQL 16 database. Set `DATABASE_URL`, `WORKER_SECRET` (32+ characters), `ALLOW_SHORT_AUCTIONS=true`, `LOCAL_AUTH_BYPASS=true` when using `next start` locally, and `ZCASH_NETWORK=testnet`, and a loopback HTTP `PUBLIC_APP_URL`. Apply migrations with `npm run db:migrate`. The Demo Market is static and needs no database seed. Browser tests now require `E2E_ISOLATED_DB=true` **and** loopback PostgreSQL/app URLs; otherwise they refuse database writes. Never point protocol tests or test-user seeding at production Neon.

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

## Invoice experiment continuation (2026-10-26)

Latest continuation: ESLint, TypeScript, **21/21** Vitest tests, **15/15** Python observer tests, **15/15** Playwright tests with `--workers=1`, and the production build passed. The initial parallel Playwright run had one signup timeout; the full sequential rerun passed. Use `npm run test:e2e -- --workers=1` on this host while wallet services are running.

Run observer regressions with `python3 -m unittest discover -s tests -p 'test_receiver_monitor.py' -v`. The [isolated invoice experiment](INVOICE_EXPERIMENT.md) documents actual receiver checkout, restart recovery, persistent replay denial, and the separate loopback databases. Payment-policy fixtures remain synthetic. The genuine 1 TAZ faucet note remains verifiable, but neither assigned invoice has received a matched payment; production payment monitoring stays disabled.

## DNS retry and account navigation (2026-10-26)

The approved invoice checkpoint was committed as `f16a87f` and its Vercel deployment succeeded. A before/after read-only comparison retained all eight current public auctions, their deadlines and DNS timestamps, and all eight public commitments (including the original five listings). Production worker health remained `unconfigured`. Both isolated invoices still had zero paid zatoshis and zero payment notes.

The following UX changes passed ESLint, TypeScript, **21/21** Vitest tests, **15/15** Python observer tests, the production build, and **18/18** Playwright tests with one worker. The browser suite runs only against the disposable loopback database, not the invoice experiment or production database.

`tests/e2e/ux-controls.spec.ts` covers desktop and mobile DNS retry, loading/disabled state, exact hostname and TXT clipboard values, actual authenticated lookup failure for a reserved `.example` domain, and simulated missing-record, network, malformed-response, unsuccessful HTTP-200, and expired-session responses. Failed attempts leave both the stored and visible DNS state unverified; the retry button remains usable and no document navigation occurs. A simulated successful response updates only a disposable fixture and refreshes the server-rendered badge without a page reload. A legacy missing challenge cannot be copied or submitted as an empty verification value. No real nameservers or DNS records are modified by these tests.

Navigation checks cover at least 15 pixels between desktop account controls at widths 1440, 1024, and 920, mobile width 390 without horizontal overflow, all three account destinations, and session invalidation after sign-out. Desktop and mobile DNS/navigation screenshots are captured in the corresponding ignored `test-results/ux-controls-*` directories and inspected locally. They show synthetic local fixtures, not production account data or genuine DNS-verification evidence.

Public-testnet invoice settlement remains unverified. The faucet receipt, synthetic tests, successful website deployments, and DNS UI fixes do not establish invoice-specific payment settlement. Keep the production worker disabled until a genuine assigned-receiver payment and its confirmation/recovery checks pass.

## Recovered final build review (2026-10-26)

The previous session's 18-test browser run has a preserved passing result. Recovery confirmed local and GitHub `main` both at `f16a87f`, with a successful Vercel deployment for that commit; the UX edits remained uncommitted and absent from live styles. The current production comparison found the same eight auctions and commitments, with one additional DNS verification (`leadatlas.xyz`); do not treat the historical before/after comparison above as the latest production state.

The pending recovery changes also reject missing DNS challenges on the server and test authenticated non-owner denial. Worker requests now require an explicit local experiment configuration. Production/Vercel requests are rejected before replay-nonce writes, and checkout instructions stay hidden even with a fresh heartbeat. The Zallet worker refuses remote app URLs and redirects. No migration, production secret rotation, or wallet reconfiguration is needed. Full current validation results are recorded in [RECOVERY_REVIEW.md](RECOVERY_REVIEW.md).

Final recovery validation: ESLint, TypeScript, **33/33** Vitest, **15/15** Python observer tests, **18/18** Playwright (2.8 minutes, one worker), and the production build passed. Sandbox-only browser/socket and build subprocess failures passed on permitted reruns. Desktop/mobile UX screenshots were visually inspected; regenerated tracked screenshots were preserved outside Git and originals restored. No new chain-payment evidence was produced.
