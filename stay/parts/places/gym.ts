// The gym's components (blender/components/gym/*.py -> media/models/gym/*.glb), on the stand in
// library/gym.tsx. name = the file's name with spaces for hyphens; rig = the keys of its sidecar's rig.
export default {
  heading: "GYM",
  props: [
    { name: "court", is: "architecture", where: "the gym's floor; its origin is under the middle rim, the free-throw line 4.2 m out (the H2 line)" },
    { name: "wall", is: "architecture", where: "9 m bays: two make the baseline wall, more turned make the side walls" },
    { name: "truss", is: "architecture", where: "under the roof across the court, every 5 m" },
    { name: "basketball", is: "ball", where: "on the court near the free-throw line (the montage's circle: bounced to the upper third)", rig: ["bounce", "squash", "spin", "position"] },
    { name: "hoop", is: "fixture", where: "on the baseline wall, three of them at three heights (the place's wrong detail; the TR circle)", rig: ["net", "rim", "kick", "height"] },
    { name: "wall pads", is: "wall item", where: "on the baseline wall under the middle goal" },
    { name: "bleachers", is: "furniture", where: "folded against a side wall", rig: ["open"] },
    { name: "caged light", is: "lighting", where: "hung on chains under each truss, three to a truss", rig: ["sway", "glow"] },
    { name: "ball rack", is: "furniture", where: "on the court's edge near the baseline", rig: ["take", "roll"] },
    { name: "scoreboard", is: "wall item", where: "high on the baseline wall, left of the middle goal", rig: ["glow"] },
    { name: "mats", is: "furniture", where: "stacked in a corner against the baseline wall", rig: ["slide", "tip"] },
    { name: "doors", is: "door", where: "in the baseline wall's corner", rig: ["open", "left", "glow"] },
    { name: "rope", is: "fixture", where: "hung from a truss, beside the key", rig: ["swing", "twist"] },
    { name: "bench", is: "furniture", where: "along a wall, or on the sideline", rig: ["tip"] },
    { name: "banners", is: "wall item", where: "high on a side wall over the bleachers", rig: ["sway"] },
    { name: "caged clock", is: "wall item", where: "on the baseline wall, right of the middle goal", rig: ["hands", "seconds"] },
  ],
};
