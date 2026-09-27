import "./index.css";
import { Composition, Folder } from "remotion";
import { ReelsGuide } from "./reels-guide/ReelsGuide";
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
} from "./reels-guide/scenes";
import { FPS, HEIGHT, scenes, totalDuration, WIDTH } from "./reels-guide/theme";

const video = { fps: FPS, width: WIDTH, height: HEIGHT };

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ReelsGuide"
        component={ReelsGuide}
        durationInFrames={totalDuration}
        {...video}
      />
      <Folder name="ReelsGuide-Scenes">
        <Composition id="Hook" component={HookScene} durationInFrames={scenes.hook} {...video} />
        <Composition id="Intro" component={IntroScene} durationInFrames={scenes.intro} {...video} />
        <Composition id="WhenData" component={WhenDataScene} durationInFrames={scenes.whenData} {...video} />
        <Composition id="WhenStart" component={WhenStartScene} durationInFrames={scenes.whenStart} {...video} />
        <Composition id="Frequency" component={FrequencyScene} durationInFrames={scenes.frequency} {...video} />
        <Composition id="HowTo1" component={HowTo1Scene} durationInFrames={scenes.howTo1} {...video} />
        <Composition id="HowTo2" component={HowTo2Scene} durationInFrames={scenes.howTo2} {...video} />
        <Composition id="After" component={AfterScene} durationInFrames={scenes.after} {...video} />
        <Composition id="Outro" component={OutroScene} durationInFrames={scenes.outro} {...video} />
      </Folder>
    </>
  );
};
