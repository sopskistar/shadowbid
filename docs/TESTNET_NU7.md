# Public testnet NU7 node status

## Earlier sync observation — 2026-10-25 06:16 UTC

The effective Z3 testnet image is `zfnd/zebra:7.0.0`; the same container and v29 state volume remain in use. Authenticated local RPC reported **4,537,422 verified blocks**, chain `test`, and verification progress **0.99977195**. The live [SoChain ZECTEST network API](https://sochain.com/api/v3/network_info/ZECTEST) reported tip **4,539,309**: **99.958% by block height**, 1,887 blocks behind. Zebra's 99.977% RPC work estimate is a different metric. Authenticated `getinfo` reported **41 peers**. During this work the height rose from 1,866,400 to 4,537,422, crossed NU7 activation at 4,465,026, and continued advancing. A pre-NU7 Zebra 6.4.2 peer sent a wrong-consensus-branch block around height 4,465,364; Zebra 7 banned that peer and continued. A temporary near-tip pause also recovered without a restart. The container still reports `unhealthy`, and `/ready` returned **503** at this observation because the node is not within its four-block readiness lag. The latest `getinfo.errors` value was `error downloading and verifying block`; this has not stopped height growth. Keep Zebra running and recheck the error if progress stops.

At 06:23 UTC Zebra reached **4,539,326**, three blocks behind SoChain's **4,539,329**, and `/ready` returned **200**. It had not restarted. This cleared the node-readiness gate, but it did **not** clear the wallet-compatibility gate. Z3 pins `zodlinc/zallet:v0.1.0-beta.1` in RPC-backed `zallet-zaino` mode. The first testnet Zallet start found no encryption identity, as expected for the previously absent wallet volume. Using Z3's documented one-time commands, a fresh testnet encryption identity and wallet encryption were initialized in new named volumes; no mnemonic, account, or invoice receiver was created. The wallet RPC host port was restricted to `127.0.0.1:40232` with a temporary Compose override. On restart, embedded Zaino repeatedly failed to deserialize post-NU7 mempool transaction data with **`invalid consensus branch id`**. Zallet was stopped; Zebra remained healthy, and no chain or wallet volume was deleted. The pinned beta.1 is therefore **observably incompatible with this post-NU7 testnet state**. Do not start it again or generate a payment invoice through it until a compatible wallet build is identified and tested. No public testnet payment has been confirmed by ShadowBid.

The latest published [Zallet release list](https://github.com/zcash/zallet/releases) shows beta.3 from August 2026, before NU7 activation. Its Zaino backend depends on `zcash_protocol` 0.10.0 and predates the finalized NU7 branch ID; do not treat its unrelated wallet-migration fix as a live-chain fix. See [the compatibility review](ZALLET_NU7_REVIEW.md). Upgrading a beta wallet may migrate its database and may not allow rollback; back up the new `z3-testnet-zallet` volume and identity before testing any replacement image. The existing Zebra v29 state is independent and should remain untouched.

## RPC binding remediation — 2026-10-25

Before remediation, Docker published Zebra RPC **0.0.0.0:18232** and health **0.0.0.0:18080**; its testnet P2P listener was **0.0.0.0:18233**. The stopped Zallet would have published wallet RPC on all interfaces if started through base Compose. The reviewed [loopback override](../ops/z3-testnet-loopback.yml) now binds Zebra RPC to **127.0.0.1:18232**, health to **127.0.0.1:18080**, and Zallet RPC to **127.0.0.1:40232**. P2P alone remains public on 18233. Optional Zaino management ports are loopback-only if that profile is enabled. Z3's gitignored `.env.testnet` now includes the override in `COMPOSE_FILE`, so ordinary `docker compose --env-file .env.testnet` commands inherit it. Only Zebra's container was recreated with the **same 7.0.0 image and named v29 chain volume**; it reopened the database, regained healthy status, and authenticated local RPC reported testnet height **4,539,400** after the change. The stopped Zallet wallet and chain volumes were not deleted.

Keep the override file at its documented absolute path on this host. On a different host, update `COMPOSE_FILE` to that host's reviewed override path before starting services. Do not run Z3 with the base Compose file alone: doing so may re-expose management ports. The authorized ShadowBid worker running on this WSL host can reach loopback RPC; a remote worker needs a private tunnel or equally trusted secured interface. Never expose wallet RPC or cookie authentication to the public internet. To confirm effective and running bindings without showing credentials:

```bash
cd /home/sopski/projects/z3
docker compose --env-file .env.testnet config --format json | python3 -c 'import sys,json; d=json.load(sys.stdin); print({n:d["services"][n].get("ports") for n in ("zebra","zallet")})'
docker ps --format '{{.Names}} {{.Status}} {{.Ports}}' --filter name=z3-testnet
```

The separate regtest stack also had public host RPC bindings. Its gitignored `.env.regtest` now appends [the regtest loopback override](../ops/z3-regtest-loopback.yml) to `COMPOSE_FILE`. Observed bindings changed from `0.0.0.0:29232` and `0.0.0.0:28080` for Zebra and `0.0.0.0:50232` for Zallet to `127.0.0.1` on the same ports. Its optional RPC router, Zaino, and monitoring profile ports are likewise loopback-only. Recreating the containers exposed that the gitignored regtest TOML files were missing; `scripts/regtest-init.sh --prepare-only` restored those files without Docker startup or volume mutation. The same `z3-regtest-chain` and `z3-regtest-zallet` volumes remained attached. Zebra reopened chain height 112 and became healthy, and Zallet reached the regtest tip. Run only the `--prepare-only` form when recovering config on an existing wallet; the full initialization script contains startup and mining steps.

On 2026-10-24, the local Z3 testnet Compose project in `/home/sopski/projects/z3` was running `zfnd/zebra:6.2.3` and was unhealthy at height 105,600. NU7 activated on public testnet at height **4,465,026**. The [Zebra 7.0.0 release](https://zfnd.org/zebra-7-0-0-release/) supports NU7 and publishes `zfnd/zebra:7.0.0`; the [release candidate notes](https://zfnd.org/zebra-7-0-0-rc-0-nu7-arrives-on-testnet/) say older testnet operators must upgrade before activation.

The testnet-only, gitignored `.env.testnet` now overrides `Z3_ZEBRA_IMAGE=zfnd/zebra:7.0.0`. The official image digest observed locally was `sha256:a70d2be8ffef3a4b6e37355724e36a0e6c1838e46baa28bfb216739f00cf2d34`. Only the testnet Zebra container was recreated; the `z3-testnet-chain` and cookie volumes remain attached. Zallet was not started, and no testnet wallet volume existed. Regtest and mainnet image settings were not changed.

Before startup, the stopped `state/v28` directory was archived to `/tmp/shadowbid-z3-testnet-v28-20261024.tar.gz` (SHA-256 `5cf76156708c5c42b3b4c3e8c3aacddab0bb49899260cef0540890224129050f`). Zebra 7.0.0 then logged an automatic upgrade from state format v28 to **v29** and resumed from height 105,600. A 2026-10-24 authenticated RPC check reported public testnet height **1,196,800** and verification progress **32.62%**; height was increasing, but the node was **not synchronized** and `/ready` remained unhealthy. The archive is a temporary local rollback artifact; copy it to a durable location before relying on it.

Zebra 6.x cannot read v29 state. Reverting the image tag alone will fail; a rollback requires restoring the v28 backup to the stopped chain volume or resyncing from genesis. Do not delete a Docker volume or wallet identity. [Zebra's state-format explanation](https://zfnd.org/zebra-7-0-0-release/).

Z3 currently pins Zallet `v0.1.0-beta.1` and runs its **RPC-backed `zallet-zaino` binary**, not the direct Zebra state reader. That avoids direct v29 database access, but it does not prove that this July beta can parse or build post-NU7 transactions. The [latest published Zallet release](https://github.com/zcash/zallet/releases/latest) is beta.3 from August, before NU7 testnet activation; its RPC surface adds methods including `z_sendfromaccount`. No compatible public-testnet wallet transaction has been observed here. Keep spending keys and wallet data in the separate worker host, and test `rpc.discover`, wallet sync, unique receiver assignment, an exact shielded payment, and three confirmations after Zebra reaches tip. Do not label checkout as public-testnet verified before those checks pass.

## Read-only operator checks

```bash
cd /home/sopski/projects/z3
docker compose --env-file .env.testnet config --images
docker compose --env-file .env.testnet ps
docker compose --env-file .env.testnet logs --tail=40 zebra
curl -i http://127.0.0.1:18080/ready
```

`/ready` should only be expected to return 200 when Zebra has synchronized within the configured four-block lag. To check chain height through local authenticated RPC without printing the cookie, run:

```bash
docker exec z3-testnet-zebra-1 sh -c 'curl -sS --user "$(cat /var/run/auth/.cookie)" -H "content-type: application/json" --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getblockchaininfo\",\"params\":[]}" http://127.0.0.1:18232' | python3 -c 'import sys,json; r=json.load(sys.stdin)["result"]; print({k:r.get(k) for k in ("chain","blocks","headers","verificationprogress")})'
```

Zebra was healthy after the loopback port change, with 36 peers and authenticated height **4,539,465** at the later check. Wallet compatibility, not Zebra sync, is the current settlement blocker. The official [Z3 testnet setup](https://github.com/ZcashFoundation/z3) describes the separate Compose project and named volumes.
