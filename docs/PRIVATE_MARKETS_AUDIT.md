# Private Markets compliance and trust audit

Review date: 2026-10-25. The track framing quoted by the owner is that the price should be public and the participants should not. The public hackathon landing page did not expose the signed-in track text during this review. ShadowBid remains an operator-run domain auction, not a trustless or zero-knowledge auction.

| Surface | Public | Restricted |
| --- | --- | --- |
| `/api/auctions` and marketplace | Seller-provided domain/description/category, opening price, actual deadlines, DNS TXT check status, commitment count, finalized/unsold status, and final winning price only after finalization | Seller ID, bidder IDs/emails, individual bid amounts, reserve amount, receipt secrets, invoice IDs/tokens, wallet receiver |
| Auction detail and ledger | Auction rules, domain, opening price, count, receipt IDs, SHA-256 commitments, accepted timestamps, final winning price or unsold outcome | Bidder identity and losing amounts; invoice link and DNS challenge only when authorized |
| Winner checkout | No public invoice response | Winner and seller need a valid session; only the winner sees the shielded receiver and QR. Receipt download is winner-only after genuine confirmation. |
| Worker APIs | General wallet health state only | Signed worker requests with timestamp and one-use nonce; invoice/account/receiver data never returned to anonymous clients. |
| Judge practice | Entry point and educational explanation | Session capability cookie guards its own two-role receipts/reveals; practice tables are separate and cannot create an invoice or payment address. |

The public price is the highest eligible **validly revealed** bid recorded by the finalized invoice. It is called a winning price because payment and manual transfer may still fail. No invoice means an unsold outcome and no final price. The operator and database administrator can read revealed losing bids and account details. The seller and winner have authorized settlement access. Zcash hides shielded transaction details from ordinary chain observers, but application records, server logs, and infrastructure metadata remain visible to operators.

Publishing the winning price creates inference risk: a sole commitment, small bidder set, known outside participation, or timestamps may link a person to that price. Commitment counts and ledger timestamps reveal participation patterns. Public descriptions are seller-authored and may include information the seller chose to publish. The receipt IDs and hashes do not identify bidders in the public API, but anyone with an off-platform receipt can correlate their own commitment.

The worker is trusted to report wallet evidence honestly. Its signed messages prevent anonymous browser callbacks and replay, but possession of `WORKER_SECRET` is powerful; a compromised worker or operator can falsify state. Regtest verified a real wallet note and three confirmations. Public testnet Zallet is currently incompatible after NU7, so production wallet-backed payment confirmation is **NO-GO**. [Wallet review](ZALLET_NU7_REVIEW.md).

Seller-created listings require an explicit authority attestation. Before a production testnet receiver can be assigned or shown, the seller must also pass the DNS TXT challenge. The worker omits unverified, unassigned invoices; a previously assigned receiver remains monitored so payments are not silently ignored. A strictly local regtest database can bypass this payment gate for repeatable integration tests. DNS control is limited evidence and can change after verification; it is not legal title, registrar escrow, or a domain-transfer guarantee.

Private routes use no-store/no-referrer/noindex response headers. Checkout still uses a token in its URL for authorized links; hosting access logs and browser history may contain that path. Session authorization remains mandatory, but eliminating token-bearing URLs is future hardening. No third-party analytics or remotely hosted page assets were found in the application source during this review.

Regression coverage: the isolated browser protocol test asserts no clearing price before finalization, a public final price without bidder IDs or checkout token afterward, an unsold/no-invoice outcome, unauthorized checkout denial, commitment/reveal rejection, signed worker replay denial, partial/duplicate payment behavior, confirmation rollback, and judge no-invoice isolation. These are local database and fixture tests, not public-testnet payment proof.
