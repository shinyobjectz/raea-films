// The canyon's mural (the director, 11-11: "we shoudl have this populate and draw buetiful intricate designs on the rock faces
// as painted dripping textures"): one long painted frieze, 2:1, on nothing (alpha), in the pigments a canyon wall is
// painted in: bone white, red and yellow ochre, turquoise, charcoal. The film's pass lays it on the rock in world
// space, along the cursor's stroke, and runs its drips (media/shaders/stay.wgsl).
//   raea render tools/mural.tsx --composition mural --alpha --at 0 -o media/paint/tmp/   ->  media/paint/mural.png
import { AbsoluteFill, Composition, registerRoot } from "raea";

const W = 2400, H = 1200;
const BONE = "#efe4cc", RED = "#a23a1e", OCHRE = "#dba23a", TURQ = "#2c9a93", COAL = "#2b2320";
let seed = 11; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const spiral = (cx: number, cy: number, r0: number, r1: number, turns: number, dir = 1) => { const pts: string[] = []; const n = Math.round(turns * 40); for (let i = 0; i <= n; i++) { const k = i / n, a = dir * k * turns * 2 * Math.PI, r = r0 + (r1 - r0) * k; pts.push(`${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`); } return `M${pts.join(" L")}`; };
const rays = (cx: number, cy: number, r0: number, r1: number, n: number, color: string, w: number) => Array.from({ length: n }, (_, i) => { const a = (i / n) * 2 * Math.PI, wob = 1 + 0.18 * Math.sin(i * 2.7); return <line key={i} x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0} x2={cx + Math.cos(a) * r1 * wob} y2={cy + Math.sin(a) * r1 * wob} stroke={color} strokeWidth={w} strokeLinecap="round" />; });
const dots = (cx: number, cy: number, r: number, n: number, color: string, size: number) => Array.from({ length: n }, (_, i) => { const a = (i / n) * 2 * Math.PI; return <circle key={i} cx={cx + Math.cos(a) * r} cy={cy + Math.sin(a) * r} r={size * (0.8 + 0.4 * rnd())} fill={color} />; });
const hand = (x: number, y: number, s: number, color: string, turn: number) => (
  <g transform={`translate(${x} ${y}) rotate(${turn}) scale(${s})`} fill={color}>
    <ellipse cx={0} cy={0} rx={30} ry={34} />
    {[-28, -13, 2, 17].map((dx, i) => <rect key={i} x={dx - 6} y={-86 - [0, 12, 10, -2][i]} width={12} height={64 + [0, 12, 10, -2][i]} rx={6} transform={`rotate(${[-14, -5, 4, 13][i]} ${dx} -30)`} />)}
    <rect x={26} y={-34} width={13} height={46} rx={6.5} transform="rotate(52 26 -8)" />
  </g>
);
const beast = (x: number, y: number, s: number, color: string, flip = 1) => (
  <g transform={`translate(${x} ${y}) scale(${s * flip} ${s})`} stroke={color} strokeWidth={9} strokeLinecap="round" fill="none">
    <path d="M-60,0 C-30,-16 30,-16 62,-2" strokeWidth={16} />
    <path d="M-48,4 L-56,58 M-28,2 L-24,60 M34,2 L30,60 M52,2 L62,56" />
    <path d="M62,-2 L92,-34 L112,-30" strokeWidth={11} />
    <path d="M90,-36 C84,-70 104,-92 128,-86 M96,-36 C98,-64 118,-76 140,-66" strokeWidth={6} />
    <path d="M-60,0 L-80,-18" strokeWidth={6} />
  </g>
);
const zig = (x0: number, x1: number, y: number, amp: number, step: number) => { let d = `M${x0},${y}`; for (let x = x0 + step, i = 1; x <= x1; x += step, i++) d += ` L${x},${y + (i % 2 ? -amp : amp)}`; return d; };
const wave = (x0: number, x1: number, y: number, amp: number, len: number) => { let d = `M${x0},${y}`; for (let x = x0; x < x1; x += len) d += ` q${len / 4},${-amp} ${len / 2},0 t${len / 2},0`; return d; };

function Mural() {
  seed = 11;
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          {/* a brush's edge: the shapes pushed about by a fine noise, and a coarser one eaten out of them where the rock's grain took no paint */}
          <filter id="brush" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="4" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="16" xChannelSelector="R" yChannelSelector="G" result="d" />
            <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="9" result="g" />
            <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.72" result="holes" />
            <feComposite in="d" in2="holes" operator="in" />
          </filter>
        </defs>
        <g filter="url(#brush)">
          {/* the great sun: a spiral in a ring of rays and dots */}
          <path d={spiral(520, 560, 12, 190, 4.5)} stroke={BONE} strokeWidth={22} fill="none" strokeLinecap="round" />
          <circle cx={520} cy={560} r={236} stroke={RED} strokeWidth={20} fill="none" />
          {rays(520, 560, 262, 360, 28, OCHRE, 15)}
          {dots(520, 560, 410, 34, TURQ, 13)}
          {rays(520, 560, 440, 478, 56, BONE, 6)}
          {/* a band of zigzags over everything and water under it */}
          <path d={zig(60, 2340, 92, 34, 46)} stroke={RED} strokeWidth={17} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <path d={zig(60, 2340, 150, 22, 46)} stroke={BONE} strokeWidth={8} fill="none" strokeLinejoin="round" />
          {Array.from({ length: 50 }, (_, i) => <circle key={i} cx={83 + i * 46} cy={196} r={7} fill={OCHRE} />)}
          <path d={wave(40, 2360, 1090, 26, 120)} stroke={TURQ} strokeWidth={16} fill="none" strokeLinecap="round" />
          <path d={wave(100, 2360, 1140, 20, 120)} stroke={BONE} strokeWidth={8} fill="none" strokeLinecap="round" />
          {/* the herd, going the way we go */}
          {beast(1080, 480, 1.5, COAL)}{beast(1330, 380, 1.15, RED)}{beast(1500, 560, 1.35, COAL)}{beast(1260, 690, 1.0, OCHRE)}{beast(1720, 440, 0.95, COAL)}{beast(1000, 820, 0.9, RED)}
          {/* hands */}
          {hand(1960, 760, 1.25, BONE, -12)}{hand(2110, 640, 1.1, RED, 9)}{hand(2230, 800, 1.2, OCHRE, 20)}{hand(1830, 930, 0.95, TURQ, -24)}{hand(2050, 950, 0.9, BONE, 4)}
          {/* a second, smaller sun, and the moon's phases over the herd */}
          <path d={spiral(2060, 360, 8, 96, 3.2, -1)} stroke={OCHRE} strokeWidth={15} fill="none" strokeLinecap="round" />
          {rays(2060, 360, 122, 178, 18, BONE, 10)}
          {[0, 1, 2, 3, 4].map((i) => <g key={i}><circle cx={1150 + i * 120} cy={250} r={34} fill={BONE} /><circle cx={1150 + i * 120 + (i - 2) * 22} cy={250} r={i === 2 ? 0 : 34} fill={COAL} /></g>)}
          {/* stepped triangles along the foot, and trails of dots between things */}
          {Array.from({ length: 22 }, (_, i) => <path key={i} d={`M${880 + i * 68},1010 l34,-58 l34,58 z`} fill={i % 3 === 0 ? RED : i % 3 === 1 ? OCHRE : COAL} />)}
          {Array.from({ length: 40 }, (_, i) => { const k = i / 39; return <circle key={i} cx={760 + k * 1000} cy={920 - Math.sin(k * 3.1) * 190 - k * 160} r={6 + 5 * rnd()} fill={i % 2 ? BONE : TURQ} />; })}
          {Array.from({ length: 26 }, (_, i) => { const k = i / 25; return <circle key={i} cx={130 + k * 300} cy={980 + Math.sin(k * 5) * 30} r={7 + 4 * rnd()} fill={RED} />; })}
        </g>
      </svg>
    </AbsoluteFill>
  );
}
registerRoot(() => <Composition id="mural" component={Mural} width={W} height={H} fps={30} durationInFrames={1} />);
