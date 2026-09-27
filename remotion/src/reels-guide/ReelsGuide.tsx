import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import {
  AfterScene,
  FrequencyScene,
  HookScene,
  HowTo1Scene,
  HowTo2Scene,
  IntroScene,
  OutroScene,
  WhenDataScene,
  WhenStartScene,
} from "./scenes";
import { colors, TRANSITION_FRAMES } from "./theme";

const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: 6,
          backgroundColor: colors.gold,
          width: `${interpolate(frame, [0, durationInFrames - 1], [0, 100])}%`,
        }}
      />
    </AbsoluteFill>
  );
};

const fadeTransition = (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
  />
);

export const ReelsGuide: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: colors.bg }}>
    <TransitionSeries>
      <TransitionSeries.Sequence name="Hook" durationInFrames={120}>
        <HookScene />
      </TransitionSeries.Sequence>
      {fadeTransition}
      <TransitionSeries.Sequence name="Intro" durationInFrames={90}>
        <IntroScene />
      </TransitionSeries.Sequence>
      {fadeTransition}
      <TransitionSeries.Sequence name="Cuándo: datos" durationInFrames={210}>
        <WhenDataScene />
      </TransitionSeries.Sequence>
      {fadeTransition}
      <TransitionSeries.Sequence name="Cuándo: horarios" durationInFrames={210}>
        <WhenStartScene />
      </TransitionSeries.Sequence>
      {fadeTransition}
      <TransitionSeries.Sequence name="Frecuencia" durationInFrames={150}>
        <FrequencyScene />
      </TransitionSeries.Sequence>
      {fadeTransition}
      <TransitionSeries.Sequence name="Cómo 1-3" durationInFrames={210}>
        <HowTo1Scene />
      </TransitionSeries.Sequence>
      {fadeTransition}
      <TransitionSeries.Sequence name="Cómo 4-6" durationInFrames={210}>
        <HowTo2Scene />
      </TransitionSeries.Sequence>
      {fadeTransition}
      <TransitionSeries.Sequence name="Después" durationInFrames={180}>
        <AfterScene />
      </TransitionSeries.Sequence>
      {fadeTransition}
      <TransitionSeries.Sequence name="Cierre" durationInFrames={150}>
        <OutroScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
    <ProgressBar />
  </AbsoluteFill>
);
