// The heat look in motion, for the director to judge before the film is built on it: type and stock shots cut together,
// three seconds each, silent. Render: tools/thermal-reel.sh (one process, frames to out/heat-reel, then ffmpeg).
import { AbsoluteFill, Composition, Sequence, registerRoot } from "raea";
import { ClipShot, FPS, TypeShot } from "./thermal/shots";

const EACH = 90;
const SHOTS: ({ type: string; size?: number; caption?: string } | { clip: string })[] = [
  { type: "Every editor has a touch.", caption: "and Fingerprint learns yours" },
  { clip: "sunset" },
  { clip: "fog" },
  { clip: "glasses" },
  { clip: "shadows" },
  { clip: "notebook" },
  { clip: "editor" },
  { type: "Fingerprint", size: 1.9, caption: "your eye, on every cut" },
];

function Reel() {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {SHOTS.map((s, i) => (
        <Sequence key={i} from={i * EACH} durationInFrames={EACH}>
          {"type" in s ? <TypeShot text={s.type} id={`t${i}`} size={s.size} caption={s.caption} span={EACH} /> : <ClipShot name={s.clip} />}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}

registerRoot(() => <Composition id="thermal-reel" width={1920} height={1080} fps={FPS} durationInFrames={SHOTS.length * EACH} component={Reel} />);
