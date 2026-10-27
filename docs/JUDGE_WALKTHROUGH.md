# Verify ShadowBid in Four Minutes

- Marketplace: https://shadowbid-ashy.vercel.app
- Practice auction: https://shadowbid-ashy.vercel.app/try
- Public repository: https://github.com/sopskistar/shadowbid
- Two-minute video: [Watch the final demo](https://youtu.be/K3JkEqG3q1Y)

Allow four minutes of server windows plus time to read and interact. No signup, wallet, funds, or production invoice is required for practice.

1. Open the [judge sandbox](https://shadowbid-ashy.vercel.app/try).
2. Press **Start practice auction →**. The reserved practice domain is not for sale.
3. Under **BIDDER A**, keep the default **0.02** offer and press **Seal bid & download receipt**. The browser submits a SHA-256 commitment.
4. Save `shadowbid-practice-A-receipt.json` — it contains the secret needed to reveal.
5. Under **BIDDER B**, keep **0.03** and press **Seal bid & download receipt**.
6. Save `shadowbid-practice-B-receipt.json` separately.
7. Wait until the real server-enforced reveal phase shows **Import saved receipt**.
8. Check tamper rejection: copy A's receipt, change only `amountZats`, and upload the altered copy under **BIDDER A**. Expect **Receipt does not match the original sealed commitment.**
9. Upload the unchanged originals using **Import Bidder A receipt** and **Import Bidder B receipt**. Each panel shows **Reveal verified**. Test the altered copy first because an accepted reveal removes that role's upload control.
10. At the reveal deadline, observe **Bidder B wins** and **0.03 practice ZEC**. The highest eligible reveal wins; equal offers use commitment time, then bid ID.


The altered-copy test is intentionally before the original upload: accepted roles no longer display an upload control. Never change the original files, and do not share either receipt. The visible practice price is denominated in practice ZEC; no funds move.

### If a step does not work

- Allow the page scripts to finish loading before Start. If assets fail to load, reload on a stable connection before creating a new session.
- Keep the same browser profile: the sandbox uses a private session cookie. A different browser cannot access that session.
- Use the correct A/B original files and the displayed server phase. Early or late reveals are rejected.
- Practice sessions expire after 30 minutes. Creation is limited to three sessions per 15 minutes; a rate-limit response is not a payment error.
- After a valid reveal, its input disappears. Use the untouched original after the altered-copy rejection, while the reveal window is still open.

## Evidence to inspect

- [domscout.xyz actual result](https://shadowbid-ashy.vercel.app/auctions/3def1e14-06e7-41a1-8d25-ebf4d3133b76): three sealed commitments, public final price **0.12 ZEC**, no completed-domain-sale claim. The final recovery's anonymous API check confirmed these values and all four domains used in the film.
- [Recorded live practice verification](JUDGE_WALKTHROUGH_VERIFICATION.json): October 27, 09:31–09:35 UTC; two downloaded receipts, altered receipt rejected, two valid reveals, B wins, no payment receiver. Early reveal rejection is also asserted in the preserved runner. Later recovery attempts are reported separately in [release validation](RELEASE_VALIDATION.md).
- [Regtest receiving evidence](DEMO_EVIDENCE.md): real shielded receiving and three confirmations, with the documented transparent funding/overpayment limitation.
- [Public-testnet invoice proof](INVOICE_PAYMENT_PROOF.md): exact **0.01 TAZ**, unique wallet-owned receiver, genuine confirmations, **A Paid / B Unpaid**. This controlled self-transfer is separate from the domscout.xyz auction and its 0.12 ZEC result.
- Sanitized film captures: [auction](../demo-video/public/captures/production-detail.png), [rejected receipt](../demo-video/public/captures/practice-invalid.png), [valid reveals](../demo-video/public/captures/practice-valid.png), [Paid checkout](../demo-video/public/captures/invoice-paid.png); no private receipt or checkout URL is included.

## Reproducible local checks

```bash
npm test
python3 -m unittest discover -s tests -p 'test_*.py'
npm run lint
npm run build
# With a disposable loopback PostgreSQL/app and the documented test environment:
E2E_ISOLATED_DB=true npm run test:e2e -- --workers=1
# Only on the preserved local invoice host, with app/scanner already healthy:
python3 scripts/check-invoice-settlement.py
python3 scripts/run-invoice-experiment.py checkout
# Existing rendered film:
python3 demo-video/scripts/validate-render.py
node demo-video/scripts/check-playback.mjs
```

Never run payment sender, offline prover, receiver assignment, fixture creation or regtest funding merely to inspect the existing public-testnet proof. Do not point browser fixture tests at Neon or the preserved invoice database.

The operator sees reveals and controls winner computation and wallet observations. Domain delivery is a manual registrar process. There is no trustless escrow, automatic transfer or demonstrated mainnet settlement. Production payment collection is disabled; private keys and persistent scanning stay off Vercel.
