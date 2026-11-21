// The street's people for the previz and the far crowd of the finished shots: everyone the people model (people/city.ts:
// the tiles' doors and queue lines, people/roles.ts's days) has out of doors near the camera at the shot's clock,
// drawn as instanced stand-ins in their dress's colour with their role's headgear (a Schutzmann's spiked helmet, a
// soldier's field cap, a woman's shawl or hat), standing in the queues, walking their trips, and stopping and turning
// to look on cue. One <Instances> a part, so a few hundred cost a handful of draws.
//   <Crowd eye={camEye} clock="07:15" t={c.f / c.fps} stopAt={1.2} lookTo={[x, y, z]} />
import { Capsule3d, Cylinder, Cone, Instances, Sphere } from "raea/3d";
import { StandardMaterial } from "raea/pbr";
import { snapshot, rng, type Person, type V3 } from "raea/people";
import type { ReactElement } from "react";
import { cityAround, passersAround } from "../../people/city";

export interface CrowdProps {
  /** the camera (the shot): who is drawn, nearest first */
  eye: V3;
  /** the shot's first moment in the day: "07:15", or minutes after midnight */
  clock: string | number;
  /** seconds into the shot */
  t: number;
  /** "1917-12-03" (a Monday) unless said */
  date?: string;
  /** seconds into the shot when the street stops: walkers halt and everyone turns toward `lookTo` */
  stopAt?: number;
  lookTo?: V3;
  /** draw those within this many metres of the camera (250), at most `max` of them (600) */
  within?: number;
  max?: number;
  /** more or fewer passers-by than the street's own numbers (1; an avenue has 0.3 walkers a metre at 5 pm) */
  busy?: number;
  /** grey clay instead of their dress's colours */
  clay?: boolean;
  /** leave out these people (by id: a shot's heroes stand in their place) */
  without?: string[];
}

// dress (research/catalogue/people.ts ids) to a cloth colour: field grey, the police's dark blue, the women's dark
// wool; a list is drawn from by the person
const CLOTH: Record<string, string[]> = {
  "coat-woman": ["#2a2522", "#33302c", "#3b3430", "#2c2f33", "#403a33"], shawl: ["#5a4a3c", "#4a4f45", "#6b5a48", "#3e3a44"],
  "work-cap-apron": ["#4d4a45", "#55524c"], schaffnerin: ["#2f3640"], "invalid-coat": ["#5f6252", "#4f5246", "#57584c"],
  "schupo-rock": ["#1f2a3a"], "mantel-m15": ["#66695a"], "bluse-m15": ["#66695a"], "rock-m10": ["#5c6150"], "flat-cap": ["#3a3631", "#43403a"],
};
type Hat = "spike" | "cap" | "visor" | "brim" | "tall" | "shawl" | "scarf" | "none";
const HAT: Record<string, Hat> = {
  schutzmann: "spike", "landsturm-sentry": "cap", "depot-soldier": "cap", gunner: "cap", officer: "visor", "tram-driver": "visor",
  schaffnerin: "visor", postwoman: "visor", coachman: "tall", clerk: "brim", pensioner: "brim", shopkeeper: "brim", "organ-grinder": "cap",
  "coal-carrier": "cap", "munitions-worker": "scarf", child: "cap",
};
const hatOf = (p: Person): Hat => (p.role === "housewife" ? (p.dress === "shawl" ? "shawl" : "brim") : p.role === "child" && p.sex === "female" ? "scarf" : HAT[p.role] ?? "none");
const SKIN = ["#c9a48c", "#bf9a80", "#b48e76", "#cfae98"];

type Fig = { p: Person; at: V3; yaw: number; h: number; cloth: string; hat: Hat };

// every part a figure can have, each one <Instances>: the shapes are the same for every copy (scale and colour vary)
const PARTS: [string, ReactElement][] = [
  ["low", <Cylinder args={[0.17, 0.29, 0.95]} />], ["body", <Capsule3d radius={0.18} half_length={0.17} />], ["head", <Sphere radius={0.105} />],
  ["dome", <Sphere radius={0.125} />], ["spike", <Cone radius={0.025} height={0.09} />], ["cap", <Cylinder radius={0.1} half_height={0.035} />],
  ["visor", <Cylinder radius={0.06} half_height={0.006} />], ["brim", <Cylinder radius={0.16} half_height={0.008} />],
  ["crown", <Cylinder radius={0.095} half_height={0.045} />], ["hood", <Sphere radius={0.125} />],
];
type Placed = { position: V3; rotation: V3; scale?: number | V3; color?: string };

/** A rotation by yaw (about y) after a tip (about x, forward), as XYZ Euler angles. */
const euler = (yaw: number, tip: number): V3 => {
  const ca = Math.cos(yaw), sa = Math.sin(yaw), cb = Math.cos(tip), sb = Math.sin(tip);
  return [Math.atan2(sb, ca * cb), Math.asin(Math.max(-1, Math.min(1, sa * cb))), Math.atan2(-sa * sb, ca)];
};
const place = (f: Fig, local: V3): V3 => {
  // feet + Ry(yaw) · local (no tip: the crowd stands or walks)
  const c = Math.cos(f.yaw), s = Math.sin(f.yaw);
  return [f.at[0] + c * local[0] + s * local[2], f.at[1] + local[1], f.at[2] - s * local[0] + c * local[2]];
};

export function Crowd({ eye, clock, t, date, stopAt, lookTo, within = 250, max = 600, busy = 1, clay = false, without = [] }: CrowdProps) {
  const start = typeof clock === "number" ? clock : Number(clock.split(":")[0]) * 60 + Number(clock.split(":")[1]);
  const day = cityAround({ eye, date });
  // walkers halt over half a second from stopAt; the day's clock stands still for them after
  const halt = stopAt === undefined ? t : t < stopAt ? t : stopAt + 0.25 * Math.min(1, (t - stopAt) / 0.5);
  const now = snapshot(day, start + halt / 60, eye, { near: within, middle: within });
  const skip = new Set(without);
  const byId = new Map(day.people.map((p) => [p.id, p]));
  const shown = now
    .filter((s) => s.level === "near" && !skip.has(s.id))
    .map((s) => ({ s, d: Math.hypot(s.at[0] - eye[0], s.at[2] - eye[2]) }));
  // and the people passing along the sidewalks (the street's own walkers, not the residents' trips)
  const passing = passersAround(eye, start + halt / 60, within, busy, 0.8, date)
    .filter((x) => !skip.has(x.id))
    .map((x) => ({ s: { id: x.id, at: x.at, facing: x.facing }, p: x.person, d: Math.hypot(x.at[0] - eye[0], x.at[2] - eye[2]) }));
  const all = [...shown.map(({ s, d }) => ({ s: { id: s.id, at: s.at, facing: s.facing }, p: byId.get(s.id)!, d })), ...passing]
    .sort((a, b) => a.d - b.d)
    .slice(0, max);
  const figs: Fig[] = all.map(({ s, p }) => {
    const r = rng(p.seed);
    let yaw = s.facing;
    if (stopAt !== undefined && lookTo && t > stopAt) {
      // each turns to look after their own startle (0.15 to 0.6 s), over 0.6 s
      const want = Math.atan2(lookTo[0] - s.at[0], lookTo[2] - s.at[2]), u = Math.min(1, Math.max(0, (t - stopAt - 0.15 - 0.45 * r.next()) / 0.6));
      const d = Math.atan2(Math.sin(want - yaw), Math.cos(want - yaw));
      yaw += d * u * u * (3 - 2 * u);
    }
    const cl = CLOTH[p.dress] ?? ["#3a3633"];
    return { p, at: s.at, yaw, h: p.body.height, cloth: clay ? "#8c8b87" : r.pick(cl), hat: hatOf(p) };
  });
  const parts: { key: string; shape: ReactElement; at: Placed[] }[] = [];
  const add = (key: string, shape: ReactElement, at: Placed) => {
    let g = parts.find((x) => x.key === key);
    if (!g) parts.push((g = { key, shape, at: [] }));
    g.at.push(at);
  };
  for (const f of figs) {
    const k = f.h / 1.7, woman = f.p.sex === "female", skin = clay ? "#b9a08a" : SKIN[f.p.seed % SKIN.length];
    const rot = euler(f.yaw, 0);
    // skirt or coat from the ground to the waist, the body above it, the head
    const lowR: V3 = woman ? [1, 1, 1] : [0.7, 1, 0.75];
    add("low", <Cylinder args={[0.17, 0.29, 0.95]} />, { position: place(f, [0, 0.475 * k, 0]), rotation: rot, scale: [lowR[0] * k, k, lowR[2] * k], color: f.cloth });
    add("body", <Capsule3d radius={0.18} half_length={0.17} />, { position: place(f, [0, 1.2 * k, 0]), rotation: rot, scale: [k, k, 0.8 * k], color: f.cloth });
    add("head", <Sphere radius={0.105} />, { position: place(f, [0, 1.585 * k, 0.01]), rotation: rot, scale: k, color: skin });
    const top = 1.685 * k;
    switch (f.hat) {
      case "spike":
        add("dome", <Sphere radius={0.125} />, { position: place(f, [0, top - 0.05 * k, 0]), rotation: rot, scale: [k, 0.8 * k, k], color: clay ? "#5a5a58" : "#1b1d22" });
        add("spike", <Cone radius={0.025} height={0.09} />, { position: place(f, [0, top + 0.07 * k, 0]), rotation: rot, scale: k, color: clay ? "#5a5a58" : "#8f8a7c" });
        break;
      case "cap": case "visor":
        add("cap", <Cylinder radius={0.1} half_height={0.035} />, { position: place(f, [0, top - 0.015 * k, 0]), rotation: rot, scale: k, color: f.cloth });
        if (f.hat === "visor") add("visor", <Cylinder radius={0.06} half_height={0.006} />, { position: place(f, [0, top - 0.05 * k, 0.09 * k]), rotation: rot, scale: [k, k, 0.8 * k], color: "#141414" });
        break;
      case "brim":
        add("brim", <Cylinder radius={0.16} half_height={0.008} />, { position: place(f, [0, top - 0.03 * k, 0]), rotation: rot, scale: k, color: f.cloth });
        add("crown", <Cylinder radius={0.095} half_height={0.045} />, { position: place(f, [0, top + 0.01 * k, 0]), rotation: rot, scale: k, color: f.cloth });
        break;
      case "tall":
        add("brim", <Cylinder radius={0.16} half_height={0.008} />, { position: place(f, [0, top - 0.03 * k, 0]), rotation: rot, scale: k, color: "#151515" });
        add("crown", <Cylinder radius={0.095} half_height={0.045} />, { position: place(f, [0, top + 0.06 * k, 0]), rotation: rot, scale: [k, 2.2 * k, k], color: "#151515" });
        break;
      case "shawl": case "scarf":
        add("hood", <Sphere radius={0.125} />, { position: place(f, [0, 1.6 * k, -0.012 * k]), rotation: rot, scale: [k, 1.05 * k, k], color: f.cloth });
        break;
    }
  }
  // A video's <Instances> keeps one count for the whole shot (runtime/scene3d instance.rs: the copies are spawned
  // once), but walkers come into and leave `within`. So every part is drawn every frame with exactly `max` copies,
  // the unused ones parked 500 m under the camera at a ten-thousandth of their size: the counts never change within
  // a shot or across a cut. (The world lane's bucketed padding, 11-17, did the same by remounting.)
  const park: Placed = { position: [eye[0], eye[1] - 500, eye[2]], rotation: [0, 0, 0], scale: 1e-4 };
  return (
    <>
      {PARTS.map(([key, shape]) => {
        const at = (parts.find((g) => g.key === key)?.at ?? []).slice(0, max);
        while (at.length < max) at.push(park);
        return (
          <Instances key={key} name={`crowd-${key}`} at={at}>
            {shape}
            <StandardMaterial base_color="#ffffff" perceptual_roughness={0.92} />
          </Instances>
        );
      })}
    </>
  );
}

/** Who the crowd shows at a moment, for a shot's notes and checks: how many, by role and by what they are doing. */
export function crowdAt(eye: V3, clock: string, within = 250, date?: string) {
  const start = Number(clock.split(":")[0]) * 60 + Number(clock.split(":")[1]);
  const day = cityAround({ eye, date });
  const now = snapshot(day, start, eye, { near: within, middle: within }).filter((s) => s.level === "near");
  const byId = new Map(day.people.map((p) => [p.id, p]));
  const roles = new Map<string, number>(), doing = new Map<string, number>();
  for (const s of now) {
    const p = byId.get(s.id)!;
    roles.set(p.role, (roles.get(p.role) ?? 0) + 1);
    doing.set(s.doing, (doing.get(s.doing) ?? 0) + 1);
  }
  return { count: now.length, roles, doing };
}
