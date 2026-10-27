# Invoice payment recovery — October 27, 2026

> Superseded payment status: the October 27 continuation completed the single authorized self-transfer and verified Invoice A Paid, Invoice B Unpaid, and worker restart. See [current invoice proof](INVOICE_PAYMENT_PROOF.md). The earlier unpaid/pending statements below are historical. Production collection remains disabled.

**Public-testnet invoice settlement remains NOT VERIFIED. Broadcast approval is pending. Production collection remains disabled.**

## Recovered state

Local and remote `main` are both `f56faf9ef6b7d2ac80e6f9243abbec2a5b3b78d7`. The 33 inherited tracked modifications, untracked video project and handoff documents were preserved. Nothing was staged, committed, pushed or deployed. Z3 remains at `e84ce9f` with its two inherited private environment changes. Unrelated containers were untouched.

The existing invoices remain unpaid, with no payment-note rows. A requests 1,000,000 zatoshis and expires October 29 at 09:00:06.418 UTC. B requests 2,000,000 zatoshis and expires at 09:00:06.667 UTC. Their distinct shielded Unified receivers, wallet indexes 2 and 3, and persisted bindings match. The real auction's deadline was not changed. Protected invoice files and four existing wallet backups retain their recovery hashes and mode 600.

## Funded wallet and sender repair

The existing public-testnet wallet reports local spending authority, rather than viewing-only authority. A fresh preflight at 07:59:31 UTC reported 100,000,000 confirmed spendable zatoshis (1 TAZ), wallet height 4,546,784 and independently checked Zebra height 4,546,785.

The original sender failed to propose a payment: its `InputSource` returned an Ironwood note even when librustzcash requested another pool. The new [pool-selection patch](../patches/zingolib-input-pools.patch), against the same pinned Zingolib revision `4d85349f3cab5f7e4e5273c7f01c34044f17b1a9`, restricts budgeted and all-funds selection to the requested pools. It preserves the existing recipient patch. Six input-source tests (including a new restriction regression) and seven wallet-summary tests passed; the release CLI compiled successfully. The original receiver binary and adapter were preserved.

The separately installed sender produced a proposal for exactly 0.01 TAZ to A with a 0.0001 TAZ fee. Offline proving and signing subsequently passed using a disposable wallet copy in a container with networking disabled. That signed copy was discarded. This establishes local transaction creation capability, not broadcast acceptance or a payment. No seed or spending key was printed or exported.

Reproduction, with the protected experiment configuration already present:

```bash
python3 scripts/prepare-invoice-payment.py --sender-cli /absolute/path/to/tested/sender
python3 scripts/prove-invoice-payment.py
```

The first command quotes without signing. The second signs only in a disposable offline copy and cannot broadcast. The sender hash and quote are retained privately in `.env.invoice-experiment/payment-preflight.json`. A later broadcast must recheck the balance, scanner, invoice mapping, deadline and fee, then use explicit owner approval. This test is a genuine self-transfer between wallet-controlled receivers; it does not establish independent-buyer payment or domain transfer.

## Monitoring and checkout

The scanner's container repeatedly timed out resolving/connecting to `testnet.zec.rocks`. A gRPC request to its freshly resolved IPv4 address, with the original TLS hostname, returned current testnet metadata and NU7 branch `77190ad9`. The scanner now has that IPv4 mapping, using the same pinned image, wallet and sync command. The previous scanner container and inspect record are preserved. No management listener was added. The address mapping is a local recovery measure and must be revalidated if the upstream address changes.

The observer now loads each immutable wallet snapshot once to read height, addresses and all notes. This reduces heartbeat gaps from repeated CLI startup. Parsing requires all three complete JSON results and a clean exit. Active-chain, recipient, integer amount, HMAC and replay checks remain intact. The local worker resumed connected, chain-checked monitoring of both unpaid invoices.

Checkout now displays `PAID`, actual observed confirmation counts, manual refresh and automatic refresh every 15 seconds while visible. Confirmed invoices hide payment instructions. The live `/try` page already states that it creates no payable invoice and does not contain the reported generic offline message. Production health still reports `disabled`; no healthy production status was fabricated.

Validation passed: ESLint, TypeScript, 33 Vitest tests, 22 Python tests, 18 Playwright tests, the production build, both actual winner checkouts, independently decoded QR/ZIP-321 values, and seller/stranger access restrictions. The initial sandbox build reproduced the TypeScript `--showConfig` subprocess failure; the permitted build passed. One actual-checkout attempt encountered an unavailable heartbeat; the check passed after the batching fix under fresh monitoring. Synthetic restart/reorg tests are not a paid-invoice restart demonstration.

## Release and video boundaries

The local `vercel.json` setting `git.deploymentEnabled: false` matches [Vercel's documented all-branch Git deployment control](https://vercel.com/docs/project-configuration/git-configuration#turning-off-all-automatic-deployments). It remains untracked and has not changed remote configuration. GitHub reports a successful Vercel deployment for the existing `f56faf9` commit. No push was attempted, and effective disablement of a future push is not claimed as an observed result. CLI/deploy-hook/manual deployment paths are separate from this Git setting.

A scan of changed/untracked text found no known private environment/account values or private-key blocks. Wallets, private config, raw captures and rendered output remain ignored. Final asset-by-asset visual review and release approval remain outstanding.

The original MP4 is 117.013 seconds, 1920×1080, 30 fps, H.264/AAC. It is preserved at `demo-video/output/shadowbid-zecathon-demo.mp4`, with a byte-identical backup at `demo-video/output/shadowbid-zecathon-demo-original-recovered.mp4`. Editable source/assets are also archived in `demo-video/output/editable-source-recovered-20261027.tar.gz`. The requested video revision has not begun: the owner explicitly prioritized payment completion first.

An external always-on worker has not been provisioned. Production integration, host selection, credentials, funding approval, commit/push/deployment approval and video publication remain separate outstanding steps. No mainnet settlement, escrow or automatic domain custody is claimed.
