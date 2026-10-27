# Asset provenance and licenses

| Asset | Origin / permission |
| --- | --- |
| ShadowBid icon/logo | Existing owner-supplied project assets, copied unchanged from the application; used for the owner's requested film. |
| Production UI footage | Anonymous read-only capture of the owner's ShadowBid site, 2026-10-26. No third-party screenshot assets. |
| Local UI footage | Actual isolated ShadowBid browser sessions, created for this film. Synthetic accounts and reserved domain; real application behavior. |
| Technical evidence | Sanitized actual wallet observer output and Paid checkout. The approved test receiver, amount and public txid are deliberately disclosed in the proof JSON; no memo, request ID, keys, checkout token or private invoice identifier is included. |
| Motion design / revised real-domain story | Original React/SVG/CSS geometry written for this project. The revised film uses the owner's real marketplace domains and domscout.xyz result. The original fictional Mara/northstar.example material remains preserved in older sources/assets but is not the revised opening or outcome. No Animr assets, sequence, narration or branding copied. |
| Inter | Fontsource local files; SIL Open Font License 1.1. Copy in `licenses/Inter-OFL.txt`; [source](https://github.com/rsms/inter). |
| Cormorant Garamond | Fontsource local files; SIL Open Font License 1.1. Copy in `licenses/Cormorant-Garamond-OFL.txt`; [source](https://github.com/CatharsisFonts/Cormorant). |
| Narration | Generated locally with Kokoro, `af_heart` voice, q8 ONNX CPU model. No impersonation, external TTS API, paid plan or account credentials. [Kokoro ONNX model](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX), Apache-2.0 model license. `kokoro-js` software Apache-2.0. |
| Music and interface accents | Original synthesized score written in `scripts/music.mjs`, deterministic synthesis with no external samples or downloaded tracks. Created for the owner as part of this project. |
| Software | Remotion 4.0.539, React, Playwright, FFmpeg and Kokoro. Software licenses are distinct from exported artwork; retained in dependencies. Remotion's applicable license must be observed if this project is reused by a larger organization. [Remotion license](https://www.remotion.dev/docs/license). |

Narration is synthetic and should not be represented as a human voice recording. No ElevenLabs subscription is required. Generated narration clips and the original soundtrack are included for editable offline rendering.

Remotion setup followed the official [coding-agent workflow](https://www.remotion.dev/docs/ai/coding-agents) and [agent skills](https://www.remotion.dev/docs/ai/skills). Installed skill snapshots are local in `.agents/skills/`. The supplied BasicCaptions resource could not be fetched; the film uses its own readable caption component and standard caption data/SRT export.
