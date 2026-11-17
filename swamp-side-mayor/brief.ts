import { brief } from "raea/brief";

// The project's first deliverable, the music video, is posted at v4 (out/goose-v4.mp4,
// a feed post, and a v5 is under way in another session (plan.org t-dv2k6hj1, t-dv2k6hf9). This brief is for the second: a tutorial of the new raea app (0.1.5), shot in the same swamp,
// where a narrator uses the goose and the set's props to walk through the app while the goose makes that same video.
// the director, 11-16: "reuse the style concept and scene of the swamp mayor music video to have a narrator similar to the
// stanley parable whom uses the goose and props to break up and explain a tutorial of the new app start to finish. it
// adds comedic relief while explaining the ins and outs of the app. we can have its project it is editing as the music
// video. we should cover everything in 5 minutes or less". The lesson plan is tutorial/plan.md; the script, with every
// line, is tutorial.script.ts.
// the director, 11-16, on the script: "forget the mayor of the swamp. just say this is goose". The goose is Goose, by name, and he.
// the director, 11-16: "something funny about the limited existential capability of goose to realize that the catchy hook
// with 'Duck' does not apply to him but hes a goose": set up in 01, paid off over the finished video in 11.
// the director, 11-16: "sundial comment makes no sense really... i just said 5 minutes or less to explain how long our tutorial
// video is". The sundial and every "five minutes" in the narration are gone; under five minutes is the length, not a line.
// the director, 11-16: "did he make a music video before or he is going to make one?" Going to: Goose makes it in the tutorial.
// the director, 11-16, on the painted "CMD \\" and "CMD Z" (Archivo Black has no command sign): "can you make one that matches
// the font for command etc just so its consistent or for keyboard shortcuts just have a separate style". Both: the
// shortcuts are keycaps, and their command sign is drawn to the keycaps' face (tools/keycap.py).
// the director, 11-16, on the set: "remove the brown turd droppings and try to lean more into an ivy procedurally... make sure
// grass/plants/trees all have some wind effects. use fish audio for the voice", and on the wide: "looks a little barren
// maybe we could see some large ruins in the distance". The voice's key is in the app's Connections (raea gen).
// the director, 11-16, on the auditions: "lets do A", and "the delivery should use drama 3 if you can and just make sure pacing
// is better than this sample": voice A on fish:drama-3, each line directed and placed on its own beat.
export default brief({
  title: "Goose Learns raea",
  logline:
    "A dry narrator walks Goose, a goose with other plans, through the new raea app from start to finish, while he makes his own music video.",
  for: "raea",
  audience:
    "People who've just installed raea 0.1.5, or are deciding whether to, and make video with an AI agent. Most never used the old app. Watched with sound on, on YouTube and raea.io/docs; chapters cut from it for the launch thread.",
  believe:
    "In the new app you say it in the chat, point at it in the feed, fix it by hand and ship it.",
  mode: ["explain", "story"],
  voice:
    "One narrator, unseen: a dry, measured British voice who speaks of Goose in the third person and the past tense (\"Goose walked to the computer.\"), as if the story were his and the goose a slightly disappointing lead. When Goose does something else, he repeats himself, exactly, more slowly, until Goose complies, or quietly rewrites the story to fit. Between the jokes he teaches plainly: what it is, where it is, what it does, in the app's own words. He never winks, never laughs, and is never cruel. Our own character and our own lines, in the register of the unreliable game narrator: nothing quoted, no other game's names or settings, and not modelled on any real actor's voice. Goose never speaks: he honks, heard and never lettered (no \"ga~\", gone for good), and the ink lettering is only the hook's sung words, the title, ENTER and SPLOOSH.",
  sound:
    "The swamp's own bed from the music video (water, frogs, reeds, wind) under the voice, with a light backing score throughout on instruments that aren't General MIDI's defaults (bassoon, baroque recorders, kalimba, marimba, a guiro for the frog; the director, 11-16), ducked under the voice, resting at the cards; the music video's song only at the end, when the finished video plays. Foley on every physical gag (key stomps, pecks, plank wings clacking, the splash, the knob's ratchet), the app's own clicks soft. Goose honks now and then, about six times in the film, each a different honk (curious, offended, protesting, proud), never on every beat. The voice on top, the bed 15 to 20 LU under it. -14 LUFS, true peak under -1 dBTP.",
  look:
    "The music video's world as it stands: the painted swamp (world2.tsx), the ruins (stone ring, trilithon, arch, columns, the goose's statue), the giant beige computer with grass on its head and lettered keycaps (machine.tsx), the critters, the ink lettering (ink.tsx), and the goose with its moves. Bright cel colour under a flat blue sky. New props in the same hand: three stone doorways in a row on the near-left grass (the swamp's bottom-left, as the rail's foot is the app's), each turned to the keyboard and lettered for one of the rail's three doors (Publish, Connections, Settings; libraries are under Search at the rail's top), and v3's plank wings. The tutorial has its own copies of the world and the machine (components/tut/), so the music video can go on changing its own: the machine already up, with a 16:9 glass and a Mac's keys, and ivy grown over it from the water in place of the mud drips (components/tut/ivy.ts), never over the glass or the keys. Everything that grows moves in one wind (components/tut/wind.ts), and great ruins (a temple front, a great arch) stand hazed on the far hills. " +
    "The app is the real 0.1.5 app, captured from raea's own window, and it runs on the giant monitor's glass. When a line teaches a control the camera is on the glass, close enough to read it (the screen over 80% of the frame, the bezel and the grass at the edges), with the real pointer acting. There is no mouse: the pointer follows Goose's head (where it looks, the pointer goes; a peck clicks; a peck held while the head turns drags), and nobody mentions it. When a line is a joke the camera is in the swamp with the goose. A key Goose presses shows once as a keycap sticker, a style of its own beside the painted words: the giant keyboard's own caps (off-white face, cool shade skirt, navy Lilita One legend, the sticker line and halo), each sinking and going yellow as it's struck, a shortcut's caps side by side and pressed in turn (⌘ \\, esc, space, B, ⌘ Z, /; tools/keycap.py, assets/tut-keys). The tutorial's keyboard has a Mac's bottom row, so the ⌘ Goose stands on is a real key.",
  notDoing: [
    "A tour of features read as a list: one project, the music video, through one loop, each part of the app taught at the step that needs it",
    "Drawn boxes or highlights standing in for the pointer: the real pointer acts on the real app",
    "Anything on the glass the 0.1.5 app doesn't do: every label, key and result is captured from the app itself",
    "Generated pictures or video: the world is the music video's own build; the narration is Fish Audio's Drama 3 in a library voice (A) that names no real person",
    "Another game's lines, names, set or narrator's voice; the narrator is ours",
    "Burned-in captions: an SRT ships beside the film",
  ],
  assumed: ["title", "audience", "believe", "mode", "voice", "sound", "look", "deliver"],
  deliver: [
    {
      name: "Tutorial: the new app, start to finish",
      specs: ["16:9, 1920x1080, 30 fps", "under 5:00 (planned 4:50)", "with sound, -14 LUFS", "chapters marked", "SRT captions"],
      script: "./tutorial.script.ts",
    },
    {
      name: "The music video (v4 posted, v5 in another session)",
      specs: ["18:9, 2160x1080", "about 90 s", "-14 LUFS"],
      item: " a feed post",
    },
  ],
  sections: [
    {
      heading: "Goal",
      text:
        "A viewer who has never opened the new app can, by the end, start a project, ask its agent for work, open what comes back, pin a note on the exact spot, compare versions, trim the cut by hand and send it, set a controller, find a shot in a library, export and share, and knows where Settings keeps agents and the fingerprint. It is done when every one of those is shown on the real app, every name the narrator says is on screen as he says it, the jokes never stop the teaching for more than a few seconds, and it runs under five minutes.",
    },
    {
      heading: "The running project",
      text:
        "Goose makes the music video in the tutorial, from its first line in the chat to the export. Its project in the app is Swamp Goose: its real cuts (v2, v3, v4) as one item's versions, and the real fix between v3 and v4 (the plank wings that became drawn wings, out/tut/wings-close.jpg) as the note Goose pins. The take is captured in a scratch workspace set up for the film, so the rail holds sample projects of ours and nothing from a client.",
    },
    {
      heading: "Comedy rules",
      text:
        "Every gag is the goose doing a thing the app's step involves, or a prop standing for a part of the app (the three doors are the rail's foot, the footprint is the fingerprint). Each callback pays off something set up earlier: \"DUCK?\" from the music video and the song's own hook (Goose doesn't care for ducks in 01, and ends the film nodding along to \"Quack, quack, quack\" and \"You say duck?\", a goose who has never wondered what he is), /goal every shot has me in it and the shot without Goose, the plank wings, the muddy foot. No gag lasts longer than about five seconds of picture without a teaching line after it.",
    },
  ],
  stages: [
    {
      name: "Plan",
      tasks: [
        { text: "Lesson plan and script approved", tags: ["gate"] },
        { text: "Narrator picked", tags: ["gate"] },
      ],
    },
    { name: "Previz", tasks: [{ text: "Previz approved: blocking, timing and camera of the whole film on the scratch voice", tags: ["gate"] }] },
    {
      name: "Make",
      tasks: [
        { text: "The app take: the scratch workspace and every state the script needs, captured from raea's window" },
        { text: "The new props and the plank wings" },
        { text: "Shots, animation, lettering" },
        { text: "Voice, bed, foley and the mix" },
        { text: "Render, check, fingerprint score, post" },
      ],
    },
  ],
});
