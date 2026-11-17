import { brief } from "raea/brief";

export default brief({
  title: "Fingerprint",
  logline:
    "A mixed-media explainer, collage, stop motion and hand-drawn ink, for raea's Fingerprint: your eye for a good cut, learned on your own computer from what you already do.",
  for: "the director",
  audience:
    "Creators, marketers and small-team editors who are curious about AI video editing but aren't technical. They watch on a landing page or a social feed, often with the sound on for an explainer, sometimes muted.",
  believe:
    "raea learns my eye from what I already do, so its AI catches what I'd catch before it shows me a cut, and none of it leaves my computer.",
  mode: ["explain"],
  voice:
    "Fish narration, the tutorials' Explainer voice (drama-3), calm and quick, friendly, plain words. No jargon: no axes, heads, encoders or embeddings.",
  sound:
    "A finished, mixed and mastered score built from sound effects: paper, pencil, scissors, tape, stamps and a typewriter keep the time with recorded CC0 percussion, and pizzicato, felt piano, marimba and celesta carry the tune. Written as MIDI (tonal + @tonejs/midi), played through raea/tone on open sample libraries. -14 LUFS, true peak under -1.5 dBTP, the voice clear over everything, the score ducked under every line.",
  look:
    "A maker's desk seen from above. Cream and kraft paper (CC0 scans), masking tape, torn edges, index cards and film strips. Real footage printed as stills and film frames. Hand-drawn ink that boils on twos: an engraving-style eye, a fingerprint whose ridges are drawn line by line, red editing pencil for notes, blue pencil for the fingerprint's answers. Objects move by stop motion, stepped on twos and threes with a little jitter; the camera drifts smoothly over the desk. Palette: paper #efe6d2, ink #1c1915, editor's red #c4372b, blue pencil #2c5aa0, kraft #b48a5a, tape #e9d9a6. Type: a hand (Caveat), a typewriter (Special Elite).",
  notDoing: [
    "A tour of every fingerprint verb. One cut through one loop: your notes in, a better cut out.",
    "Numbers, AUCs or model names on screen or in the voice.",
    "Generated images or video. Every picture is stock, CC0 texture, real footage or drawn in code.",
    "Glow, bloom or blur over the work.",
  ],
  assumed: ["audience", "voice", "deliver"],
  sections: [
    {
      heading: "What's true (from docs/fingerprint.md, docs/fingerprint.feature and the CLI)",
      text:
        "Fingerprint learns from approvals (approve), picks and hand edits (pair), versions, work you admire (profile), marks (teach) and your notes, which an agent reads and you check before they count (read, readings, learn-notes). Every thing it watches for scores from its words on day one. `raea fingerprint score` lists the moments it expects a note on, in your words; with --was it says whether each is fixed, still there, or looks disguised. Everything runs on the device; a team shares evidence, never media, and each person's weighting stays their own. Agents get the moment and the words, never a number.",
    },
  ],
  deliver: [
    {
      name: "fingerprint-explainer",
      specs: ["about 75 s", "16:9, 1920x1080, 24 fps", "with sound, mastered to -14 LUFS"],
      script: "fingerprint.script.ts",
    },
  ],
  stages: [
    {
      name: "Plan",
      tasks: [{ text: "storyboard approved", tags: ["gate"] }],
    },
  ],
});
