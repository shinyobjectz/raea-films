// A door's casing by itself (media/models/hallway/door-frame.glb), from the hallway's door wall: the wall's face and its
// skirting are dropped from the scene, so a door can stand in any world with nothing round it (v3/worlds.tsx).
//   bun tools/door-frame.ts
const src = `${import.meta.dir}/../media/models/hallway/wall-door.glb`, out = `${import.meta.dir}/../media/models/hallway/door-frame.glb`;
const b = new Uint8Array(await Bun.file(src).arrayBuffer()), dv = new DataView(b.buffer);
const jl = dv.getUint32(12, true), j = JSON.parse(new TextDecoder().decode(b.subarray(20, 20 + jl))), rest = b.subarray(20 + jl);
const keep = (n: number): boolean => { const node = j.nodes[n]; if (node.children) node.children = node.children.filter(keep); return node.name === "wall_door_casing" || (node.children?.length ?? 0) > 0; };
j.scenes[j.scene ?? 0].nodes = j.scenes[j.scene ?? 0].nodes.filter(keep);
let js = new TextEncoder().encode(JSON.stringify(j)); const pad = (4 - (js.length % 4)) % 4; const jp = new Uint8Array(js.length + pad).fill(0x20); jp.set(js);
const total = 12 + 8 + jp.length + rest.length, o = new Uint8Array(total), od = new DataView(o.buffer);
od.setUint32(0, 0x46546c67, true); od.setUint32(4, 2, true); od.setUint32(8, total, true); od.setUint32(12, jp.length, true); od.setUint32(16, 0x4e4f534a, true); o.set(jp, 20); o.set(rest, 20 + jp.length);
await Bun.write(out, o); console.log(out, total, "bytes; scene nodes:", j.scenes[j.scene ?? 0].nodes.map((n: number) => j.nodes[n].name).join(", "));
