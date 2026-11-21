// A box of the Straube plan (cache tiles, 500 m at 0.25 m a pixel, named by their lower-left corner in 100 m units,
// on a grid from E 389400 / N 5814800), with a red 10 m grid labelled every 50 m, for reading house numbers by eye.
//   bun stcrop.ts OUT.png X0 Y0 X1 Y1
import { $ } from "bun";
const [out, ...b] = process.argv.slice(2);
const [X0, Y0, X1, Y1] = b.map(Number);
const dir = `${import.meta.dir}/../../cache/berlin/rasters/straube`;
const T = 500, PX = 4, OE = 389400, ON = 5814800;
const e0 = OE + Math.floor((X0 - OE) / T) * T, n0 = ON + Math.floor((Y0 - ON) / T) * T;
const e1 = OE + Math.floor((X1 - 1e-6 - OE) / T) * T, n1 = ON + Math.floor((Y1 - 1e-6 - ON) / T) * T;
const args: string[] = [];
for (let e = e0; e <= e1; e += T) for (let n = n0; n <= n1; n += T)
  args.push("(", `${dir}/${e / 100}_${n / 100}.png`, "-repage", `+${(e - e0) * PX}+${(n1 + T - (n + T)) * PX}`, ")");
const W = Math.round((X1 - X0) * PX), H = Math.round((Y1 - Y0) * PX), ox = (X0 - e0) * PX, oy = (n1 + T - Y1) * PX;
const draw: string[] = [];
for (let x = Math.ceil(X0 / 10) * 10; x <= X1; x += 10) {
  const px = (x - X0) * PX;
  draw.push("-stroke", x % 50 ? "rgba(220,0,0,0.25)" : "rgba(220,0,0,0.6)", "-draw", `line ${px},0 ${px},${H}`);
  if (x % 50 === 0) draw.push("-stroke", "none", "-fill", "rgb(200,0,0)", "-draw", `text ${px + 2},12 '${x % 1000}'`);
}
for (let y = Math.ceil(Y0 / 10) * 10; y <= Y1; y += 10) {
  const py = (Y1 - y) * PX;
  draw.push("-stroke", y % 50 ? "rgba(220,0,0,0.25)" : "rgba(220,0,0,0.6)", "-draw", `line 0,${py} ${W},${py}`);
  if (y % 50 === 0) draw.push("-stroke", "none", "-fill", "rgb(200,0,0)", "-draw", `text 2,${py - 2} '${y % 1000}'`);
}
await $`magick ${args} -background white -layers mosaic -crop ${W}x${H}+${ox}+${oy} +repage -font /Library/Fonts/Arial\ Unicode.ttf -pointsize 11 ${draw} ${out}`;
console.log(`${out}: ${W}x${H}, E ${X0}-${X1}, N ${Y0}-${Y1}; labels are E and N mod 1000`);
