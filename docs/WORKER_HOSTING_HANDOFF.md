# Always-on observer and production release handoff

**Prepared, not deployed. Production collection remains disabled.** The laptop/WSL observer is not a reliable judging host. The live marketplace and `/try` work without it; the sanitized payment proof remains inspectable without another payment.

## Simplest host for the current code

Use a dedicated always-on Linux VM, persistent encrypted storage, Docker, Node 22+, Python 3, and systemd. Keep the existing isolated app/PostgreSQL and observer together on loopback: the current receiver worker intentionally refuses remote app URLs. This preserves the tested code and avoids pretending that a Vercel worker is active. Publish no database, wallet RPC, or invoice checkout port. Administration should use SSH with an allowlist or a private VPN.

An existing trusted Linux server is the quickest option. If purchasing a VM, Hetzner Cloud is one candidate with persistent block volumes; **attached volumes are excluded from server snapshots/backups**, so encrypted wallet/database backups must be arranged explicitly. No provider account, region, VM, purchase or upload was selected or authorized. [Provider volume documentation](https://docs.hetzner.com/cloud/volumes/overview/).

Size storage from the current Zebra database plus growth headroom before choosing a plan; do not assume a tiny general-purpose instance can hold a full node. Preserve the pinned Zcash/Zingolib image and tested recipient binary hash. Test the current lightwallet TLS endpoint and IPv4 mapping on the destination. Never disable TLS hostname verification or treat the current IP as permanent.

The release recovery measured **14 GiB** at `/home/zebra/.cache/zebra` in the existing testnet container. This excludes Docker images/build caches, wallet/database backups, operating system and growth. Allocate substantially more total persistent space; measure again before provisioning. This is a testnet measurement, not a mainnet sizing estimate.

## Migration checklist after host approval

1. Provision a dedicated `shadowbid` user with UID 1000, matching the current container's wallet UID. Place reviewed source at `/srv/shadowbid`. Docker access is privileged: only the trusted operator/service account receives it.
2. Build/install dependencies and the pinned image without secrets. Preserve both wallet backups and source archives. Transfer wallet state, immutable receiver bindings, approval/attempt journal, database and replay-nonce tables over an authenticated encrypted channel. Paths remain `.env.nu7-receiver/` and `.env.invoice-experiment/`; directories 700 and secret/state files 600. Never put them in Git or Vercel.
3. Pause the original observer/scanner for a coherent final copy; retain it for rollback. Run only one scanner/writer against a wallet. Do not derive new addresses, restore an older wallet over a newer one, re-run the approved sender, or erase the consumed attempt record.
4. Restore the experiment database on `127.0.0.1:55435`, retain its exact invoice IDs, and configure the loopback app on `127.0.0.1:3101`. Keep Zebra RPC at `127.0.0.1:18232`; retain cookie authentication and the expected `z3-testnet-zebra-1` container name. Only peer networking may be publicly reachable. Scanner name is `shadowbid-nu7-receiver-scan`; it starts no management listener.
5. Review the [app service](../ops/shadowbid-invoice-app.service.example) and [observer service](../ops/shadowbid-invoice-observer.service.example). The templates are not installed or enabled. They require the existing protected configuration and Docker services; they do not create or fund wallets. Set container restart policies after approval. Verify service stop/resume leaves the scanner running and releases both locks.
6. Run the real settlement acceptance and authenticated checkout checks. Reboot the VM; verify the same wallet, bindings, A Paid/B Unpaid, one payment-note identity, persisted replay rejection and a fresh chain-checked heartbeat. Interrupt the lightwallet endpoint; checkout must hide instructions. Restore connectivity and confirm recovery.
7. Configure an external watchdog that alerts when heartbeat age exceeds 60 seconds, state is not connected, disk space is low, the scanner exits, or the wallet lags Zebra. A process being alive is not proof of a healthy observer. Exercise the alert and an encrypted backup restore before relying on it during judging.

## Production configuration remains a separate release

### Configuration and costs

The existing protected `.env.invoice-experiment/worker.json` contains `app_url`, `database_url`, `worker_secret`, and `adapter_sha256`. Preserve its values; the runner maps the first three to `PUBLIC_APP_URL`, `DATABASE_URL`, and `WORKER_SECRET`. It sets `ZCASH_NETWORK=testnet`, `LOCAL_AUTH_BYPASS=true`, `ALLOW_SHORT_AUCTIONS=true`, `EMAIL_VERIFICATION_MODE=disabled`, empty `RESEND_API_KEY`/`VERCEL_ENV`, and `SHADOWBID_ZINGO_INVOICE_CLI` for the isolated observer. These local bypass settings must never be copied into Vercel. Ensure `VERCEL` is absent on the isolated host. Zebra authentication is read from the existing container's `/var/run/auth/.cookie`; no public RPC URL or shared password is needed.

An existing trusted server avoids a new rental bill but still needs storage, backups, uptime and operator attention. For a new VM, use **USD 40–100/month as an initial planning allowance, not a provider quote**, then obtain a region-specific quote after measuring the full-node database. Budget separately for persistent block storage, encrypted off-host backups, tax and any bandwidth charges; large chain storage can exceed this allowance. Current [provider plans](https://www.hetzner.com/cloud/) and [volume rules](https://docs.hetzner.com/cloud/volumes/overview/) must be checked at purchase. Do not purchase the cheapest advertised VM without sizing the node. Allow several hours for owner provisioning, secure state transfer, chain catch-up and reboot/restore testing; chain synchronization may take longer.

The owner must choose the host/account, provision access and storage, transfer the protected state, install the reviewed services, configure alerts/backups, and approve any later production integration. Vercel and Neon can continue serving the marketplace and judge practice without this move. The present worker cannot report to Vercel/Neon: both its app-origin and application database policy are loopback-only. Moving it alone does not enable production collection.

### Recovery finding: restart is not readiness

The final recovery reproduced a stopped loopback app (`Connection refused`); restarting it restored HMAC access and durable replay rejection. It also found a separate scanner failure: repeated Nym discovery timeouts and intermittent transport errors, with the wallet behind Zebra. The configured `testnet.zec.rocks` IPv4 mapping still matched DNS at inspection. An `unless-stopped` restart policy was present but did not make scanning healthy. Preserve fail-closed gating; diagnose Nym/lightwallet connectivity and require fresh chain-checked observations before calling a migrated host ready. Do not mark health connected manually or loosen the two-block lag limit.

Vercel should retain `ZCASH_NETWORK=testnet`, production authentication, and the existing release lock. Do not set `LOCAL_AUTH_BYPASS=true` or `ALLOW_SHORT_AUCTIONS=true` in production. Wallet material and RPC credentials stay off Vercel. The current code rejects worker observations on Vercel regardless of a heartbeat; the local host templates cannot activate collection there.

A future release must separately replace the loopback-only worker policy with a reviewed exact HTTPS origin allowlist, production authentication, redirect rejection, authenticated requests, timestamp checks and durable unique nonces. Keep private RPC, immutable receiver assignments, active-chain verification, integer amounts, atomic note identity constraints, and stale-health gating. HMAC authenticates the trusted worker's assertion; it is not a trustless proof of decryption. Test the actual external deployment before asking for production collection approval.

## Git deployment caution

Local `vercel.json` sets `git.deploymentEnabled: false`, matching [Vercel's documented all-branch Git setting](https://vercel.com/docs/project-configuration/git-configuration#turning-off-all-automatic-deployments). A fresh anonymous GitHub check found **no `vercel.json` on remote `main`**. Existing main has a successful Vercel status. Therefore a push must be treated as potentially deploying; the local untracked file is not proof of effective remote disablement. Manual CLI, dashboard, deploy-hook and workflow paths are separate.

Before any approved push, inspect the actual Vercel project Git integration and confirm the intended deployment behavior. Source push, deployment, external-host migration, production collection, additional payments, video publication and final organizer submission require their own owner approvals. None was performed here.
