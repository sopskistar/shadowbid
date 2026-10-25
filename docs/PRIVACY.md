# Privacy disclosure

During bidding, ShadowBid stores a SHA-256 commitment, receipt ID, account ID, and trusted server timestamp. The bid amount and secret stay in the browser until reveal. Commitment **counts and hashes are public**, so participation and timing are visible. A bidder's downloaded receipt contains the exact amount and secret; anyone who obtains it can learn the bid.

During reveal, the application server learns valid bid values and secrets. Other bidders and public API clients cannot read them. The operator and database administrator can. The seller sees settlement state but not the full losing-bid table. Email addresses, IP logs at hosting providers, network metadata, and browser fingerprints can affect anonymity.

After valid finalization, the winning price is public without the winner's account ID, email, receipt, invoice token, payment address, or losing bids. This reveals the amount the winner offered even if payment later expires; it does not prove a completed sale. A sole bidder, a small participant set, public commitment timing, or outside information can make the winner or bid easier to infer. An auction with no eligible winning reveal is labeled unsold and publishes no price.

A shielded Zcash payment protects recipient and amount from ordinary public-chain observers. The recipient wallet, wallet operator, application operator, and authorized winner know the invoice details. ZIP-321 wallet support varies. Zcash does not enforce the bid contract or prove domain transfer. DNS TXT verification proves only limited control of DNS at the time checked.

The app stores no Zcash seed or spending key. The separate Zallet wallet may hold spending authority if configured with a mnemonic. The MVP has no noncustodial seller payout integration; the wallet operator controls received funds. Do not interpret “private” as “trustless” or “anonymous.”

The judge practice flow stores two roles under one short-lived capability cookie. The same visitor can read both of their own receipts and revealed amounts; it is a protocol exercise rather than a two-person privacy test. It never creates an invoice or Zcash receiver. CSV imports remain private to their authenticated seller until each domain passes a DNS TXT challenge and becomes a public auction. The seller's authority attestation and challenge result are application records visible to the operator.

Manual Owner Auctions require the seller to attest authority. A production payment receiver is withheld until the DNS TXT check succeeds. An unverified listing may still accept sealed bids, so bidders should read its control status before participating. The DNS check is a point-in-time signal, not permanent control or legal ownership.
