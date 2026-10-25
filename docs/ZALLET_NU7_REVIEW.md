# Public testnet receiving wallet after NU7

Status: **blocked, no public testnet payment observed** (2026-10-25). Keep the production payment worker disabled until a compatible wallet is tested with actual receiving notes.

## Observed failure

Zebra 7.0.0 completed sync past NU7 activation and returned `/ready` 200. The pinned Z3 image is `zodlinc/zallet:v0.1.0-beta.1` with the RPC-backed `zallet-zaino` binary. On the preserved testnet chain, its embedded Zaino indexer repeatedly logged `mempool source fetch failed ... could not deserialize transaction data: parse error: invalid consensus branch id`. Zallet was stopped. The separate newly encrypted `z3-testnet-zallet` volume, Zebra v29 database, and pre-upgrade archive were preserved. There is no initialized mnemonic, public-testnet invoice receiver, or wallet-backed payment evidence.

## Why beta.3 is not an established fix

The [latest official Zallet release](https://github.com/zcash/zallet/releases) is beta.3 from August 2026. Its [tagged Zaino backend manifest](https://github.com/zcash/zallet/blob/v0.1.0-beta.3/backends/zaino/Cargo.toml) specifies `zcash_protocol = "0.10.0"`, Zaino 0.4/0.5, and older Zebra crates. The finalized NU7 branch ID and public testnet activation schedule appear in [zcash_protocol 0.11.0's October 21 changelog](https://github.com/zcash/librustzcash/blob/main/components/zcash_protocol/CHANGELOG.md). This version chronology strongly indicates beta.3 cannot be assumed to parse current NU7 transactions. The [Zallet troubleshooting entry](https://zcash.github.io/zallet/troubleshooting.html) about “Consensus branch ID not known” says beta.3 fixes specific **zcashd wallet migration** cases; it does not claim a fix for the observed live mempool parse error. Beta.3 has **not** been started here, so its exact behavior is not claimed.

Upstream [Zallet's current changelog](https://github.com/zcash/zallet/blob/main/CHANGELOG.md) removes the `zallet-zaino` backend after beta.3. The replacement Zebra-state backend requires a `zebrad` build with its indexer feature, a matching state database format, and co-location with Zebra's state. Z3 currently packages the RPC-backed backend; switching is an architecture and wallet-version change, not a safe image-tag swap. No published replacement in this review has been verified with ShadowBid's RPC methods: `getwalletstatus`, `z_getnewaccount`, `z_getaddressforaccount`, `z_listunifiedreceivers`, and `z_listunspent`.

## Gate for a future switch

1. Obtain an officially published or reproducibly built NU7-capable wallet/indexer with documented Zebra 7.0.0 v29 compatibility. Verify its source revision, dependencies, and image digest. Do not reuse the encrypted beta.1 volume for an experiment; create a separate disposable wallet volume and back up the existing wallet identity first.
2. Keep RPC on loopback. Verify the candidate reports the public testnet chain and a synchronized wallet tip. Exercise all ShadowBid receiver and note RPCs against that exact build. Confirm a unique shielded receiver belongs to the monitored wallet or viewing authority.
3. With separately obtained TAZ in the owner's Zingo testnet wallet, send an exact shielded payment to an authorized test invoice. Compare wallet note account, receiver, integer zatoshi value, and Zebra active-chain confirmations. Require three confirmations and an authenticated, non-replayed worker notification before marking the invoice confirmed. Test duplicate, partial, wrong-recipient, and rollback observations.
4. Record transaction and chain evidence privately. Only then update the public-testnet integration status. Regtest fixtures and a synchronized Zebra node do not satisfy this gate.
