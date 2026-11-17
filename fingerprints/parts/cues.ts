// The score's hits as frames, for the picture: what the score sounds, the picture shows on the same frame.
import score from "./score.gen.json";
import { FPS } from "./timeline";

const HITS = (score as unknown as { hits: { t: number; name: string }[] }).hits;

/** the frames of every hit of one sound between two frames (inclusive, exclusive), in order */
export const cues = (name: string, from = 0, to = Infinity) =>
  HITS.map((h) => ({ name: h.name, f: Math.round(h.t * FPS) })).filter((h) => h.name === name && h.f >= from && h.f < to).map((h) => h.f).sort((a, b) => a - b);
