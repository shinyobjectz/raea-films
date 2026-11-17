// The observatory's components (blender/components/observatory/*.py -> media/models/observatory/*.glb), on the stand in
// library/observatory.tsx. name = the file's name with spaces for hyphens; rig = the keys of its sidecar's rig.
export default {
  heading: "OBSERVATORY",
  props: [
    { name: "floor", is: "floor", where: "the round observing floor, a brass meridian strip through it, a trapdoor", rig: ["hatch"] },
    { name: "wall", is: "wall", where: "the drum under the dome: plaster over a boarded wainscot, a door, the dome's rail and rollers on top", rig: ["door"] },
    { name: "dome", is: "roof", where: "on the wall's rollers: the boarded hemisphere, its ribs, the slit and its two shutter leaves", rig: ["open", "turn"] },
    { name: "pier", is: "mount", where: "the room's middle" },
    { name: "telescope", is: "telescope", where: "on the pier: the refractor on its equatorial mount", rig: ["slew", "ra", "dec", "focus", "drive"] },
    { name: "moon", is: "sky", where: "through the slit, far off, 33 degrees up", rig: ["phase", "rise", "halo", "glow"] },
    { name: "stars", is: "sky", where: "the sky outside, through the slit", rig: ["drift", "glow"] },
    { name: "ladder", is: "steps", where: "the rolling observing steps, by the eyepiece", rig: ["roll", "brake"] },
    { name: "chart table", is: "furniture", where: "against the wall right of the slit: a star chart, a planisphere, the log, a loupe, binoculars", rig: ["dial", "page"] },
    { name: "desk lamp", is: "light", where: "clamped on the chart table's back edge", rig: ["on"] },
    { name: "stool", is: "furniture", where: "at the chart table" },
    { name: "chart cabinet", is: "furniture", where: "against the wall on the right", rig: ["drawer", "drawers"] },
    { name: "globe", is: "instrument", where: "a celestial globe on its stand, by the cabinet", rig: ["spin", "tip"] },
    { name: "clock", is: "instrument", where: "the long-case sidereal clock against the wall on the left", rig: ["hands"] },
    { name: "bookshelf", is: "furniture", where: "against the wall, left of the clock" },
    { name: "step ladder", is: "steps", where: "leaning by the door" },
    { name: "wall chart", is: "picture", where: "on the wall right of the slit", rig: ["tilt"] },
    { name: "crank", is: "machine", where: "on the wall under the slit: the dome's hand gear, its shaft up to the rack", rig: ["turn"] },
    { name: "wall lamp", is: "light", where: "three round the wall, 2.1 m up: the red safelights", rig: ["on"] },
  ],
};
