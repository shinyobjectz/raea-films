// The transitions' sound: a few made effects on the cuts the foley can't hear (the director, 11-12: "add more transitional
// sound effects if possible we have to be selective"). Each is ElevenLabs Sound Effects (media/gen/trans/NAME/out.mp3,
// two takes made of each, the one picked by its shape), laid so the moment it is for lands on the picture's: `hit` is
// the second in the take that is that moment (its peak, or its onset), `at` the song second it lands on.
// tools/trans-mix.sh lays them as out/v3/stems/trans.wav at the foley's level, each moved by its own `level`.
import { shot } from "./plan";

export type Trans = { name: string; take: string; hit: number; at: number; level?: number; why: string };
const f0 = (id: string) => shot(id).f0 / 30;
export const TRANSITIONS: Trans[] = [
  { name: "pull", take: "pull-a", hit: 0.25, at: f0("painting") + 0.25, level: -4, why: "the pull-out from the garden's canvas across the bedroom: a soft whoosh back" },
  { name: "drop", take: "drop-a", hit: 0.1, at: f0("fern") + 1.15, level: -2, why: "the drop at the fern's tip lets go: one plip" },
  // (the glare's shimmer went with the sun, 11-12: the glade is fog now, and the cut to the dock is a tree passing the lens)
  { name: "tree", take: "pull-a", hit: 0.25, at: f0("harbour"), level: -3, why: "the trunk passing close by the lens over the cut to the dock: a soft whoosh" },
  { name: "rush", take: "rush-b", hit: 0.4, at: f0("hotel"), level: -2, why: "the corridors at the train's speed: the air rushing past" },
  { name: "storm", take: "storm-a", hit: 0.6, at: f0("sea"), level: -3, why: "out of the faces into the storm: a low swell gathering, held over the cut" },
];
