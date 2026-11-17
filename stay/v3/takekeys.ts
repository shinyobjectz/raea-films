// The opening is one take (the director, 11-11: "is the camera even one take anymore? can we just perice together the worlds
// and then actually mkake it one take?"). The lens was always one line through the doors, but each world ran its own
// cursor from its own first key to its own last and leaned the lens after it, so at every door the cursor's path began
// again and the lens's aim jumped. Now each world only says what the cursor does in it (its keys, in its own space and
// seconds) here, and every world's view is taken from all of them together (v3/walk.tsx takeView): one cursor path and
// one lean for the whole opening, the same on both sides of every join. (No imports but a type, so walk.tsx and the
// worlds can both fill and read it without importing each other.)
import type { Key } from "./hand3d";

/** a world of the take's cursor keys at its own t (seconds into its shot), by the shot's id */
export const TAKE_KEYS: Record<string, (t: number) => Key[]> = {};
