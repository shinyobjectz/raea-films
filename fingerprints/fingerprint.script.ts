import { script } from "raea/brief";

// One cut through one loop: a short coffee-shop film gets notes, raea writes them into a fingerprint, and the next cut is
// checked against it before anyone sees it. Seen from above a maker's desk: paper, tape, prints, ink.
export default script({
  title: "Fingerprint",
  logline: "Your eye for a good cut, written down, so the AI catches what you'd catch.",
  scenes: [
    {
      heading: "The eye",
      payoff: "You already know what's wrong with a cut when you see it.",
      beats: [
        {
          onScreen:
            "Cream paper. An engraving-style eye inks itself on, line by line, then its hatching. Its iris is a whorl of ridges, a fingerprint, not yet named.",
          camera: "a slow drift down the desk, already moving",
          cues: ["pencil scratches set the first beat", "celesta picks out the theme"],
          lines: [{ who: "narrator", says: "Every editor has an eye." }],
          seconds: 3,
        },
        {
          onScreen:
            "A film strip of the coffee film slides in under the eye, frame by frame (stop motion). Red pencil circles a dark frame: 'too dark'. A drawn waveform fizzes: 'hiss'. A soft frame: 'too soft'.",
          camera: "keeps drifting with the strip",
          cues: ["each red circle is a pencil hit on the beat"],
          lines: [
            {
              who: "narrator",
              says: "One look, and you'd catch it: a shot too dark, a hiss under the voice, a frame gone soft.",
            },
          ],
          onWord: "dark",
          seconds: 6,
        },
      ],
    },
    {
      heading: "The same notes",
      payoff: "An AI is fast, but it doesn't know your eye, so you repeat yourself.",
      beats: [
        {
          onScreen:
            "Scissors (a real photo, cut out) tagged 'AI' snip the film strip into a cut by themselves, stop motion.",
          cut: "match on the strip's motion",
          cues: ["scissor snips are the snare"],
          lines: [{ who: "narrator", says: "AI cuts video in minutes." }],
          seconds: 3,
        },
        {
          onScreen:
            "Sticky notes land on the new cut, one a beat, all in your hand: 'too dark', 'too dark (again)', 'hiss', 'still too dark'. The pile grows.",
          cues: ["paper slaps on the beat, faster"],
          lines: [
            {
              who: "narrator",
              says: "But it can't see what you see. So you write the same notes. Again, and again.",
            },
          ],
          seconds: 6,
        },
      ],
    },
    {
      heading: "The fingerprint",
      payoff: "raea writes your eye down, from things you already do.",
      beats: [
        {
          onScreen:
            "The pile slides away. An index card; an ink fingerprint presses onto it in three steps. A typewriter label: 'fingerprint'.",
          cues: ["a rubber-stamp thud on the downbeat", "typewriter keys on the label"],
          lines: [{ who: "narrator", says: "So raea made Fingerprint: your eye, written down." }],
          onWord: "fingerprint",
          seconds: 4,
        },
        {
          onScreen:
            "What you already do flies in and becomes a ridge: an APPROVED stamp on a print, two Polaroids with one circled, a note card. A small blue-pencil 'read you right?' with its box ticked.",
          cues: ["stamp, shutter click, paper"],
          lines: [
            {
              who: "narrator",
              says: "It learns from what you already do. The cuts you approve. The takes you pick. The notes you leave. Then it checks it read you right.",
            },
          ],
          seconds: 8,
        },
      ],
    },
    {
      heading: "Your words",
      payoff: "It speaks your language, from day one.",
      beats: [
        {
          onScreen:
            "Close on the print. Its ridges are words, handwritten along the curves: 'too dark', 'hiss under the voice', 'too soft'. Red string pins a dark print and a hissing waveform to their words.",
          camera: "push in, turning with the whorl",
          lines: [
            {
              who: "narrator",
              says: "It speaks your language. Too dark. Hiss under the voice. Too soft. From day one, it knows how those words look, and how they sound.",
            },
          ],
          seconds: 9,
        },
      ],
    },
    {
      heading: "The check",
      payoff: "Before you see a cut, it's been read with your eye, and a fake fix doesn't pass.",
      beats: [
        {
          onScreen:
            "The AI's next cut slides under the fingerprint, now a lens. It stops on a dark frame: a tag in your hand, 'too dark 0:07', and 'hiss 0:04' (the real flags `raea fingerprint score` gave media/cuts/cut-v1.mp4). The frame brightens. Blue pencil: 'fixed'.",
          cues: ["a ratchet as the strip advances", "a bell on 'fixed'"],
          lines: [
            {
              who: "narrator",
              says: "So before the AI shows you a cut, it checks it against your fingerprint, catches what you'd flag, and fixes it first.",
            },
          ],
          seconds: 8,
        },
        {
          onScreen:
            "Next flag: 'hiss'. A drawn volume knob turns the hiss down and a paper patch is taped over the waveform. Red stamp: 'still there' (what score --was said of the hiss turned down, to a twelfth). The patch peels off; the waveform is cleaned; 'fixed'.",
          cues: ["tape rip", "stamp", "the theme returns"],
          lines: [{ who: "narrator", says: "Paper over a problem? It can tell." }],
          seconds: 5,
        },
      ],
    },
    {
      heading: "Yours",
      payoff: "It stays on your computer; a team shares what it learned, never the footage.",
      beats: [
        {
          onScreen:
            "A drawn laptop. The fingerprint card and the film reels go inside; a padlock on the reels.",
          lines: [{ who: "narrator", says: "It all runs on your computer. Your footage never leaves." }],
          seconds: 5,
        },
        {
          onScreen:
            "Copies of the card slide out to three desks; the reels stay home. Each copy takes its own ink colour.",
          lines: [
            {
              who: "narrator",
              says: "On a team? Share what it's learned, never the footage. Everyone keeps their own eye.",
            },
          ],
          seconds: 6,
        },
      ],
    },
    {
      heading: "The cut",
      payoff: "The finished cut, signed with your fingerprint.",
      beats: [
        {
          onScreen:
            "The coffee film plays, clean, in a torn-paper window. The fingerprint presses into its corner like a signature. 'Fingerprint, in raea' with the raea logo.",
          cues: ["the theme resolves", "one stamp"],
          lines: [{ who: "narrator", says: "Your eye, on every cut. Fingerprint, in raea." }],
          seconds: 6,
        },
      ],
    },
  ],
});
