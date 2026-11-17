// A temperature as a colour (hot.tsx's, on its own so the film's shots and graphics can use it without the scanned
// hand hot.tsx poses). Temperatures are linear (the pass reads the linear frame), so greys go through sRGB first.
import { Srgba } from "raea/color";

const gamma = (x: number) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
/** a temperature (linear grey) as a colour, with alpha */
export const heat = (t: number, a = 1) => { const g = gamma(Math.max(0, Math.min(1, t))); return new Srgba(g, g, g, a); };
