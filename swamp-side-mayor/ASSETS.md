# Assets and their licences

The code, Goose, the song and every asset made for these two films are **Apache-2.0** ([LICENSE](../LICENSE)). The
assets made by others keep their own licences, listed here: most are CC0 (public domain dedication, free for any use),
a few need their credit kept. Folders of `assets/` (from `tools/get-assets.sh`) carry their own `LICENCE.txt` or
`LICENCES.md` with the same details.

## Made for these films (Apache-2.0)

- **Goose** (`assets/goose`, `assets/glb/goose-*`): built from scratch, rigged and posed by `blender/goose_build.py`.
- **The song**, *Swamp-Side Mayor* (`assets/music`, its words in `assets/lyrics`).
- **The world**: the trees, grass, plants, ruins and panoramas (`assets/glb`, `assets/pano`, `assets/sky`, `assets/tiles`),
  grown and built by the scripts in `blender/` and `tools/`.
- **The lettering, the effects and the cards** (`assets/ink`, `assets/tut-ink`, `assets/fx`, `assets/likes*`,
  `assets/stack`, `assets/tut-keys`, `assets/tut-fp`, `assets/tut-desktop`), drawn by `tools/`.
- **The app on the screen** (`assets/app`, `assets/screen`, `assets/tutorial-app`): the real raea app, captured from
  raea's own window.
- **The sound effects and the swamp's beds** (`assets/sfx`, `assets/tut-sound`, the hash-named `.wav` files): Stable
  Audio Open takes made on our own machine with `raea sao`. `assets/made.jsonl` records each one's prompt and seed.
- **The narration** (`assets/vo11`, `assets/vo11-comp`): a Fish Audio voice, generated for the tutorial.

## Credit required (CC BY 3.0)

| Asset | Used for | Credit |
|---|---|---|
| [tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments) bassoon and contrabass (`assets/sounds/bassoon`, `assets/sounds/contrabass`) | the tutorial's score | Nicholaus Brosowsky, edited from Versilian Studios' VSCO-2 |

## CC0

| Asset | Used for | By |
|---|---|---|
| Frog, frog 2, deer, fish, rat, snake, raccoon (`assets/critters`, `assets/glb/critter-*`) | the swamp's critters (the raccoon is unused) | Quaternius, from [Poly Pizza](https://poly.pizza); each page is in `assets/critters/LICENCES.md` |
| [Versilian Community Sample Library](https://github.com/sgossner/VCSL): guiro, kalimba, marimba, slit drum, strumstick, baroque tenor recorder, woodblock (`assets/sounds`) | the tutorial's score | Versilian Studios |

## Fonts

From [github.com/google/fonts](https://github.com/google/fonts), each with its licence beside it in `assets/fonts`:

| Font | Licence |
|---|---|
| Archivo Black (Omnibus-Type), Lilita One (Juan Montoreano), Gochi Hand (Huerta Tipográfica), Rubik Marker Hatch (the Rubik project authors) | SIL Open Font License 1.1 |
| Permanent Marker, Rock Salt (Font Diner) | Apache License 2.0 |

## Not included

- **The logos of four AI agents** (`assets/tut-logos`: Claude, Gemini, Kimi, OpenAI), seen in the tutorial's chapter on
  choosing an agent. They're their companies' marks, so the download has plain grey cards in their place.
- **The music video, as the tutorial plays it** (`assets/tut-song/goose-v5.mp4`): a link to `out/goose-v5.mp4`.
  Render the music video there first (README).
- **Earlier narration takes and discarded app states**, which no composition reads.

The raea name and logo (`assets/logo`, `assets/tut-desktop/raea-icon.png`) are trademarks and are not licensed under
Apache-2.0 (its section 6): put your own mark in their place if you make your own film from this.
