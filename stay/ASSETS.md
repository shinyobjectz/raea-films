# Assets and their licences

The code and every asset made for Stay are **Apache-2.0** ([LICENSE](../LICENSE)). Everything else in the download
is **CC0** (public domain dedication: free for any use, no credit needed). Every model in `media/models` has a
`.glb.json` sidecar with how it was made, its source and its licence: of 896, 419 are Poly Haven's, the rest our own
geometry, many dressed with Poly Haven's textures.

## Made for the film (Apache-2.0)

- **The worlds' own geometry** (`media/models`, `blender/src`): doors, rooms, furniture, props, built by the scripts in
  `blender/`.
- **The dust and the sea** (`media/dust`, `media/ocean`, `media/fog`): a Mantaflow bake and ocean simulations, made
  for the film.
- **The paintings, the mural, the pixel world and the title cards** (`media/painting`, `media/paint`, `media/splat`,
  `media/title`, `media/words`, `media/covers`).
- **The app** (`media/app`, `media/app-stay`, `media/ph`): the raea app, captured for the ending.
- **The people** (`media/characters`): five from raea's character set, fitted to portraits of people who don't exist;
  their bodies, skins and face shapes are MakeHuman's (CC0). `media/characters/SOURCE.md` has the details.
- **The sound effects** (`media/foley`, `media/gen`, `media/sfx`): generated for the film. The foley is Hunyuan Video
  Foley run on the shots' own pictures; the transitions are ElevenLabs Sound Effects (`v3/transitions.ts`); the
  `.json` beside each says what made it.
- **The song's beat map** (`media/music/stay.song.json`).

## CC0

| Asset | Used for | Source |
|---|---|---|
| 419 models, and the textures on most of ours (named in each `.glb.json`) | the worlds | [Poly Haven](https://polyhaven.com) |
| The skies (`media/hdri`, each with its `.json`) | light and backgrounds | [Poly Haven](https://polyhaven.com) |
| Bark, rock and moss maps (`media/micro`, `blender/src/micro`), sand (`media/tex`) | the macro shots and the beaches | cut from Poly Haven's scans (Jolcham Oak Bark 01, Dry Riverbed Rock, Moss 01, Sand 02) by `tools/micro-tex.sh`; the dunes' ripples are ours |
| MakeHuman's body, skins and MPFB2's expression targets (`media/characters`) | the faces | [MakeHuman](http://www.makehumancommunity.org) |

## Fonts

Geist and Geist Mono (the Geist Project Authors), SIL Open Font License 1.1, each with its licence in `media/fonts`.

## Not included

- **The song, *Stay*** (`media/music/stay.wav`): its licence isn't settled. Any track there plays under the picture
  (README).
- **The tall cut's portal renders**, Blender's `.blend` files, the Poly Haven download cache the build scripts fetch
  again, and the prebuilt plugin binary (`tools/sea-plugin.sh` builds it).

The raea name and logo (`media/brand`) are trademarks and are not licensed under Apache-2.0 (its section 6).
