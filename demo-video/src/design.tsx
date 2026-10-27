import React from "react";
import {
  AbsoluteFill,
  CanvasImage,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { Video } from "@remotion/media";
import { loadFont } from "@remotion/fonts";

loadFont({
  family: "Inter",
  url: staticFile("fonts/inter-latin-400-normal.woff2"),
  weight: "400",
});
loadFont({
  family: "Inter",
  url: staticFile("fonts/inter-latin-600-normal.woff2"),
  weight: "600",
});
loadFont({
  family: "Inter",
  url: staticFile("fonts/inter-latin-700-normal.woff2"),
  weight: "700",
});
loadFont({
  family: "Cormorant",
  url: staticFile("fonts/cormorant-garamond-latin-500-italic.woff2"),
  weight: "500",
  style: "italic",
});
export const C = {
  bg: "#080a13",
  panel: "#131424",
  text: "#f7f5ff",
  muted: "#aba9c0",
  violet: "#ab87ff",
  gold: "#edc97e",
  line: "#333047",
  green: "#94d8bb",
  red: "#f09ba9",
};
export const ease = Easing.bezier(0.16, 1, 0.3, 1);
export const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};
export function Enter({
  children,
  delay = 0,
  style = {},
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        opacity: interpolate(f, [delay, delay + 22], [0, 1], clamp),
        translate: `0 ${interpolate(f, [delay, delay + 32], [42, 0], { ...clamp, easing: ease })}px`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
export function Background() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at ${70 + Math.sin(f / 190) * 8}% ${35 + Math.cos(f / 200) * 8}%,#39215a80,transparent 55%),radial-gradient(ellipse at 15% 95%,#132a3d70,transparent 48%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(#a695cf07 1px, transparent 1px),linear-gradient(90deg,#a695cf07 1px, transparent 1px)",
          backgroundSize: "88px 88px",
          maskImage: "linear-gradient(transparent,black,transparent)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          right: 0,
          height: 2,
          background: "linear-gradient(90deg,transparent,#9d78d9,transparent)",
          opacity: 0.6,
        }}
      />
    </AbsoluteFill>
  );
}
export function Logo({
  size = 54,
  word = true,
}: {
  size?: number;
  word?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.24 }}>
      <CanvasImage
        src={staticFile("brand/shadowbid-icon.png")}
        style={{ width: size, height: size, objectFit: "contain" }}
      />
      {word && (
        <span
          style={{
            fontWeight: 700,
            fontSize: size * 0.55,
            letterSpacing: -1.5,
          }}
        >
          ShadowBid
        </span>
      )}
    </div>
  );
}
export function Label({
  children,
  tone = "violet",
}: {
  children: React.ReactNode;
  tone?: "gold" | "violet" | "green" | "red";
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        fontSize: 22,
        letterSpacing: 2,
        fontWeight: 600,
        color: C[tone],
        textTransform: "uppercase",
      }}
    >
      <span
        style={{ width: 7, height: 7, borderRadius: 8, background: C[tone] }}
      />
      {children}
    </div>
  );
}
export function Chapter({
  number,
  label,
  title,
  tag,
}: {
  number: string;
  label: string;
  title: string;
  tag: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 82,
        right: 82,
        top: 44,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", gap: 25, alignItems: "center" }}>
        <span style={{ fontSize: 20, color: C.gold, fontFamily: "monospace" }}>
          /{number}
        </span>
        <div>
          <div
            style={{
              fontSize: 17,
              letterSpacing: 3,
              color: C.muted,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            {label}
          </div>
          <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: -1.4 }}>
            {title}
          </div>
        </div>
      </div>
      <div
        style={{
          fontSize: 18,
          letterSpacing: 1.4,
          padding: "14px 20px",
          border: "1px solid " + C.line,
          borderRadius: 30,
          color: C.muted,
          maxWidth: 480,
          textAlign: "right",
        }}
      >
        {tag}
      </div>
    </div>
  );
}
export function Browser({
  src,
  label,
  zoom = 1,
  position = "center",
  style = {},
}: {
  src: string;
  label: string;
  zoom?: number;
  position?: string;
  style?: React.CSSProperties;
}) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        left: 180,
        top: 157,
        width: 1560,
        height: 795,
        borderRadius: 24,
        overflow: "hidden",
        border: "1px solid #605572",
        boxShadow: "0 40px 95px #0008",
        background: "#0d0d15",
        scale: interpolate(f, [0, fps], [0.97, 1], { ...clamp, easing: ease }),
        ...style,
      }}
    >
      <div
        style={{
          height: 43,
          background: "#1a1926",
          display: "flex",
          alignItems: "center",
          padding: "0 22px",
          gap: 8,
          borderBottom: "1px solid #332e44",
        }}
      >
        {["#92728a", "#ae9677", "#778e8b"].map((color) => (
          <i
            key={color}
            style={{
              width: 10,
              height: 10,
              borderRadius: 8,
              background: color,
            }}
          />
        ))}
        <div
          style={{
            marginLeft: 24,
            fontSize: 17,
            color: "#c3bed1",
            letterSpacing: 0.7,
          }}
        >
          {label}
        </div>
        <div style={{ marginLeft: "auto", fontSize: 13, color: "#908b9e" }}>
          ACTUAL APPLICATION CAPTURE
        </div>
      </div>
      <div
        style={{
          height: "calc(100% - 43px)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Video
          src={staticFile(src)}
          muted
          objectFit="cover"
          style={{
            width: "100%",
            height: "100%",
            objectPosition: position,
            scale: zoom,
          }}
        />
      </div>
    </div>
  );
}
export function StillBrowser({
  src,
  label,
  fit = "cover",
  style = {},
}: {
  src: string;
  label: string;
  fit?: "cover" | "contain";
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 180,
        top: 157,
        width: 1560,
        height: 795,
        borderRadius: 24,
        overflow: "hidden",
        border: "1px solid #605572",
        background: "#0d0d15",
        boxShadow: "0 40px 90px #0008",
        ...style,
      }}
    >
      <div
        style={{
          height: 43,
          background: "#1a1926",
          padding: "11px 24px",
          fontSize: 17,
          color: C.muted,
        }}
      >
        {label}
      </div>
      <CanvasImage
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "calc(100% - 43px)",
          objectFit: fit,
        }}
      />
    </div>
  );
}
export function Icon({
  kind,
  size = 80,
  color = C.violet,
}: {
  kind: "lock" | "seal" | "check" | "arrow" | "file";
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {kind === "lock" ? (
        <>
          <rect x="17" y="34" width="46" height="35" rx="9" />
          <path d="M25 34V24a15 15 0 0 1 30 0v10" />
          <circle cx="40" cy="49" r="4" />
          <path d="M40 53v7" />
        </>
      ) : kind === "seal" ? (
        <>
          <rect x="9" y="19" width="62" height="44" rx="7" />
          <path d="m11 23 29 23 29-23M11 60l21-20m36 20L48 40" />
        </>
      ) : kind === "check" ? (
        <>
          <circle cx="40" cy="40" r="29" />
          <path d="m25 40 11 12 21-25" />
        </>
      ) : kind === "file" ? (
        <>
          <path d="M20 8h27l15 15v48H20Z" />
          <path d="M47 8v16h15M29 36h24M29 46h24M29 56h16" />
        </>
      ) : (
        <path d="M12 40h55M49 23l18 17-18 17" />
      )}
    </svg>
  );
}
export function EndFade({ duration }: { duration: number }) {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        opacity: interpolate(f, [duration - 8, duration], [0, 1], clamp),
        pointerEvents: "none",
      }}
    />
  );
}
