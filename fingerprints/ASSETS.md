# Assets and their licences

The code and every asset made for the film are **Apache-2.0** ([LICENSE](../LICENSE)). The fonts and one drum keep
their own free licences, listed here. The stock footage isn't in this repository or its download (below).

## Made for the film (Apache-2.0)

- **The depth layers** (`media/thermal/depth`): Depth Anything 3 (DA3-BASE, an Apache-2.0 model) run on our own
  machine over the seconds of each stock clip the film uses (`tools/depth-all.sh`). They're depth estimates and camera
  paths, with none of the clips' pictures in them.
- **The narration** (`media/voice-thermal`): a Fish Audio voice, generated for the film, timed word by word.
- **The score's instruments** (`media/score-thermal`): generated on our own machine with TokenSynth
  (`thermal-instruments.tsx`), a few seeds per note and the best kept (`thermal/instruments.gen.json`).
- **The heat prints and blobs** (`media/thermal/*.png`).

## Free licences

| Asset | Used for | Licence |
|---|---|---|
| [Versilian Community Sample Library](https://github.com/sgossner/VCSL) bass drum (`media/sounds/vcsl-bass-drum-2`) | the heartbeat kick | CC0 |
| Instrument Serif, IBM Plex Mono, DM Serif Display, Caveat, Reenie Beanie (`media/fonts`) | type | SIL Open Font License 1.1 |
| Special Elite, Permanent Marker (`media/fonts`) | type | Apache License 2.0 |

The fonts are from [github.com/google/fonts](https://github.com/google/fonts); each has its licence beside it.

## Fetched separately: the stock footage

`tools/get-stock.sh` fetches the ten clips into `media/thermal/stock` and checks each against `tools/stock.txt`. Their
licences let you use them in your own film, but not pass the files on.

| Clip | From | Licence |
|---|---|---|
| Close shot of a guy editing a video (44074), close-up of a hand writing notes (99890), drawing a heart on a foggy window (18308), editing a video on an audiovisual workstation (41276), eye of a woman looking at a tablet (41180), reflection of a screen in glasses (221), silhouette of a hand held up (46762), young creatives editing video (23148) | [Mixkit](https://mixkit.co) | Mixkit Stock Video Free License |
| An editor at night (345077), thumbs up (20855) | [Pixabay](https://pixabay.com) | Pixabay Content License |

## Not included

- **The earlier cuts' media.** `fingerprint*.tsx`, `v2/` and `v3/` are kept as history; v3's hand is a purchased scan
  whose licence doesn't allow sharing it.

The raea name and logo are trademarks and are not licensed under Apache-2.0 (its section 6).
