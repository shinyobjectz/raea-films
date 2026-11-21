// The National Monument for the Wars of Liberation on the Kreuzberg (Schinkel, 1818-21, cast at the Royal Prussian
// Iron Foundry): the monument that gave the Iron Cross its hill and the district its name.
//   monument-kreuzberg         the cast-iron spire, 18.83 m (60 Prussian feet; en.wikipedia), on a Greek-cross plan whose
//                              short arms are narrower than their ends are wide. Each of its twelve outer faces is one
//                              battle: the battle's name and year, a little socket with an Iron Cross above it, and a
//                              niche for its genius. The four arm ends are the four great battles, named in gold:
//                              Groß-Görschen east, Leipzig north, Paris west, Belle Alliance south. Gables and corner
//                              pinnacles over the niches, a square stage with blind lancets, the spire, and the Iron
//                              Cross at the top. The genii are not drawn (statues are parked): each niche keeps a ledge,
//                              and KREUZBERG_NICHES lists where a figure stands, for whoever makes them.
//   monument-kreuzberg-socket  Strack's 8 m socket of 1878, brick faced with grey Silesian granite, octagonal, its
//                              terrace walled with battlements, an iron railing round the spire. The monument stands on
//                              its terrace at y 8.0 (place both at the same point, the spire 8 m up).
// Frame: +z north, +x east, origin at the foot of the axis. ASSUMED: the plan's widths (5.6 m across the arms, arms
// 2.6 m wide), every height but the total, which battle takes which side face, the socket's width (19 m across) and
// battlements. The 1878 lift turned it 21 degrees onto Großbeerenstraße's axis: the world lane's yaw, not drawn here.
import { crossSection, type Solid } from "raea/3d";
import { ball, box, lathe, post, union, type V3 } from "./geo";
import type { MatId } from "./mats";
import { rod, sign } from "./outgeo";
import { ironCross } from "./patriot";
import { prop } from "./prop";

type Part = { mat: MatId; solid: Solid; overlap?: boolean };
type CS = ReturnType<typeof crossSection.rect>;

const S = 5.6, A = 2.6, L = (S - A) / 2;
/** The Greek cross's plan, grown by g on every side. */
const plan = (g = 0): CS => crossSection.rect(S + 2 * g, A + 2 * g).union(crossSection.rect(A + 2 * g, S + 2 * g));
/** A plan extruded upward from y0, h high. */
const up = (cs: CS, y0: number, h: number) => cs.extrude(h).rotate(-90, 0, 0).move(0, y0, 0);
/** A solid built in a face's own frame (the face's plane at z 0, its outward normal +z, x along it) turned onto the
 *  face at (x, z) with normal (nx, nz). */
const onFace = (s: Solid, f: Face) => s.rotate(0, (Math.atan2(f.n[0], f.n[1]) * 180) / Math.PI, 0).move(f.c[0], 0, f.c[1]);

type Face = { c: [number, number]; n: [number, number]; w: number; battle: string; year: string; main: boolean };
/** The twelve faces, the four ends first; each arm's two sides after it. */
function faces(): Face[] {
  const ends: [string, string, number][] = [["LEIPZIG", "1813", 0], ["GROSS-GÖRSCHEN", "1813", 90], ["BELLE ALLIANCE", "1815", 180], ["PARIS", "1814", 270]];
  const sides: [string, string][] = [["DENNEWITZ", "1813"], ["KULM", "1813"], ["KATZBACH", "1813"], ["GROSSBEEREN", "1813"], ["LAON", "1814"], ["BAR SUR AUBE", "1814"], ["LA ROTHIÈRE", "1814"], ["WARTENBURG", "1813"]];
  const out: Face[] = [];
  ends.forEach(([battle, year, deg], k) => {
    const t = (deg * Math.PI) / 180, nx = Math.sin(t), nz = Math.cos(t);
    out.push({ c: [nx * S / 2, nz * S / 2], n: [nx, nz], w: A, battle, year, main: true });
    // the arm's two sides: normals at right angles, centred half-way along the arm
    for (const [j, s] of [[0, 1], [1, -1]] as [number, number][]) {
      const mx = nx * (A / 2 + L / 2), mz = nz * (A / 2 + L / 2), px = nz * s, pz = -nx * s;
      const [b, y] = sides[k * 2 + j];
      out.push({ c: [mx + px * A / 2, mz + pz * A / 2], n: [px, pz], w: L, battle: b, year: y, main: false });
    }
  });
  return out;
}

const N0 = 4.0, NH = 3.3; // the niche's ledge and the height of its sides
/** Where each genius would stand: on its niche's ledge, facing out. */
export const KREUZBERG_NICHES: { at: V3; facing: [number, number]; battle: string }[] = faces().map((f) => ({ at: [f.c[0] - f.n[0] * 0.2, N0 + 0.2, f.c[1] - f.n[1] * 0.2], facing: f.n, battle: f.battle }));

function pinnacle(x: number, y: number, z: number, r: number, h: number): Solid[] {
  return [lathe([[0, 0], [r, 0], [r, h * 0.2], [r * 0.8, h * 0.22], [0, h]], x, y, z, 8), ball(r * 0.45).move(x, y + h, z)];
}

function spire(): Part[] {
  const iron: Solid[] = [], gold: Solid[] = [];
  // the body: two steps, the pedestal and its cornice, the niche stage and its cornice, the attic over the niches
  let body = union(up(plan(0.35), 0, 0.3), up(plan(0.18), 0.3, 0.25), up(plan(), 0.55, 2.85), up(plan(0.1), 3.4, 0.18), up(plan(), 3.58, 4.9), up(plan(0.12), 8.48, 0.2), up(plan(), 8.68, 1.0));
  const cuts: Solid[] = [];
  for (const f of faces()) {
    const nw = Math.min(f.w * 0.6, 1.3), s = nw / Math.SQRT2;
    // the niche: straight sides to NH, a pointed head; its ledge left standing
    cuts.push(onFace(union(box(nw, NH, 0.9, 0, N0, 0), box(s, s, 0.9, 0, -s / 2, 0).rotate(0, 0, 45).move(0, N0 + NH, 0)), f));
    // the gable over it, its finial; the battle's name and year; the socket and its Iron Cross
    const gw = nw + 0.35, gh = f.main ? 1.9 : 1.3;
    iron.push(onFace(crossSection.polygon([[-gw / 2, 0], [gw / 2, 0], [0, gh]]).extrude(0.12).move(0, 8.68, 0), f), ...pinnacle(0, 8.68 + gh, 0, 0.07, 0.45).map((p) => onFace(p.move(0, 0, 0.06), f)));
    const ts = f.main ? 0.17 : 0.1;
    const name = onFace(sign(f.battle, ts, 0.02).move(0, 1.95, 0), f), year = onFace(sign(f.year, ts * 0.75, 0.02).move(0, 1.95 - ts * 1.25, 0), f);
    (f.main ? gold : iron).push(name, year);
    const R = f.main ? 0.2 : 0.14;
    iron.push(onFace(box(R * 2.4, 0.1, 0.16, 0, 2.62, 0), f), onFace(crossSection.polygon(ironCross(0, 0, R)).extrude(0.05).move(0, 2.74 + R, 0.03), f));
  }
  body = body.minus(union(...cuts));
  // buttresses on the eight outer corners, their pinnacles above the attic
  for (let k = 0; k < 4; k++) {
    const t = (k * Math.PI) / 2, nx = Math.sin(t), nz = Math.cos(t);
    for (const s of [-1, 1]) {
      const x = nx * S / 2 + nz * s * A / 2, z = nz * S / 2 - nx * s * A / 2;
      iron.push(box(0.34, 9.15, 0.34, x, 0.55, z), ...pinnacle(x, 9.7, z, 0.2, 2.0));
    }
  }
  // the square stage with two blind lancets a face, its cornice and corner pinnacles; the spire, its bands, the
  // finial and the Iron Cross at 18.83 m
  const T = 2.4, TY = 9.68, TH = 4.3;
  let stage = box(T, TH, T, 0, TY, 0);
  for (let k = 0; k < 4; k++) {
    const t = (k * Math.PI) / 2, f: Face = { c: [Math.sin(t) * T / 2, Math.cos(t) * T / 2], n: [Math.sin(t), Math.cos(t)], w: T, battle: "", year: "", main: false };
    for (const x of [-0.45, 0.45]) stage = stage.minus(onFace(union(box(0.5, 2.6, 0.24, x, TY + 0.7, 0), box(0.354, 0.354, 0.24, 0, -0.177, 0).rotate(0, 0, 45).move(x, TY + 3.3, 0)), f));
  }
  iron.push(stage, box(T + 0.24, 0.2, T + 0.24, 0, TY + TH, 0));
  for (const [x, z] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) iron.push(...pinnacle(x * T / 2, TY + TH + 0.2, z * T / 2, 0.16, 1.6));
  const SY = TY + TH + 0.2;
  iron.push(lathe([[0, 0], [1.12, 0], [0.95, 0.35], [0.12, 3.75], [0, 3.75]], 0, SY, 0, 8).rotate(0, 22.5, 0));
  for (const [y, r] of [[1.2, 0.74], [2.4, 0.47]]) iron.push(lathe([[0, -0.06], [r, -0.06], [r, 0.06], [0, 0.06]], 0, SY + y, 0, 8).rotate(0, 22.5, 0));
  iron.push(lathe([[0, 0], [0.14, 0], [0.16, 0.1], [0.06, 0.24], [0.04, 0.34], [0, 0.34]], 0, SY + 3.7, 0, 10));
  iron.push(crossSection.polygon(ironCross(0, 0, 0.3)).extrude(0.07).move(0, 18.53, -0.035));
  return [{ mat: "iron-cast", solid: union(body, ...iron) }, { mat: "nail-gold", solid: union(...gold), overlap: true }];
}

function socket(): Part[] {
  const oct = (r: number): CS => crossSection.polygon(Array.from({ length: 8 }, (_, i): [number, number] => { const a = ((i + 0.5) / 8) * Math.PI * 2; return [r * Math.cos(a), r * Math.sin(a)]; }));
  const R = 10.2, ap = Math.cos(Math.PI / 8);
  const stone: Solid[] = [up(oct(R + 0.4), 0, 0.6), up(oct(R), 0.6, 6.7), up(oct(R + 0.25), 7.3, 0.3), up(oct(R + 0.1), 7.6, 0.4)];
  // the parapet: a low wall round the terrace, merlons along each side
  stone.push(up(oct(R + 0.1).minus(oct(R - 0.45)), 8.0, 0.55));
  const side = 2 * (R + 0.1) * Math.sin(Math.PI / 8);
  for (let k = 0; k < 8; k++) {
    const t = (k * Math.PI) / 4, nx = Math.cos(t), nz = Math.sin(t), px = -nz, pz = nx, d = (R + 0.1) * ap - 0.27;
    for (let i = 0; i < 4; i++) { const u = (i - 1.5) * (side / 4); stone.push(box(side / 8, 0.65, 0.55).rotate(0, (Math.atan2(nx, nz) * 180) / Math.PI, 0).move(nx * d + px * u, 8.55, nz * d + pz * u)); }
  }
  // the iron railing round the spire on the terrace, an octagon of bars 4.4 m out
  const rail: Solid[] = [], RR = 4.4;
  for (let k = 0; k < 8; k++) {
    const a0 = ((k + 0.5) / 8) * Math.PI * 2, a1 = ((k + 1.5) / 8) * Math.PI * 2;
    const p0: V3 = [RR * Math.cos(a0), 8.0, RR * Math.sin(a0)], p1: V3 = [RR * Math.cos(a1), 8.0, RR * Math.sin(a1)];
    for (const y of [0.12, 0.95]) rail.push(rod([p0[0], 8 + y, p0[2]], [p1[0], 8 + y, p1[2]], 0.015));
    for (let i = 0; i < 18; i++) { const f = i / 18, x = p0[0] + (p1[0] - p0[0]) * f, z = p0[2] + (p1[2] - p0[2]) * f; rail.push(post(0.01, 1.02, x, 8.0, z), lathe([[0, 0], [0.022, 0], [0, 0.08]], x, 9.02, z, 6)); }
    rail.push(post(0.035, 1.15, p0[0], 8.0, p0[2]), ball(0.05).move(p0[0], 9.2, p0[2]));
  }
  return [{ mat: "granite", solid: union(...stone) }, { mat: "iron", solid: union(...rail), overlap: true }];
}

prop({ id: "monument-kreuzberg", items: ["monument"], size: [6.4, 18.9, 6.4], place: "floor", where: "set", tris: 60000, parts: spire });
prop({ id: "monument-kreuzberg-socket", items: ["monument"], size: [21.2, 9.3, 21.2], place: "floor", where: "set", tris: 26000, parts: socket });

export const KIT_KREUZBERG = true;
