# Final recovery and release validation — October 27, 2026

**Final release review: October 27, 2026.** The owner has published the [final video](https://youtu.be/K3JkEqG3q1Y) and authorized the reviewed source release to GitHub main and Vercel. Production collection remains disabled. The owner alone performs the organizer submission.

## Final publication checks

Recovery confirmed local and remote main at `f56faf9ef6b7d2ac80e6f9243abbec2a5b3b78d7`, no staged files, and no intervening release. The interrupted production build completed successfully, including TypeScript and all 22 static pages. Its candidate files matched the previous audit hashes exactly. No application code was changed during final publication; updates are documentation and Vercel branch configuration.

Fresh ESLint, TypeScript, all 33 Vitest tests and all 29 Python tests passed. The later preserved 18-test Playwright pass supersedes older interrupted/failed logs; the 13 Rust tests and CLI build also passed. Subsequent application edits before this handoff were disclosure/copy updates covered by the successful final build. No lengthy wallet or browser experiment was repeated.

A fresh anonymous production check returned HTTP 200 for `/`, `/try` and the domscout.xyz detail. All eight public auction records match the preserved baseline, including three domscout.xyz commitments and the 0.12 ZEC final price. Worker health remains `disabled`, with no heartbeat or chain-cross-check claim.

The final MP4 hash still matches the value below. All eleven protected entries in the latest preservation manifest match. Publication scanning checks known private values in text and binary assets, private-key patterns, excluded paths and file sizes. Screenshot contact sheets were reviewed again. See the final [release manifest](RELEASE_MANIFEST.md).

`vercel.json` permits main and disables other branches, including branches containing slashes, using `main: true` and `**: false`. Vercel documents that any matching true rule enables deployment. This setting changes Git deployment eligibility only. The application still rejects wallet workers on Vercel and hides payment instructions while collection is disabled. [Vercel configuration reference](https://vercel.com/docs/project-configuration/git-configuration#branches-matching-multiple-rules).

The sections below retain the earlier recovery evidence and limitations. Publication/deployment results are verified after the release commit, rather than predicted here.

## Earlier recovery record

Branch `main`, HEAD `f56faf9ef6b7d2ac80e6f9243abbec2a5b3b78d7`. Existing source edits, invoices, protected attempt journal, wallet backups, original MP4 and editable archive were preserved. Z3 remains at `e84ce9fd8e864ff0b2a8a62f6ce14392145db0fb` with its two inherited private environment changes. Nothing was staged or committed.

The revised render had already completed. Its decode passed, but visual review found a cropped Paid checkout panel; a narrow `objectFit` option corrected it using the existing Remotion composition. Previous exports are backed up. Stale application and documentation claims were updated. The submission description was shortened from 2,024 to **1,936 characters**.

The ambiguous combined restart/settlement failure was reproduced in separate steps:

- The invoice app on port 3101 was stopped: `Connection refused` occurred before authentication. Restarting the same app restored authenticated access, and the previously consumed nonce was rejected. This also passed after the final build restart.
- The separate observation gate failed because the wallet lagged Zebra. Scanner logs show repeated Nym discovery timeouts and intermittent lightwallet transport errors. The configured IPv4 mapping still matched DNS. No health or payment observations were fabricated, and no lag threshold was relaxed.
- The acceptance runner now retains unique, mode-600 private failure diagnostics and tells operators not to repeat payment. Its earlier generic exit message suppressed the useful cause.

## Existing payment

TXID: `8cbffc50de4acdf7d9705a940c5cb8adad932715f96f275e0300e96f3e5a5206`.

Exact amount: **1,000,000 zatoshis / 0.01000000 TAZ**. Recorded fee: **10,000 zatoshis / 0.00010000 TAZ**. The consumed attempt remains `broadcast_accepted`. No sender, prover, payout or refund was executed during recovery.

At 13:59:32 UTC, two fresh offline CLI processes loaded the same saved wallet and agreed on its note and distinct receiver attribution. Zebra's public-testnet active block 4,546,995 still contained the transaction; tip 4,547,578 gave **584 confirmations**. A remained Paid with one credited note; B remained Unpaid with no note. The wallet was 24 blocks behind Zebra. [Machine-readable recheck](INVOICE_PAYMENT_RECHECK.json) preserves this distinction; [original proof](INVOICE_PAYMENT_PROOF.json) retains the earlier ten-confirmation successful online acceptance.

Actual checkout checks during stale monitoring passed: A shows Paid and offers its authorized receipt; B remains unpaid; payment links/QRs stay hidden; seller/anonymous receipt access is denied; unauthenticated observations are rejected. Durable nonce replay rejection and fresh HMAC access passed after app restart. Synthetic tests cover reorg rollback, replacement notes, conflicting/duplicate outputs and invoice isolation. No public-testnet reorg was induced.

The original successful paid worker-process restart evidence remains valid. A **fresh fully online settlement/checkout gate is not currently passing** because scanning is unhealthy. An always-on external deployment, reboot/restore test and production activation remain incomplete. This is a wallet-controlled self-transfer, not an independent customer payment or payment for domscout.xyz.

## Video

`/home/sopski/projects/shadowbid/demo-video/output/shadowbid-zecathon-demo-revised.mp4`

117.013 seconds; 1920 × 1080; 30 fps; H.264/AAC stereo; 18,353,896 bytes. SHA-256: `1b22514fb1b148f5d92775842e3281596402059e4b516a91db0792c924c1b6e2`.

Full decode, audio/video duration agreement, 22 synchronized sentence captions, loudness (−16.01 LUFS, −2.46 dBTP), black/silence checks, Chromium playback/seeking and mobile-landscape framing passed. Sampled visual review confirms the corrected checkout and truthful historical payment card. All 106 candidate WAV/MP4 source assets also decoded without errors. Original MP4 and its backup still share SHA-256 `930fd8e67636b92db73ee4942e1cc8e9892338b5ff6065a9ba8855a2e4823f56`.

The owner has published this film: https://youtu.be/K3JkEqG3q1Y. Native Windows/mobile hardware and human full listening were not available for agent validation. [Detailed film validation](../demo-video/docs/VALIDATION.md).

## Judge and public demo

The preserved live run at 09:31–09:35 UTC passed both genuine server windows, downloaded two receipts, rejected early/altered reveals, accepted originals and selected B without a payment receiver. Its evidence was not overwritten.

Later live browser attempts in this recovery did **not** complete. Chromium repeatedly reported `ERR_NETWORK_CHANGED`; other attempts loaded the page but did not reach the practice session after Start. TLS handshakes and a JavaScript asset fetch also timed out intermittently, while direct `/try` and health requests returned 200. These are failed current checks, not a fresh pass or a proven application defect. Recheck `/try` from a stable connection before final submission. The full local Playwright suite passed against the disposable loopback database.

Anonymous API checks confirmed all four film domains, domscout.xyz's three commitments and 12,000,000-zatoshi final price, and production worker health `disabled`. An old strict inventory comparison failed only because `leadatlas.xyz` gained a DNS verification timestamp; that change was already documented in earlier recovery records. No auction deadline or payment was changed here. GitHub remains publicly readable. [Judge walkthrough](JUDGE_WALKTHROUGH.md).

## Tests and release limits

- Vitest: **33 passed**.
- Python: **29 passed**, including repeat-send prevention, receiver attribution, stale/reorg fail-closed behavior and acceptance identity checks.
- Playwright: **18 passed**, including authorization, private checkout, replay, duplicate notes, reorgs, receipts, judge flow and responsive layouts.
- Rust: **13 passed** (six input-source, seven summary tests); preserved pinned CLI release build passed. No wallet mounted in the build container.
- App ESLint, TypeScript and production build passed on the authorized host. The restricted build reproduced the known TypeScript `--showConfig` subprocess failure; no type checking was disabled.
- Remotion source lint/typecheck, final rendering, full decode and browser playback passed.

No schema changes or new migrations are proposed. Existing migrations 0000–0007 are required for a fresh environment. Production database configuration, native-device playback, persistent external hosting, fresh live `/try`, and current scanner connectivity are not certified by these local tests.

The [release manifest](RELEASE_MANIFEST.md) lists every proposed file. Known private values were scanned in both text and binary bytes; no match or candidate file over 90 MB was found. Screenshot contact sheets and final-film samples were reviewed. Two prior preservation manifests matched all 9 and 11 entries respectively, including existing wallet backups, invoice bindings/configuration and the original MP4. This is a scoped audit, not a claim that every possible secret or every video frame was manually inspected. Wallets, backups, environment values, receipts, tokens, raw captures, chain data and rendered outputs remain ignored.

At recovery, remote main lacked `vercel.json`. The reviewed final configuration now allows main deployments and excludes other branches. The owner explicitly authorized this safe source/site release; production payment activation remains prohibited.

Escrow remains planned. No secured release/refund workflow, registrar integration or threshold-wallet integration is implemented. See [escrow evaluation](ESCROW_OPTIONS.md) and [worker handoff](WORKER_HOSTING_HANDOFF.md).

## Remaining owner actions

1. Review the published repository, demo and [final video](https://youtu.be/K3JkEqG3q1Y), including playback with sound and the disclosed limitations.
2. Keep production collection disabled. Current scanner connectivity and external hosting remain incomplete and are not required to inspect the recorded payment proof.
3. Use the final [submission packet](ZECATHON_SUBMISSION.md) and personally press **SUBMIT** by **October 28, 2026, 23:59 UTC**. Confirm the organizer shows submitted status.
