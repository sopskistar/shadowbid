# Revised film validation — October 27, 2026

Finished MP4: `/home/sopski/projects/shadowbid/demo-video/output/shadowbid-zecathon-demo-revised.mp4`.

The recovered revised MP4 was complete, but visual review found that its Paid checkout image was cropped at both edges. A narrow Remotion change fits that image inside its existing frame. The same 117-second composition, narration, score, evidence and other footage were retained. The recovered revision is backed up as `output/shadowbid-zecathon-demo-revised-before-framing-fix.mp4`.

Final export: **117.013 seconds; 1920 × 1080; 30 fps; H.264, correctly tagged full-range 8-bit 4:2:0; stereo AAC; 18,353,896 bytes**. SHA-256: `1b22514fb1b148f5d92775842e3281596402059e4b516a91db0792c924c1b6e2`.

`output/validation-revised.json` records a complete FFmpeg decode, matching video/audio durations, no black section of 0.4 seconds or more, and no silence of 1 second or more at the configured threshold. Audio measures **−16.01 LUFS integrated, −2.46 dBTP**, with original synthesized music/effects and locally generated narration. All **22** sentence captions exactly match their narration schedule and do not overlap. The SRT and burned captions use the same timings. This is sentence-level synchronization, not word-level forced alignment.

Chromium successfully played and sought through the actual revised file. Mobile-landscape framing was checked at 844 × 475. H.264/AAC is the intended Windows/mobile delivery format; no physical Windows or mobile device was available for native-device testing. Owner full listening and signed-out YouTube playback remain final publication checks.

The contact sheet and full-resolution samples were reviewed, including the corrected Paid checkout and the evidence card. The film shows the genuine domscout.xyz result (three commitments, 0.12 ZEC) separately from the local 0.01 TAZ self-transfer. The card's ten confirmations are the recorded October 27 observation, not a live counter. A Paid/B Unpaid and disabled production collection are explicit. The operator sees reveals, transfer is manual, and escrow/mainnet are not claimed. No private credentials were observed in the sampled frames.

The original MP4 and its original-recovered backup remain byte-identical with SHA-256 `930fd8e67636b92db73ee4942e1cc8e9892338b5ff6065a9ba8855a2e4823f56`. Editable source and the previous source archive are preserved. A revised thumbnail and SRT are available in `output/`. Nothing has been uploaded or published.
