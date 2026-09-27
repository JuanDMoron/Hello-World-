import React from "react";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, sans, serif } from "./theme";

const ease = Easing.bezier(0.16, 1, 0.3, 1);

// Dark backdrop with a warm glow, vignette and per-frame film grain.
export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(random(`grain-${frame}`) * 1000);

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% 42%, rgba(201,164,106,0.13) 0%, rgba(11,10,9,0) 70%)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 120% 90% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.75) 100%)",
        }}
      />
      <AbsoluteFill style={{ opacity: 0.09, mixBlendMode: "screen" }}>
        <svg width="100%" height="100%">
          <filter id="grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="2"
              seed={seed}
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Scene wrapper: backdrop plus a content column kept inside the Reels safe zone.
export const SceneFrame: React.FC<{
  children: React.ReactNode;
  align?: "center" | "flex-start";
}> = ({ children, align = "flex-start" }) => {
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill
        style={{
          padding: "280px 96px 440px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: align,
          textAlign: align === "center" ? "center" : "left",
          color: colors.cream,
          fontFamily: sans,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Fades and lifts its children in, starting at `delay` seconds.
export const Reveal: React.FC<{
  delay?: number;
  name: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, name, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Interactive.Div
      name={name}
      style={{
        opacity: interpolate(
          frame,
          [delay * fps, delay * fps + 0.7 * fps],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease },
        ),
        translate: interpolate(
          frame,
          [delay * fps, delay * fps + 0.9 * fps],
          ["0px 40px", "0px 0px"],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease },
        ),
        ...style,
      }}
    >
      {children}
    </Interactive.Div>
  );
};

export const Kicker: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Reveal name="Kicker" delay={delay} style={{ marginBottom: 40 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          fontSize: 30,
          fontWeight: 600,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: colors.gold,
        }}
      >
        <div
          style={{
            height: 2,
            backgroundColor: colors.gold,
            width: interpolate(
              frame,
              [delay * fps, delay * fps + fps],
              [0, 72],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease },
            ),
          }}
        />
        {children}
      </div>
    </Reveal>
  );
};

export const Headline: React.FC<{
  children: React.ReactNode;
  delay?: number;
  size?: number;
}> = ({ children, delay = 0.2, size = 104 }) => (
  <Reveal name="Headline" delay={delay}>
    <div
      style={{
        fontFamily: serif,
        fontWeight: 500,
        fontSize: size,
        lineHeight: 1.08,
        letterSpacing: "-0.01em",
      }}
    >
      {children}
    </div>
  </Reveal>
);

export const Accent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ fontFamily: serif, fontStyle: "italic", color: colors.gold }}>
    {children}
  </span>
);

export const Body: React.FC<{
  children: React.ReactNode;
  delay: number;
  style?: React.CSSProperties;
}> = ({ children, delay, style }) => (
  <Reveal name="Body" delay={delay} style={{ marginTop: 48, ...style }}>
    <div style={{ fontSize: 46, lineHeight: 1.35, color: colors.muted }}>
      {children}
    </div>
  </Reveal>
);

// One row of a checklist: gold number, title and a supporting line.
export const Step: React.FC<{
  n: string;
  title: string;
  detail: string;
  delay: number;
}> = ({ n, title, detail, delay }) => (
  <Reveal
    name={`Step ${n}`}
    delay={delay}
    style={{
      display: "flex",
      gap: 36,
      padding: "40px 0",
      borderTop: `1px solid ${colors.line}`,
      width: "100%",
    }}
  >
    <div
      style={{
        fontFamily: serif,
        fontStyle: "italic",
        fontSize: 64,
        color: colors.gold,
        lineHeight: 1,
        minWidth: 72,
      }}
    >
      {n}
    </div>
    <div>
      <div style={{ fontSize: 52, fontWeight: 600, lineHeight: 1.15 }}>
        {title}
      </div>
      <div
        style={{
          fontSize: 40,
          color: colors.muted,
          marginTop: 12,
          lineHeight: 1.35,
        }}
      >
        {detail}
      </div>
    </div>
  </Reveal>
);
