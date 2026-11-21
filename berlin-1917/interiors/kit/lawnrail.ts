// The low railing along the lawns of the squares and the Tiergarten (catalogue hoop-fence). The period photographs show
// posts and one rail, not hoops: the Siegesallee (Photoglob photochrom, print 17758 P.Z., before 1905; Library of
// Congress ppmsca.52895, public domain) and the Gendarmenmarkt's lawns (photochrom 8686, 1890-1900; LoC ppmsca.00346,
// public domain). Round cast-iron posts with a flared cap plate and a ball on a short neck, about knee high; a round
// bar threaded through each post just under its cap, bending in a smooth curve where the lawn turns a corner.
//   lawn-rail        one bay: its post at the origin, the rail running 1.8 m along +x to the next bay's post
//   lawn-rail-bend   the bay round a corner: 0.3 m straight, a quarter turn toward +z at 0.5 m radius, 0.3 m straight,
//                    ending at (0.8, 0.8) where the next bay's post stands, that bay turned to run along +z
//   lawn-rail-post   the post alone, closing the last bay of a run
// ASSUMED: the heights (cap at 0.43 m, rail at 0.39 m, from the posts' proportions against the monument's steps), the
// 1.8 m bay (from the Gendarmenmarkt's spacing against its lamps) and the bar sizes; the paint dark like the photos'.
// Frame: the post's foot on the lawn at the origin, buried 6 cm.
import type { Solid } from "raea/3d";
import { tube } from "./forms";
import { lathe, union, type V3 } from "./geo";
import { rod } from "./outgeo";
import { type Part, prop } from "./prop";

const PR = 0.024, PH = 0.43, RY = 0.39, RR = 0.014, BAY = 1.8;

/** The post: shaft, a cap plate flaring out and bevelled on top, a short neck, the ball. */
function post(): Solid {
  const c = PH + 0.058, b = 0.023, ballPts: [number, number][] = [];
  for (let a = -60; a <= 90; a += 15) ballPts.push([a === 90 ? 0 : b * Math.cos((a * Math.PI) / 180), c + b * Math.sin((a * Math.PI) / 180)]);
  return lathe([[0, -0.06], [PR, -0.06], [PR, PH - 0.004], [0.04, PH + 0.008], [0.044, PH + 0.014], [0.044, PH + 0.019], [0.03, PH + 0.025], [0.011, PH + 0.029], [0.01, PH + 0.037], ...ballPts], 0, 0, 0, 16);
}

function bay(): Part[] {
  return [{ mat: "iron-cast", solid: union(post(), rod([0, RY, 0], [BAY, RY, 0], RR)) }];
}

function bend(): Part[] {
  const S = 0.3, R = 0.5, pts: V3[] = [[0, RY, 0], [S, RY, 0]];
  for (let i = 1; i <= 10; i++) { const a = ((i / 10) * Math.PI) / 2; pts.push([S + R * Math.sin(a), RY, R - R * Math.cos(a)]); }
  pts.push([S + R, RY, R + S]);
  return [{ mat: "iron-cast", solid: union(post(), ...tube(pts, RR)) }];
}

const P = (id: string, size: [number, number, number], tris: number, f: () => Part[]) => prop({ id, items: ["hoop-fence"], size, place: "floor", where: "set", tris, parts: f });
P("lawn-rail", [BAY + 0.05, 0.57, 0.09], 900, bay);
P("lawn-rail-bend", [0.85, 0.57, 0.85], 2200, bend);
P("lawn-rail-post", [0.09, 0.57, 0.09], 600, () => [{ mat: "iron-cast", solid: post() }]);

export const KIT_LAWNRAIL = true;
