# Building a place's component library (Stay, graybox v2)

The director's words this serves: "we should have super high density utilize lots of hyper realistic scenes"; "more dynamic
scenes ... with more props and detail. more moving of 3d objects and things"; "Every prop should be a component. Every
component has props that we animate. Those are rigs."; props are "CC0 models from Poly Haven and other free libraries in
Blender, modelled by hand where none fits".

The office is the worked example: `blender/components/office/*.py` (30 scripts), `library/office.tsx`,
`out/library/office/frame-0000{0,1}.png`. Read `blender/lib/comp.py` whole, then `office/chair.py`, `office/blinds.py`,
`office/water_cooler.py`, `office/desk.py` (a Poly Haven model with a rig) and `office/wall_clock.py` before writing.

## What a place needs
- What the place is and what happens in it: its entry in `board/scenes.ts` (real, directed, props, hooks) and its
  shots in `board/chain.ts` (the `eye` and `cut` lines say what moves and what the match cut lands on) and, for the
  main places, its scene in `stay.script.ts` and its prop list in `parts/places.ts`.
- At least 12 components, at least 3 of them rigged, and every prop the shot moves or cuts on must be one, with the
  rig that shot needs (the thing the cursor grabs, spins, winds, flicks; the hook's circle, line or rectangle).
  More is better: dense, specific set dressing that says what the place is.
- The place's shell too, as components: floor, walls, ceiling or ground, sky-facing pieces, at real size, textured
  from Poly Haven texture sets (`comp.ph_texture`), so the place can be assembled from parts.

## Rules
- One script a component: `blender/components/PLACE/NAME.py` (underscores), writing `media/models/PLACE/NAME.glb`
  (hyphens) and its sidecar through `comp.export`. Build headless only:
  `cd ~/Studio/raea/projects/stay && raea blender run blender/components/PLACE/NAME.py` (look for its `wrote` line).
  Never use the Blender MCP tools (one live Blender is shared), never open Preview or a browser, never `raea show`.
- Blender frame: z up, the component's front toward -y (raea's +z, toward the camera), standing on the floor at the
  origin; a wall item's back at y 0; a ceiling item's top at z 0. Metres, real sizes.
- A rig channel is a clip: `comp.channel("name", [(object, "rotation_euler"|"location"|"scale", index, rest, full)])`,
  rest at 0 s to full travel at 1 s (a spin's full is one whole turn). Moving parts hang from `comp.pivot` (at the
  hinge or axle) or `comp.hang`. What the scene drives instead (a glow, a screen's picture, where it stands) is named
  in the sidecar's rig with "in the scene: ...", and its material gets its own name (`dryer_light`, `crt_screen`).
- Poly Haven first: `blender/src/polyhaven/models.json` and `textures.json` list every model and texture set (keys are
  the asset ids; `comp.ph_component`, `comp.ph_model`, `comp.ph_texture`). All CC0. Check a model's parts and size
  before use (`https://api.polyhaven.com/files/ID`, `/info/ID`). Other sources only if CC0 or CC BY with the credit
  in the sidecar; no paid generation, no Sketchfab key. Otherwise model it by hand with bmesh, with real detail
  (bevels, separate parts, handles, labels, fixings): never a low-poly stand-in or a bare box.
- Don't edit `blender/lib/comp.py`, another place's files, `parts/places.ts`, `board/`, or `parts/library.tsx`.
  A helper you need goes in `blender/components/PLACE/_lib.py`. If comp.py has a bug, work round it and report it.
- Known traps: a new object's `matrix_world` is stale until `bpy.context.view_layer.update()`; the glTF export keeps
  a multiply tint on a texture but no other colour nodes (`ph_texture(..., grey=True, tint=...)` desaturates the
  image itself); a mesh with shape keys can't have modifiers; very thin parallel slats moiré in the render; keep each
  component under about 150 000 triangles and a place's parts under about 100 MB (use 1k textures for small things:
  `res="1k"`); text is `comp.text` (Blender's built-in font).
- No words that pretend to be a real brand. Signs and labels are generic and our own.

## Prove it in raea
- Write `library/PLACE.tsx` like `library/office.tsx` (the parts standing where they belong in the place, each rigged
  one with its `clip`; `wall={false}` and your own eye/look for an outdoor place) and
  `parts/places/PLACE.ts`: `export default { heading: "...", props: [{ name, is, where, rig? }] }` with every
  component (name = the file's name with spaces for hyphens; rig = the sidecar's rig keys).
- Render both frames and look at them (Read the PNGs):
  `antsy run --name stay-library-PLACE --stall 3m --mem 12G --for "Stay graybox v2: PLACE's component library" -- raea render library/PLACE.tsx --composition library-PLACE --at 0,30 -o out/library/PLACE/`
  Frame 0 is rest, frame 30 every rig at full travel. Fix what looks wrong (a part at the origin, a rig turning about
  the wrong point, a missing texture, black or blown-out materials, things floating or sunk) and render again. Read
  the render's warnings; don't grep them away. Other agents render too: if antsy refuses for memory, wait on
  `antsy events --follow` for a job to end rather than sleeping.
- No git commands. Nothing leaves this machine except Poly Haven downloads.
