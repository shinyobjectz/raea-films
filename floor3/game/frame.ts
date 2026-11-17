// The picture's shape. The film is made wide (1920x1080) and tall (1080x1920, a phone held upright); the game, its run
// and its sound are the same in both, and only the framing changes: the tall picture's camera sees taller and narrower,
// the hand sits nearer the middle, and the type keeps out of the bands a phone's app draws over.
import { useVideoConfig } from "raea";

export interface Shape {
  w: number; h: number; tall: boolean;
  /** the composition's id: "floor3-turn" is the wide film whose title screen asks a phone to turn */
  id: string;
  /** the bands type stays out of: a player's controls and title (wide); a phone app's buttons and captions (tall) */
  safe: { top: number; bottom: number; left: number; right: number };
}

export function useShape(): Shape {
  const { width: w, height: h, id } = useVideoConfig();
  const tall = h > w;
  // tall: TikTok's and YouTube's bands (7-10% top, 25% bottom, 13-14% right), Instagram's top (14%)
  const safe = tall ? { top: 270, bottom: 500, left: 72, right: 150 } : { top: 140, bottom: 140, left: 96, right: 96 };
  return { w, h, tall, id, safe };
}

/** the camera's vertical field of view: 59 degrees wide (90 across); tall, 72 (44.5 across), so the middle of the view,
 * where the hand works, fills the narrow frame */
export const fovOf = (tall: boolean) => ((tall ? 72 : 59) * Math.PI) / 180;
