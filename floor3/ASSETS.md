# Assets and their licences

The code and every asset made for FLOOR3 are **Apache-2.0** ([LICENSE](../LICENSE)). Everything else in the download
is **CC0** (public domain dedication: free for any use, no credit needed). Each model in `assets/models` has a
`.glb.json` sidecar with how it was made, its source and its licence.

## Made for the game (Apache-2.0)

- **Most of the models** (59 of 80): the desks, CRTs, phones, copier, cassette recorder, signs, switches, lamps,
  bookcases and the building itself, modelled in code by the scripts in `blender/`.
- **The soft props** (a coat, a backpack, a cardigan): our drawings, made 3D on our own machine by Idol and carved to
  meshes (`tools/idol.sh`).
- **The printed surfaces** (`blender/src/tex`): clock dials, labels, forms, binder spines, drawn with ImageMagick by
  `tools/tex.sh`.
- **The art** (`assets/art`, `assets/papers`): the posters, prints, calendar, snapshots and notices, generated to our
  prompts (`tools/art.sh`: FLUX.2 Pro and GPT Image 2) and set by `tools/papers.sh`.
- **Dana's voice** (`assets/voice`): Fish Audio, generated for the game by `tools/voice.ts`.
- **The foley** (`assets/sfx`): Stable Audio Open takes made on our own machine (`tools/foley.sh`). The electronic
  sounds and the score are synthesized by `tools/mix.ts`.
- **The covers** (`assets/covers`).

## CC0

| Asset | Used for | Source |
|---|---|---|
| Beige Wall 001, Concrete Floor Worn 001, Decrepit Wallpaper, Dirty Carpet, Old Linoleum Flooring 01 (`assets/tex`) | walls and floors (the `*_lit` and `*_clean` maps are our grades of them) | [Poly Haven](https://polyhaven.com) |
| 17 models and the textures on four of ours (`assets/models`, each named in its sidecar) | furniture and props | [Poly Haven](https://polyhaven.com) |
| The people at the desks (`assets/models/*/` with "MakeHuman" in their sidecar) | the bodies slumped at the desks | MakeHuman's body and clothes ([makehumancommunity.org](http://www.makehumancommunity.org)), posed and baked by us |

The exit sign's letters are set in Blender's built-in font (Bfont), whose licence leaves what you make with it free.

The raea name and logo (`assets/brand`) are trademarks and are not licensed under Apache-2.0 (its section 6).
