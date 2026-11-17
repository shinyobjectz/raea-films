// The frame's thirds, where every match cut leaves and lands (the director, 11-11: "storybaord how we are goign to use
// structure and rule fo thirds on screne to do the match cuts as we move between scenes"). A point is one of the four
// thirds intersections, the middles of the thirds lines, or the centre; a line is one of the four thirds lines; FULL
// is a thing that fills the frame (a screen pushed into, a sheet over the lens, a car's flank passing it).
export type Point = "TL" | "TC" | "TR" | "ML" | "CC" | "MR" | "BL" | "BC" | "BR";
export type Line = "H1" | "H2" | "V1" | "V2";
export type At = Point | Line | "FULL";
export type Glyph = "circle" | "rect" | "hline" | "vline" | "vanish" | "diag" | "blob" | "streaks" | "dots";

/** a point's place on the frame, 0..1 across and down */
export const POINTS: Record<Point, [number, number]> = {
  TL: [1 / 3, 1 / 3], TC: [1 / 2, 1 / 3], TR: [2 / 3, 1 / 3],
  ML: [1 / 3, 1 / 2], CC: [1 / 2, 1 / 2], MR: [2 / 3, 1 / 2],
  BL: [1 / 3, 2 / 3], BC: [1 / 2, 2 / 3], BR: [2 / 3, 2 / 3],
};
/** a line's place: H across at that height, V down at that width */
export const LINES: Record<Line, { axis: "H" | "V"; at: number }> = { H1: { axis: "H", at: 1 / 3 }, H2: { axis: "H", at: 2 / 3 }, V1: { axis: "V", at: 1 / 3 }, V2: { axis: "V", at: 2 / 3 } };
export const NAMES: Record<At, string> = {
  TL: "upper-left third", TC: "upper third, centre", TR: "upper-right third", ML: "left third, middle", CC: "centre",
  MR: "right third, middle", BL: "lower-left third", BC: "lower third, centre", BR: "lower-right third",
  H1: "upper thirds line", H2: "lower thirds line", V1: "left thirds line", V2: "right thirds line", FULL: "the whole frame",
};
/** where a thing at `at` sits, for a match: lines and points compare as places on the frame */
export const centreOf = (at: At): [number, number] => {
  if (at === "FULL") return [0.5, 0.5];
  if (at in POINTS) return POINTS[at as Point];
  const l = LINES[at as Line];
  return l.axis === "H" ? [0.5, l.at] : [l.at, 0.5];
};
/** glyphs that read as the same thing across a cut */
export const SAME: Glyph[][] = [["circle"], ["rect"], ["hline"], ["vline", "diag"], ["vanish"], ["blob", "streaks", "dots"]];
export const matches = (a: Glyph, b: Glyph) => SAME.some((g) => g.includes(a) && g.includes(b));
