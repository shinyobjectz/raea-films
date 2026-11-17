// Study 2: lettra's MSDF type through raea's R3F path, for the prompt line the generator is asked with. Each reroll the
// line scrambles through its own glyphs and wipes back in: "an office at night, cinematic" breaking up and resolving.
// Geist 700, baked to an MSDF atlas with `lettra bake` (fonts/; the steps are in studies/NOTES.md).
//   cd studies/lettra && raea render lettra.tsx --composition study-lettra --at 0,10,22,40 -o ../../out/studies/lettra/
import { Composition, registerRoot } from "raea";
import { R3F } from "raea/r3f";
import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { composeEffects, configureFontTexture, createText, parseFont, scramble, wipe } from "lettra/three";
import inter from "./fonts/Geist-700.json";

const LINE = "an office at night,\ncinematic";
function Prompt() {
  const text = useMemo(() => {
    const map = new THREE.TextureLoader().load("fonts/Geist-700.png", (t) => void configureFontTexture(t));
    Object.assign(map, { flipY: false, colorSpace: THREE.NoColorSpace, generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    const effect = composeEffects(wipe(), scramble({ font: inter as never, chars: "anofficeatnightcinematic", rate: 0 }));
    const t = createText({ font: parseFont(inter), map, text: LINE, layout: { align: "center" }, material: { fill: "#ffffff", effect } });
    t.mesh.scale.setScalar(0.55); // the two lines inside the 5:4 frame
    return t;
  }, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const u = text.uniforms as unknown as { wipeIn: { value: number }; scramble: { value: number } };
    // typed in by the wipe over the first 0.7 s; a reroll hits at 1.0 s: scrambled hard, settling back by 1.6 s
    u.wipeIn.value = Math.min(1, t / 0.7);
    u.scramble.value = t < 1.0 ? 0 : Math.max(0, 1 - (t - 1.0) / 0.6);
  });
  return <primitive object={text.mesh} />;
}
registerRoot(() => (
  <Composition id="study-lettra" width={1350} height={1080} fps={30} durationInFrames={61} component={() => (
    <R3F camera={{ position: [0, 0, 5], fov: 45 }}>
      <color attach="background" args={["#0b0b0d"]} />
      <Prompt />
    </R3F>
  )} />
));
