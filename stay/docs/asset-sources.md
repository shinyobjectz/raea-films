# Open 3D asset and scene sources (surveyed 2026-11-10; corrected 11-11)

The raea skill pages that grew out of this are in ~/raea/sdk/guides/craft/bevy/ (sources.md, blend-files.md,
godot-projects.md); they are the current version, with every licence re-read at its source. This file is the survey.

For Stay's component library first, and written so it can move into the raea skill (`3d/assets.md`, beside the Poly
Haven notes) once checked. Licence comes first on every row because raea only takes CC0, CC BY with its credit, or
MIT-like terms (`3d/blender.md`: every asset carries a sidecar with source, licence and credit).

"Seen" means I read the source's own page for that fact in this survey. "Not checked" means it comes from a list or
from memory and needs the licence page read before first use.

## Use freely: CC0 / public domain

| Source | What it has | Access | Notes |
|---|---|---|---|
| Poly Haven (polyhaven.com) | 521 models, plus texture sets and HDRIs; scanned and hand-made, realistic | Public API, no key, free for commercial use; wants a unique User-Agent and a visible "from Poly Haven" when the live API is used (seen) | Already wired in (`blender/lib/comp.py`). Thin on modern interiors and electronics. |
| ambientCG (ambientcg.com) | PBR materials, HDRIs, and 34 3D models | API v3 `/api/v3/assets?type=3d-model&include=downloads`, no key (seen) | CC0 for every asset (seen). Good second texture source. |
| Smithsonian Open Access 3D (3d.si.edu) | About 3,450 CC0 scans: skulls, fossils, corals, aircraft, spacecraft, furniture, sculpture | Public S3 bucket and API; a Hugging Face packaging holds every GLB (22 GB) (seen) | CC0 covers copyright only, not trademark or likeness. Right for the museum, observatory and clock-tower dressing. |
| Museum scans: The Met, SMK (National Gallery of Denmark) | Sculpture, casts, architecture fragments | Each museum's open-access portal; modelsxi.com indexes about 940 | Listed as CC0 / public domain by an index (not checked at the museums). Cathedral statuary. |
| The Base Mesh (thebasemesh.com) | 900+ untextured base meshes of everyday objects | Site download | Listed CC0 (not checked). Good starting shapes to detail by hand. |
| Sketchfab, CC0 filter | A slice of a million downloadable models; quality varies widely | Data API search by licence; download needs a logged-in Sketchfab token (seen) | Licence is per model and must be shown with the author. The Blender MCP's Sketchfab switch needs a key. |
| ShareTextures (sharetextures.com) | Textures and some models | Manual download only | CC0 assets, but the site forbids automated downloads and use from add-ons (seen). By hand, or skip. |
| Polygonal Mind collections / opensource3dassets.com | 991 GLBs in 17 themed sets (parks, museums, neon streets) | JSON registry on GitHub with direct links (seen) | CC0, but stylised metaverse props: useful for variety, not for realism. |
| grab3d.com | 2,422 CC0 models with .blend, GLB, FBX; 163 tagged realistic | Site download | States CC0 (seen). Provenance of the models isn't stated: check before leaning on it. |
| Kenney, Quaternius, KayKit | Tens of thousands of game props | Zips | CC0 but low-poly by design. Not for Stay; fine for games. |

## Use with credit: CC BY

| Source | What it has | Access | Notes |
|---|---|---|---|
| Amazon Berkeley Objects (ABO) | 7,953 real products as GLB with 4K PBR maps: chairs, sofas, lamps, tables, shelves, rugs, appliances | Public S3 bucket, no account: `aws s3 ls --no-sign-request s3://amazon-berkeley-objects/` (seen) | CC BY 4.0 since 2023 (seen). The best single fix for our thin interiors: laundromat, bedroom, diner, office variety. Product designs are real: avoid visible brand marks. |
| Google Scanned Objects | 1,030 scanned household items: toys, shoes, kitchenware, boxes, bottles | Hugging Face packaging with normalised GLBs, 22 GB (seen) | CC BY 4.0, "Copyright 2020 Google LLC" (seen). Many are branded retail products: pick unbranded ones or cover the label. Right for the kid's bedroom. |
| Objaverse | 800K+ objects gathered from Sketchfab | Hugging Face, per-object metadata (seen) | Licence is per object: 721K CC BY, 3.5K CC0, the rest NC or SA (seen). Filter on the metadata's licence field and keep the author for the credit. Quality is uneven. |
| Amazon Lumberyard Bistro | A whole Paris street and bistro interior, 2.8M + 1M triangles, FBX | NVIDIA ORCA download (seen) | CC BY 4.0 (seen). Pick apart for the diner: tables, chairs, bottles, awnings, street furniture. |
| Intel Sponza (2022 remake) and add-ons | The atrium with 4K PBR, plus curtains, ivy, trees, candles; glTF, FBX, USD | Intel GPU Research samples (seen) | "Creative Commons Attribution" (seen; version not stated on the page). Columns, arches and drapery for the cathedral and stairwell. |
| Intel Jungle Ruins | A large photoreal rainforest ruin, Blender source and USD, 4 GB | Same page (seen) | Same licence. Plants, roots, stone for the forest road and the kelp forest's shapes. |
| Blender Studio open films and demo files | Charge, Sprite Fright, Spring, Pet Projects, Gold, House of Chores, and more, as .blend | blender.org demo files and studio.blender.org (seen) | Studio files are CC BY; several community splash scenes are CC BY-SA (share-alike: keep out unless the film can carry it). Full production sets with rigs. |

## Free, but with terms that limit how we ship it

| Source | Terms | Verdict |
|---|---|---|
| Quixel Megascans on Fab | The whole library is free again on Fab as of 2026-11-05, under the Fab Standard License: any tool or engine, commercial use, no credit; no redistributing the assets on their own (seen) | Usable in a film render and the best source for rock, sand, forest floor, road, bark (canyon, road, sea rocks). Needs an Epic account, so the director claims and downloads. Can't be bundled in a public raea project or the skills repo. |
| BlenderKit | Two licences: CC0, and Royalty Free (commercial use, no re-selling the asset as an asset) (seen 11-11) | Usable per asset; check which licence each carries. |

## Don't use

| Source | Why |
|---|---|
| Disney Moana Island | Research and software development only (seen). |
| ALab (Animal Logic / Netflix) | ASWF Digital Assets License v1.1: education, training, research, development, benchmarking and demos only (seen 11-11). |
| Pixar Kitchen Set | USD Asset EULA: personal, non-commercial testing of USD only (seen 11-11). |
| NVIDIA Emerald Square, UE4 Sun Temple | CC BY-NC-SA: non-commercial (seen). |
| 3D-FRONT / 3D-FUTURE, InternScenes | Research only / non-commercial (seen). |
| Unreal "UE-Only" content, Paragon, City Sample, Lyra | Licensed for Unreal-based products only (seen). |
| Sketchfab "Standard" or NC / ND models | Not redistributable or not commercial. |

## Make it instead of finding it

- **Infinigen and Infinigen Indoors** (Princeton): procedural nature and whole furnished rooms generated in Blender;
  BSD 3-Clause in the repository's LICENSE (seen 11-11). Output is ours. Heavy to run.
- **ProcTHOR-10K**: 10,000 procedurally laid-out houses, Apache-2.0 in both repositories (seen 11-11).
  Layouts more than looks.
- **SandBase's `sandbase-3d-assets` skill** (sandbase.ai/lab): probably what "sandbar" was. It is a pipeline, not a
  library: an image model draws each object, a person approves the picture, Hunyuan 3D turns it into a textured GLB,
  and a script scales everything to real heights in one library .blend, with Poly Haven for materials and skies. Paid
  per object (about $0.40 to $0.55 a model). Worth copying as a shape for a raea skill: spec, price first, approve the
  image, never pay twice, one library file. It goes against Stay's "no paid generation" choice, so not used here.

## What I'd pull for Stay, in order

1. **ABO** for interiors: a few dozen chairs, lamps, tables and shelves give the laundromat, bedroom and diner
   variation the hand-modelled sets lack.
2. **Megascans** for the canyon, the road's verge and the sea rocks, if the director claims the library on Fab.
3. **Bistro and Sponza**, picked apart, for the diner and the cathedral.
4. **Google Scanned Objects** for the bedroom's toys and shelves (unbranded ones).
5. **Smithsonian** for the observatory and clock tower's instruments and the museum-grade oddities.

## For the raea skill

A short "where assets come from" page should carry: the licence rule, this table trimmed to the rows marked seen, the
access line for each (Poly Haven API, ambientCG API, ABO's bucket, Smithsonian's bucket), and the three traps found
here: a "free" library can forbid redistribution (Megascans, ShareTextures' automation ban), a dataset's licence can be
per object (Objaverse), and CC0 on a scan doesn't clear the brand printed on the object (ABO, Google Scanned Objects).
