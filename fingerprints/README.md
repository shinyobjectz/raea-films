# Fingerprints

**[Watch the film](https://media.raea.io/#fingerprints)** (2:19, 1920×1080, 30 fps, with sound)

Don't prompt a model to edit like you, train one. An explainer for raea's Fingerprint: models that see, hear and read
every cut learn your eye from your own notes, on your own computer. It's told in heat: stock footage of editors at
work, every shot traced from its own depth, with motion graphics drawn in the same thermal light.

Every shot is code: React and TypeScript compositions that raea renders on the GPU. This folder is the whole project,
with the earlier cuts it grew from. It's Apache-2.0: read it, take it apart, make your own.

## How it was made

1. **A brief and a script.** [`brief.ts`](brief.ts) says what the film is for and who it's for;
   [`thermal.script.ts`](thermal.script.ts) has every line and what's on screen under it.
2. **Footage traced from its own depth.** Each stock shot is run through Depth Anything 3 on our own machine
   ([`tools/depth.py`](tools/depth.py), [`tools/depth-all.sh`](tools/depth-all.sh)), and
   [`thermal/depth.ts`](thermal/depth.ts) uses those layers to wrap a scan plane round the real surfaces, leave
   contours behind it, and spread a ring out from whatever is touched: a fingertip, a pen, a lens.
3. **Motion graphics in heat.** Half the lines are drawn, not filmed ([`thermal/mograph.tsx`](thermal/mograph.tsx)):
   clips that warm and fall away, A and B, a new cut's marks, fixed, still there, disguised.
4. **Sound.** The narrator is a Fish Audio voice ([`tools/voice-thermal.ts`](tools/voice-thermal.ts)). The score is
   MIDI written in code ([`thermal/score.ts`](thermal/score.ts): D minor, 90 BPM, every sound struck or plucked) and
   played on instruments generated on our own machine with TokenSynth, a few takes per note with the best kept
   ([`thermal-instruments.tsx`](thermal-instruments.tsx)).
5. **Render.** [`tools/thermal-film.sh`](tools/thermal-film.sh) renders the sound whole and the picture a shot at a
   time, then joins them.

## Make it yourself

You need [raea](https://raea.io) 0.1.6 or later, plus bun, ffmpeg and zstd.

The media comes with a raea account, which is free: sign in on [the film's page](https://media.raea.io/#fingerprints),
press **Get the media**, and it gives you the `tools/get-assets.sh` line below with your own link (or the archive to
download, which `tools/get-assets.sh` takes as a path).

```sh
git clone https://github.com/shinyobjectz/raea-films && cd raea-films/fingerprints
tools/get-assets.sh LINK  # the depth layers, the voice, the score's instruments and the fonts: about 0.1 GB
tools/get-stock.sh        # the ten stock clips, from Mixkit and Pixabay (see below)

raea render thermal-film.tsx --composition thermal-film --frame 900 -o still.png
tools/thermal-film.sh out/fingerprints.mp4
```

The stock footage isn't ours to pass on, so `tools/get-stock.sh` fetches it from where it's published and checks
each file against [`tools/stock.txt`](tools/stock.txt). Eight clips come straight from Mixkit. Pixabay serves its
files only to a browser, so the script names the two pages to save from and where to put each file; run it again
and it checks them.

The other compositions at the top level (`fingerprint*.tsx`, `thermal-*.tsx`) and `v2/`, `v3/` are the earlier cuts
and studies, kept as history. Their own media isn't in the download.

## Layout

| | |
|---|---|
| `thermal-film.tsx`, `thermal/` | the film: its shots, depth tracing, motion graphics, HUD, score and timing |
| `parts/` | drawing and type shared by every cut |
| `tools/` | the scripts that traced the depth, voiced the narration, made the instruments and rendered the film |
| `brief.ts`, `thermal.script.ts` | the brief and the script |
| `media/` | fetched by `tools/get-assets.sh` and `tools/get-stock.sh` |

## Licence

The code and every asset made for the film are [Apache-2.0](../LICENSE). The fonts and one drum keep their own free
licences, and the stock footage stays under its sites' licences: [`ASSETS.md`](ASSETS.md) has each one. The raea name
and logo are trademarks and aren't covered by the Apache licence.
