import { brief } from "raea/brief";

export default brief({
  title: "v0.1.5",
  logline: "A hype film for raea 0.1.5's new app: a small robot cursor, on a giant monitor sunk in a dead swamp, redesigns the world it is standing in, then sends it up to the mothership for review.",
  for: "the director",
  audience: "People who make video, 3D and games with agents, scrolling X and raea.io. Most watch muted first.",
  believe: "In the new raea app, what you say and what you touch changes the whole world you're making.",
  mode: ["pitch", "story"],
  voice: "No narrator, no titles. The only words in the film are the app's own, the line typed into it, and one subtitle: the alien reviewers' note, translated as \"I'm not sure this is on brand for us.\" (the director, 11-16). It ends on the stars, raea's logo full size and centred over them (the director, 11-16, on v3).",
  sound:
    "The swamp is the score. Frogs, crickets, water and wind start as a bed; every action on screen has its own foley (keys clacking under moss, the robot's servo chirps, a ripple a click); the swamp's own sounds fall into a rhythm as the piece is made, and open into one warm chord when it plays. -14 LUFS.",
  look:
    "A real swamp, photographed: hyper-realistic and cinematic (the director, 11-16: no watercolour, no pencil line, no low-poly shapes). Scanned trees, roots, rocks, moss and plants, photographic materials on the monitor, keyboard and robot, still water that mirrors the scene. All light is ray-traced (Solari): a low sun through real canopy, shafts in the mist, the screen's glow on wet things. A film lens: shallow focus on close work, slight motion blur, a restrained grade. " +
    "Palette by meaning: the film opens with no colour at all, a grey world; the screen's cool white is the app and the first light; every colour after that is something the robot made (the sun's warmth, the water's colour, leaf green, dusk and firefly amber), so by the end no part of the frame is the world it opened on. Beige is the robot alone. " +
    "The monitor is the subject of every shot and its picture stays sharp: no grade or blur softens the app. Camera low, among the reeds, always drifting; close and medium, never a wide empty shot. Cinematic 16:9. No type of ours anywhere: the UI and the atmosphere do the talking. The one mark is the logo (assets/brand, the real file), full size over the stars at the end.",
  notDoing: [
    "A tour of 0.1.5's features: one project, the swamp, start to finish; each control shown is one that changes it",
    "Generated images or video: props are built in raea or are CC0 scans (Poly Haven, each with its licence sidecar), the screen is the real app",
    "Work from any other project on the screen",
    "A voiceover, captions in a template style (the one subtitle is a film subtitle: plain white, low centre), a whoosh on every move",
    "A \"made in raea\" line, the version number, the words \"the raea app\", an address. The end card is a picture, not a title: the ship and the Earth in space, the robot flying back up to it, then the stars with the logo alone over them (the director, 11-15; the end card in space, 11-16; the stars and the full-size logo, on v3)",
    "Stylised rendering (paint, outlines, flat shading), or grain and blur over the app's picture",
  ],
  assumed: ["audience", "believe", "mode", "sound", "look", "deliver"],
  deliver: [
    {
      name: "Hype film",
      specs: ["16:9, 1920x1080, 30 fps", "84.8 s", "with sound, -14 LUFS", "works muted"],
      script: "./hype.script.ts",
    },
  ],
  sections: [
    {
      heading: "Goal",
      text:
        "One film that makes someone stop and want the new app. v3 (the director, 11-16) adds an ending: the robot shares the film for review, a beam opens in the ground and the camera follows it up out of the atmosphere to a massive ship in orbit (a real 3D Earth, shot like Abrams and Spielberg: the limb, the sun cresting, flares as events), where unseen aliens watch it, cheer, and leave the note \"I'm not sure this is on brand for us.\"; then an end card in space as the robot flies home. v4 (the director's 16 notes on v3) adds close-ups (the lens, the New project dialog, the tasks, the Comment tool, the glyphs), the Return's pulse of life, a fish and fleeing birds, the ground blowing open, a volumetric beam straight into the port, the aliens arriving, skinned hands, the robot's arc home with a woosh and a sad warble, a mysterious opening score, and the tilt to the stars. v5 (the director's 15 notes on v4) opens with the camera coming up out of the water, drops the pulse's rings and two cuts (the pin and the wipe), moves the ravens into the sky, lets the bank's plants ride the ground and throws a burst of leaves in the blast, shakes the trees with the beam, sharpens the stars, joins the aliens' bodies and gives them more life, and plays the film itself on the room's screen; and a goose's skull (a real scan) lies in the mud behind the keyboard. It is done when: the first two seconds stop a muted viewer; the screen shows the real 0.1.5 app making one new project from one typed line, then being worked by hand (a controller's slider, a colour, a part dragged in the scene, the timeline), each changing the world round the monitor; every prop (monitor, keyboard under grass and rubble, cursor robot, water, trees, mist) holds up in a close still; the energy climbs from a dead grey swamp to a different, living one; and it ends on the stars with the logo alone, no card and no words.",
    },
    {
      heading: "What the robot makes",
      text:
        "A new project, Swamp, made for this film: the swamp itself as a raea scene, with its own controllers (Light: Sun; Water: Colour) and a timeline that runs to dusk. It is a real raea composition in a fresh project in the real app; no other project's work is on screen. The film's fiction is that the scene on the glass and the world round the monitor are the same thing: the director, 11-15, \"more opportunities to show it working, designing the visuals of other interactive components to the point that the entire world is different\".",
    },
  ],
});
