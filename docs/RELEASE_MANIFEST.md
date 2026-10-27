# Final release manifest — October 27, 2026

**Reviewed for the owner-authorized GitHub main and Vercel release. Production payment collection remains disabled.**

Base: `main` at `f56faf9ef6b7d2ac80e6f9243abbec2a5b3b78d7`.

The proposed source release contains **235 files: 41 modified tracked files and 194 untracked files**, including **139 binary assets**. The [machine-readable manifest](RELEASE_MANIFEST.json) lists every path, byte size and SHA-256. Its own entry intentionally has no self-hash. Do not use a blanket `git add .` without comparing the final candidate set to that list.

## Reviewed commit contents

- Existing inherited homepage/brand copy and screenshot updates; corrected local payment disclosures on homepage, FAQ, roadmap, docs, practice result and checkout.
- Checkout Paid/confirmation display and refresh; hidden repeat-payment instructions; reorg-safe note reconciliation and receipts; numeric validation and production lock clarification.
- Receiver batching/filtering, exact invoice acceptance and private failure diagnostics; prior guarded payment/preflight/prover sources and their tests. These scripts are preserved code, **not instructions or authorization to run payment/proof commands again**.
- Pinned Rust input-pool patch and the already tracked recipient patch; Python and browser regression coverage. No compiled wallet or wallet database.
- README, real payment proof/recheck, historical recovery records, judge walkthrough, worker hosting/service templates, escrow evaluation and 1,854-character submission packet with the final YouTube link.
- Existing Remotion project, lockfile, fonts/licenses, narration, original score, sanitized UI captures, revised captions and narrow checkout-framing fix. Prior sources remain preserved.
- `.gitignore`, `.vercelignore`, `vercel.json`, and app TypeScript/ESLint exclusions for the separate film project.

Suggested commit title: `Finish verified testnet evidence and Zecathon release materials`.

## Audit and deployment effects

Known private values were scanned across text and binary bytes; no matches or private-key blocks were found. No candidate exceeds 90 MB. All 106 WAV/MP4 candidates decoded. Screenshot sheets and final-film samples were reviewed. This is a scoped review; native-device testing and owner full listening remain.

Wallet databases/backups, chain data, private config, invoices/receipts/tokens, browser sessions, raw captures, model caches, dependencies and rendered deliverables are excluded. Original/revised MP4s and the 118 MB original editable archive remain **local ignored deliverables**, not Git contents. Prior protected preservation manifests still match.

**Main is allowed to deploy.** The final `vercel.json` uses `main: true` and `**: false`, covering other branch names including names with slashes. Vercel documents that a matching true rule enables deployment. JSON syntax and branch behavior were checked against its current [Git configuration documentation](https://vercel.com/docs/project-configuration/git-configuration). This changes deployment eligibility only; the production payment lock remains closed. The owner has explicitly authorized this reviewed release.

No schema migration or secret change is required for these edits. Fresh environments need existing migrations 0000–0007; the isolated test schema check passes. Production database assignment remains uninspected.

## Validation and approvals

See [release validation](RELEASE_VALIDATION.md) for the passing 33 Vitest, 29 Python, 18 Playwright and 13 Rust tests, app build, film checks, and the unresolved current scanner/live-network checks.

The owner authorized the reviewed source commit, push and safe website deployment and has published the final video. Host provisioning, production payment activation and any new financial action are outside this release. The existing payment approval is consumed. The owner must personally press the organizer's SUBMIT button. No new payment is proposed.
