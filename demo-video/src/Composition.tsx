import {
  AbsoluteFill,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import {
  Problem,
  Question,
  Product,
  Bidding,
  Reveal,
  Outcome,
  Checkout,
  Closing,
} from "./scenes";
import { C } from "./design";
import captions from "./captions-revised.json";

function Captions() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const cue = captions.find((c) => ms >= c.startMs && ms < c.endMs);
  if (!cue) return null;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 32,
        left: 100,
        right: 100,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          maxWidth: 1580,
          padding: "15px 28px",
          borderRadius: 12,
          background: "#05060cee",
          color: "#fff",
          fontSize: 36,
          lineHeight: 1.28,
          textAlign: "center",
          fontWeight: 600,
          boxShadow: "0 5px 25px #0009",
          whiteSpace: "pre-line",
        }}
      >
        {cue.text}
      </div>
    </div>
  );
}
export function ShadowBidFilm() {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{ fontFamily: "Inter", background: C.bg, color: C.text }}
    >
      <Sequence
        name="01 · The public bidding problem"
        durationInFrames={12 * fps}
      >
        <Problem />
      </Sequence>
      <Sequence
        name="02 · What if your offer stayed yours"
        from={12 * fps}
        durationInFrames={11 * fps}
      >
        <Question />
      </Sequence>
      <Sequence
        name="03 · Real owner auctions"
        from={23 * fps}
        durationInFrames={14 * fps}
      >
        <Product />
      </Sequence>
      <Sequence
        name="04 · Genuine sealed bid and receipt"
        from={37 * fps}
        durationInFrames={17 * fps}
      >
        <Bidding />
      </Sequence>
      <Sequence
        name="05 · Timed practice reveal verification"
        from={54 * fps}
        durationInFrames={22 * fps}
      >
        <Reveal />
      </Sequence>
      <Sequence
        name="06 · Public result and privacy boundary"
        from={76 * fps}
        durationInFrames={15 * fps}
      >
        <Outcome />
      </Sequence>
      <Sequence
        name="07 · Private invoice and verified receiver evidence"
        from={91 * fps}
        durationInFrames={14 * fps}
      >
        <Checkout />
      </Sequence>
      <Sequence
        name="08 · Roadmap and closing"
        from={105 * fps}
        durationInFrames={12 * fps}
      >
        <Closing />
      </Sequence>
      <Audio
        name="Mastered narration, original score and interface sound design"
        src={staticFile("audio/master-revised.wav")}
      />
      <Captions />
    </AbsoluteFill>
  );
}
