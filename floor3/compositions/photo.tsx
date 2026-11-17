// The copier's page: the player's own desk at 11:52 PM, seen from behind and above, with somebody asleep at it. One
// still, rendered once (tools/papers.sh turns it into the photocopied page the game shows).
import { AbsoluteFill, Composition, registerRoot, staticFile } from "raea";
import { Model } from "raea/3d";
import { World } from "../game/world";
import { INITIAL } from "../game/step";

const LIT = { ...INITIAL, f: 4000 };
const at = [3.6, 2.05, 7.9] as [number, number, number];
const to = [2.8, 0.85, 6.0];
const d = [to[0] - at[0], to[1] - at[1], to[2] - at[2]];
const yaw = Math.atan2(-d[0], -d[2]), pitch = Math.atan2(d[1], Math.hypot(d[0], d[2]));

function Photo() {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <World s={LIT} view={{ pos: at, yaw, pitch, fov: (50 * Math.PI) / 180 }} noHand hide={["bay-chair-s0", "bay-kb-s0"]}
        extra={<>
          <Model name="photo-chair" src={staticFile("models/office/chair.glb")} position={[2.85, 0, 6.6]} rotation={[0, Math.PI + 0.12, 0]} />
          <Model name="photo-body" src={staticFile("models/afk/slumped.glb")} position={[2.82, 0.53, 6.62]} rotation={[0, Math.PI + 0.06, 0]} />
        </>} />
    </AbsoluteFill>
  );
}
registerRoot(() => <Composition id="photo" component={Photo} width={1920} height={1080} fps={60} durationInFrames={2} />);
