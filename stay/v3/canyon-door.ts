// Where the cellar's door stands in the canyon: the lens's point as it comes through that door, in the canyon's own
// (unturned) space. v3/walk.tsx stands the canyon beyond the cellar's door by it, and v3/places.tsx starts the canyon's
// camera on it, so the take carries straight on into the slot.
import type { V3 } from "../v2/math";
export const CANYON_DOOR: V3 = [0.3, 1.45, 8.12];   // (the rock is cut off at z 7.9: it begins a hand behind the wall the door is in)
/** the canyon's pieces that are cut off at the door's plane (blender/canyon-in.py) */
export const CUT: Record<string, string> = { walls: "walls-in", rim: "rim-in", sand: "sand-in" };
