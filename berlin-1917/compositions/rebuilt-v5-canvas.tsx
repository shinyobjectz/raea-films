// The records canvas (components/rebuilt/record-canvas.tsx), on its own: the ~60 s tour of the whole desk, and each
// chapter's ~6 s leg as berlin-rebuilt-v5 would cut it in. Silent; a preview of the component, not a film.
import { AbsoluteFill, Composition, registerRoot, useCurrentFrame } from "raea";
import { Fonts } from "../components/rebuilt/labels";
import { CHAPTER_LEGS, RecordCanvas, TOUR_LEGS, TOUR_LEN } from "../components/rebuilt/record-canvas";
import type { Leg, Station } from "../components/rebuilt/record-canvas";

const FPS = 24;

function View({ legs, done }: { legs: Leg[]; done: Station[] }) {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill>
      <Fonts />
      <RecordCanvas t={t} legs={legs} done={done} />
    </AbsoluteFill>
  );
}

registerRoot(() => (
  <>
    <Composition id="rebuilt-v5-canvas" width={1920} height={1080} fps={FPS} durationInFrames={Math.round(TOUR_LEN * FPS)} component={() => <View legs={TOUR_LEGS} done={[]} />} />
    {(Object.keys(CHAPTER_LEGS) as (keyof typeof CHAPTER_LEGS)[]).map((k) => (
      <Composition key={k} id={`rebuilt-v5-canvas-${k}`} width={1920} height={1080} fps={FPS} durationInFrames={Math.round(CHAPTER_LEGS[k].len * FPS)} component={() => <View legs={CHAPTER_LEGS[k].legs} done={CHAPTER_LEGS[k].done} />} />
    ))}
  </>
));
