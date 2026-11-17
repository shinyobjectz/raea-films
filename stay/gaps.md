# Gaps found making Stay

Engine and SDK limits hit while making this film: each one has its repro and the workaround in use, so it can be built
properly (the director: SDK limits are the roadmap).

## `<Atmosphere light />` panics: the view's light buffer isn't ready (11-10)

- **What:** a render with `<Atmosphere light />` panics on its first frame at
  `bevy_pbr-0.20.0/src/atmosphere/environment.rs:124:64` (`prepare_atmosphere_probe_bind_groups`):
  `lights_uniforms.view_gpu_lights.binding().unwrap()` is `None`. The atmosphere's environment probe builds its bind
  group before the view's GPU lights buffer has been written.
- **Repro:** `raea render repro/props-atmosphere.tsx --composition prop-cursor --at 0 -o /tmp/x/` panics 3 times out of 3.
  The minimal scene in `repro/atmosphere-panic.tsx` (a floor and the same sun, with or without Solari, the custom
  projection, or the cursor model) does not. So it's a schedule race the stand's scene loses, not a missing component.
  What differs: a 1350x1080 frame, a 12 m wall box, a rotated Model.
- **Workaround:** the prop stand (props.tsx) leaves the atmosphere out.
- **Fix to build:** order `prepare_atmosphere_probe_bind_groups` after the system that writes `LightMeta.view_gpu_lights`
  (or skip the probe for a frame when the binding isn't there), in raea's vendored Bevy, with this repro as its test.

## A glowing mesh removed during a render keeps drawing and lighting (11-11)

**What:** in one continuous render, a `Mesh3d` with an emissive `StandardMaterial` (parts/kit.tsx `Glow`, the pool's
tubes) that leaves the tree mid-render stays drawn and keeps lighting the room under Solari. A different entity in
its place (another key and name) doesn't change that. A model leaving mid-render (the cursor) does go.
**Repro:** Stay's pool-b2 kills its tube rows at 12.19 and 13.77 (parts/pool.tsx `rowOn`). Rendered alone as
`--at 435` (14.5 s) the room is dark; inside the shot's chunk render (frames 267..450) frame 435 is as lit as frame
360, with the tubes white on the ceiling.
**Workaround:** the render splits at each glow change as well as at each cut (parts/plan.ts `RENDER_SPLITS`,
`SEGMENTS`), so each state is the first frame of its own render.
**Fix to build:** despawn (or drop from Solari's ray-traced scene) an entity whose node leaves the tree during a render,
the same way a model is; a test that renders a glow going out mid-render and checks the frame after against a still.
