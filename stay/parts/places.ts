// The component library's plan: every place in the film and every prop in it, each a component (the director, 11-10: "Every
// prop should be a component. Every component has props that we animate. Those are rigs."). `is` says what it is,
// `where` where it belongs in its place (so a desk faces the aisle and a mug sits on a desk, never in the laundromat),
// `rig` the props a shot animates. Built in Blender (blender/), one .glb per component; stay.checks.ts holds each
// place to its count and each rigged prop the storyboard moves to a rig here. A rig that is a clip in the .glb (a
// travel from rest at 0 s to its end at 1 s; blender/lib/comp.py) is named in the component's sidecar, as is one
// the scene drives (a glow, a texture, where it stands).
export type Prop = { name: string; is: string; where: string; rig?: string[] };
export type Place = { heading: string; props: Prop[] };
import bedroom from "./places/bedroom";
import canyon from "./places/canyon";
import cathedral from "./places/cathedral";
import clocktower from "./places/clocktower";
import court from "./places/court";
import diner from "./places/diner";
import ferris from "./places/ferris";
import garage from "./places/garage";
import gym from "./places/gym";
import kelp from "./places/kelp";
import koi from "./places/koi";
import laundromat from "./places/laundromat";
import lighthouse from "./places/lighthouse";
import observatory from "./places/observatory";
import pool from "./places/pool";
import road from "./places/road";
import sea from "./places/sea";
import stairwell from "./places/stairwell";
import subway from "./places/subway";
import turbines from "./places/turbines";
import vinyl from "./places/vinyl";

export const PLACES: Record<string, Place> = {
  office: {
    heading: "OFFICE",
    props: [
      { name: "desk", is: "furniture", where: "in rows either side of the aisle, facing it", rig: ["drawer", "drawers"] },
      { name: "chair", is: "furniture", where: "at a desk, or rolled away from it", rig: ["position", "swivel", "casters", "recline", "height"] },
      { name: "monitor", is: "electronics", where: "on a desk, on an arm", rig: ["arm swing", "arm fold", "tilt", "screen wake"] },
      { name: "keyboard", is: "electronics", where: "on a desk before its monitor" },
      { name: "mouse", is: "electronics", where: "beside a keyboard" },
      { name: "mug", is: "desk item", where: "on a desk", rig: ["rock", "level"] },
      { name: "desk lamp", is: "lighting", where: "on a desk's corner" },
      { name: "partition", is: "furniture", where: "between desk rows" },
      { name: "filing cabinet", is: "furniture", where: "against a wall or a partition's end", rig: ["drawer", "drawers"] },
      { name: "printer", is: "electronics", where: "on its own stand by a wall", rig: ["paper feed"] },
      { name: "water cooler", is: "appliance", where: "by a wall near the kitchen door", rig: ["glug", "slosh"] },
      { name: "plant", is: "decor", where: "in a pot on the floor by a window or a partition's end", rig: ["sway"] },
      { name: "whiteboard", is: "wall item", where: "on a wall" },
      { name: "wall clock", is: "wall item", where: "high on a wall", rig: ["hands", "seconds"] },
      { name: "tubes", is: "lighting", where: "in the ceiling, in rows of fittings", rig: ["on"] },
      { name: "ceiling fan", is: "fixture", where: "in the ceiling over the aisle", rig: ["spin"] },
      { name: "blinds", is: "window", where: "on the windows along one wall", rig: ["slats", "raise"] },
      { name: "exit sign", is: "sign", where: "over the door", rig: ["glow"] },
      { name: "bin", is: "furniture", where: "under a desk" },
      { name: "phone", is: "desk item", where: "on a desk", rig: ["lift", "ring"] },
      { name: "cables", is: "desk item", where: "from a monitor down the desk's back" },
      { name: "plant b", is: "decor", where: "a second, lower plant, so the rows don't repeat", rig: ["sway"] },
      { name: "shelf unit", is: "furniture", where: "against a wall", rig: ["drawer"] },
      { name: "laptop", is: "electronics", where: "on a desk at the back of the floor" },
      { name: "clipboard", is: "desk item", where: "on a desk" },
      { name: "notepads", is: "desk item", where: "spread on a desk" },
      { name: "stationery", is: "desk item", where: "on a desk by the monitor" },
      { name: "stapler", is: "desk item", where: "on a desk" },
      { name: "fire alarm", is: "wall item", where: "on a wall by the door" },
      { name: "wet floor sign", is: "sign", where: "in the aisle by the water cooler" },
    ],
  },
  // the other 21 places: each list is written with its components (parts/places/PLACE.ts, blender/components/PLACE)
  pool, canyon, laundromat, bedroom, road, garage, sea,
  vinyl, koi, stairwell, ferris, clocktower, subway, diner, gym, cathedral, kelp, lighthouse, turbines, court, observatory,
};
