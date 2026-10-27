# Verified invoice-specific public-testnet payment

**Invoice A: Paid. Invoice B: Unpaid. Production collection: disabled.**

**Final recovery recheck:** at 13:59 UTC on October 27, two fresh offline wallet processes independently reloaded the same exact invoice payment. Zebra still included it at block 4,546,995, with **584 confirmations** at local tip 4,547,578. A retained one credited note and B retained none. See [sanitized recheck](INVOICE_PAYMENT_RECHECK.json). The wallet was 24 blocks behind Zebra and the online observation gate failed closed due to scanner connectivity; this is a monitoring-availability failure, not evidence that the completed payment disappeared. The historical ten-confirmation evidence below and in the film is preserved. No further payment or signature was made.

This is a genuine wallet-controlled self-transfer on Zcash public testnet, observed through the existing Rust/Zingolib receiver and authenticated local ShadowBid worker. It demonstrates invoice-specific shielded receiving, attribution, settlement, and restart persistence. It does not demonstrate an independent buyer, trustless escrow, seller payout, mainnet settlement, or domain transfer.

| Evidence | Recorded result |
| --- | --- |
| Transaction ID | `8cbffc50de4acdf7d9705a940c5cb8adad932715f96f275e0300e96f3e5a5206` |
| Amount | 1,000,000 zatoshis / 0.01000000 TAZ |
| Network fee | 10,000 zatoshis / 0.00010000 TAZ |
| Pool / output index | Ironwood / 1 |
| Active block | 4,546,995 |
| Recorded Zebra tip | 4,547,004 |
| Confirmations at recorded observation | 10, at 2026-10-27 09:30:47 UTC |
| Invoice A | Paid; exactly 1,000,000 confirmed zatoshis; one matching note |
| Invoice B | Unpaid; zero paid zatoshis; no matching notes |
| Restart and repeat scan | Two fresh worker processes; same note identity; no duplicate credit |
| Actual authenticated checkout | Paid state, confirmation display, receipt authorization, hidden repeat-payment instructions; B's exact distinct receiver and independently decoded ZIP-321 QR; seller/stranger restrictions passed |

The approved test receiver is:

```text
utest17dq63e3706fv67tjetzuwljufjkems30v47tpg4jc2v92xdv2fd5jlshxxzhhpf2thuek8zgjj252svkp9w9erqz9t79sxg7zv82w9kg
```

It was independently checked with `check_address` as wallet-controlled, account 0, address index 2. The receiver adapter resolved the decrypted note's recipient to that address. Amount and attribution came from wallet-decrypted note data, not a frontend action or a user-submitted transaction ID. Zebra placed the transaction in its active block and calculated confirmations from the current tip. [Machine-readable sanitized evidence](INVOICE_PAYMENT_PROOF.json) contains no invoice ID, session, checkout token, seed, spending key, or private credentials. Shielded amount and recipient are deliberately disclosed for this controlled proof; a public transaction ID alone cannot reveal or establish them.

## What a judge can verify

Read the sanitized JSON and [recheck](INVOICE_PAYMENT_RECHECK.json), then inspect the [actual Paid checkout capture](../demo-video/public/captures/invoice-paid.png). The public transaction ID establishes neither a shielded amount nor its recipient by itself: those claims come from the wallet-decrypted observation and receiver binding. The unique receiver belongs to Invoice A; B has a different receiver and no credited note. The disclosed receiver is test evidence, not a request for another payment.

Restart evidence includes fresh worker processes, persisted note identity, and durable nonce replay rejection after app restart. Reorganization behavior is covered by synthetic fail-closed tests; no real reorganization was induced. This evidence does not depend on enabling production collection.

## Recovery and single-send boundary

Recovery found the original explicit approval, no attempt file, no sender process/container, no outgoing transaction, one unspent 1 TAZ faucet note, and two unpaid invoices. The prior offline proof transaction was absent from Zebra and never existed in the live wallet history.

The recovered guarded sender signed the approved payment, then stopped before broadcasting. Its durable stage was `calculated_not_broadcast`. The same saved transaction passed a subsequent inspection of its recipient, 1,000,000-zatoshi output, one input, 98,990,000-zatoshi change, and 10,000-zatoshi fee. A narrow resume path rejects any attempted/accepted transmission, changed approval, changed sender binary, or non-calculated wallet status; it never proposes or signs a replacement. That exact saved transaction was transmitted once and acknowledged. Its protected attempt record is now `broadcast_accepted` and prohibits another use.

The pre-broadcast failure is consistent with the original chain snapshot becoming stale during proving; the original handler did not preserve an exception reason, so that specific cause is an inference. Later failures are now logged privately. Wallets, original backup files, both invoices and their deadlines were preserved. The self-transfer reduces the wallet's total balance only by its fee; sender and receiver share custody.

## Reproduction and limits

With the original protected local configuration and scanner, run `python3 scripts/check-invoice-settlement.py`. This performs no send, receiver derivation, deadline change, or synthetic observation. It checks the real notes and database twice in fresh processes. Run `scripts/run-invoice-experiment.py watch` and the separate `checkout` check for fresh UI health. **Never rerun the sender for this proof.**

Synthetic Python/browser tests cover chain rollback, reorganization during observation, replacement payments, replay, duplicate/conflicting output identities, and account isolation. No public-testnet reorganization was induced. Offline calculated and failed notes are excluded from receiving observations.

Local monitoring occasionally fails closed while the wallet lags the active tip; checkout hides instructions until fresh authenticated health returns. An always-on external host, restart under host failure, remote authentication, and production activation remain unverified. The existing Vercel payment release lock is unchanged.
