# Continuation recovery — 2026-10-26

## State on arrival

- Existing checkout: `/home/sopski/projects/shadowbid`, branch `main`, HEAD `f56faf9` (`Record approved deployment and disabled payment worker evidence`). Nothing staged.
- Z3 checkout: `/home/sopski/projects/z3`, HEAD `e84ce9f`. Its private `.env.regtest` and `.env.testnet` changes were already present and were not printed or modified.
- ShadowBid had 23 modified tracked files: homepage and hero wording, one matching browser assertion, TypeScript/ESLint video exclusions, ignore rules, evidence documentation, and regenerated screenshots. `.vercelignore` and the entire `demo-video/` project were untracked. All were retained.
- The video stopped after source/asset production and preview review. Eight scenes, edited real captures, 24 generated narration utterances, original music/effects, caption timings, review stills, and an SRT existed. No final MP4 or thumbnail existed; no render was running. Six of eight delivery categories were present (75% checklist completion): source/storyboard, footage/evidence, voice, music/effects, captions, preview stills. Final encoding and validation were missing.
- Existing private raw captures, wallet databases, encrypted material, backup copies, and invoice mappings were retained. No duplicate checkout, Git reset/clean, wallet regeneration, chain reset, volume deletion, or production auction mutation occurred.

## Recovered settlement state

The invoice-recipient patch, wallet observer, local HMAC worker, distinct receiver mapping, exact zatoshi handling, reorg reconciliation, checkout gating, and tests were already committed in `f16a87f`. The production release lock and UX fixes were committed in `4c4b551`; `f56faf9` records that approved deployment. These commits are not newly created work in this continuation.

Read-only local database inspection confirmed the preserved experiment: invoice A = 1,000,000 zatoshis, invoice B = 2,000,000 zatoshis; both `awaiting`, paid zatoshis 0, payment-note rows 0. Receiver indexes 2 and 3 have distinct persistent bindings. The 1 TAZ faucet note is receiving evidence, not payment to either invoice.

The film's sanitized 2026-10-26 observation was matched field-by-field against the durable private observation log, including wallet height, active-chain height, amount, recipient ownership, and 2,829 confirmations. No synthetic note was supplied to the real experiment.

Docker inspection found healthy existing public-testnet Zebra 7.0.0 and regtest Zebra 6.2.3, running regtest Zallet, running isolated NU7 receiver scanner, and the two local PostgreSQL containers. The incompatible testnet Zallet was already stopped. Management RPC remains loopback-only; the isolated receiver has no published ports.

## Video continuation

Preserved the eight-scene creative work and original master/timing assets. The final 117-second cut removes one redundant closing utterance, moves the existing closing invitation earlier, retains the tagline on screen, and shows the already-captured production homepage before inventory. `scripts/finalize-media.py` generates separate final audio/caption assets. Original source recordings are untouched. The score is original synthesis; voice is the existing locally generated Kokoro voice, not a human recording.

See [video validation](../demo-video/docs/VALIDATION.md) for final encoding and review results and [the submission packet](ZECATHON_SUBMISSION.md) for the actual description and required owner publishing/submission steps.

## Release boundary

No commit, push, deployment, public video upload, hackathon submission, external payment, or faucet request is authorized by this recovery record. The owner explicitly reserved approval for those actions. Production payment instructions remain disabled. Repository visibility and public `/`, `/try`, and worker-health responses were checked anonymously; the repository is public and health reports `disabled`.

## Subsequent session recovery and export completion

A subsequent inspection found the previous session had rendered the final 19.2 MB MP4 and thumbnail, then stopped at the validator’s pixel-format assertion. The exported file is valid full-range H.264 4:2:0; correcting that assertion allowed full validation to pass without replacing the render. Seven of eight inherited delivery categories were complete at recovery (87.5% checklist completion); final technical/visual validation is now complete. Human listening approval and public upload remain owner steps. The source project is `demo-video/`, and the final artifact is `demo-video/output/shadowbid-zecathon-demo.mp4`.

This session independently rechecked anonymous GitHub visibility (`private: false`), homepage and `/try` HTTP 200, and production worker health `disabled`. It preserved the 25 pre-existing tracked modifications, the untracked video/submission materials, private wallets, assignments, and Z3 environment changes. No commit, push, deployment, or public upload was performed.

### Settlement continuation

The subsequent session fixed stale note confirmations after reorg, filtered payment receipts to current confirmed notes, bounded worker payload integers, hid repeat-payment instructions on paid invoices, extended regression coverage, and added `scripts/check-invoice-settlement.py`. See `INVOICE_EXPERIMENT.md` for exact evidence, the repaired local scanner network, and the remaining funding/deployment gates. Existing wallets, bindings, chain state, and production auction records were retained. The final real invoice check still reports both invoices unpaid; no paid state or transaction was fabricated.
