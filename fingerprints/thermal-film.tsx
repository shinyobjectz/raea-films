// Fingerprint, in thermal: the film for X (16:9, under X's 2:20). The shots and the sound are thermal/film.tsx (what
// each shot is and why); this registers the whole film, for its sound and for stills. The picture is rendered a shot
// at a time by tools/thermal-film.sh (see ShotOnly).
import { Composition, registerRoot } from "raea";
import "./thermal/score";
import { Film } from "./thermal/film";
import { FPS } from "./thermal/shots";
import { DURATION } from "./thermal/time";

registerRoot(() => <Composition id="thermal-film" width={1920} height={1080} fps={FPS} durationInFrames={DURATION} component={Film} />);
