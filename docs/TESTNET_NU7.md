# Public testnet NU7 node status

On 2026-10-24, the local Z3 testnet Compose project in `/home/sopski/projects/z3` was running `zfnd/zebra:6.2.3` and was unhealthy at height 105,600. NU7 activated on public testnet at height **4,465,026**. The [Zebra 7.0.0 release](https://zfnd.org/zebra-7-0-0-release/) supports NU7 and publishes `zfnd/zebra:7.0.0`; the [release candidate notes](https://zfnd.org/zebra-7-0-0-rc-0-nu7-arrives-on-testnet/) say older testnet operators must upgrade before activation.

The testnet-only, gitignored `.env.testnet` now overrides `Z3_ZEBRA_IMAGE=zfnd/zebra:7.0.0`. The official image digest observed locally was `sha256:a70d2be8ffef3a4b6e37355724e36a0e6c1838e46baa28bfb216739f00cf2d34`. Only the testnet Zebra container was recreated; the `z3-testnet-chain` and cookie volumes remain attached. Zallet was not started, and no testnet wallet volume existed. Regtest and mainnet image settings were not changed.

Before startup, the stopped `state/v28` directory was archived to `/tmp/shadowbid-z3-testnet-v28-20261024.tar.gz` (SHA-256 `5cf76156708c5c42b3b4c3e8c3aacddab0bb49899260cef0540890224129050f`). Zebra 7.0.0 then logged an automatic upgrade from state format v28 to **v29** and resumed from height 105,600. An authenticated RPC check later reported public testnet height 220,800 and verification progress 6.41%; height was increasing, but the node was **not synchronized** and `/ready` remained unhealthy. The archive is a temporary local rollback artifact; copy it to a durable location before relying on it.

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

The current height must advance and the reported verification progress must approach 1 before Zallet wallet synchronization or ShadowBid public testnet settlement can be evaluated. The official [Z3 testnet setup](https://github.com/ZcashFoundation/z3) describes the separate Compose project and named volumes.
