// The faces: one of raea's people (raea/character), turbo, and his face made in front of us. the director, 11-12: "the circle of
// the hallway mathc cuts formas the wireframe of the first person, we only show him, and as we slowly pull out the face
// starts to form features and clay and textyre and the basic look then the dlss look ... until it gets to the next
// scee." The torii's last frame is the montage's ring in the middle of the frame, the line drawing inside it; here the
// same ring, the same size at the cut, holds his head in the drawing, with everything outside it black. His triangles settle in (the features form); on the downbeat
// the ring closes over his face and leaves him clay; then his skin; then the DLSS pass (tools/faces.sh). The lens pulls out all
// the way, at one speed, from his head to his head and shoulders. Stages and their frames: v3/faces-cuts.ts.
// (it was ten, then six match cuts between five people and their styles, 11-11)
//   bash tools/faces.sh   (raea render v3/faces.tsx --composition faces, then the DLSS pass and the grain)
import { AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame } from "raea";
import { Character, registerBody, rest, type Skeleton } from "raea/character";
import { Bloom, Canvas3D, DepthOfField, Environment, FogVolume, Refinish, ToneMapping, VolumetricFog } from "raea/3d";
import { DirectionalLight, SolariLighting } from "raea/light";
import { Transform } from "raea/transform";
import { Camera3d } from "raea/camera";
import { StandardMaterial } from "raea/pbr";
import turbo from "../media/characters/turbo/skeleton.json" with { type: "json" };
import luis from "../media/characters/luis/skeleton.json" with { type: "json" };
import leila from "../media/characters/leila/skeleton.json" with { type: "json" };
import mai from "../media/characters/mai/skeleton.json" with { type: "json" };
import pavel from "../media/characters/pavel/skeleton.json" with { type: "json" };
import { FilmLook } from "./look";

const PEOPLE = [turbo, luis, leila, mai, pavel] as unknown as Skeleton[];
PEOPLE.forEach((s) => registerBody(s));
import { CLAY, FPS, LEN, SKIN } from "./faces-cuts";
import { H, SHORT, TALL, W } from "./plan";
const FOV = 0.27, EYELINE = 0.42;
type Face = Record<string, number>;
function faceAt(f: number, person: number): Face {
  const face: Face = { smile: 0.1 + 0.05 * Math.sin(f * 0.05 + person) };
  const bt = (f + 22) % 68; if (bt < 5) face.blink = Math.sin((bt / 4) * Math.PI);
  return face;
}
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => { const t = clamp01(x); return t * t * (3 - 2 * t); };
/** the torii's circle: its radius, as a share of the frame's height (out/v3/shots/torii.mp4's last frame) */
const CIRCLE = 0.3125;
/** the body's glTF materials (media/characters/turbo/body.glb) */
const BODY = ["skin", "eye", "namuhekam_male_polo_shirt", "toigo_wool_pants", "toigo_ankle_boots_male", "teeth", "tongue", "eyelashes", "brows", "cornea"];
/** the ring about his head, in metres at his head (crown to chin is 0.24 m), and how far behind the eyes his head's middle is */
const R0 = 0.135, BACK = 0.09;
/** `k`: pixels per pixel of the 1350 x 1080 frame (2 at full size), so the lens's blur is the same share of the picture */
function Faces({ k = 1, from = 0 }: { k?: number; /** the segment's first frame of the shot */ from?: number }) {
  const f = useCurrentFrame() + from, u = f / (LEN - 1);
  const who = 0, sk = PEOPLE[who], p = rest(sk);
  const eyes = (sk.landmarks?.eyes ?? [0, 1.7, 0.13]) as unknown as [number, number, number];
  const head: [number, number, number] = [0, eyes[1] - 0.01, eyes[2] - BACK];
  // the pull-out: a slow one from an extreme close-up (his eyes, 0.11 m of frame) to a close-up (his face, 0.32 m, his
  // eyes on the upper third's line), at one speed, already moving at the cut (the director, 11-12: "without pushing back that
  // far its way far out we just want a slow push out form ecu to cu"; it went out to his head and shoulders, 0.9 m)
  // (tall: 0.2 m to 0.42 m, so the extreme close-up still holds both eyes across the narrow frame; the ring about them is
  // then the same size in metres as on the 5:4)
  const t2 = 2 * Math.tan(FOV / 2), viewH0 = TALL ? 0.2 : 0.11, viewH1 = TALL ? 0.42 : 0.32;
  const viewH = viewH0 + (viewH1 - viewH0) * u, dist = viewH / t2;
  const aim = head[1] + (eyes[1] - (0.5 - EYELINE) * viewH - head[1]) * ease(u * 1.2);
  const cam = { eye: [0.03 * Math.sin(u * 3), aim, head[2] + dist] as [number, number, number], look: [0, aim, head[2]] as [number, number, number], fov: (FOV * 180) / Math.PI };
  // the stages: the drawing (black outside it), the clay sweeping on from the nose back, the skin
  // the montage's own ring (v3/places.tsx: inside it, the drawing), the torii's size at the cut (0.31 of the frame's
  // height), then the size of his head as the lens pulls away, and on the downbeat closing to nothing over his face
  // (the ring is the torii's size at the cut, and from there it stays on his face: a patch of it that the lens pulls away from)
  const ring = k * SHORT * CIRCLE * (viewH0 / viewH) * (1 - ease((f - CLAY) / 12));
  // (Refinish does not reach the body's own materials; each is recovered on the body itself, as raea/character does its
  // hair: black before the clay, so only the ring's drawing is seen; then one clay over all of him, eyes and all)
  const plain = f < CLAY ? { c: "#030303", r: 1 } : f < SKIN ? { c: "#b7a795", r: 0.72 } : null;
  return (
    <AbsoluteFill style={{ background: "#020202" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...cam.eye).lookingAt(cam.look)} projection={{ Perspective: { fov: FOV } }}>
          <SolariLighting bounces={2} />
          {/* a fast long lens: the eyes sharp, the ears and shoulders already soft, the dark behind a blur */}
          <DepthOfField focal_distance={dist - BACK - 0.04} aperture_f_stops={2.2} max_circle_of_confusion_diameter={12 * k} mode={"Bokeh" as never} />
        </Camera3d>
        <ToneMapping mode="agx" exposure={0.3} />
        <Bloom intensity={0.22} threshold={0.75} />
        <Environment src={staticFile("sky/studio.hdr")} intensity={0.02} />
        {/* One hard key from high on the left raking across the face, almost no fill, a cold edge from behind on the
            dark side, the key's shaft in a little haze (the director, 11-11: "a24 right?", "volumetric lighting"). */}
        <DirectionalLight transform={Transform.fromXyz(-1.25, eyes[1] + 0.95, 0.35).lookingAt([0, eyes[1] - 0.02, 0])} illuminance={3400} color="#ffe6c4" volumetric shadow_maps_enabled soft_shadow_size={0.5} />
        <DirectionalLight transform={Transform.fromXyz(1.4, eyes[1] + 0.1, 1.0).lookingAt([0, eyes[1], 0])} illuminance={22} color="#cfdcff" shadow_maps_enabled soft_shadow_size={1.5} />
        <DirectionalLight transform={Transform.fromXyz(1.1, eyes[1] + 0.35, -1.2).lookingAt([0, eyes[1], 0])} illuminance={1100} color="#9fc0ff" shadow_maps_enabled soft_shadow_size={0.6} />
        <VolumetricFog ambient={0} />
        <FogVolume name="haze" position={[0, eyes[1], 0]} scale={[3, 3, 3.4]} density={0.05} scattering={0.55} anisotropy={0.75} />
        <Refinish materials={[{ material: "namuhekam_male_polo_shirt", color: "#101012", roughness: 0.95 }]}>
          <Character name={sk.name} body={sk.name} outline={false} face={faceAt(f, who)} pose={{ ...p, root: [0, p.root[1], 0] }}>
            {plain && BODY.map((m) => <StandardMaterial key={m} material={m} base_color={plain.c} base_color_texture={null} normal_map_texture={null} metallic_roughness_texture={null} perceptual_roughness={plain.r} reflectance={0.3} />)}
          </Character>
        </Refinish>
        {/* the film's own print and its line drawing inside the ring, without its grain (the DLSS pass wants a clean
            picture; tools/faces.sh lays grain on after) */}
        <FilmLook cam={cam} look={{ base: 0, warm: 0.25, sat: 0.95, contrast: 0.6, grain: 0, vignette: 0.3, halation: 0.5, print: 0,
          ...(ring > 4 * k ? { ring: [(W / 2) * k, (H / 2) * k, ring] as [number, number, number] } : {}) }} seed={0} />
      </Canvas3D>
    </AbsoluteFill>
  );
}
// Three segments, one a stage's material: a render keeps the materials of its first frame, so the clay never came on in
// one render of the whole shot (the clay frame rendered alone was right). tools/faces.sh renders them and joins them.
// faces-0 is the drawing over the black body, faces-1 the clay, faces-2 the skin; -x at full size (2700 x 2160).
const SEGS: [string, number, number][] = [["0", 0, CLAY], ["1", CLAY, SKIN], ["2", SKIN, LEN]];
registerRoot(() => (
  <>
    {SEGS.map(([id, a, b]) => <Composition key={id} id={`faces-${id}`} component={() => <Faces from={a} />} width={W} height={H} fps={FPS} durationInFrames={b - a} />)}
    {SEGS.map(([id, a, b]) => <Composition key={`x${id}`} id={`faces-${id}-x`} component={() => <Faces k={2} from={a} />} width={W * 2} height={H * 2} fps={FPS} durationInFrames={b - a} />)}
  </>
));
