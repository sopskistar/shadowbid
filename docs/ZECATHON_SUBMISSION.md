# ShadowBid — owner submission packet

Deadline supplied by the owner: **October 28, 2026, 23:59 UTC**.

| Field | Value |
| --- | --- |
| Project name | ShadowBid |
| Track | Private Markets |
| Repository | https://github.com/sopskistar/shadowbid |
| Repository visibility | Public, verified by anonymous GitHub access during recovery |
| Working demo | https://shadowbid-ashy.vercel.app/try |
| Marketplace | https://shadowbid-ashy.vercel.app |
| Demo video | https://youtu.be/K3JkEqG3q1Y |

## Description — paste this text

ShadowBid brings confidential price discovery to the domain aftermarket. Public bidding can expose a buyer's budget, competitive interest and next business move. Private auctions. Public outcomes.

Sellers list real domains and verify control with DNS TXT records. Bidders submit SHA-256 sealed commitments in their browser and download secret receipts. After bidding closes, the server verifies reveals and selects the highest eligible offer. Final prices are public; participant identities and losing offers stay private from other bidders. Checkout is restricted to the winner, with a limited seller settlement view.

Try the four-minute judge sandbox: seal two bids, save both receipts, reject a modified receipt, reveal the originals and observe the winner. It uses genuine commitment verification and server-enforced deadlines, with no payable invoice. The real domscout.xyz auction separately demonstrates three sealed commitments and a 0.12 ZEC winning price; no payment or completed domain transfer is claimed for it.

Invoice-specific shielded Zcash settlement was verified on public testnet: an exact 0.01 TAZ (1,000,000 zatoshis) controlled wallet self-transfer was decrypted and attributed to Invoice A's unique receiver with at least three active-chain confirmations. Invoice A became Paid while Invoice B remained Unpaid. Restart, replay protection and invoice-isolation checks passed. Public evidence records the transaction ID, recipient attribution and confirmations. This was not an independent buyer purchase.

The operator is trusted for reveal handling and winner selection. Domain transfer is manual. Production payment collection remains disabled, and external wallet monitoring is not deployed. Future work includes escrow, registrar integrations, mainnet settlement after security review, and broader private auction categories.

## Final published video

https://youtu.be/K3JkEqG3q1Y

The owner has published the completed film. The original source remains at `demo-video/output/shadowbid-zecathon-demo-revised.mp4`: 117.013 seconds, 1920 × 1080, 30 fps, H.264/AAC, 18,353,896 bytes. SHA-256: `1b22514fb1b148f5d92775842e3281596402059e4b516a91db0792c924c1b6e2`. No new render or upload is needed.

## Current validation handoff

The revised MP4 is rendered and technically validated; see [release validation](RELEASE_VALIDATION.md). The preserved live four-minute walkthrough passed earlier on October 27. Later recovery attempts encountered host network changes and did not complete; recheck `/try` from a stable connection before submitting. The existing payment remains verified, while current local scanner connectivity is unhealthy. Neither limitation is permission to send again or enable production collection.

## Owner review and submission

1. Watch the complete video with sound. Confirm the technical limitation statement and all public claims.
2. Review the description, repository, demo, and actual video URL. The repository is already publicly readable; keep it public through the deadline.
3. Review the published release status. The owner authorized the final reviewed commit/push and safe website release; production payment activation is not authorized. The video is already published.
4. In the signed-in organizer form, confirm the public-repository checkbox and press **SUBMIT** yourself.
5. Verify the final **submitted** status. Saving a draft is not submission. **Saving a draft after submitting withdraws it from submitted status until you press SUBMIT again.**

No submission action or account setting change has been performed. Contact details remain in the owner's organizer account and are not copied into this public document.
