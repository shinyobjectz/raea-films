// A household's day at home, minute by minute, person by person: the indoor half of the people's days. The character
// SDK's people model (raea/people, people/roles.ts) says where each role is outside (the queues, the shift, school,
// church); this fills the rest in the flat's own rooms with its own things: the bed of the sleeping plan (life.ts),
// the range or the Stube's iron stove, the kitchen table, the tap or the pail, the pot, the zinc tub on Saturday, the
// work taken in (identity.ts homework), the satchel's homework, the newspaper, the instrument, the prayers. Pure data,
// deterministic by household seed and weekday; checked by interiors/home.feature (tools/interiors/home-check.ts).
//
// Times, all ASSUMED unless a source is named: the workers rose at five for a six o'clock shift and the women queued
// for bread from before dawn (people/roles.ts); light and coal were short in the fourth war winter, so the poor went to
// bed early; the midday meal was the main one; Saturday night was bath night in the kitchen's zinc tub (research/
// interiors.md); a Heimarbeiterin sewed twelve hours and more (heimarbeit-1906); the devout Jewish household kept the
// Sabbath from Friday dusk (Berlin's December sunset about 15:55) to Saturday night, cooking nothing on it.
import type { Klass } from "./flats";
import type { Person } from "./households";
import type { Identity } from "./identity";
import { hash } from "./hash";
import { longEvening } from "./sun";
import type { Activity } from "./uses";

/** A room of the flat as the day sees it (RoomRec: its use, its beds' people, whether the household cooks there). */
export interface HomeRoom { id: number; use: string; sleep?: number[][]; cook?: 1 }
/** An outside commitment, from the person's role (outsOf). */
export interface Out { from: number; to: number; what: string; at?: string }
/** The place kinds of the household's errands: the queues and the shops, which a maid runs when there is one. */
export const ERRANDS = new Set(["bakery", "butcher", "greengrocer", "market-hall", "war-kitchen", "dairy", "grocer"]);
/** One stretch of a person's day: what they do, in which room of the flat (null: outside the flat, `where` says). */
export interface Slot { from: number; to: number; act: Activity | "out"; room: number | null; where?: string; what?: string }

/** The bits of a raea/people Role this reads (people/roles.ts ROLES), so this file needs no SDK types. */
export interface RoleLike { id: string; day?: { what: string; at: string; from: number; to?: number; minutes?: number; chance?: number; days?: number[] }[] }

const H = (h: number, m = 0) => h * 60 + m;
const DAY = 1440;

/** A role's blocks away from home on a weekday (0 Sunday), each drawn once by the seed (chance), with their times. */
export function outsOf(role: RoleLike | undefined, weekday: number, seed: number): Out[] {
  return (role?.day ?? []).flatMap((b, k) => {
    if (b.at === "home" || (b.days && !b.days.includes(weekday)) || hash(seed, k, weekday, 77) >= (b.chance ?? 1)) return [];
    return [{ from: b.from, to: Math.min(DAY, b.to ?? b.from + (b.minutes ?? 60)), what: b.what, at: b.at }];
  });
}

export interface HomeInput {
  people: Person[];
  klass: Klass;
  identity: Identity | null;
  rooms: HomeRoom[];
  /** 0 Sunday ... 6 Saturday */
  weekday: number;
  /** the week of the year: the big wash comes round every fourth week (default 0) */
  week?: number;
  /** the day of the year (1-366): the long summer evenings (plan/sun.ts); default 15, mid-January */
  day?: number;
  seed: number;
  /** each person's commitments outside, by index (outsOf with their role) */
  outs: (i: number) => Out[];
}

/** Each person's day at home and away: slots covering 0..1440 without gaps or overlaps. The people away (at the front,
 *  fallen) get one slot "out" the whole day. */
export function homeDay(o: HomeInput): Slot[][] {
  const { people, klass, identity: id, rooms, weekday: wd, seed } = o;
  const R = (k: number, j = 0) => hash(seed, k, j, 909);
  const use = (u: string) => rooms.find((r) => r.use === u)?.id ?? null;
  const cookRoom = rooms.find((r) => r.cook)?.id ?? use("kitchen");
  const good = klass === "bourgeois", poor = klass === "worker" || klass === "porter";
  // the everyday room and the table: a good flat's salon and dining room even when the city frames neither (the day then
  // names them off-stage), never its kitchen, which is the servants'
  const living = good ? use("salon") ?? use("dining") : use("stube") ?? use("gute-stube") ?? cookRoom;
  const eatRoom = good ? use("dining") : cookRoom;
  const here = (id: number | null, name: string) => (id !== null ? { room: id } : { room: null, where: `${name} (not framed)` });
  const isKin = (p: Person) => !["lodger", "subtenant", "maid", "cook", "apprentice"].includes(p.relation);
  const servants = people.some((p) => p.status === "home" && (p.relation === "maid" || p.relation === "cook"));
  const bath = use("bath");
  const jewish = id?.confession === "jewish-orthodox" || (id?.confession === "jewish" && (id?.devout ?? 0) >= 0.6);
  const sabbath = jewish && wd === 6, eve = jewish && wd === 5;
  // the household's big wash: one weekday in every fourth week, by the house's wash-kitchen rota (ASSUMED: drawn per
  // household; the big wash came every three to six weeks, small things washed in the kitchen between)
  const washDay = 1 + Math.floor(R(1) * 6), washWeek = ((o.week ?? 0) + Math.floor(R(2) * 4)) % 4 === 0;
  // who cooks: the cook or the maid in a good flat, else the wife or the woman at the head, else the eldest daughter
  const cookIdx = people.findIndex((p) => p.status === "home" && (p.relation === "cook" || p.relation === "maid"));
  const homeWoman = people.findIndex((p) => p.status === "home" && p.sex === "f" && (p.relation === "wife" || p.relation === "head"));
  const cook = cookIdx >= 0 ? cookIdx : homeWoman >= 0 ? homeWoman : people.findIndex((p) => p.status === "home" && p.sex === "f" && p.age >= 12);
  const worker = (p: Person) => /heimarbeit|näherin|schneiderin|wäscherin|plätterin/i.test(p.work ?? "");
  const homeWorker = (p: Person) => !!id?.homework && worker(p) && p.status === "home" && wd !== 0 && !sabbath;
  const stove = cookRoom !== null && rooms.find((r) => r.id === cookRoom)?.use !== "kitchen" ? "iron-stove" : "range";
  // the long evenings (late April to mid-August, light until after half past eight): no lamp to pay for, so the poor
  // sat up later, in the court, at the house door or out at the allotment's Laube; and a summer Sunday took the whole
  // household out (the Grunewald, Treptow, the Müggelsee, the allotment) (ASSUMED: shares below)
  const long = longEvening(o.day ?? 15), outing = long && wd === 0 && !jewish && R(14) < 0.45;
  const SUNDAY: Out = { from: H(13, 30), to: H(19), what: "a summer Sunday out: the Grunewald, Treptow or the allotment" };

  // Each person's blocks outside. A home worker keeps only her first errand, the bread queue, and a schoolchild takes
  // it over at a quarter to seven ("in the morning, when they had to go to work, the children came to relieve them":
  // people/roles.ts), so she can sew.
  const reliever = people.findIndex((q) => q.status === "home" && q.relation === "child" && q.age >= 8 && q.age < 14);
  const outsAll: Out[][] = people.map((p, i) => {
    // (the night shift's hours stand in for the role's day: homeDay paints them)
    if (p.status !== "home") return [];
    // the small go where the household goes
    if (p.relation === "child" && p.age < 6) return outing ? [SUNDAY] : [];
    // where there is a maid, she queues and shops: the family keeps no errands of its own
    let xs = o.outs(i);
    if (servants && isKin(p)) xs = xs.filter((x) => !ERRANDS.has(x.at ?? ""));
    // the good flat's lady: afternoon calls, or the Nationaler Frauendienst's sewing room (ASSUMED: half of weekdays)
    if (good && p.sex === "f" && (p.relation === "wife" || p.relation === "head") && wd !== 0 && R(12, i) < 0.5)
      xs.push({ from: H(15), to: H(17, 30), what: "calls, or the Frauendienst's sewing room" });
    // a Schlafgänger rented a bed, not a room: off shift he spent the evening in the Kneipe (ASSUMED: half of evenings)
    if (p.sex === "m" && (p.relation === "lodger" || p.relation === "apprentice") && R(11, i) < 0.5) xs.push({ from: H(19, 15), to: H(21), what: "the Kneipe" });
    if (outing && isKin(p)) xs.push(SUNDAY);
    else if (long && !good && isKin(p) && wd !== 0 && wd !== 6 && R(13, i) < 0.6) xs.push({ from: H(19, 30), to: H(21), what: "the long evening in the court, or at the allotment" });
    if (!homeWorker(p)) return xs;
    const first = xs.slice().sort((a, b) => a.from - b.from)[0];
    return first ? [{ ...first, to: reliever >= 0 ? Math.min(first.to, H(6, 45)) : first.to }] : [];
  });
  if (reliever >= 0 && people.some((p, i) => homeWorker(p) && outsAll[i].length))
    outsAll[reliever] = [...outsAll[reliever], { from: H(6, 45), to: H(7, 45), what: "take over mother's place in the bread queue" }];
  /** the first minute at or after t that person i is not out */
  const freeAt = (i: number, t: number) => {
    let s = t;
    for (let moved = true; moved;) { moved = false; for (const x of outsAll[i]) if (x.from <= s && x.to > s) { s = x.to; moved = true; } }
    return s;
  };
  // supper when the cook is home and has cooked; each eats it when they are home
  const cookBack = cook >= 0 ? freeAt(cook, H(17, 20)) : H(17, 20);
  const supperAt = Math.max(H(18, 15), cookBack + 50);
  // Saturday night's bath: one tub refilled from the range, twenty minutes each, the children first, then each as they
  // come home (the good flat: its bathroom); never on the Sabbath, the night shift at work, the baby washed in a basin
  const tub = new Map<number, number>();
  if (wd === 6 && !sabbath) {
    const q = people.map((p, j) => ({ p, j, ready: freeAt(j, H(17, 30)) })).filter((x) => x.p.status === "home" && !(x.p.relation === "child" && x.p.age < 2));
    q.sort((a, b) => a.ready - b.ready || a.p.age - b.p.age);
    // each in turn takes the earliest twenty minutes free both at the tub and for them (not while at the Kneipe)
    const taken: number[] = [];
    for (const x of q) {
      let s = x.ready;
      for (let guard = 0; guard < 60; guard++) {
        const tubBusy = taken.find((u) => u < s + 20 && s < u + 20), out = outsAll[x.j].find((o) => o.from < s + 20 && s < o.to);
        if (tubBusy === undefined && !out) break;
        s = Math.max(tubBusy !== undefined ? tubBusy + 20 : s, out ? out.to : s);
      }
      if (s + 20 <= DAY) { tub.set(x.j, s); taken.push(s); }
    }
  }

  return people.map((p, i) => {
    if (p.status === "front" || p.status === "fallen") return [{ from: 0, to: DAY, act: "out", room: null, where: p.status === "front" ? "at the front" : "fallen" }];
    const paint: (Slot | null)[] = new Array(DAY).fill(null);
    const put = (from: number, to: number, s: Omit<Slot, "from" | "to">) => {
      for (let m = Math.max(0, Math.round(from)); m < Math.min(DAY, Math.round(to)); m++) if (!paint[m]) paint[m] = { from: 0, to: 0, ...s };
    };
    const bed = rooms.find((r) => r.sleep?.some((b) => b.includes(i)))?.id ?? null;
    const sleepWhere = bed === null ? "a bed in a room the city doesn't frame" : undefined;
    const child = p.relation === "child" && p.age < 14, small = child && p.age < 6, infant = child && p.age < 2;
    const outs = outsAll[i];
    const night = p.status === "night-shift";
    // the family keeps the household's faith, paper and music; a lodger, a subtenant or a servant lives by their own
    const kin = isKin(p), servant = p.relation === "maid" || p.relation === "cook";
    // where they sit and eat: a servant in the kitchen; the family in its everyday room and at its table
    const L = servant ? here(cookRoom, "the kitchen") : here(living, good ? "the salon" : "the Stube");
    const E = servant ? here(cookRoom, "the kitchen") : here(eatRoom, good ? "the dining room" : "the kitchen");

    // 1. outside: the role's blocks (a night-shift Schlafgänger works the night and sleeps by day)
    if (night) { put(0, H(6), { act: "out", room: null, where: "the night shift" }); put(H(18), DAY, { act: "out", room: null, where: "the night shift" }); }
    for (const x of outs) put(x.from, x.to, { act: "out", room: null, where: x.what });
    if (sabbath && p.sex === "m" && p.age >= 13) put(H(8, 30), H(11, 30), { act: "out", room: null, where: "the synagogue" });
    // Saturday's bath comes before bed: the last home bathes late
    const tb = tub.get(i);
    if (tb !== undefined) put(tb, tb + 20, { act: "bathe", room: bath ?? cookRoom, what: bath !== null ? "bathtub" : "zinc-tub" });

    // 2. sleep: bed early for the poor (no light, no coal), later for the good flat; children earlier still
    const firstOut = Math.min(...outs.map((x) => x.from).filter((f) => f < H(12)), DAY);
    const wake = night ? H(14) : infant ? H(6) : Math.max(H(4, 15), Math.min(firstOut - 50, good ? H(7) : klass === "petty" ? H(6) : H(5, 15)));
    // a home worker sews by the lamp to eleven (heimarbeit-1906: days of twelve hours and more)
    // (in the long evenings the poor and the petty sit up half an hour longer, and so do their older children)
    const bedtime = night ? H(7) : infant ? H(18, 30) : child ? (p.age < 10 ? H(19, 30) : H(20, 30) + (long && !good ? 30 : 0)) : homeWorker(p) ? H(23) : p.age >= 65 ? H(20, 30) : good ? H(22, 45) : (poor ? H(21, 15) : H(22)) + (long ? 30 : 0);
    const sl = { act: "sleep" as const, room: bed, ...(sleepWhere ? { where: sleepWhere } : {}) };
    if (night) put(H(7, 30), H(14), sl);
    else { put(bedtime, DAY, sl); put(0, wake, sl); }
    // the night's pot: the old once in the small hours (the WC is down on the half landing)
    if (!night && p.age >= 50) put(H(2, 30), H(2, 36), { act: "toilet", room: bed, what: "chamber-pot" });

    // 4. morning: the WC on the half landing (the good flat's own), washing at the tap or the washstand, dressing, coffee
    if (!infant) {
      const t = night ? H(14) : wake;
      // a small child uses the pot by the bed; the rest go down to the half landing (the good flat has its own WC)
      if (child && p.age < 4) put(t, t + 6, { act: "toilet", room: bed, what: "chamber-pot" });
      else if (bath !== null && !servant && kin) put(t, t + 8, { act: "toilet", room: bath, what: "wc" });
      else put(t, t + 8, { act: "toilet", room: null, where: "the WC on the half landing", what: "wc" });
      // washing: the washstand's jug and bowl in the bedroom, else the kitchen's tap, else a basin from the landing's pail
      const stand = (good || klass === "petty") && !servant && bed !== null;
      put(t + 8, t + 18, { act: "wash", room: stand ? bed : cookRoom, what: stand ? "washstand" : stove === "range" ? "kitchen-sink" : "water-pail" });
      put(t + 18, t + 28, { act: "dress", room: bed });
      put(t + 28, t + 45, { act: "eat", ...E, what: "ersatz coffee and bread" });
    }

    // 5. the Sabbath: the candles on Friday at dusk, the meal; on Saturday no cooking and no work (the Schalet kept warm)
    if (eve) { put(H(15, 35), H(15, 50), { act: "pray", ...E, what: "sabbath-candlesticks" }); put(H(18, 30), H(19, 45), { act: "eat", ...E, what: "the Sabbath meal" }); }

    // 6. the cook's day: wash day in the house's wash kitchen, ironing after, the midday meal, supper
    if (i === cook && !sabbath) {
      if (wd === washDay && washWeek) put(H(7), H(13), { act: "launder", room: null, where: "the house's wash kitchen" });
      if (wd === washDay % 6 + 1 && washWeek) put(H(14), H(16), { act: "iron", room: cookRoom, what: "flat-iron" });
      if (wd !== 0) put(H(10, 30), H(11, 50), { act: "cook", room: cookRoom, what: stove });
      else put(H(10), H(12), { act: "cook", room: cookRoom, what: "the Sunday roast, if there is one" });
      put(cookBack, cookBack + 50, { act: "cook", room: cookRoom, what: stove });
    }
    if (night) { put(H(6, 15), H(6, 45), { act: "eat", ...E, what: "soup after the shift" }); put(H(17, 15), H(17, 45), { act: "eat", ...E, what: "bread before the shift" }); }
    if (!infant) {
      // the midday meal when they are home for it: the schoolchildren at one; the shift eats at the works
      const mt = freeAt(i, H(12));
      if (mt <= H(14)) put(mt, mt + 35, { act: "eat", ...E, what: "the midday meal" });
      const st = Math.max(supperAt, freeAt(i, supperAt));
      put(st, st + 30, { act: "eat", ...E, what: "supper" });
    } else { for (const t of [H(10), H(14), H(18)]) put(t, t + 20, { act: "eat", room: bed ?? cookRoom, what: "fed" }); }

    // 7. work taken in: the home worker sews, rolls or binds from the bread queue to eleven at night, never on the
    //    Sabbath or Sunday
    if (homeWorker(p)) {
      const at = id!.homework === "laundry" ? cookRoom : living ?? cookRoom;
      put(H(6), H(12), { act: "trade", room: at, what: id!.homework! });
      put(H(12, 35), H(17, 20), { act: "trade", room: at, what: id!.homework! });
      put(H(18, 45), H(23), { act: "trade", room: at, what: id!.homework! });
    }
    // school work at the kitchen table after play; the good flat's in the children's room
    if (child && !small && wd !== 0 && !sabbath) put(H(16), H(17), { act: "study", room: (good ? use("children") : null) ?? cookRoom, what: "school-things" });

    // 8. the evening and the gaps: prayers, the paper, music, cards, mending, the old by the stove
    if ((id?.devout ?? 0) >= 0.6 && !child && kin) put(bedtime - 20, bedtime - 5, { act: "pray", ...(bed !== null ? { room: bed } : L), what: id?.confession === "catholic" ? "the rosary" : "the evening prayer" });
    const ints: string[] = kin ? id?.interests ?? [] : [];
    // a piano wants a petty flat's good room or better; the zither, the accordion and the fiddle go anywhere
    const music = ["piano", "zither", "accordion", "violin", "guitar"].find((x) => ints.includes(x) && (x !== "piano" || !poor));
    if (music && !child && R(10, i) < 0.5 && !sabbath) put(H(19), H(19, 40), { act: "music", ...(music === "piano" && klass === "petty" && use("gute-stube") !== null ? { room: use("gute-stube") } : L), what: music });
    if (ints.includes("skat") && p.sex === "m" && !child && wd === 6) put(H(19, 30), H(21), { act: "games", ...L, what: "skat" });
    if (!child && kin && p.sex === "m" && id?.paper) put(H(18, 45), H(19, 30), { act: "read", ...L, what: id.paper });
    if (!child && p.sex === "f") put(H(19), H(20, 30), { act: "sew", ...L, what: "mending" });
    if (p.age >= 60) put(H(13), H(17), { act: "warm", ...L, what: "by the stove" });
    if (small) put(H(7), H(18), { act: "play", ...L });

    // what's left at home: sitting in the everyday room (the good room on Sunday afternoon in a petty flat)
    const gs = use("gute-stube");
    const sit = wd === 0 && klass === "petty" && gs !== null && kin ? { room: gs } : L;
    const out: Slot[] = [];
    for (let m = 0; m < DAY; m++) {
      const s: Slot = paint[m] ?? { from: 0, to: 0, act: "sit", ...sit };
      const last = out[out.length - 1];
      if (last && last.act === s.act && last.room === s.room && last.where === s.where && last.what === s.what) last.to = m + 1;
      else out.push({ ...s, from: m, to: m + 1 });
    }
    return out;
  });
}
