// The v3 cut: every shot of the film in order, the swamp's (take.ts), the orbit's (orbit.tsx) and the review room's
// (room.tsx), each a row with its frames and camera. hype.tsx renders one composition a row.
import { ORBIT_SHOTS } from "./orbit";
import { ROOM_SHOTS } from "./room";
import { SHOTS2, type Shot2 } from "./take";
import { END, T } from "./timeline";

const O = ORBIT_SHOTS(T.orbit, T.port, T.arrive, T.end, END);
const R = ROOM_SHOTS(T.arrive, T.room, T.hands, T.glyphs, T.noteRoom, T.end);
export const CUT: Shot2[] = [...SHOTS2, O[0], O[1], ...R, O[2]];
