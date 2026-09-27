import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Fonts ship in public/fonts so renders don't depend on Google Fonts at runtime.
// Both are variable fonts, so one file covers every weight.
export const serif = "Playfair Display";
export const sans = "Inter";

loadFont({
  family: serif,
  url: staticFile("fonts/PlayfairDisplay-normal.woff2"),
  weight: "400 900",
});
loadFont({
  family: serif,
  url: staticFile("fonts/PlayfairDisplay-italic.woff2"),
  weight: "400 900",
  style: "italic",
});
loadFont({
  family: sans,
  url: staticFile("fonts/Inter-normal.woff2"),
  weight: "100 900",
});

export const colors = {
  bg: "#0B0A09",
  cream: "#F2EDE4",
  muted: "#9C958A",
  gold: "#C9A46A",
  line: "rgba(242, 237, 228, 0.14)",
};

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const TRANSITION_FRAMES = 15;

// Scene lengths in frames. The main video subtracts the overlapping transitions.
export const scenes = {
  hook: 120,
  intro: 90,
  whenData: 210,
  whenStart: 210,
  frequency: 150,
  howTo1: 210,
  howTo2: 210,
  after: 180,
  outro: 150,
};

export const totalDuration =
  Object.values(scenes).reduce((a, b) => a + b, 0) -
  (Object.keys(scenes).length - 1) * TRANSITION_FRAMES;
