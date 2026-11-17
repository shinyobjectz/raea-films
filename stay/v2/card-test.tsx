import { AbsoluteFill, Composition, registerRoot, useCurrentFrame } from "raea";
import { CommentCard } from "./card";
function Test() {
  const t = useCurrentFrame() / 30;
  return <AbsoluteFill style={{ background: "#223344" }}><CommentCard text="lose the tubes. morning through the blinds." t={t} sent={3.2} at={[300, 300]} /></AbsoluteFill>;
}
registerRoot(() => <Composition id="card-test" width={1350} height={1080} fps={30} durationInFrames={130} component={Test} />);
