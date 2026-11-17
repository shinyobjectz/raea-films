// v4, after the Return: the first sign of the magic, the screen flaring. v5 (note 2): the rings of light v4 ran out from
// the monitor's foot across the water and the bank are gone; the shot holds on the dead swamp as the screen flares
// and spills its light, and the score's swell carries it. (v4's rings: /tmp/v4scripts/pulse.v4.tsx, git history.)
import { interpolate } from "raea";
import { T, clamp } from "./timeline";

/** the screen's flare: 0..1 */
export const flareAt = (f: number) => interpolate(f, [T.pulse - 5, T.pulse, T.pulse + 16], [0, 1, 0], clamp);
