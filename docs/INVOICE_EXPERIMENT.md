# Isolated invoice experiment — 2026-10-26

**Invoice-specific public-testnet settlement is not verified. Keep the production payment worker disabled.** The two persistent local invoices have real wallet-derived receivers, but neither has a matched payment. Synthetic payment tests do not change that conclusion.

## State inherited from the previous session

- A genuine 100,000,000-zatoshi (1 TAZ) Ironwood faucet note, transaction `183df88acced845220e0394bd90937ffc4ee4c36f518f6ee876f15f26be6d03d`, output 0, block 4,541,930.
- The [pinned Zingolib patch](../patches/zingolib-invoice-recipient.patch), compiled adapter, protected receiver wallet, and private observation log.
- Two invoices for 1,000,000 and 2,000,000 zatoshis in `shadowbid_invoice_experiment` on loopback PostgreSQL port 55435. Their reserved `.example` domains and DNS timestamps are local fixtures, not genuine domain-control evidence.
- Distinct wallet receivers at address indexes 2 and 3, persistent invoice associations, and four before/after wallet backups. No receivers or wallets were regenerated in this continuation.
- Observer, preparation, checkout, and synthetic regression scripts in progress.

## Verification in this continuation

The existing faucet note was decrypted again with the hash-pinned adapter. Its recipient matched the original wallet receiver, and Zebra independently placed its transaction in the active block. At tip **4,543,682**, it had **1,753 confirmations**; the wallet was at 4,543,681. Four recorded addresses and one note were present. The note belongs to neither invoice receiver. Fresh observations reconciled **both invoices to `awaiting`, zero detected and zero confirmed zatoshis**.

The source patch matches the existing patched Zingolib source: reverse application in dry-run mode succeeded. The installed adapter's SHA-256 matched the protected experiment configuration. The Rust check and release build were inherited from the previous session, not rerun in this continuation.

The final observation at **2026-10-26 10:32:36 UTC**, tip **4,543,713**, still contained only that faucet note, now with **1,784 confirmations**. The post-restart browser checkout check passed when run immediately after a fresh observation. A final direct query of the experiment database confirmed both invoices were `awaiting`, each with zero paid zatoshis and zero payment-note rows.

| Check | Result and scope |
| --- | --- |
| ESLint and TypeScript | Passed |
| Vitest | 21/21 passed |
| Python observer tests | 15/15 passed; synthetic exact amounts, receiver separation within one transaction, unknown recipients, duplicates, unsupported pools, scope, stale snapshots, forged confirmations, rollback, and durable assignment recovery |
| Playwright | 15/15 passed with one worker against the existing disposable `shadowbid_test` database on loopback port 55434, app port 3102 |
| Production build | Passed with the isolated experiment environment. The sandbox attempt failed reading TypeScript subprocess output; the permitted retry outside the sandbox passed |
| Actual receiver checkout | Passed for both real wallet receivers: winner-only instructions, seller/stranger restrictions, ZIP-321 link and QR image, exact copied amount/address/link, unpaid receipt and transfer denial, session reload and sign-out. QR image presence was checked; independent QR decoding was not performed |
| Process restart | Local app stopped and restarted with the same configuration; observer rerun as a fresh process. Both persisted receiver associations remained unchanged and both invoices remained unpaid |
| Authorization after restart | A previously accepted nonce, signed again with a fresh timestamp after app restart, was rejected (401); a fresh nonce was accepted. Replay protection persisted in PostgreSQL |
| Preservation | Both association files, four wallet backups, fixture file, and account file retained their original SHA-256 hashes. Zebra and database volumes were retained; the receiver scanner resumed after wallet snapshots |

The first four-worker Playwright run passed 14/15 tests: signup navigation exceeded its five-second assertion timeout while still processing. The complete sequential rerun passed without changing that test. Initial checkout attempts failed with one-shot monitoring, including an expired heartbeat after restart; the check passed under continuous monitoring and again when run immediately after observation. These failures are recorded rather than counted as passes.

Synthetic worker tests exercise partial payments, two versus three confirmations, excess amounts, duplicate snapshots, conflicting amounts, cross-invoice output reuse, missing/tampered/stale HMAC authorization, nonce replay, and reorg rollback. They run in a different database from the real receiver experiment. No synthetic note was submitted to either real receiver invoice.

## Continue from the preserved state

Private configuration and credentials remain under `.env.invoice-experiment/`; wallet state, bindings, backups, adapter binary, and observations remain under `.env.nu7-receiver/`. Both trees are gitignored. Directories are mode 700 and private files mode 600; the adapter is executable mode 700. Never commit these artifacts or print credentials, memos, reveal secrets, or checkout tokens.

The wrapper validates the loopback experiment target and supplies its private environment:

```bash
python3 scripts/run-invoice-experiment.py build
python3 scripts/run-invoice-experiment.py serve
# Separate terminal; reuses and checks existing fixture IDs:
python3 scripts/run-invoice-experiment.py prepare
python3 scripts/run-invoice-experiment.py observe
# For fresh heartbeats throughout interactive checkout:
python3 scripts/run-invoice-experiment.py watch
# Separate terminal, with the local Chromium path if needed:
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/path/to/chrome python3 scripts/run-invoice-experiment.py checkout
python3 -m unittest discover -s tests -p 'test_receiver_monitor.py' -v
```

`prepare` preserves an existing fixture; it must not be used to replace lost private associations. The observer intentionally supports Ironwood invoice notes only and fails closed for unsupported pools. The wallet scanner and observer serialize access; each snapshot briefly stops the scanner, copies the saved wallet into a private temporary directory, then resumes scanning before offline inspection. The whole assigned invoice set is reconciled before publishing a connected heartbeat. Without fresh monitoring, checkout hides payment instructions.

## Remaining gate and release scope

A genuine payment to an assigned invoice receiver must still be sent from a functioning public-testnet source and observed through its decrypted recipient, exact integer-zatoshi value, and at least three active-chain confirmations. Its matching invoice must transition while the other invoice stays unaffected, and the paid state must survive restart. This continuation sent no transaction and made no faucet request. A cached sender balance or user-supplied transaction ID is insufficient evidence.

No production database connection or mutation, auction deadline change, commitment change, wallet regeneration, volume deletion, production worker enablement, commit, push, or deployment was performed. The five real auctions and their commitments were outside the test targets. Production records were not independently re-audited in this pass.

The source scripts, patch, tests, checkout copy improvement, ignore rules, and honest evidence documentation are suitable for review and a source commit after owner approval. The checkout UI improvement and documentation can be deployed after approval while the payment worker remains disabled. The loopback-only experiment scripts are not a production Zingolib worker; production activation requires the genuine invoice-payment gate and a separately reviewed production integration. Private artifacts, binaries, and regenerated test screenshots are excluded.

## Uncommitted file inventory

Eight modified tracked files:

```text
.gitignore
README.md
docs/DEMO_EVIDENCE.md
docs/INTEGRATION_STATUS.md
docs/TESTING.md
scripts/receiver-observe.py
src/app/checkout/[token]/page.tsx
src/components/CheckoutActions.tsx
```

Nine new files:

```text
docs/INVOICE_EXPERIMENT.md
docs/ZINGOLIB_INVOICE_ADAPTER.md
patches/zingolib-invoice-recipient.patch
scripts/check-receiver-checkout.mjs
scripts/prepare-receiver-invoices.ts
scripts/receiver-invoices.py
scripts/run-invoice-experiment.py
tests/e2e/payment-policy.spec.ts
tests/test_receiver_monitor.py
```
