# Sealed-bid protocol

The client generates 32 random bytes with `crypto.getRandomValues`. It converts the decimal offer to integer zatoshis and hashes a UTF-8 JSON string whose key order is fixed:

```json
{"version":1,"auctionId":"...","bidderId":"...","amountZats":"5000000","secret":"64 lowercase hex chars"}
```

SHA-256 output is the commitment. Only it is submitted during bidding. The server assigns a receipt UUID and timestamp, and the browser downloads the secret, amount, IDs, hash, and timestamp as JSON. One bidder may submit one commitment per auction. The seller cannot commit to their own listing.

After bidding closes and before reveal ends, the signed-in bidder uploads the receipt. The server uses the authenticated bidder ID and URL auction ID, recalculates the hash, rejects mismatches and duplicates, and privately stores the amount. The buyer's secret is not stored. After the reveal deadline, the highest revealed amount at or above the starting price and optional reserve wins. Ties use trusted commitment timestamp, then stable bid UUID. Finalization uses a database advisory lock and a unique invoice per auction. Invalid or missing reveals cannot win.

The public ledger exposes only receipt UUID, commitment hash, and accepted timestamp. It is operator-controlled and does not provide decentralized proof of fair selection. The operator remains trusted to run the application honestly and keep it available.

After valid finalization, the public auction API and detail page disclose the final winning amount without bidder identity, losing amounts, invoice token, or shielded receiver. This price is a selected bid, not proof of payment or domain transfer. If no eligible revealed bid exists, finalization records an unsold outcome and creates no invoice. A small bidder set can still make the public winning price identifying by inference.

A seller must attest authority to create an Owner Auction. A production testnet invoice may be created after finalization, but its payment receiver and QR remain unavailable until the seller's DNS TXT challenge is verified. The isolated loopback regtest flow has an explicit test-only exception. DNS control is a point-in-time signal, not legal title or registrar escrow.

Auction-critical terms have no edit endpoint in this MVP. Expired unpaid invoices do not automatically promote a runner-up.
