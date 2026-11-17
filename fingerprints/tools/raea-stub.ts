// A stand-in for the raea SDK (and React's JSX runtime) so bun can import the film's own code outside a render, to
// measure what it decides (the lens, the cursor) frame by frame: every name a file here imports from raea is a value
// that can be called, built, read and chained and does nothing. Only staticFile and useCurrentFrame mean something.
//   bun --preload ./tools/raea-stub.ts tools/views.ts
import { plugin } from "bun";
import { readdirSync, readFileSync, statSync } from "node:fs";

const ROOT = new URL("..", import.meta.url).pathname;
const names = new Map<string, Set<string>>();
function scan(dir: string) {
  for (const f of readdirSync(dir)) {
    if (["node_modules", "out", "media", "vendor", "blender"].includes(f) || f.startsWith(".")) continue;
    const p = `${dir}/${f}`;
    if (statSync(p).isDirectory()) { scan(p); continue; }
    if (!/\.(tsx?|jsx?)$/.test(f)) continue;
    for (const m of readFileSync(p, "utf8").matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+"((?:raea|react)(?:\/[^"]*)?)"/g)) {
      const set = names.get(m[2]) ?? new Set<string>();
      for (const n of m[1].split(",")) { const k = n.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0].trim(); if (k) set.add(k); }
      names.set(m[2], set);
    }
  }
}
scan(ROOT.replace(/\/$/, ""));
const any: any = new Proxy(function () {}, { get: (_t, k) => (k === Symbol.toPrimitive ? () => 0 : k === "then" ? undefined : any), apply: () => any, construct: () => any });
const MEANT: Record<string, unknown> = { staticFile: (p: string) => p, useCurrentFrame: () => 0, jsx: () => null, jsxs: () => null, jsxDEV: () => null };
for (const r of ["react/jsx-runtime", "react/jsx-dev-runtime", "react"]) names.set(r, new Set([...(names.get(r) ?? []), "jsx", "jsxs", "jsxDEV", "Fragment"]));
plugin({
  name: "raea-stub",
  setup(b) {
    for (const [spec, want] of names) {
      b.module(spec, () => ({ exports: { default: any, ...Object.fromEntries([...want].map((n) => [n, MEANT[n] ?? any])) }, loader: "object" }));
    }
  },
});
