// One integer per line (CSV from DuckDB) -> raw little-endian uint16. usage: bun u16.ts IN.csv OUT.u16
const [inp, out] = process.argv.slice(2);
const lines = (await Bun.file(inp).text()).split("\n").filter((l) => l.length > 0);
const buf = new Uint16Array(lines.length);
for (let i = 0; i < lines.length; i++) buf[i] = Math.max(0, Math.min(65535, Number(lines[i])));
await Bun.write(out, buf);
console.log(`u16: ${lines.length} values -> ${out}`);
