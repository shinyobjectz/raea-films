// The thermal score's TokenSynth instruments (no drones, the director 11-13): a pulse bass, a felt piano, staccato cellos, a
// glassy pluck. thermal-instruments.tsx renders their candidates; score.ts plays the curated picks.
export const INSTRUMENTS = {
  bass: { timbre: "deep analog synth bass, short punchy pluck, dark and warm, mono", lo: 24, hi: 48, seconds: 2 },
  piano: { timbre: "soft felt piano, intimate and close, dark and warm", lo: 48, hi: 84, seconds: 4 },
  cello: { timbre: "staccato cello section, short spiccato, dark and tense", lo: 36, hi: 60, seconds: 2 },
  pluck: { timbre: "glassy analog synth pluck, short, clean and bright", lo: 60, hi: 84, seconds: 2 },
} as const;
export const SEEDS = [1, 2, 3];
const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const noteName = (m: number) => `${NAMES[m % 12]}${Math.floor(m / 12) - 1}`;
export const roots = (lo: number, hi: number) => { const r: number[] = []; for (let m = lo; m <= hi; m += 3) r.push(m); return r; };
