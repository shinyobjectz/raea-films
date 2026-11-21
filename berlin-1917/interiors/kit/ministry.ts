// The ministries' and court offices' rooms on the Wilhelmstraße, the Linden and Leipziger Platz (research/catalogue
// rooms.ts "ministry"; the map lane tags 17 buildings `institution` ministry or court office, and the Herrenhaus and
// Abgeordnetenhaus as parliament). The old palaces' bel étage: rooms of 4.4 to 5.8 m under stucco, parquet, damask on
// the walls, white double doors with gilt overdoors. A state secretary's or a Vortragender Rat's room: the partners'
// desk standing free with the light from the left, a lamp on it, leather armchairs for callers, glazed bookcases of
// the Reichsgesetzblatt, the monarch's portrait in a gilt frame, and in the war the General Staff's map of the fronts
// on the wall. References: the Reichskanzlei's Arbeitszimmer (Bundesarchiv Bild 146-1997-022-35, about 1920-25, the
// rooms unchanged), Bismarck's study in the Reichskanzlerpalais (1889).
// The hotel kit registers the palace versions of its chandelier, club chair and window drapes (kit/hotel.ts).
import { box, lathe, post, rodX, union } from "./geo";
import { bar } from "./porter";
import { prop } from "./prop";
import type { MatId } from "./mats";

/** The partners' desk: two pedestals of drawers both sides, a leather top, the blotter at the official's side (+z),
 *  an inkstand, a stack of files. Origin at its foot's middle; the callers sit at -z. */
prop({
  id: "partners-desk", items: ["partners-desk"], size: [1.9, 0.8, 1.05], place: "floor", tris: 1600,
  parts: () => {
    const wood = [box(1.9, 0.045, 1.05, 0, 0.74, 0), box(0.8, 0.5, 0.03, 0, 0.22, 0)], pulls = [];
    for (const s of [-1, 1]) {
      wood.push(box(0.52, 0.68, 1.0, s * 0.66, 0.06, 0), box(0.56, 0.06, 1.04, s * 0.66, 0, 0));
      for (const f of [-1, 1]) for (let i = 0; i < 3; i++) {
        wood.push(box(0.44, 0.19, 0.012, s * 0.66, 0.1 + i * 0.21, f * 0.506));
        pulls.push(rodX(0.006, 0.09, s * 0.66, 0.2 + i * 0.21, f * 0.522));
      }
    }
    for (const f of [-1, 1]) { wood.push(box(0.72, 0.1, 0.012, 0, 0.62, f * 0.506)); pulls.push(rodX(0.006, 0.12, 0, 0.67, f * 0.522)); }
    return [
      { mat: "wood-dark" as MatId, solid: union(...wood) },
      { mat: "leather" as MatId, solid: box(1.6, 0.004, 0.78, 0, 0.785, 0), overlap: true },
      { mat: "card" as MatId, solid: box(0.52, 0.01, 0.38, 0.05, 0.789, 0.2), overlap: true },
      { mat: "paper" as MatId, solid: union(box(0.3, 0.07, 0.23, -0.55, 0.789, 0.05), box(0.24, 0.005, 0.31, 0.3, 0.799, 0.22)), overlap: true },
      { mat: "brass" as MatId, solid: union(...pulls, box(0.3, 0.022, 0.15, 0.5, 0.789, -0.1)), overlap: true },
      { mat: "glass-dark" as MatId, solid: union(...[-1, 1].map((s) => lathe([[0, 0], [0.035, 0], [0.035, 0.05], [0.012, 0.06], [0, 0.06]], 0.5 + s * 0.08, 0.811, -0.1, 10))), overlap: true },
    ];
  },
});

/** The desk lamp: a brass foot and stem, a green glass shade. It stands on the partners' desk (interiors/furnish.ts). */
prop({
  id: "desk-lamp", items: ["desk-lamp"], size: [0.28, 0.48, 0.28], place: "on", tris: 500,
  parts: () => [
    { mat: "brass", solid: union(lathe([[0, 0], [0.09, 0], [0.085, 0.02], [0.03, 0.04], [0, 0.045]], 0, 0, 0, 16), post(0.009, 0.32, 0, 0.04, 0), post(0.014, 0.03, 0, 0.35, 0)) },
    { mat: "glass-green", solid: lathe([[0, 0], [0.14, 0], [0.13, 0.03], [0.07, 0.1], [0.025, 0.12], [0, 0.12]], 0, 0.34, 0, 20), overlap: true },
  ],
  glow: [{ at: [0, 0.33, 0], lumens: 380, color: "#ffd59a", range: 6 }],
});

/** A glazed bookcase: a cupboard under, shelves of bound law gazettes and files behind two glazed doors, a cornice.
 *  Origin at its foot's middle against the wall (-z), the doors to +z. */
prop({
  id: "bookcase-glazed", items: ["bookcase"], size: [1.6, 2.62, 0.47], place: "wall", tris: 1500,
  parts: () => {
    const wood = [box(0.05, 2.45, 0.45, -0.775, 0.05, 0), box(0.05, 2.45, 0.45, 0.775, 0.05, 0), box(1.6, 0.1, 0.47, 0, 0, 0), box(1.7, 0.12, 0.52, 0, 2.5, 0.01),
      box(1.5, 2.35, 0.02, 0, 0.1, -0.215), box(1.5, 0.8, 0.03, 0, 0.1, 0.21), box(1.5, 0.04, 0.44, 0, 0.9, 0)];
    const books: Record<string, ReturnType<typeof box>[]> = { "cloth-brown": [], "cloth-navy": [], leather: [], "cloth-black": [] };
    const mats = Object.keys(books);
    for (let i = 0; i < 4; i++) {
      const y = 0.94 + i * 0.38;
      if (i) wood.push(box(1.5, 0.025, 0.4, 0, y - 0.025, 0));
      for (let k = 0, x = -0.72; x < 0.7; k++) {
        const w = 0.16 + ((i * 7 + k * 3) % 5) * 0.03, h = 0.26 + ((i + k * 5) % 4) * 0.02;
        books[mats[(i + k) % mats.length]].push(box(Math.min(w, 0.72 - x) - 0.01, h, 0.27, x + Math.min(w, 0.72 - x) / 2, y, -0.03));
        x += w;
      }
    }
    for (const s of [-1, 1]) wood.push(box(0.05, 1.56, 0.03, s * 0.725, 0.92, 0.215), box(0.05, 1.56, 0.03, s * 0.025, 0.92, 0.215), box(0.7, 0.05, 0.03, s * 0.375, 0.92, 0.215), box(0.7, 0.05, 0.03, s * 0.375, 2.43, 0.215));
    return [
      { mat: "wood-dark", solid: union(...wood) },
      ...mats.map((m) => ({ mat: m as MatId, solid: union(...books[m]), overlap: true })), // the books stand in the case on its shelves
      { mat: "glass-plate", solid: box(1.42, 1.48, 0.006, 0, 0.96, 0.218), overlap: true },
      { mat: "brass", solid: union(rodX(0.005, 0.04, -0.05, 1.6, 0.235), rodX(0.005, 0.04, 0.05, 1.6, 0.235), rodX(0.006, 0.08, -0.37, 0.5, 0.232), rodX(0.006, 0.08, 0.37, 0.5, 0.232)), overlap: true },
    ];
  },
});

/** The monarch's portrait in a gilt frame, as every office of state hung it: a figure in field grey before a dark
 *  ground, read from across the room, not a likeness. Origin at the frame's foot, against the wall. */
prop({
  id: "state-portrait", items: ["state-portrait"], size: [1.0, 1.35, 0.08], place: "hung", tris: 300,
  parts: () => [
    { mat: "brass", solid: union(box(1.0, 0.1, 0.08, 0, 1.25, 0), box(1.0, 0.1, 0.08, 0, 0, 0), box(0.1, 1.35, 0.08, -0.45, 0, 0), box(0.1, 1.35, 0.08, 0.45, 0, 0)) },
    { mat: "cloth-black", solid: box(0.8, 1.15, 0.01, 0, 0.1, -0.015) },
    { mat: "cloth-field", solid: union(box(0.4, 0.58, 0.012, 0, 0.1, -0.006), box(0.5, 0.11, 0.012, 0, 0.62, -0.006)), overlap: true },
    { mat: "wax", solid: box(0.11, 0.14, 0.012, 0, 0.74, -0.006), overlap: true },
    { mat: "iron", solid: union(box(0.15, 0.07, 0.012, 0, 0.88, -0.006), box(0.015, 0.06, 0.012, 0, 0.95, -0.006)), overlap: true },
  ],
});

/** The General Staff's map of the Western Front on its rollers, the line pinned in red from Flanders to the Vosges,
 *  moved by the day's report. Origin at the lower roller's middle, against the wall. */
prop({
  id: "staff-map", items: ["staff-map"], size: [1.84, 1.32, 0.05], place: "hung", tris: 500,
  parts: () => {
    const line: [number, number, number][] = [[-0.42, 1.2, 0.006], [-0.36, 1.02, 0.006], [-0.2, 0.86, 0.006], [0.02, 0.74, 0.006], [-0.02, 0.56, 0.006], [0.14, 0.38, 0.006], [0.3, 0.2, 0.006], [0.36, 0.08, 0.006]];
    return [
      { mat: "wood-mid", solid: union(rodX(0.02, 1.84, 0, 1.3, 0), rodX(0.02, 1.84, 0, 0.02, 0)) },
      { mat: "paper", solid: box(1.76, 1.26, 0.004, 0, 0.03, 0) },
      { mat: "leaf", solid: union(box(0.3, 0.18, 0.003, 0.5, 0.7, 0.003), box(0.22, 0.26, 0.003, -0.6, 0.3, 0.003), box(0.18, 0.14, 0.003, 0.25, 1.0, 0.003)), overlap: true },
      { mat: "paper-blue", solid: union(bar([-0.86, 1.1, 0.004], [-0.5, 0.95, 0.004], 0.004), bar([0.1, 1.25, 0.004], [0.4, 0.6, 0.004], 0.004), bar([0.4, 0.6, 0.004], [0.7, 0.3, 0.004], 0.004)), overlap: true },
      { mat: "paint-red", solid: union(...line.slice(1).map((p, i) => bar(line[i], p, 0.005)), ...line.map((p) => box(0.025, 0.018, 0.004, p[0] + 0.02, p[1] + 0.02, 0.012))), overlap: true },
    ];
  },
});

/** A floor globe: the ball on its brass meridian in a turned stand with a horizon ring. Origin at its foot. */
prop({
  id: "floor-globe", items: ["globe"], size: [0.6, 1.08, 0.6], place: "floor", tris: 1200,
  parts: () => [
    { mat: "wood-dark", solid: union(lathe([[0, 0], [0.24, 0], [0.24, 0.04], [0.06, 0.08], [0.04, 0.5], [0.08, 0.56], [0, 0.58]], 0, 0, 0, 20), lathe([[0.27, 0], [0.3, 0], [0.3, 0.025], [0.27, 0.025]], 0, 0.8, 0, 32)) },
    { mat: "paper", solid: lathe([[0, 0], [0.11, 0.015], [0.19, 0.08], [0.22, 0.22], [0.19, 0.36], [0.11, 0.425], [0, 0.44]], 0, 0.6, 0, 24) },
    { mat: "brass", solid: lathe([[0.235, -0.008], [0.245, -0.008], [0.245, 0.008], [0.235, 0.008]], 0, 0, 0, 32).rotate(90, 0, 0).move(0, 0.82, 0), overlap: true },
  ],
});

/** A palace's double door: two white panelled leaves, the architrave, a gilt overdoor panel, brass levers. Origin at
 *  its foot's middle against the wall. */
prop({
  id: "door-double", items: ["door-double"], size: [1.9, 3.45, 0.12], place: "wall", tris: 700,
  parts: () => {
    const white = [box(0.1, 3.0, 0.08, -0.9, 0, 0.02), box(0.1, 3.0, 0.08, 0.9, 0, 0.02), box(1.9, 0.12, 0.09, 0, 2.95, 0.02)];
    for (const s of [-1, 1]) {
      white.push(box(0.8, 2.94, 0.05, s * 0.41, 0.01, 0.0));
      for (const [y, h] of [[0.18, 0.62], [0.95, 1.2], [2.3, 0.5]]) white.push(box(0.58, h, 0.014, s * 0.41, y, 0.03));
    }
    return [
      { mat: "paint-white", solid: union(...white, box(1.6, 0.36, 0.03, 0, 3.07, 0.03)) },
      { mat: "brass", solid: union(rodX(0.009, 0.12, -0.12, 1.05, 0.05), rodX(0.009, 0.12, 0.12, 1.05, 0.05), box(0.5, 0.18, 0.012, 0, 3.16, 0.05)), overlap: true },
    ];
  },
});

export const KIT_MINISTRY = true;
