import { script } from "raea/brief";

// Fingerprint, in thermal: the film as built (v3: thermal/film.tsx, thermal-film.tsx registers it). Half motion
// graphics drawn in heat (thermal/mograph.tsx), half stock footage (Mixkit, Pixabay: media/thermal/stock) seen as
// heat and traced from its own depth (DA3-BASE run on this Mac, tools/depth.py): a scan wraps the real surfaces and a
// ring spreads from what's touched. the director on v1 (11-13): "the VO is too deep and slow ... more motion graphics, less
// stock footage ... for every stock footage we also have something tracing the scene"; then: "educational about what
// we are doing and the models and systems underneath without being technical". The voice says it plainly; each
// model's real name rides on screen as a small tag. Narration: Fish's Adrian at 1.1x (tools/voice-thermal.ts). Score:
// MIDI on TokenSynth bass, felt piano, staccato cellos and glassy plucks at 90 BPM in D minor, no drones
// (thermal/score.ts). Every claim is from docs/fingerprint.md. 2:19 for X (cap 2:20), 16:9. Seconds are each beat's
// span in thermal/time.ts.
export default script({
  title: "Fingerprint, in thermal",
  logline: "Every editor has a touch. raea's Fingerprint learns yours, on models that run on your own machine.",
  scenes: [
    {
      heading: "A touch",
      payoff: "You leave a mark on everything you cut.",
      beats: [
        {
          onScreen: "Black. 'Every editor has a touch.' lights as a heat front sweeps through it, flares, and settles white.",
          cues: ["the bass pulse alone, 90 BPM", "two notes of the felt-piano motif after the line"],
          lines: [{ who: "narrator", says: "Every editor has a touch." }],
          seconds: 3.3,
        },
        {
          onScreen: "Five clips on a timeline in heat. On 'warm' one goes white-hot ('warm to'); on 'notes' a pin drops onto another ('tighten this'); on 'throw' the last cools to blue and falls off ('thrown away').",
          lines: [{ who: "narrator", says: "The cuts you warm to. The notes you leave. The takes you throw away." }],
          seconds: 6.7,
        },
      ],
    },
    {
      heading: "What Fingerprint is",
      payoff: "Your eye for a good cut, learned from what you already do, on your own computer.",
      beats: [
        {
          onScreen: "A hand held up against a sunset, white-hot, traced: a scan plane wraps it from fingertips to hills, contours stay behind; on 'touch' a ring spreads from the fingertip across the hand. Tag: 'your eye, written down'.",
          cues: ["a deep hit on 'Fingerprint'", "staccato cellos join"],
          lines: [{ who: "narrator", says: "raea's Fingerprint learns that touch: your eye for a good cut, written down from what you already do." }],
          seconds: 8.0,
        },
        {
          onScreen: "An editor at night adjusting his glasses (black and white), traced; a ring rises from his temple. Tag: 'on this machine'.",
          lines: [{ who: "narrator", says: "It runs on your computer, and it learns there." }],
          seconds: 3.7,
        },
      ],
    },
    {
      heading: "What it stands on",
      payoff: "Models that already understand pictures, sound and words, frozen; a small part on top is yours.",
      beats: [
        {
          onScreen: "Cold blocks rise into a stack, each lighting as it's named: 'pictures', 'sound', 'words'.",
          cues: ["the music strips to bass quarters and the piano motif"],
          lines: [{ who: "narrator", says: "Underneath, it stands on models that already understand pictures, sound and words." }],
          seconds: 6.7,
        },
        {
          onScreen: "An eye in close-up (ice), traced, a ring from the pupil; tag 'SigLIP 2 · sees'; small frames tick along the bottom, four a second ('four frames every second'). Cut on 'and' to a face in glasses: 'an eye', 'a screen', 'glasses' named on the frame.",
          lines: [{ who: "narrator", says: "One sees. Four frames every second, and what's in each." }],
          seconds: 5.7,
        },
        {
          onScreen: "Headphones from behind (ice): waves spread from the ear cup across the head; tags 'CLAP · how it sounds', 'YAMNet · what happens'. Cut to a strip of sound in heat: 'a voice', 'a door', 'a hum' boxed as each is said.",
          lines: [{ who: "narrator", says: "Two listen: one to how it sounds, one to what happens. A voice. A door. A hum." }],
          seconds: 8.3,
        },
        {
          onScreen: "Three lines in heat type, each lit as it's named: a note ('the opening drags'), a script ('INT. EDIT BAY. NIGHT.'), a brief ('for: first-time editors'). Caption: 'EmbeddingGemma · reads'.",
          lines: [{ who: "narrator", says: "One reads: your notes, your scripts, your briefs." }],
          seconds: 5.0,
        },
        {
          onScreen: "The sunset hand again. On 'depth' the picture turns into the model's own depth map (near white, far black): tags 'Depth Anything 3 · how far', 'near', 'far'. On 'every line' it turns back to heat as the scan draws the lines over it, a ring from the fingertip.",
          lines: [{ who: "narrator", says: "And one sees depth, how far away everything is. Every line traced in this film comes from it." }],
          seconds: 8.0,
        },
        {
          onScreen: "The stack of five frozen models, cold, named (SigLIP 2, CLAP, YAMNet, EmbeddingGemma, Depth Anything 3). On 'top' a thin white-hot layer settles on it: 'yours'.",
          lines: [{ who: "narrator", says: "Those models never change. On top sits something small, and it's only yours." }],
          seconds: 7.7,
        },
        {
          onScreen: "Words in heat type, lit in turn: 'a soft picture', 'a cut that drags', 'noise under the voice'. Caption: 'your words · day one'.",
          cues: ["the plucks and the heartbeat kick come in"],
          lines: [{ who: "narrator", says: "Name what you care about, and it looks for it from day one, from your words alone." }],
          seconds: 7.3,
        },
      ],
    },
    {
      heading: "How it learns",
      payoff: "Everything you already do teaches it something different.",
      beats: [
        {
          onScreen: "Rows of thumbs up (ember), outlined; a ripple spreads from one thumb across them all. Tag: 'approved'.",
          lines: [{ who: "narrator", says: "Approve a cut, and it learns what you like." }],
          seconds: 3.0,
        },
        {
          onScreen: "Two cards, A and B. On 'pick' B goes white-hot and A cools to blue and recedes. Tag: 'why B wins'.",
          lines: [{ who: "narrator", says: "Pick one version over another, and it learns why one wins." }],
          seconds: 4.7,
        },
        {
          onScreen: "A hand on a mouse (ice), traced; the scan wipes across the desk from 'before' to 'after'.",
          lines: [{ who: "narrator", says: "Fix something by hand, and your before and after teach it too." }],
          seconds: 5.0,
        },
        {
          onScreen: "A hand writing in a notebook (black and white), traced; rings from the pen. Tags: 'the cut lands late', 'at 0:41'.",
          lines: [{ who: "narrator", says: "Leave a note in your own words, and it learns what you meant, and exactly when." }],
          seconds: 5.3,
        },
        {
          onScreen: "A finger drawing a heart on a fogged window, its outline traced; a box drawn round the heart: 'here'.",
          lines: [{ who: "narrator", says: "Draw a box on the frame, and it learns where." }],
          seconds: 3.3,
        },
        {
          onScreen: "A screen reflected in glasses (ember), traced; rings ripple out from the lens. Tag: 'work you admire'.",
          lines: [{ who: "narrator", says: "Show it work you admire, and it learns the range you aim for." }],
          seconds: 4.7,
        },
        {
          onScreen: "The stack with its white-hot top. On 'trains' the top comes apart into small judges, each lighting in a blink: 'a soft picture', 'a cut that drags', 'noise under the voice'.",
          lines: [{ who: "narrator", says: "Each of those trains a tiny judge for one thing you care about. In a blink, on your machine." }],
          seconds: 7.7,
        },
      ],
    },
    {
      heading: "What it does",
      payoff: "Before you see a new cut, it marks what you'd mark, in your words, and checks the fixes.",
      beats: [
        {
          onScreen: "A new cut's frames slide by (jet); a mark drops on three moments, each the hottest thing there, with its words: 'too dark', 'lands late', 'hiss'.",
          cues: ["a riser into it", "a kick on every beat"],
          lines: [{ who: "narrator", says: "Then, before you ever see a new cut, it marks the moments you'd flag, in your words." }],
          seconds: 6.3,
        },
        {
          onScreen: "The marked frame and a panel, 'to your agent': moment 0:41, words 'the cut lands late'. On 'Never' a score, 87/100, appears, goes cold and drops away.",
          lines: [{ who: "narrator", says: "Your agent gets the moment and your words. Never a score to chase." }],
          seconds: 5.3,
        },
        {
          onScreen: "Three marked frames; a check sweeps across them. One flaw cools away ('fixed'), one stays hot ('still there'), one is covered and still glows through ('disguised').",
          lines: [{ who: "narrator", says: "It fixes them, and the fingerprint checks the work: fixed, still there, or only disguised." }],
          seconds: 8.3,
        },
      ],
    },
    {
      heading: "Your team",
      payoff: "Keep a fingerprint with a project and the whole team judges by the same taste; the footage stays.",
      beats: [
        {
          onScreen: "A team round an editing screen, traced; waves spread from the screen across all of them. Tags: 'one fingerprint', and a box round the screen: 'stays here'.",
          cues: ["the drive drops back to quarter-note cellos"],
          lines: [{ who: "narrator", says: "Keep a fingerprint with a project, and your whole team judges by the same taste. Your footage never leaves." }],
          seconds: 8.7,
        },
      ],
    },
    {
      heading: "Close",
      payoff: "Your eye, on every cut.",
      beats: [
        {
          onScreen: "'Fingerprint' lights white-hot through the heat; under it types 'IN RAEA · YOUR EYE, ON EVERY CUT'; it cools out.",
          cues: ["a hit on 'Fingerprint'", "the piano's whole motif, landing on D over a low D"],
          lines: [{ who: "narrator", says: "Fingerprint, in raea. Your eye, on every cut." }],
          seconds: 6.7,
        },
      ],
    },
  ],
});
