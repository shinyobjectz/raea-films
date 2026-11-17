// The subway platform's components (blender/components/subway/*.py -> media/models/subway/*.glb), on the stand in
// library/subway.tsx. name = the file's name with spaces for hyphens; rig = the keys of its sidecar's rig.
export default {
  heading: "SUBWAY PLATFORM",
  props: [
    { name: "train", is: "train", where: "in the tunnel, 6 m back from its mouth; its headlight is the shot's circle", rig: ["arrive", "wheels", "doors", "headlight"] },
    { name: "tunnel", is: "shell", where: "the platform's far end: the headwall, the arched mouth and 20 m of tube (the vanishing point)", rig: ["lights"] },
    { name: "track", is: "shell", where: "the trough left of the platform and on into the tunnel, 20 m a piece" },
    { name: "platform", is: "shell", where: "right of the track, 1.2 m up; its edge and yellow line are the shot's horizontal line" },
    { name: "wall", is: "shell", where: "the platform's back wall, tiled, 10 m a piece, with the name tablets and posters" },
    { name: "track wall", is: "shell", where: "across the track, tiled, 10 m a piece, cables along its foot" },
    { name: "ceiling", is: "shell", where: "over everything, 4.5 m above the track bed, its girder over the columns" },
    { name: "column", is: "structure", where: "every 5 m along the platform, 0.8 m in from the edge" },
    { name: "signal", is: "signal", where: "at the tunnel mouth, left of the track, showing red", rig: ["trip", "aspects"] },
    { name: "lamp", is: "light", where: "over the platform, one a bay", rig: ["sway", "on"] },
    { name: "strip light", is: "light", where: "over the track, one a bay", rig: ["on"] },
    { name: "clock", is: "clock", where: "hung over the platform, reading 2:10", rig: ["hands", "glow"] },
    { name: "sign", is: "sign", where: "hung over the platform near the camera", rig: ["swing"] },
    { name: "bench", is: "furniture", where: "against the back wall, two of them" },
    { name: "trash can", is: "furniture", where: "by the back wall, its lid off" },
    { name: "utility box", is: "furniture", where: "against the back wall" },
    { name: "fire extinguisher", is: "furniture", where: "by the back wall, near the camera" },
    { name: "litter", is: "litter", where: "on the platform by the first column, and further down", rig: ["blow"] },
  ],
};
