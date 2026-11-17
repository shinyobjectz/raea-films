import bevy_pbr::render::mesh_functions::{
    get_world_from_local,
    get_visibility_range_dither_level,
    mesh_normal_local_to_world,
    mesh_position_local_to_clip,
    mesh_position_local_to_world,
};

@if(PREPASS_PIPELINE)
import bevy_pbr::prepass::io::{
    Vertex,
    VertexOutput,
};
@else
import bevy_pbr::render::forward_io::{
    Vertex,
    VertexOutput,
};

@if(!PREPASS_PIPELINE)
import bevy_pbr::render::pbr_fragment::pbr_input_from_standard_material;
@if(!PREPASS_PIPELINE)
import bevy_pbr::render::pbr_functions::alpha_discard;
@if(!PREPASS_PIPELINE)
import bevy_pbr::render::pbr_functions::prepare_world_normal;
@if(!PREPASS_PIPELINE)
import bevy_pbr::render::pbr_types;
@if(!PREPASS_PIPELINE)
import bevy_pbr::render::pbr_types::STANDARD_MATERIAL_FLAGS_DOUBLE_SIDED_BIT;
@if(!PREPASS_PIPELINE)
import bevy_pbr::render::pbr_types::STANDARD_MATERIAL_FLAGS_UNLIT_BIT;
@if(!PREPASS_PIPELINE)
import bevy_pbr::render::forward_io::{
    VertexOutput as FragVertexOutput,
    FragmentOutput,
};
@if(!PREPASS_PIPELINE)
import bevy_pbr::render::pbr_functions::{
    apply_pbr_lighting,
    main_pass_post_lighting_processing,
};

@if(PREPASS_PIPELINE && PREPASS_FRAGMENT)
import bevy_pbr::prepass::io::{
    VertexOutput as FragVertexOutput,
    FragmentOutput,
};
@if(PREPASS_PIPELINE && PREPASS_FRAGMENT && NORMAL_PREPASS_OR_DEFERRED_PREPASS)
import bevy_pbr::render::pbr_fragment::pbr_input_from_standard_material;
@if(PREPASS_PIPELINE && PREPASS_FRAGMENT && NORMAL_PREPASS_OR_DEFERRED_PREPASS)
import bevy_pbr::render::pbr_functions::alpha_discard;
@if(PREPASS_PIPELINE && PREPASS_FRAGMENT && NORMAL_PREPASS_OR_DEFERRED_PREPASS)
import bevy_pbr::render::pbr_functions::prepare_world_normal;
@if(PREPASS_PIPELINE && PREPASS_FRAGMENT && NORMAL_PREPASS_OR_DEFERRED_PREPASS)
import bevy_pbr::deferred::functions::deferred_output;
@if(PREPASS_PIPELINE && PREPASS_FRAGMENT && NORMAL_PREPASS_OR_DEFERRED_PREPASS)
import bevy_pbr::render::pbr_types::STANDARD_MATERIAL_FLAGS_DOUBLE_SIDED_BIT;

struct OceanExtensionUniform {
    amplitude: f32,
    choppiness: f32,
    ocean_tile_world_size: f32,
    grid_size: f32,
    wind_direction: f32,
    foam_intensity: f32,
    foam_cutoff: f32,
    foam_falloff: f32,
    foam_trail_decay: f32,
    fade_near: f32,
    fade_far: f32,
    shore_x: f32,
    shore_z: f32,
    shore_radius: f32,
    shore_width: f32,
}

@group(constants::MATERIAL_BIND_GROUP) @binding(100) var<uniform> ocean_ext: OceanExtensionUniform;
@group(constants::MATERIAL_BIND_GROUP) @binding(101) var displacement_texture: texture_2d<f32>;
@group(constants::MATERIAL_BIND_GROUP) @binding(103) var foam_mask_texture: texture_2d<f32>;

fn ocean_wrap(i: i32, n: i32) -> i32 {
    return (i % n + n) % n;
}

fn ocean_load_disp(tex: texture_2d<f32>, cx: i32, cz: i32, dims: i32) -> vec4<f32> {
    return textureLoad(tex, vec2<i32>(ocean_wrap(cx, dims), ocean_wrap(cz, dims)), 0);
}

/// Bilinear fetch that wraps at the tile edge (tile_uv in tiles, any range).
fn ocean_bilinear(tex: texture_2d<f32>, tile_uv: vec2<f32>, dims: i32) -> vec4<f32> {
    let p = tile_uv * f32(dims) - vec2<f32>(0.5);
    let b = floor(p);
    let f = p - b;
    let ix = i32(b.x);
    let iz = i32(b.y);
    let a0 = ocean_load_disp(tex, ix, iz, dims);
    let a1 = ocean_load_disp(tex, ix + 1, iz, dims);
    let a2 = ocean_load_disp(tex, ix, iz + 1, dims);
    let a3 = ocean_load_disp(tex, ix + 1, iz + 1, dims);
    return mix(mix(a0, a1, f.x), mix(a2, a3, f.x), f.y);
}

struct DisplacedSurface {
    clip_position: vec4<f32>,
    world_position: vec4<f32>,
    world_normal: vec3<f32>,
    tile_uv: vec2<f32>,
}

/// `spatial_output`: R/G/B = height slopes X and Z and elevation; A = wind-along chop scalar (before amplitude and choppiness).
fn ocean_displace_surface(instance_index: u32, position_local: vec3<f32>, mesh_uv: vec2<f32>) -> DisplacedSurface {
    let size = ocean_ext.grid_size;
    let dims = i32(size);
    // Tile coordinates from the vertex's own place, so one periodic patch covers a sea of any size.
    let tile_uv = position_local.xz / ocean_ext.ocean_tile_world_size + vec2<f32>(0.5);
    let reach = length(position_local.xz);
    let fade = 1.0 - smoothstep(ocean_ext.fade_near, ocean_ext.fade_far, reach);
    let disp = ocean_bilinear(displacement_texture, tile_uv, dims) * vec4<f32>(1.0, 1.0, fade, fade);

    let amp = ocean_ext.amplitude;
    let tile = ocean_ext.ocean_tile_world_size;

    let deta_dx = disp.r * amp;
    let deta_dz = disp.g * amp;
    let eta = disp.b * amp;
    // Same linear scale as height; scalar field matches `((k dot w_hat)/|k|)(i*h)` in `ocean_spectrum`.
    let chop = disp.a * amp * ocean_ext.choppiness;
    let wx = cos(ocean_ext.wind_direction);
    let wz = sin(ocean_ext.wind_direction);

    var displaced_position = position_local;
    displaced_position.x += chop * wx;
    displaced_position.z += chop * wz;
    displaced_position.y = position_local.y + eta;

    // Tangents use spectral height slopes only (horizontal chop does not tilt the normal here).
    let dx_cell = tile / max(size - 1.0, 1.0);
    let dz_cell = dx_cell;
    let tu = vec3<f32>(2.0 * dx_cell, deta_dx * 2.0 * dx_cell, 0.0);
    let tv = vec3<f32>(0.0, deta_dz * 2.0 * dz_cell, 2.0 * dz_cell);

    let n_raw = cross(tv, tu);
    let len2 = dot(n_raw, n_raw);
    let local_n = select(normalize(n_raw), vec3(0.0, 1.0, 0.0), len2 < 1e-12);

    let world_from_local = get_world_from_local(instance_index);
    var out: DisplacedSurface;
    out.clip_position = mesh_position_local_to_clip(world_from_local, vec4<f32>(displaced_position, 1.0));
    out.world_position = mesh_position_local_to_world(world_from_local, vec4<f32>(displaced_position, 1.0));
    out.world_normal = mesh_normal_local_to_world(local_n, instance_index);
    out.tile_uv = tile_uv;
    return out;
}

/// Slopes from bilinear fetch on the FFT grid (mip 0), then the same local normal as the vertex path.
/// `mesh_uv` is the plane attribute UV (0..1); we map to texel-centered coordinates so clamp-to-edge never pins the seam.
fn ocean_highres_world_normal(instance_index: u32, mesh_uv: vec2<f32>) -> vec3<f32> {
    let size = ocean_ext.grid_size;
    let amp = ocean_ext.amplitude;
    let tile = ocean_ext.ocean_tile_world_size;

    let disp = ocean_bilinear(displacement_texture, mesh_uv, i32(size));

    let deta_dx = disp.r * amp;
    let deta_dz = disp.g * amp;

    let dx_cell = tile / max(size - 1.0, 1.0);
    let dz_cell = dx_cell;
    let tu = vec3<f32>(2.0 * dx_cell, deta_dx * 2.0 * dx_cell, 0.0);
    let tv = vec3<f32>(0.0, deta_dz * 2.0 * dz_cell, 2.0 * dz_cell);
    let n_raw = cross(tv, tu);
    let len2 = dot(n_raw, n_raw);
    let local_n = select(normalize(n_raw), vec3(0.0, 1.0, 0.0), len2 < 1e-12);
    return mesh_normal_local_to_world(local_n, instance_index);
}

fn ocean_foam_coverage(mesh_uv: vec2<f32>) -> f32 {
    let size = ocean_ext.grid_size;
    return ocean_bilinear(foam_mask_texture, mesh_uv, i32(size)).r;
}

fn ocean_mix_foam_into_base_color(mesh_uv: vec2<f32>, base_color: vec4<f32>) -> vec4<f32> {
    let foam_cov = ocean_foam_coverage(mesh_uv);
    let foam_mix = saturate(foam_cov * ocean_ext.foam_intensity);
    let foam_white = vec3<f32>(1.0, 1.0, 1.0);
    return vec4<f32>(mix(base_color.rgb, foam_white, foam_mix), base_color.a);
}

struct OceanShade {
    normal: vec3<f32>,
    base_color: vec4<f32>,
    roughness: f32,
}

fn ocean_rot(p: vec2<f32>, a: f32) -> vec2<f32> {
    let c = cos(a);
    let s = sin(a);
    return vec2<f32>(c * p.x - s * p.y, s * p.x + c * p.y);
}

fn ocean_hash(p: vec2<f32>) -> f32 {
    let q = fract(p * vec2<f32>(0.1031, 0.1030));
    let r = q + dot(q, q.yx + 33.33);
    return fract((r.x + r.y) * r.x);
}

fn ocean_noise(p: vec2<f32>) -> f32 {
    let i = floor(p);
    let f = fract(p);
    let u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(ocean_hash(i), ocean_hash(i + vec2<f32>(1.0, 0.0)), u.x),
        mix(ocean_hash(i + vec2<f32>(0.0, 1.0)), ocean_hash(i + vec2<f32>(1.0, 1.0)), u.x),
        u.y,
    );
}

/// The fragment's water: the simulated slopes, two finer copies of the same field for the chop a single
/// patch can't hold (each fading before it would alias), a crest tint, and foam broken into lace.
fn ocean_shade(instance_index: u32, tile_uv: vec2<f32>, world_xz: vec2<f32>, base_color: vec4<f32>, roughness: f32) -> OceanShade {
    let size = ocean_ext.grid_size;
    let dims = i32(size);
    // Texels of the patch one pixel covers.
    let footprint = max(length(dpdx(tile_uv)), length(dpdy(tile_uv))) * size;

    let d0 = ocean_bilinear(displacement_texture, tile_uv, dims);
    let keep0 = 1.0 / (1.0 + footprint * footprint * 0.02);
    var slope = d0.rg * ocean_ext.amplitude * keep0;

    let a1 = 0.61;
    let s1 = 4.7;
    let d1 = ocean_bilinear(displacement_texture, ocean_rot(tile_uv, a1) * s1 + vec2<f32>(0.37, 0.11), dims);
    let keep1 = 1.0 - smoothstep(0.35, 1.2, footprint * s1);
    slope += ocean_rot(d1.rg, -a1) * ocean_ext.amplitude * 0.55 * keep1;

    let a2 = -1.13;
    let s2 = 15.3;
    let d2 = ocean_bilinear(displacement_texture, ocean_rot(tile_uv, a2) * s2 + vec2<f32>(0.71, 0.53), dims);
    let keep2 = 1.0 - smoothstep(0.35, 1.2, footprint * s2);
    slope += ocean_rot(d2.rg, -a2) * ocean_ext.amplitude * 0.4 * keep2;

    let a3 = 2.31;
    let s3 = 43.0;
    let d3 = ocean_bilinear(displacement_texture, ocean_rot(tile_uv, a3) * s3 + vec2<f32>(0.13, 0.87), dims);
    let keep3 = 1.0 - smoothstep(0.35, 1.2, footprint * s3);
    slope += ocean_rot(d3.rg, -a3) * ocean_ext.amplitude * 0.3 * keep3;

    let local_n = normalize(vec3<f32>(-slope.x, 1.0, -slope.y));

    var out: OceanShade;
    out.normal = mesh_normal_local_to_world(local_n, instance_index);

    // What the pixel can't resolve becomes roughness, so the far sea is a soft sheen and not sparkle.
    let lost = (1.0 - keep0) * 0.5 + (1.0 - keep1) * 0.12 + (1.0 - keep2) * 0.08;
    out.roughness = clamp(roughness + lost, 0.0, 1.0);

    // Crests are thinner water: a little light comes through them.
    let eta = d0.b * ocean_ext.amplitude;
    let lift = smoothstep(0.2, 2.4, eta);
    var color = base_color.rgb + vec3<f32>(0.0, 0.022, 0.026) * lift;

    let cov = ocean_bilinear(foam_mask_texture, tile_uv, dims).r;
    // Foam is lace, not paint: cells and wind-drawn streaks eat into it, the more the older it is.
    let along = ocean_rot(world_xz, -ocean_ext.wind_direction) * vec2<f32>(0.28, 1.0);
    let streak = ocean_noise(along * 2.3) * 0.55 + ocean_noise(along * 6.1 + vec2<f32>(9.0, 2.0)) * 0.45;
    let cells = ocean_noise(world_xz * 3.7) * 0.5 + ocean_noise(world_xz * 9.1 + vec2<f32>(17.0, 3.0)) * 0.3 + ocean_noise(world_xz * 27.0 + vec2<f32>(5.0, 41.0)) * 0.2;
    let body = cov * (0.5 + 0.55 * streak + 0.5 * cells);
    var foam = smoothstep(0.42, 0.95, body);
    // Water against the rock: a ring of churned white that breathes with the swell.
    let to_shore = length(world_xz - vec2<f32>(ocean_ext.shore_x, ocean_ext.shore_z)) - ocean_ext.shore_radius;
    let ring = 1.0 - smoothstep(0.0, max(ocean_ext.shore_width, 0.001), to_shore + (cells - 0.5) * ocean_ext.shore_width * 0.9);
    let churn = ring * (0.45 + 0.55 * smoothstep(-0.6, 1.2, eta)) * step(0.001, ocean_ext.shore_width);
    foam = max(foam, smoothstep(0.42, 0.9, churn * (0.3 + 0.75 * cells + 0.55 * streak)));
    foam = saturate(foam * ocean_ext.foam_intensity);
    color = mix(color, vec3<f32>(0.97, 0.98, 0.98), foam);
    out.roughness = mix(out.roughness, 0.95, foam);
    out.base_color = vec4<f32>(color, base_color.a);
    return out;
}

// `PREPASS_PIPELINE` is only set for actual prepass draw pipelines. The main mesh pipeline can still
// define `DEFERRED_PREPASS` (for example when sampling prepass normals) without
// `NORMAL_PREPASS_OR_DEFERRED_PREPASS`, in which case `prepass_io::VertexOutput` has no `world_normal`.
// Match Bevy's `prepass.wgsl`: use `prepass_io` only when `PREPASS_PIPELINE` is set, otherwise `forward_io`.

@vertex
fn vertex(vertex: Vertex) -> VertexOutput {
    let surf = ocean_displace_surface(vertex.instance_index, vertex.position, vertex.uv);

@if(PREPASS_PIPELINE && NORMAL_PREPASS_OR_DEFERRED_PREPASS) {
    var out: VertexOutput;
    out.position = surf.clip_position;
    out.world_position = surf.world_position;
@if(VERTEX_UVS_A)
    out.uv = surf.tile_uv;
@if(VERTEX_UVS_B)
    out.uv_b = vertex.uv_b;
    out.world_normal = surf.world_normal;
@if(VERTEX_OUTPUT_INSTANCE_INDEX)
    out.instance_index = vertex.instance_index;
@if(MOTION_VECTOR_PREPASS)
    out.previous_world_position = surf.world_position;
@if(VERTEX_COLORS)
    out.color = vertex.color;
@if(VISIBILITY_RANGE_DITHER)
    out.visibility_range_dither = get_visibility_range_dither_level(
        vertex.instance_index,
        get_world_from_local(vertex.instance_index)[3],
    );
    return out;
} @elif(PREPASS_PIPELINE) {
    var out: VertexOutput;
    out.position = surf.clip_position;
    out.world_position = surf.world_position;
@if(VERTEX_UVS_A)
    out.uv = surf.tile_uv;
@if(VERTEX_UVS_B)
    out.uv_b = vertex.uv_b;
@if(VERTEX_OUTPUT_INSTANCE_INDEX)
    out.instance_index = vertex.instance_index;
@if(MOTION_VECTOR_PREPASS)
    out.previous_world_position = surf.world_position;
@if(VERTEX_COLORS)
    out.color = vertex.color;
@if(UNCLIPPED_DEPTH_ORTHO_EMULATION) {
    out.unclipped_depth = surf.clip_position.z;
    out.position.z = min(out.position.z, 1.0);
}
@if(VISIBILITY_RANGE_DITHER)
    out.visibility_range_dither = get_visibility_range_dither_level(
        vertex.instance_index,
        get_world_from_local(vertex.instance_index)[3],
    );
    return out;
} @else {
    var out: VertexOutput;
    out.position = surf.clip_position;
    out.world_position = surf.world_position;
    out.world_normal = surf.world_normal;
@if(VERTEX_UVS_A)
    out.uv = surf.tile_uv;
@if(VERTEX_UVS_B)
    out.uv_b = vertex.uv_b;
@if(VERTEX_OUTPUT_INSTANCE_INDEX)
    out.instance_index = vertex.instance_index;
@if(VERTEX_COLORS)
    out.color = vertex.color;
@if(VISIBILITY_RANGE_DITHER)
    out.visibility_range_dither = get_visibility_range_dither_level(
        vertex.instance_index,
        get_world_from_local(vertex.instance_index)[3],
    );
    return out;
}
}

@if(!PREPASS_PIPELINE)
@fragment
fn fragment(in: FragVertexOutput, @builtin(front_facing) is_front: bool) -> FragmentOutput {
    var pbr_input = pbr_input_from_standard_material(in, is_front);
    pbr_input.material.base_color = alpha_discard(
        pbr_input.material.flags,
        pbr_input.material.alpha_cutoff,
        pbr_input.material.base_color
    );
@if(VERTEX_OUTPUT_INSTANCE_INDEX && VERTEX_UVS_A) {
    let double_sided =
        (pbr_input.material.flags & STANDARD_MATERIAL_FLAGS_DOUBLE_SIDED_BIT) != 0u;
    let shade = ocean_shade(in.instance_index, in.uv, in.world_position.xz, pbr_input.material.base_color, pbr_input.material.perceptual_roughness);
    pbr_input.world_normal = prepare_world_normal(shade.normal, double_sided, is_front);
    pbr_input.N = normalize(pbr_input.world_normal);
    pbr_input.material.base_color = shade.base_color;
    pbr_input.material.perceptual_roughness = shade.roughness;
}
    var out: FragmentOutput;
    if (pbr_input.material.flags & STANDARD_MATERIAL_FLAGS_UNLIT_BIT) == 0u {
        out.color = apply_pbr_lighting(pbr_input);
    } else {
        out.color = pbr_input.material.base_color;
    }
    out.color = main_pass_post_lighting_processing(pbr_input, out.color);
    return out;
}

@if(PREPASS_PIPELINE && PREPASS_FRAGMENT)
@fragment
fn fragment(in: FragVertexOutput, @builtin(front_facing) is_front: bool) -> FragmentOutput {
@if(!NORMAL_PREPASS_OR_DEFERRED_PREPASS) {
    var out: FragmentOutput;
@if(UNCLIPPED_DEPTH_ORTHO_EMULATION)
    out.frag_depth = in.position.z;
    return out;
} @else {
    var pbr_input = pbr_input_from_standard_material(in, is_front);
    pbr_input.material.base_color = alpha_discard(
        pbr_input.material.flags,
        pbr_input.material.alpha_cutoff,
        pbr_input.material.base_color
    );
@if(VERTEX_OUTPUT_INSTANCE_INDEX && VERTEX_UVS_A) {
    let double_sided =
        (pbr_input.material.flags & STANDARD_MATERIAL_FLAGS_DOUBLE_SIDED_BIT) != 0u;
    let shade = ocean_shade(in.instance_index, in.uv, in.world_position.xz, pbr_input.material.base_color, pbr_input.material.perceptual_roughness);
    pbr_input.world_normal = prepare_world_normal(shade.normal, double_sided, is_front);
    pbr_input.N = normalize(pbr_input.world_normal);
    pbr_input.material.base_color = shade.base_color;
    pbr_input.material.perceptual_roughness = shade.roughness;
}
@if(DEFERRED_PREPASS) {
    return deferred_output(in, pbr_input);
} @else {
    var out: FragmentOutput;
@if(NORMAL_PREPASS)
    out.normal = vec4<f32>(pbr_input.N * 0.5 + vec3<f32>(0.5), 1.0);
@if(MOTION_VECTOR_PREPASS)
    out.motion_vector = vec2<f32>(0.0);
@if(UNCLIPPED_DEPTH_ORTHO_EMULATION)
    out.frag_depth = in.position.z;
    return out;
}
}
}
