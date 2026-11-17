// The five-minute run: what this player decides to do, moment by moment, said in a player's terms (go there, look at
// that, press, wait, flinch). The Bot turns it into device input and the game's own step answers. Nothing here sets the
// game's state.
import { Bot } from "./bot";
import { BADGE, COPY_OPEN, GHOST_AT, KNOCK_DOOR, MACHINE, NOTICE, PHONE1, READER, RECORDER, fixtureAt, interact, type V3 } from "./level";
import { LINES } from "./lines";
import { COPY_MAX, FIN, FPS, PRINT_SLIDE, lightOf, readMin, type Game } from "./step";

/** seconds of lingering, tuned so the voice behind the player lands where the film needs it */
export interface Pace { wake: number; bay: number; corridor: number; notice: number; copy: number; photo: number; mouth: number; wing: number; lobby: number }
export const PACE: Pace = { wake: 2.5, bay: 2.5, corridor: 2.0, notice: 1.5, copy: 2.6, photo: 2.8, mouth: 4.6, wing: 3.95, lobby: 4.9 };

const capAt = (line: keyof typeof LINES, has: string) => LINES[line].captions.find((c) => c.text.toLowerCase().includes(has.toLowerCase()))?.t0 ?? 0;

export function* play(b: Bot, pace: Pace = PACE): Generator<void> {
  const st = () => b.s.st;
  const since = (f: number) => (b.s.f - f) / FPS;
  const ev = (name: string) => b.s.ev.includes(name);
  void ev;

  // ---- waking at the desk -------------------------------------------------------------------------------------------
  b.mark("wake");
  yield* b.wait(3.1); // the tubes strike; a person waits for a room to finish arriving
  yield* b.lookAt({ yaw: 0.04, pitch: -0.06 }, 0.75);
  yield* b.wait(0.7);
  yield* b.lookAt({ yaw: 0.95, pitch: -0.1 }, 0.9);
  yield* b.wait(0.55);
  yield* b.lookAt({ yaw: -1.25, pitch: -0.04 }, 1.0);
  yield* b.wait(0.8);
  // down at the hand, and a waggle: is that mine?
  yield* b.lookAt({ yaw: -0.3, pitch: -0.62 }, 0.9);
  yield* b.wait(0.5);
  for (const d of [0.09, -0.15, 0.11, -0.05]) { b.lookBy(d, -0.6 + d * 0.2, 1.0); yield* b.wait(0.36); }
  yield* b.wait(0.6 + pace.wake);
  // back from the desk, a look round the room
  b.press("s");
  yield* b.wait(0.55);
  b.release("s");
  yield* b.lookAt({ yaw: -1.9, pitch: -0.05 }, 0.85);
  yield* b.wait(0.4);
  b.press("w"); yield* b.wait(0.5); b.release("w");
  yield* b.until(() => st().ring1 >= 0, 20);
  b.mark("ring1");
  // the phone: the head goes to the sound before the feet do
  yield* b.wait(0.34);
  yield* b.lookAt([PHONE1[0], 1.25, PHONE1[2]], 1.6);
  yield* b.wait(0.9);
  yield* b.walk([[4.6, 7.72], [8.4, 7.72]], { pitch: -0.06 });
  // passing the last desk: a glance at the door's sign, then on
  yield* b.both(b.walk([[10.5, 7.1], [10.62, 5.3]], { watch: [10.5, 2.25, 0.1], stopAtEnd: false }), b.wait(0.1));
  yield* b.walk([[10.55, 4.5], [9.46, 4.12]], { watch: [PHONE1[0], PHONE1[1] + 0.05, PHONE1[2]], arrive: 0.1 });
  const ph = interact("phone1").at;
  yield* b.lookAt(ph, 1.0, 0.02);
  yield* b.until(() => b.s.hand.hover === "phone1", 2);
  yield* b.wait(0.45);
  yield* b.click(5);
  b.mark("vm1-press");
  yield* b.until(() => st().vm1 >= 0 && b.s.f >= st().vm1, 2);
  // listening: standing, eyes on the phone, then drifting; the floor goes to sleep round them
  yield* b.wait(2.4);
  yield* b.lookAt({ yaw: 1.2, pitch: 0.02 }, 0.7);
  yield* b.wait(1.7);
  yield* b.lookAt(ph, 0.8);
  yield* b.until(() => b.s.sleep > 0.42, 12);
  // the light is going: up at the tube, round at the room
  yield* b.wait(0.3);
  yield* b.lookAt([9.6, 2.7, 2.6], 1.5);
  yield* b.wait(0.7);
  yield* b.lookAt({ yaw: 2.3, pitch: 0.0 }, 1.6);
  yield* b.until(() => b.s.sleep > 0.9, 8);
  // something is in the corridor: eyes to the door, feet backwards
  yield* b.lookAt([10.5, 1.5, 0.0], 2.2);
  yield* b.wait(0.5);
  b.mark("wake-move");
  yield* b.walk([[10.45, 5.2]], { watch: [10.5, 1.45, 0.0], arrive: 0.3 });
  yield* b.wait(0.7);
  // it worked: keep moving, as told; pace while the message runs
  const vm1End = () => since(st().vm1) > LINES.vm1.seconds - 2.2;
  let lap = 0;
  while (!vm1End()) {
    const pts: [number, number][] = lap % 2 === 0 ? [[10.6, 6.9], [10.2, 7.5]] : [[10.62, 5.6], [10.55, 3.3]];
    const watch: V3 | null = lap % 2 === 0 ? null : [PHONE1[0], 1.0, PHONE1[2]];
    yield* b.both(b.walk(pts, { watch, stopAtEnd: false }), b.until(vm1End, 40));
    lap++;
    if (lap > 8) break;
  }
  b.releaseAll();
  yield* b.wait(0.1 + pace.bay);
  b.mark("to-corridor");
  yield* b.walk([[10.58, 3.0], [10.5, 0.7], [10.5, -1.05]], { stopAtEnd: false });

  // ---- the corridor -------------------------------------------------------------------------------------------------
  // which way? west first: it is dark that way
  yield* b.both(b.walk([[9.6, -1.3], [7.4, -1.25]], { watch: [-4, 1.5, -1.3], stopAtEnd: false }), b.wait(0.1));
  // on under the tired tube, to where the lights stop
  yield* b.walk([[5.6, -1.3], [4.3, -1.35]], { pitch: -0.02, arrive: 0.15 });
  yield* b.wait(1.0);
  b.press("a"); yield* b.wait(0.35); b.release("a"); // a restless half-step
  yield* b.lookAt({ yaw: Math.PI / 2 + 0.08, pitch: 0.12 }, 0.8); // the dead tubes overhead, into the dark
  yield* b.wait(1.2 + pace.corridor);
  // something in there shifts: backing off, eyes on it
  b.press("s"); yield* b.wait(0.9); b.release("s");
  yield* b.wait(0.5);
  b.mark("turn-east");
  yield* b.walk([[8.2, -1.3], [10.6, -1.35], [12.2, -1.6], [12.78, -1.78]], { arrive: 0.12 });
  // a door: try it
  const lk = interact("locked").at;
  yield* b.lookAt(lk, 1.0, 0.02);
  yield* b.until(() => b.s.hand.hover === "locked", 2);
  yield* b.wait(0.3);
  yield* b.click(6);
  yield* b.wait(0.55);
  yield* b.click(4);
  yield* b.wait(0.7);
  b.mark("locked");
  // on east: a notice on the board. Reading it, the player stands still, and the floor goes to sleep round them
  yield* b.walk([[13.7, -1.42], [14.12, -1.52]], { arrive: 0.1, watch: [NOTICE[0], NOTICE[1], NOTICE[2]] });
  yield* b.lookAt(interact("notice").at, 0.9, 0.02);
  yield* b.until(() => b.s.hand.hover === "notice", 2);
  yield* b.wait(0.65); // the "Read" prompt up a full second and more before the paper covers it
  yield* b.click(5);
  yield* b.until(() => st().read === "notice", 1);
  b.mark("notice");
  const opened = st().readF;
  // read through, and the last line again
  yield* b.until(() => b.s.f - opened > readMin("notice") + Math.round((1.4 + pace.notice) * FPS), 40);
  yield* b.click(5);
  b.mark("notice-down");
  // dark. The tube overhead, then down the corridor, west
  yield* b.wait(0.75);
  yield* b.lookAt({ yaw: b.s.p.yaw + 0.15, pitch: 0.6 }, 1.0);
  yield* b.wait(0.5);
  yield* b.lookAt([8.1, 1.42, -1.15], 1.35);
  b.mark("sees-it");
  yield* b.wait(1.0);
  // backing off, east, eyes on it: the floor wakes
  b.pushX = -11; b.pushY = 5;
  b.press("s"); yield* b.wait(0.95); b.release("s");
  yield* b.wait(1.4);
  // gone. On, fast, glancing back
  yield* b.lookAt({ yaw: -Math.PI / 2, pitch: -0.03 }, 1.6);
  yield* b.walk([[15.6, -1.45], [16.9, -1.4]], { stopAtEnd: false });
  yield* b.walk([[18.19, -1.72]], { arrive: 0.1, watch: [18.17, 1.3, -4.5] });
  // a gap, and a lit room through it: try to go in
  yield* b.lookAt([18.17, 1.35, -4.2], 1.0);
  b.press("w"); yield* b.wait(0.85); b.release("w");
  yield* b.wait(0.5);
  b.press("w"); b.press("d"); yield* b.wait(0.4); b.releaseAll();
  yield* b.wait(0.45);
  b.press("s"); yield* b.wait(0.3); b.release("s");
  // the edge of the gap
  const edge = (): V3 => [COPY_OPEN.a + st().copyW, 1.18, -2.5];
  yield* b.lookAt(edge(), 0.9, 0.02);
  yield* b.until(() => b.s.hand.hover === "copy-edge", 2);
  yield* b.wait(0.75);
  b.mark("resize");
  // hold and pull: three sweeps of the mouse, the hand lifted and set down between them
  b.down = true;
  yield* b.wait(0.18);
  b.freeze = true;
  for (let sweep = 0; sweep < 6 && st().copyW < COPY_MAX - 0.008; sweep++) {
    const counts = b.n(sweep === 0 ? 170 : 290, 30), dur = Math.round(b.n(sweep === 0 ? 30 : 26, 4));
    if (sweep >= 1) b.press("d");
    for (let i = 0; i < dur && st().drag; i++) {
      const u0 = i / dur, u1 = (i + 1) / dur;
      const e = (u: number) => u * u * (3 - 2 * u);
      b.pushX = counts * (e(u1) - e(u0));
      b.pushY = (b.rand() - 0.5) * 1.5;
      yield;
    }
    b.release("d");
    yield* b.wait(b.n(0.3, 0.06)); // the lift
    if (!st().drag) break;
  }
  b.down = false;
  b.freeze = false;
  b.releaseAll();
  yield* b.wait(0.5);
  b.mark("resized");
  // in
  yield* b.walk([[18.62, -1.95], [18.62, -3.5], [19.35, -4.5], [19.69, -4.86]], { arrive: 0.1 });

  // ---- the copy room ------------------------------------------------------------------------------------------------
  const rec = interact("recorder").at;
  yield* b.lookAt(rec, 0.9, 0.02);
  yield* b.until(() => b.s.hand.hover === "recorder", 2);
  yield* b.wait(0.5);
  yield* b.click(6);
  b.mark("tape2-press");
  yield* b.wait(1.6);
  // a small restless move while it talks
  b.press("a"); yield* b.wait(0.3); b.release("a");
  yield* b.until(() => since(st().tape2) > capAt("tape2", "take mine") + 0.5, 20);
  const bd = interact("badge").at;
  yield* b.lookAt(bd, 1.1, 0.02);
  yield* b.until(() => b.s.hand.hover === "badge", 2);
  yield* b.wait(0.3);
  b.down = true;
  yield* b.wait(0.4);
  // lifted: look at it
  yield* b.lookAt({ yaw: b.s.p.yaw + 0.1, pitch: -0.28 }, 0.8);
  yield* b.wait(1.2);
  b.down = false;
  b.mark("badge");
  yield* b.wait(0.3);
  // keep moving, as told: a slow turn about the room while the tape runs out
  const tapeEnd = () => since(st().tape2) > LINES.tape2.seconds - 0.3;
  yield* b.both(b.walk([[18.9, -5.0], [17.6, -5.2]], { watch: [16.3, 1.3, -5.6] }), b.until(tapeEnd, 14));
  b.releaseAll();
  lap = 0;
  while (!tapeEnd()) {
    const pts: [number, number][] = lap % 2 === 0 ? [[18.4, -4.6]] : [[17.7, -5.3]];
    yield* b.both(b.walk(pts, { watch: [RECORDER[0], RECORDER[1], RECORDER[2]], stopAtEnd: false, arrive: 0.25 }), b.until(tapeEnd, 40));
    lap++;
    if (lap > 12) break;
  }
  b.releaseAll();
  yield* b.wait(0.4 + pace.copy);
  // the tape's done. The copier starts by itself: the head snaps to it
  yield* b.until(() => st().copier >= 0, 8);
  yield* b.wait(0.3);
  b.pushX = 12; b.pushY = 3;
  yield* b.lookAt([18.3, 1.02, -7.25], 2.0);
  b.mark("copier");
  yield* b.wait(1.1);
  yield* b.walk([[17.85, -6.55]], { watch: [18.1, 0.95, -7.35], arrive: 0.12 });
  // a page comes out: take it
  yield* b.until(() => st().printed >= 0 && b.s.f - st().printed > PRINT_SLIDE + 12, 10);
  yield* b.lookAt(interact("printout").at, 0.9, 0.02);
  yield* b.until(() => b.s.hand.hover === "printout", 2);
  yield* b.wait(0.85); // likewise "Take", before the page comes up over it
  yield* b.click(5);
  b.mark("printout");
  yield* b.until(() => st().read === "printout" && b.s.f >= st().readF, 2);
  const op = st().readF;
  yield* b.until(() => b.s.f - op > readMin("printout") + Math.round((2.4 + pace.photo) * FPS), 20);
  yield* b.click(5);
  yield* b.wait(0.6);
  // the desk in the picture is theirs. Eyes to the door, and out
  yield* b.lookAt([18.6, 1.4, -2.6], 1.7);
  yield* b.wait(0.5);
  b.mark("leave-copy");
  yield* b.walk([[18.62, -3.3], [18.66, -1.6], [20.4, -1.25]], { stopAtEnd: false });

  // ---- east, to the dark ----------------------------------------------------------------------------------------------
  // knocking, from inside the office opposite: a stop, a look, the handle tried from the other side, away from it
  yield* b.race(b.walk([[23.2, -1.2], [26.2, -1.0]], { stopAtEnd: false }), b.until(() => st().knock >= 0, 12));
  yield* b.wait(0.18);
  b.releaseAll();
  yield* b.wait(0.4);
  b.pushX = 8; b.pushY = -3;
  yield* b.lookAt([KNOCK_DOOR[0] + 0.1, KNOCK_DOOR[1], KNOCK_DOOR[2]], 1.6);
  b.mark("knock");
  yield* b.until(() => b.s.f - st().knock > Math.round(3.6 * FPS), 6);
  b.press("a"); b.press("s"); yield* b.wait(0.55); b.releaseAll();
  yield* b.wait(0.7);
  yield* b.lookAt({ yaw: -Math.PI / 2, pitch: -0.03 }, 1.3);
  yield* b.walk([[24.2, -1.5], [26.2, -1.1]], { stopAtEnd: false });
  yield* b.walk([[28.6, -1.2], [29.55, -1.3]], { pitch: -0.03 });
  b.mark("mouth");
  // the mouth of the wing: a stop, a look in
  yield* b.wait(0.5);
  yield* b.lookAt({ yaw: -Math.PI / 2 + 0.5, pitch: 0.0 }, 0.7);
  yield* b.wait(0.7);
  yield* b.lookAt({ yaw: -Math.PI / 2 - 0.45, pitch: -0.02 }, 0.8);
  yield* b.wait(0.8 + pace.mouth);
  // back up the corridor: nothing. In, then.
  yield* b.lookAt({ yaw: Math.PI / 2 + 0.1, pitch: -0.02 }, 1.3);
  yield* b.wait(0.9);
  yield* b.lookAt({ yaw: -Math.PI / 2, pitch: -0.04 }, 1.0);
  yield* b.wait(0.4);
  yield* b.walk([[31.4, -1.3], [32.7, -1.25]], { pitch: -0.04 });
  b.mark("wing");
  yield* b.wait(0.4);
  // standing under the one light, listening: it gives up on them. Up at it; a step, and it strikes again
  yield* b.lookAt({ yaw: -Math.PI / 2 + 0.75, pitch: 0.02 }, 0.8);
  const over = fixtureAt(32.4, -1.3);
  yield* b.until(() => lightOf(b.s, over) < 0.2, 4);
  yield* b.wait(0.35);
  yield* b.lookAt([32.4, 2.6, -1.3], 1.1);
  yield* b.wait(0.9 + pace.wing);
  b.press("w"); yield* b.wait(0.32); b.release("w");
  yield* b.wait(0.9);
  yield* b.lookAt({ yaw: -Math.PI / 2 + 0.2, pitch: -0.02 }, 0.9);
  yield* b.wait(0.5);
  yield* b.lookAt({ yaw: -Math.PI / 2 - 0.9, pitch: -0.03 }, 0.9);
  yield* b.wait(0.8);
  yield* b.lookAt({ yaw: -Math.PI / 2 + 0.2, pitch: -0.02 }, 0.9);
  // across the wing's south side, the sensors striking ahead of them; the carpet rolls; east along the row into the dark
  yield* b.walk([[33.7, 0.5], [34.6, 2.75]], { pitch: -0.03, stopAtEnd: false });
  yield* b.walk([[34.9, 3.05]], { watch: [38.3, 0.35, 4.9], arrive: 0.2 });
  yield* b.wait(1.0);
  yield* b.lookAt({ yaw: -Math.PI / 2 - 0.3, pitch: -0.02 }, 1.0);
  yield* b.wait(0.8);
  yield* b.race(b.walk([[36.2, 1.4], [36.0, -0.6]], { pitch: -0.03 }), b.until(() => st().ghost1 >= 0, 20));
  b.releaseAll();
  yield* b.until(() => st().ghost1 >= 0, 10);
  // a light, far off, with nobody under it. Somebody under it.
  yield* b.wait(0.27);
  b.pushX = 14; b.pushY = -6; // the flinch reaches the mouse first
  yield* b.lookAt([GHOST_AT[0][0], 1.3, GHOST_AT[0][1] - 0.4], 2.3);
  b.mark("ghost1");
  yield* b.wait(1.5);
  b.press("s"); yield* b.wait(0.7); b.release("s");
  yield* b.until(() => st().ghost2 >= 0, 6);
  yield* b.wait(0.25);
  yield* b.lookAt([GHOST_AT[1][0], 1.4, GHOST_AT[1][1]], 2.0);
  b.mark("ghost2");
  yield* b.wait(0.9);
  // away from it, sideways, not turning the back
  yield* b.both(b.walk([[36.4, 0.3], [37.4, 1.0]], { watch: [GHOST_AT[1][0], 1.3, GHOST_AT[1][1]] }), b.until(() => st().ghost3 >= 0, 8));
  b.releaseAll();
  yield* b.until(() => st().ghost3 >= 0, 6);
  yield* b.wait(0.22);
  yield* b.lookAt([GHOST_AT[2][0], 1.5, GHOST_AT[2][1]], 2.4);
  b.mark("ghost3");
  yield* b.wait(0.55);
  // run
  yield* b.lookAt([47.9, 1.5, -1.3], 2.4, 0.2);
  yield* b.walk([[41.3, 0.25], [45.2, -0.95], [47.3, -1.3], [49.4, -1.3]], { sprint: true, stopAtEnd: false, pitch: -0.02 });
  b.release("Shift");
  yield* b.walk([[50.4, -1.25]], { stopAtEnd: false });
  b.mark("lobby");

  // ---- the lobby ------------------------------------------------------------------------------------------------------
  // round, walking backwards, eyes on the doorway
  yield* b.lookAt([48.2, 1.45, -1.3], 2.2, 0.15);
  yield* b.walk([[51.6, -1.2]], { watch: [48.2, 1.45, -1.3], arrive: 0.2 });
  yield* b.wait(1.4);
  b.press("d"); yield* b.wait(0.3); b.release("d");
  yield* b.wait(0.9 + pace.lobby);
  // nothing came through. The room: the desk, the sign, the door.
  yield* b.lookAt([50.6, 1.0, -3.5], 0.8);
  yield* b.wait(0.9);
  yield* b.lookAt([53.6, 2.3, -1.3], 0.9);
  yield* b.wait(0.7);
  yield* b.walk([[52.6, -0.95], [53.28, -0.74]], { arrive: 0.1 });
  const rd = interact("reader").at;
  yield* b.lookAt(rd, 1.0, 0.02);
  yield* b.until(() => b.s.hand.hover === "reader", 2);
  yield* b.wait(0.5);
  yield* b.click(6);
  b.mark("swipe");
  yield* b.wait(1.3);
  const hd = interact("stair-handle").at;
  yield* b.lookAt(hd, 0.9, 0.02);
  yield* b.until(() => st().ring2 >= 0, 6);
  // the phone on the desk
  yield* b.wait(0.24);
  b.pushX = -18; b.pushY = -5;
  yield* b.lookAt([MACHINE[0], MACHINE[1] + 0.1, MACHINE[2]], 2.1);
  b.mark("ring2");
  yield* b.wait(1.3);
  yield* b.walk([[52.2, -2.0], [51.85, -2.42]], { watch: [MACHINE[0], MACHINE[1] + 0.05, MACHINE[2]], arrive: 0.15 });
  yield* b.until(() => st().vm3 >= 0, 10);
  b.mark("vm3");
  // listening, and never still: a sway, left and right, in front of the desk
  const t3 = () => since(st().vm3);
  const notMe = capAt("vm3", "not from me");
  lap = 0;
  while (t3() < notMe + 0.9) {
    const pts: [number, number][] = lap % 2 === 0 ? [[51.25, -2.38]] : [[52.05, -2.44]];
    yield* b.both(b.walk(pts, { watch: [MACHINE[0], MACHINE[1] + 0.05, MACHINE[2]], arrive: 0.2 }), b.until(() => t3() >= notMe + 0.9, 40));
    b.releaseAll();
    yield* b.wait(b.n(0.5, 0.15));
    lap++;
    if (lap > 14) break;
  }
  b.releaseAll();
  b.mark("not-from-me");
  // that lands: still, then the door, then the machine
  yield* b.wait(1.3);
  yield* b.lookAt([53.95, 1.3, -1.3], 1.5);
  yield* b.wait(1.1);
  yield* b.lookAt([MACHINE[0], MACHINE[1] + 0.05, MACHINE[2]], 1.4);
  // away from that door
  yield* b.walk([[51.3, -1.75]], { watch: [MACHINE[0], MACHINE[1] + 0.05, MACHINE[2]], arrive: 0.2 });
  yield* b.until(() => t3() > LINES.vm3.seconds + 0.5, 30);
  // the line is dead. The door.
  yield* b.lookAt([53.95, 1.25, -1.3], 0.9);
  b.press("a"); yield* b.wait(0.25); b.release("a");
  yield* b.until(() => st().behind >= 0, 10);
  b.mark("behind");
  // the voice, close, behind: a beat of nothing, then round
  const B = st().behind;
  const after = (fr: number) => b.s.f >= B + fr;
  yield* b.wait(0.36);
  yield* b.lookAt([48.2, 1.5, -1.3], 2.6, 0.12);
  yield* b.wait(0.5);
  yield* b.lookAt([40, 1.45, -1.3], 1.2);
  yield* b.until(() => after(FIN.corOut(1)), 6);
  // backing off, slowly, as the far lights go
  b.press("s"); yield* b.wait(0.55); b.release("s");
  yield* b.until(() => after(FIN.wingOn(0) + 8), 6);
  b.press("s");
  yield* b.until(() => after(FIN.wingOn(2)), 6);
  b.release("s");
  yield* b.until(() => after(FIN.wingOn(3) + 14), 6);
  b.pushX = 9; b.pushY = 5;
  yield* b.lookAt([45.5, 1.6, -1.3], 2.2);
  b.press("s"); b.press("d");
  yield* b.until(() => after(FIN.lobbyA + 10), 6);
  yield* b.lookAt([48.75, 1.75, -1.3], 2.0);
  // the hand stops answering; the player doesn't stop trying
  yield* b.until(() => after(FIN.lock + 20), 6);
  for (let i = 0; i < 7; i++) { b.pushX = (i % 2 ? -1 : 1) * b.n(60, 20); b.pushY = b.n(0, 14); yield* b.wait(0.11); }
  b.releaseAll();
  yield* b.until(() => after(FIN.end), 12);
  b.mark("end");
}

export function simulate(pace: Pace = PACE, seed = 7): { bot: Bot; states: Game[] } {
  const bot = new Bot(seed);
  bot.play(play(bot, pace));
  return { bot, states: bot.states };
}
void BADGE; void READER;
