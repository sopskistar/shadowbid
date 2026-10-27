# SHADOWBID — THE PRIVATE DOMAIN AFTERMARKET

**Private auctions. Public outcomes.** The revised 117-second film extends the existing Remotion project, brand, genuine production footage, controlled receipt demonstration, original score and synthetic narration voice. It adds verified public-testnet invoice settlement.

**Published final video: https://youtu.be/K3JkEqG3q1Y**

- Final revised MP4: `output/shadowbid-zecathon-demo-revised.mp4`.
- Original, unchanged: `output/shadowbid-zecathon-demo.mp4`.
- Byte-identical original backup: `output/shadowbid-zecathon-demo-original-recovered.mp4`.
- Original editable source archive: `output/editable-source-recovered-20261027.tar.gz`.
- Revised captions: `output/shadowbid-zecathon-demo-revised.srt`.
- [Narration and storyboard](docs/STORYBOARD.md), [claim evidence](docs/CLAIMS_EVIDENCE.md), [asset licenses](docs/ASSET_LICENSES.md), [validation](docs/VALIDATION.md).

## Reproduce the revised cut

```bash
cd demo-video
npm ci
mkdir -p output
node scripts/voice.mjs
python3 scripts/revise-media.py
npm run lint
npm run render
npm run thumbnail
npm run validate
node scripts/check-playback.mjs
```

Append `-- --browser-executable=/absolute/path/to/chrome` to render/thumbnail commands if needed. Existing revised voice clips are reused; the model runs locally. The source uses `src/captions-revised.json`, `public/audio/master-revised.wav` and `public/captures/invoice-payment-proof.json`. Finished assets render without wallet or account access. The older processing scripts are preserved for the original edit and should not be used to regenerate the revised cut.

Private raw captures, wallet files, credentials, model cache and render outputs are excluded from Git. The root app excludes the video project from TypeScript/ESLint and Vercel uploads. The original soundtrack and captions remain preserved locally/source archive.

The local public-testnet proof is a same-wallet self-transfer: A Paid, B Unpaid, exact amount and recipient, active-chain confirmations and paid restart. It does not establish mainnet settlement, independent-buyer custody, escrow or registrar transfer. Production collection remains disabled.

The owner published the final film at the YouTube link above; the [submission packet](../docs/ZECATHON_SUBMISSION.md) includes it. The existing MP4 is preserved without another render or upload. The owner performs the final organizer submission.
