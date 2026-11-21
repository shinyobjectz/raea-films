// A small glTF 2.0 binary writer: meshes of triangles with normals, optional vertex colours and uvs, plain PBR
// materials, optional PNG textures. Y is up, as glTF asks; the callers put east on +x and north on -z.

export type Part = {
  positions: number[]; // xyz per vertex
  normals: number[];
  colors?: number[]; // rgba 0..255 per vertex
  uvs?: number[];
  indices: number[];
  material: number;
};
export type Material = {
  name: string;
  color: [number, number, number, number]; // linear 0..1
  roughness: number;
  metallic?: number;
  texture?: number; // index into images
  doubleSided?: boolean;
  emissive?: [number, number, number];
};
export type Node = { name: string; parts: Part[]; extras?: Record<string, unknown> };

/** A mesh being filled: push vertices and triangles, then hand it to writeGlb as a Part. */
export class Builder {
  positions: number[] = [];
  normals: number[] = [];
  colors: number[] = [];
  uvs: number[] = [];
  indices: number[] = [];
  constructor(public material: number, public withUv = false) {}
  get count() { return this.positions.length / 3; }
  vertex(p: number[], n: number[], c: number[] = [255, 255, 255, 255], uv: number[] = [0, 0]) {
    this.positions.push(p[0], p[1], p[2]);
    this.normals.push(n[0], n[1], n[2]);
    this.colors.push(c[0], c[1], c[2], c[3] ?? 255);
    if (this.withUv) this.uvs.push(uv[0], uv[1]);
    return this.count - 1;
  }
  tri(a: number, b: number, c: number) { this.indices.push(a, b, c); }
  /** A quad a b c d (counter-clockwise seen from where n points), one flat normal. */
  quad(a: number[], b: number[], c: number[], d: number[], n: number[], col?: number[], uv?: number[][]) {
    const i = this.vertex(a, n, col, uv?.[0]), j = this.vertex(b, n, col, uv?.[1]);
    const k = this.vertex(c, n, col, uv?.[2]), l = this.vertex(d, n, col, uv?.[3]);
    this.tri(i, j, k);
    this.tri(i, k, l);
  }
  part(): Part | null {
    if (!this.indices.length) return null;
    return { positions: this.positions, normals: this.normals, colors: this.colors, uvs: this.withUv ? this.uvs : undefined, indices: this.indices, material: this.material };
  }
}

export function writeGlb(nodes: Node[], materials: Material[], images: Uint8Array[] = []): Uint8Array {
  const chunks: Uint8Array[] = [];
  let length = 0;
  const views: any[] = [], accessors: any[] = [];
  const add = (bytes: Uint8Array, target?: number) => {
    const pad = (4 - (length % 4)) % 4;
    if (pad) (chunks.push(new Uint8Array(pad)), (length += pad));
    views.push({ buffer: 0, byteOffset: length, byteLength: bytes.byteLength, ...(target ? { target } : {}) });
    chunks.push(bytes);
    length += bytes.byteLength;
    return views.length - 1;
  };
  const accessor = (data: ArrayLike<number>, type: string, kind: "f32" | "u32" | "u8n", target: number, minmax = false) => {
    const size = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[type]!;
    const arr = kind === "f32" ? new Float32Array(data) : kind === "u32" ? new Uint32Array(data) : new Uint8Array(data);
    const a: any = {
      bufferView: add(new Uint8Array(arr.buffer), target),
      componentType: kind === "f32" ? 5126 : kind === "u32" ? 5125 : 5121,
      count: data.length / size,
      type,
      ...(kind === "u8n" ? { normalized: true } : {}),
    };
    if (minmax) {
      const min = Array(size).fill(Infinity), max = Array(size).fill(-Infinity);
      for (let i = 0; i < data.length; i++) (min[i % size] = Math.min(min[i % size], data[i])), (max[i % size] = Math.max(max[i % size], data[i]));
      a.min = min.map((v) => Math.fround(v));
      a.max = max.map((v) => Math.fround(v));
    }
    accessors.push(a);
    return accessors.length - 1;
  };

  const meshes: any[] = [], gnodes: any[] = [];
  for (const node of nodes) {
    const prims = node.parts.map((p) => {
      const attributes: any = {
        POSITION: accessor(p.positions, "VEC3", "f32", 34962, true),
        NORMAL: accessor(p.normals, "VEC3", "f32", 34962),
      };
      if (p.colors?.length) attributes.COLOR_0 = accessor(p.colors, "VEC4", "u8n", 34962);
      if (p.uvs?.length) attributes.TEXCOORD_0 = accessor(p.uvs, "VEC2", "f32", 34962);
      return { attributes, indices: accessor(p.indices, "SCALAR", "u32", 34963), material: p.material, mode: 4 };
    });
    if (!prims.length) continue;
    meshes.push({ name: node.name, primitives: prims });
    gnodes.push({ name: node.name, mesh: meshes.length - 1, ...(node.extras ? { extras: node.extras } : {}) });
  }
  const imageDefs = images.map((png) => ({ bufferView: add(png), mimeType: "image/png" }));
  const json: any = {
    asset: { version: "2.0", generator: "gambit tools/map/glb.ts" },
    scene: 0,
    scenes: [{ nodes: gnodes.map((_, i) => i) }],
    nodes: gnodes,
    meshes,
    materials: materials.map((m) => ({
      name: m.name,
      pbrMetallicRoughness: {
        baseColorFactor: m.color,
        metallicFactor: m.metallic ?? 0,
        roughnessFactor: m.roughness,
        ...(m.texture !== undefined ? { baseColorTexture: { index: m.texture } } : {}),
      },
      ...(m.emissive ? { emissiveFactor: m.emissive } : {}),
      ...(m.doubleSided ? { doubleSided: true } : {}),
      ...(m.color[3] < 1 ? { alphaMode: "BLEND" } : {}),
    })),
    accessors,
    bufferViews: views,
    buffers: [{ byteLength: length }],
  };
  if (images.length) {
    json.images = imageDefs;
    json.samplers = [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }];
    json.textures = images.map((_, i) => ({ sampler: 0, source: i }));
  }
  const bin = new Uint8Array(length + ((4 - (length % 4)) % 4));
  let o = 0;
  for (const c of chunks) (bin.set(c, o), (o += c.byteLength));
  // Pad the JSON chunk with spaces to 4 bytes, counted in UTF-8 bytes (names carry umlauts).
  const raw = new TextEncoder().encode(JSON.stringify(json));
  const jbytes = new Uint8Array(raw.byteLength + ((4 - (raw.byteLength % 4)) % 4)).fill(0x20);
  jbytes.set(raw);
  const out = new Uint8Array(12 + 8 + jbytes.byteLength + 8 + bin.byteLength);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, 0x46546c67, true);
  dv.setUint32(4, 2, true);
  dv.setUint32(8, out.byteLength, true);
  dv.setUint32(12, jbytes.byteLength, true);
  dv.setUint32(16, 0x4e4f534a, true);
  out.set(jbytes, 20);
  const b = 20 + jbytes.byteLength;
  dv.setUint32(b, bin.byteLength, true);
  dv.setUint32(b + 4, 0x004e4942, true);
  out.set(bin, b + 8);
  return out;
}
