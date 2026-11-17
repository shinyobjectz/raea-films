# raea gaps hit making film v3

Each was worked round in this project; the fix belongs in raea.

## Scene graph
- An `<Entity>` with no `transform` hides its children (the Earth drew nothing until its wrapper became a fragment).
- An Entity's transform is not carried down to a nested Entity component such as the Robot: its world pose has to be
  worked out in TS and passed in (orbit.tsx `robotPose`).
- `Transform.lookingAt(target)` with the default up breaks when the direction is along +y: an upright beam drew
  nothing, then a white blob in the sky. Pass an up that isn't along it (space.tsx `Beam`), or have raea pick one.

## Light (Solari)
- Solari lights only by DirectionalLight and emissive meshes; a PointLight does nothing. A glowing panel stands in
  for a key light (the softbox on the robot in 32-end).
- ExtendedMaterial / ShaderExtension meshes are lit by raster after the denoiser and are not traced.
- A single-frame render at frame 0 fails its readback when the scene has emissives: render test frames at frame 4+.
- Bevy's default ambient light is 80 nits; space needs `GlobalAmbientLight brightness={0}` or the night side greys.
- An unlit StandardMaterial can't take a ShaderExtension.

## Fog
- VolumetricFog draws the whole frame black once the camera is high above the scene (about 60 m up, at the top of the
  beam's rise). shot.tsx turns the fog and the mist off above 20 m.

## Assets
- In a video render a material's texture (a StandardMaterial's `emissive_texture`, a ShaderExtension's `textures`) is
  never awaited: one first used partway through a shot never shows, and even one mounted from the first frame shows
  only if it happened to finish loading during warm-up (a 2 MB atlas did, two 8-10 MB ones never did). A still waits
  for it, so stills look right and the video is black. The review room's screen changed picture every frame and drew
  black through all of 29-room; it's now a `<Screen pass="ui">` page holding an `<Img>` (which waits), and the light it
  throws is a grid of emissive tiles whose colours change instead of a texture. `load_shared` should await images as it
  awaits models.
- `staticFile` textures for a ShaderExtension weren't staged; ES imports of the files work.
- Textures load as sRGB (Bevy's default), so data maps (height, water, clouds) need converting back in the shader.
- The HDR frame is f16 (max 65504): a sun at its real luminance overflows; the sun disc is held at 3e6 nits.

# raea gaps hit making film v4

## Video renders (and multi-frame `--at` stills) keep some things at their first frame
Measured on a 20-frame test (compositions/uniform-probe.tsx) and the orbit beam (compositions/beam-probe.tsx):
- A ShaderExtension's `uniforms` keep the values of the frame the material was first drawn on: a scalar and a vec3
  ramped 0..1 over the clip both stayed black. A FramePass's uniforms do update, and so do a StandardMaterial's
  emissive and every transform. (A single `--frame N` still is right, so stills hide it.) The beam's glow (space.tsx,
  groundbeam.tsx) and the pit's light shaft (opening.tsx) now keep their uniforms constant; what changes is carried by
  the transform (the shaft reads its brightness from its container's radius).
- A Mesh3d whose `shape` is computed per frame (a cone of the beam's current length, a Cuboid whose half_size grows)
  isn't rebuilt: the first frame's shape stays, moved by the new transform. v3's rising beam drew wrong or not at all
  for this; the pulse's second ring broke into dashes for it. Unit shapes sized by `withScale` work.
- A mesh with an ExtendedMaterial first mounted partway through a shot never drew (a glow re-keyed every frame went
  blank). Mount it from the shot's first frame, dark, and change it from there.

### More raea gaps from the v4 beam (2026-11-16)

- A volumetric SpotLight can't make a thin, long shaft. Bevy clamps a cone's edge width (cos inner - cos outer) to
  1e-4 and works in f32: a cone under about 0.01 rad keeps under 1% of its light, and under about 0.003 rad its falloff
  breaks into a few visible steps (stripes in the fog). A 0.4 m beam lit from 1200 m up (0.0003 rad) was invisible.
- Volumetric fog only shows where a FogVolume is, and its `ambient` lights every volume's whole box by density: a box
  of air as thick as the mist reads as a grey column.
- What worked: a FramePass (before-tonemap, prepass depth) that integrates the beam's glowing air analytically along
  each pixel's ray to depth(uv) (Gaussian tubes: an erf), marches the energy inside, and blurs across the shutter
  itself. depth(uv) is metres along the view axis; FramePass uniforms do update in video.
- Backticks inside a wesl template literal end the JS string: the bundler reports a missing semicolon in hype.tsx.

### raea gaps from the v4 ravens (2026-11-16)

- `<Model hide={["node"]}>`: a node hidden on a video render's first frame never shows again when `hide` empties. A
  probe of three ways to keep a bird out of sight until it flies (15-leaves 896-915, compositions/birds-probe.tsx,
  since deleted): hidden, none drew; shrunk to scale×1e-3 in place, or shown in place, all drew. The birds wait shrunk.
- `<Model morphs>` does update per frame in video: the raven's 11-pose flipbook beats.
- Scene MotionBlur in 15-leaves smears the whole canopy on some frames: the leaf models grow by scale and offset each
  frame (world.tsx), and a step in that reads as a huge velocity. The shot stays unblurred.
- A model moved in from far away on the frame it first shows is drawn by MotionBlur as a dithered ghost of itself
  smeared along the whole jump (the first try waited the birds 120 m underground).
