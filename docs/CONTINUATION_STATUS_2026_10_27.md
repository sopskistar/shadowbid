# Continuation delivery — 2026-10-27 UTC

> Superseded payment status: the October 27 continuation completed the single authorized self-transfer and verified Invoice A Paid, Invoice B Unpaid, and worker restart. See [current invoice proof](INVOICE_PAYMENT_PROOF.md). The earlier unpaid/pending statements below are historical. Production collection remains disabled.

Later recovery: see [payment recovery and pending broadcast approval](PAYMENT_RECOVERY_2026_10_27.md). It identifies and fixes a funded-wallet input-selection bug, verifies an unsigned quote and offline proof/signing, repairs scanner DNS, and preserves the original film. Invoice A and B remain unpaid pending explicit owner authorization for the genuine transfer. The historical delivery record below is preserved.

## Recovery

Branch `main`, HEAD `f56faf9` (`Record approved deployment and disabled payment worker evidence`). The original 25 tracked modifications and untracked video/submission project were preserved. Z3 remains at `e84ce9f` with its two inherited environment-file changes. No commit, push, production deployment or organizer submission was performed.

The prior session had already rendered the final film, but its validator stopped on a full-range YUV pixel-format assertion. This continuation corrected the validator, preserved the existing MP4 byte-for-byte, and completed technical/visual review. Existing payment work was already committed in `f16a87f`; the production release lock was already committed in `4c4b551`.

## Video and submission

- MP4: `/home/sopski/projects/shadowbid/demo-video/output/shadowbid-zecathon-demo.mp4`.
- 117.013 seconds; 1920 × 1080; 30 fps; H.264/AAC stereo; 19,153,087 bytes.
- 23 synchronized sentence captions, separate SRT, Kokoro narration, original synthesized score/effects, and thumbnail. Editable source: `demo-video/`.
- Full decode, codec/duration/dimension checks, silence/black detection, browser playback/seeking, and sampled visual review passed. Owner full listening review remains.
- Public video URL: absent. Owner should upload as Public/Unlisted, wait for 1080p processing, and test signed-out playback.
- Submission: ShadowBid / Private Markets. The exact 1,813-character description and all form values are in `ZECATHON_SUBMISSION.md`. Anonymous checks confirmed a public repository, working homepage and `/try`, and disabled production payment health.
- Deadline: October 28, 2026, 23:59 UTC. Only pressing SUBMIT sends the entry to judges; saving a draft afterward requires SUBMIT again.

## Settlement code completed in this continuation

- `src/app/api/worker/observe/route.ts`: revoke stale note confirmations after reorg and reject out-of-range numeric payloads.
- `src/app/api/checkout/[token]/receipt/route.ts`: include only currently confirmed notes.
- `src/app/checkout/[token]/page.tsx`: hide repeat-payment instructions after confirmation.
- `scripts/check-invoice-settlement.py`: genuine two-invoice acceptance and worker-process restart check; cannot send funds or pass without invoice A payment.
- `scripts/check-receiver-checkout.mjs`: support paid-state checks and optional independent QR decoding.
- Expanded `tests/test_receiver_monitor.py`, `tests/e2e/payment-policy.spec.ts`, and `tests/e2e/protocol.spec.ts`.
- Updated video validation and recovery/testing/evidence documentation. Inherited homepage, screenshot, build-exclusion and video-source changes remain preserved.

## Evidence and blockers

The local scanner’s Docker bridge networking failed. Its identical sync-only command now runs on the host network using the same pinned image and wallet; the original container is retained stopped for rollback, and no management listener was added. The scanner caught up. The genuine 1 TAZ faucet note was again decrypted, matched to its original receiver, and active-chain verified at 3,895 confirmations. It matches neither assigned invoice.

Invoice A remains awaiting at 0/1,000,000 zatoshis. Invoice B remains awaiting at 0/2,000,000 zatoshis. Neither has payment-note rows. Original deadlines around October 29, 09:00 UTC remain intact. The real acceptance command correctly returned NOT VERIFIED. No genuine paid-invoice or paid restart claim is made.

Both actual local winner checkouts passed authorization, clipboard and independently decoded QR checks. Funding still needs owner coordination: an authorized compatible sender must pay exactly 0.01 TAZ to A while monitoring is fresh; B must receive nothing. Then rerun the acceptance and authorization checks. Do not use the old faucet deposit as that evidence or send to expired instructions.

External hosting is not deployed. Use a separate always-on Linux VM with persistent protected storage, backups, supervision, and private management RPC. The existing production lock also needs separately reviewed changes before a remote worker can report to production. Passing the invoice test and explicit owner approval are required before activation.

## Validation and approvals

Passed: ESLint, TypeScript, 33 Vitest tests, 21 Python tests, 18 Playwright tests, seven pinned Rust wallet-summary tests, production build, video-source lint/typecheck, MP4 validation/playback and genuine receiver-checkout/QR validation. Sandbox listener/build failures and Docker DNS/dependency failures were resolved on permitted reruns and are documented.

The changed/untracked text scan found no known private environment values, private-key blocks, or unexpected email addresses. Private wallet, invoice, raw capture and rendered-output trees remain ignored. No staging or commit occurred.

Required owner actions: review/listen to the film; publish and verify its share URL; coordinate the real test payment; approve source commit/push and any desired deployment separately; review and press SUBMIT in the organizer form. Production settlement remains NO-GO.
