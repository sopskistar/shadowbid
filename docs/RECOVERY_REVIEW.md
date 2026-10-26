# Recovery and release review — 2026-10-26

This document records the pre-release recovery snapshot. No commit, push, deployment, submission, production database write, wallet reconfiguration, or Docker restart was performed during that review. The owner subsequently approved committing, pushing, and deploying the reviewed changes. The approved deployment was verified as recorded below; historical references to pending files describe the pre-release review snapshot.

## Recovered state

- Working directory: `/home/sopski/projects/shadowbid`; existing checkout retained.
- Local HEAD and live GitHub `main`: `f16a87f0efd1febd995e4f316f5e39a3056f2e27`.
- GitHub's Vercel status for that commit is successful: [deployment record](https://vercel.com/sopskistars-projects/shadowbid/ETFyTcSR5ELSnueEm94bpzZAJ2TA).
- On entry, nothing was staged. Four tracked files were modified: `docs/TESTING.md`, `src/app/auctions/[id]/page.tsx`, `src/app/globals.css`, and `src/components/VerifyDns.tsx`. `tests/e2e/ux-controls.spec.ts` was untracked. Original copies were preserved locally before further edits.
- The previous session completed task A: invoice receiver source, patch, tests, and evidence were committed and pushed. It also deployed that checkpoint. Its invoice report's old “uncommitted” inventory is now explicitly historical.
- Tasks B and C were implemented locally: repeatable DNS verification, copy controls, loading/errors, and desktop account spacing/mobile navigation. The saved Playwright result was passed and its testing notes recorded 18 passing tests. Live production styles do not include these UX fixes.
- Task D was partly complete: the checkpoint was deployed, but the subsequent UX changes were not committed, pushed, or deployed.

## Completion in this recovery

Preserved the existing UX implementation. Added explicit server rejection for a missing DNS challenge and browser checks that another authenticated account cannot verify the seller's listing.

Added a production payment release lock. Worker authorization requires an explicitly configured local testnet/regtest experiment: loopback PostgreSQL and HTTP app URLs, local authentication bypass and short-auction flags, and no Vercel environment. Production requests fail before nonce writes even with valid HMAC credentials. Checkout hides payment instructions regardless of an old connected heartbeat. Worker health reports `disabled` outside the allowed local configuration. The Zallet sender refuses remote app targets and API redirects. Production enablement requires a reviewed code change after genuine invoice payment and paid recovery evidence, plus review of the production wallet integration.

This lock preserves the existing `WORKER_SECRET`, invoice token encryption, data, and independent auction finalization. There is no schema migration. It intentionally blocks every worker-authenticated route in production, including automated worker finalization; ordinary authorized auction finalization remains available.

## Validation

| Check | Recovery result |
| --- | --- |
| ESLint | Passed |
| TypeScript (`tsc --noEmit --incremental false`) | Passed |
| Vitest | 33/33 passed |
| Python receiver/observer tests | 15/15 passed |
| Production build | Passed, using isolated local test configuration |
| Playwright | 18/18 passed in 2.8 minutes; one worker, Chromium |
| Test database schema | Existing `shadowbid_test` schema complete; no migrations run |
| Secret review | No credential/key/private-artifact/personal-email findings in the checkpoint and pending file scan; no staged files |

The sandbox build could not read TypeScript subprocess output; a permitted build passed. The sandbox browser run failed because Chromium sockets and loopback database connections were denied. Those infrastructure failures are not passing tests. Vitest also prints an advisory about a future Vite config-loader default; it does not fail validation.

Browser tests use only `shadowbid_test` at loopback port 55434 and the local app at port 3102, with one worker. Invoice-payment fixtures and simulated successful DNS responses remain synthetic. The separate real receiver experiment at port 55435 receives no synthetic observations. Browser screenshots/traces remain local; regenerated screenshot copies were retained outside Git and the original tracked screenshots restored from pre-run copies. Desktop and mobile DNS/navigation screenshots were visually inspected. Navigation tests check at least 15 pixels between desktop account controls at 1440, 1024, and 920 pixels, plus a usable 390-pixel mobile menu with no horizontal overflow.

## Production and wallet preservation

Read-only public requests found eight auctions, six DNS-verified listings, and all eight prior public commitments. All original auction deadlines and commitment records remain present. The only field change from the previous session's snapshot is `leadatlas.xyz` gaining a DNS verification timestamp (`2026-10-26T11:05:12.936Z`). It was already changed when this recovery read production; this session did not write it. The original five DNS-verified domains remain present.

Production worker health is `unconfigured`, with no heartbeat. `/`, `/signup`, `/try`, and `/auctions` returned HTTP 200. The pending code lock will change the production health result to `disabled` once approved and deployed. Authenticated production flows and private production records were not re-audited.

Zebra 7.0.0 public testnet was healthy. The NU7 receiver scanner, invoice database, disposable test database, and existing regtest services were running. The old incompatible public-testnet Zallet service was already stopped. No service, wallet, volume, or blockchain state was removed or restarted.

All eight entries in the previous session's preservation manifest still match, including receiver associations, four wallet backups, fixture, and account artifacts. The recovery's additional private configuration/artifact hash checks also match. The active scanner can continue updating its own wallet and observation state; no live-wallet byte-for-byte immutability is claimed.

A read-only transaction against the preserved invoice experiment found:

| Invoice amount (zatoshis) | Status | Paid zatoshis | Payment-note rows |
| --- | --- | --- | --- |
| 1,000,000 | awaiting | 0 | 0 |
| 2,000,000 | awaiting | 0 | 0 |

The genuine 1 TAZ faucet receipt remains prior shielded-receiving evidence. This recovery did not run a new wallet scan, request faucet funds, or send any transaction. Neither assigned invoice has demonstrated genuine payment, three-confirmation settlement, or recovery of paid state. The previously demonstrated restart preserves receiver associations and **unpaid** state only.

## Pending file inventory

Modified tracked files:

```text
docs/DEMO_EVIDENCE.md
docs/DEPLOYMENT.md
docs/GO_NO_GO.md
docs/INVOICE_EXPERIMENT.md
docs/TESTING.md
src/app/api/auctions/[id]/verify-dns/route.ts
src/app/api/worker/health/route.ts
src/app/auctions/[id]/page.tsx
src/app/checkout/[token]/page.tsx
src/app/globals.css
src/components/VerifyDns.tsx
src/lib/worker-auth.ts
worker/zallet.ts
```

New files:

```text
docs/RECOVERY_REVIEW.md
src/lib/payment-worker-policy.ts
tests/e2e/ux-controls.spec.ts
tests/payment-worker-policy.test.ts
```

No files are staged. Private environment files, wallets, keys, receipts, observations, backups, temporary runners, and regenerated screenshots are excluded from the proposed commit.

## Release and submission decision

All applicable checks passed. After owner approval, the above source, tests, and accurate documentation form the proposed safe release. No production worker configuration or secret changes accompany it. After deployment, verify public routes, `state: disabled` worker health, and authenticated DNS/navigation behavior on desktop and mobile.

There is no demonstrated build blocker to an honestly scoped Private Markets submission by the owner-supplied deadline, October 28, 2026, 23:59 UTC. Approval, final deployment verification, and submission preparation remain. A genuine completed production auction/final-price demonstration is still outstanding in the evidence record. A submission must explicitly disclose that public-testnet invoice-specific settlement and paid recovery are unproven, payments remain disabled, and registrar transfer is manual. This review does not independently verify hackathon eligibility or submission acceptance.

## Approved release outcome

The owner approved the reviewed release. Implementation commit `4c4b5510b5c2ccd519058afd9bc256b6e1a3d88a` was committed and pushed to `main`; [Vercel completed its deployment](https://vercel.com/sopskistars-projects/shadowbid/89uzsLrepTi7magP2uDTbF1UC3pn). Post-deployment public checks passed for the homepage, signup, judge sandbox, auctions, login, and roadmap. Live styles contain both UX fixes. Production worker health reports **disabled**, with no heartbeat. The before/after snapshot retained all eight auctions, their deadlines and DNS timestamps, and eight public commitments with no changes.

The staged 17-file release passed another secret scan, and both eight-entry preservation manifests matched before commit. There were no migrations, wallet changes, secret rotations, payment-worker starts, or production data writes. Authenticated flows were validated locally; no production account was used. Submission and genuine invoice-specific settlement/paid recovery remain outstanding. This follow-up documentation records the successful implementation release; it changes no application behavior.
