//! One component for a whole sea: put [`Sea`] on an entity and it becomes the FFT ocean's simulation, with a
//! surface mesh spawned under it. Every field may change frame to frame (a storm slider): the spectrum is
//! rebuilt from the same random numbers, so the sea swells instead of jumping.
//!
//! The surface is one mesh that tiles the periodic patch by position: fine in the middle (`dense` metres
//! across), then growing cells out to `extent`, so the horizon is water without millions of vertices.

use bevy::{
    asset::RenderAssetUsages,
    material::OpaqueRendererMethod,
    mesh::{Indices, PrimitiveTopology},
    pbr::StandardMaterial,
    prelude::*,
};

use super::render::{sync_ocean_dynamic_uniform, sync_ocean_foam_uniform};
use crate::prelude::*;

#[derive(Component, Clone, Reflect)]
#[reflect(Component, Default)]
pub struct Sea {
    /// Half-width of the water (m): the surface reaches this far from the entity in X and Z.
    pub extent: f32,
    /// Width of the finely meshed middle (m).
    pub dense: f32,
    /// Vertices along one edge of the surface mesh.
    pub vertices: u32,
    /// FFT grid size (a power of two).
    pub grid: u32,
    /// The periodic patch's edge (m). Keep it above the dominant wavelength (about 0.85 * wind_speed^2 m).
    pub tile: f32,
    pub wind_speed: f32,
    /// Radians on XZ.
    pub wind_direction: f32,
    pub directional_spread: f32,
    pub peak_enhancement: f32,
    /// Multiplier on the spectrum's own sea state (1 is nominal for the wind).
    pub amplitude: f32,
    pub choppiness: f32,
    pub time_scale: f32,
    /// Seconds of sea time; below zero, the app's clock runs it.
    pub time: f32,
    pub foam_intensity: f32,
    pub foam_cutoff: f32,
    pub foam_falloff: f32,
    pub foam_trail_decay: f32,
    /// Water colour, linear RGB.
    pub color: Vec3,
    pub roughness: f32,
    pub reflectance: f32,
    /// Distance from the entity where waves start to flatten, and where they are flat.
    pub fade_near: f32,
    pub fade_far: f32,
    /// A rock standing in the water: x, z, radius and the width of the churned foam around it (0 for none).
    pub shore: Vec4,
}

impl Default for Sea {
    fn default() -> Self {
        Self {
            extent: 3000.0,
            dense: 160.0,
            vertices: 768,
            grid: 1024,
            tile: 512.0,
            wind_speed: 12.0,
            wind_direction: 0.0,
            directional_spread: 0.0,
            peak_enhancement: 3.3,
            amplitude: 1.0,
            choppiness: 0.6,
            time_scale: 1.0,
            time: -1.0,
            foam_intensity: 0.65,
            foam_cutoff: 0.88,
            foam_falloff: 0.22,
            foam_trail_decay: 0.94,
            color: Vec3::new(0.012, 0.03, 0.045),
            roughness: 0.1,
            reflectance: 0.5,
            fade_near: 1200.0,
            fade_far: 2800.0,
            shore: Vec4::ZERO,
        }
    }
}

/// The surface entity of a [`Sea`].
#[derive(Component)]
pub struct SeaSurface(pub Entity);

/// What a [`Sea`]'s mesh was built for, so a change in shape rebuilds it.
#[derive(Component, PartialEq, Clone, Copy)]
struct SeaShape {
    extent: f32,
    dense: f32,
    vertices: u32,
}

pub struct SeaPlugin;

impl Plugin for SeaPlugin {
    fn build(&self, app: &mut App) {
        if !app.is_plugin_added::<FftPlugin>() {
            app.add_plugins(FftPlugin);
        }
        if !app.is_plugin_added::<OceanPlugin>() {
            app.add_plugins(OceanPlugin);
        }
        app.register_type::<Sea>()
            .add_systems(Update, sea_begin.before(FftSystemSet::PrepareTextures))
            .add_systems(
                Update,
                (
                    sea_settings.before(super::render::sync_ocean_h0_uniform),
                    sea_surface.after(super::render::prepare_ocean_foam_mask_image),
                    sea_material
                        .after(sea_surface)
                        .before(sync_ocean_foam_uniform),
                    sea_time.after(sync_ocean_dynamic_uniform),
                ),
            );
    }
}

fn settings_of(sea: &Sea) -> OceanSimSettings {
    OceanSimSettings {
        texture_size: sea.grid,
        tile_size: sea.tile,
        wind_direction: sea.wind_direction,
        wind_speed: sea.wind_speed,
        peak_enhancement: sea.peak_enhancement,
        directional_spread: sea.directional_spread,
        amplitude_scale: sea.amplitude,
        time_scale: sea.time_scale,
        ..default()
    }
}

fn uniform_of(sea: &Sea) -> OceanMaterialUniform {
    OceanMaterialUniform {
        // The spectrum already carries `amplitude`; the surface draws it as simulated.
        amplitude: 1.0,
        choppiness: sea.choppiness,
        ocean_tile_world_size: sea.tile,
        grid_size: sea.grid as f32,
        wind_direction: sea.wind_direction,
        foam_intensity: sea.foam_intensity,
        foam_cutoff: sea.foam_cutoff,
        foam_falloff: sea.foam_falloff,
        foam_trail_decay: sea.foam_trail_decay,
        fade_near: sea.fade_near,
        fade_far: sea.fade_far,
        shore_x: sea.shore.x,
        shore_z: sea.shore.y,
        shore_radius: sea.shore.z,
        shore_width: sea.shore.w,
    }
}

fn sea_begin(mut commands: Commands, seas: Query<(Entity, &Sea), Without<FftSource>>) {
    for (entity, sea) in &seas {
        commands.entity(entity).insert((
            FftSource::square_inverse_only(sea.grid),
            settings_of(sea),
            OceanH0Uniform::default(),
            OceanDynamicUniform::default(),
            OceanFoamUniform::default(),
            OceanFoamPhase(0),
        ));
    }
}

fn sea_settings(mut seas: Query<(&Sea, &mut OceanSimSettings), Changed<Sea>>) {
    for (sea, mut settings) in &mut seas {
        *settings = settings_of(sea);
    }
}

/// Coordinates along one edge: even cells across the dense middle, then cells that grow out to the extent.
fn edge(sea: &Sea) -> Vec<f32> {
    let n = sea.vertices.max(8) as usize;
    let half_dense = (sea.dense * 0.5).min(sea.extent);
    let inner = (n * 6 / 10).max(2);
    let outer = (n - inner) / 2;
    let step = sea.dense.min(sea.extent * 2.0) / (inner - 1) as f32;
    let ratio = if outer > 0 && sea.extent > half_dense {
        (sea.extent / half_dense).powf(1.0 / outer as f32)
    } else {
        1.0
    };
    let mut xs = Vec::with_capacity(inner + 2 * outer);
    for i in (1..=outer).rev() {
        xs.push(-half_dense * ratio.powi(i as i32));
    }
    for i in 0..inner {
        xs.push(-half_dense + step * i as f32);
    }
    for i in 1..=outer {
        xs.push(half_dense * ratio.powi(i as i32));
    }
    xs
}

fn surface_mesh(sea: &Sea) -> Mesh {
    let xs = edge(sea);
    let n = xs.len();
    let mut positions = Vec::with_capacity(n * n);
    let mut normals = Vec::with_capacity(n * n);
    let mut uvs = Vec::with_capacity(n * n);
    for &z in &xs {
        for &x in &xs {
            positions.push([x, 0.0, z]);
            normals.push([0.0, 1.0, 0.0]);
            uvs.push([x / sea.tile + 0.5, z / sea.tile + 0.5]);
        }
    }
    let mut indices = Vec::with_capacity((n - 1) * (n - 1) * 6);
    for j in 0..n - 1 {
        for i in 0..n - 1 {
            let a = (j * n + i) as u32;
            let b = a + 1;
            let c = a + n as u32;
            let d = c + 1;
            indices.extend_from_slice(&[a, c, b, b, c, d]);
        }
    }
    Mesh::new(
        PrimitiveTopology::TriangleList,
        RenderAssetUsages::default(),
    )
    .with_inserted_attribute(Mesh::ATTRIBUTE_POSITION, positions)
    .with_inserted_attribute(Mesh::ATTRIBUTE_NORMAL, normals)
    .with_inserted_attribute(Mesh::ATTRIBUTE_UV_0, uvs)
    .with_inserted_indices(Indices::U32(indices))
}

#[allow(clippy::type_complexity)]
fn sea_surface(
    mut commands: Commands,
    mut meshes: ResMut<Assets<Mesh>>,
    mut materials: ResMut<Assets<OceanSurfaceMaterial>>,
    seas: Query<(Entity, &Sea, &FftTextures, &OceanFoamMask, Option<&SeaShape>)>,
    surfaces: Query<(Entity, &SeaSurface)>,
) {
    for (entity, sea, textures, foam, shape) in &seas {
        let want = SeaShape {
            extent: sea.extent,
            dense: sea.dense,
            vertices: sea.vertices,
        };
        if shape == Some(&want) {
            continue;
        }
        for (surface, of) in &surfaces {
            if of.0 == entity {
                commands.entity(surface).despawn();
            }
        }
        let material = OceanSurfaceMaterial {
            base: StandardMaterial {
                base_color: Color::linear_rgb(sea.color.x, sea.color.y, sea.color.z),
                perceptual_roughness: sea.roughness,
                reflectance: sea.reflectance,
                metallic: 0.0,
                opaque_render_method: OpaqueRendererMethod::Auto,
                ..default()
            },
            extension: OceanSurfaceExtension {
                settings: uniform_of(sea),
                displacement: textures.spatial_output.clone(),
                foam_mask: foam.texture_a.clone(),
            },
        };
        let surface = commands
            .spawn((
                Mesh3d(meshes.add(surface_mesh(sea))),
                MeshMaterial3d(materials.add(material)),
                Transform::default(),
                bevy::camera::visibility::NoFrustumCulling,
                bevy::light::NotShadowCaster,
                OceanSurfaceTag,
                SeaSurface(entity),
            ))
            .id();
        commands.entity(entity).add_child(surface).insert(want);
    }
}

fn sea_material(
    seas: Query<&Sea, Changed<Sea>>,
    surfaces: Query<(&SeaSurface, &MeshMaterial3d<OceanSurfaceMaterial>)>,
    mut materials: ResMut<Assets<OceanSurfaceMaterial>>,
) {
    for (of, handle) in &surfaces {
        let Ok(sea) = seas.get(of.0) else {
            continue;
        };
        let Some(mut material) = materials.get_mut(&handle.0) else {
            continue;
        };
        material.extension.settings = uniform_of(sea);
        material.base.base_color = Color::linear_rgb(sea.color.x, sea.color.y, sea.color.z);
        material.base.perceptual_roughness = sea.roughness;
        material.base.reflectance = sea.reflectance;
    }
}

fn sea_time(mut seas: Query<(&Sea, &mut OceanDynamicUniform)>) {
    for (sea, mut dynamic) in &mut seas {
        if sea.time >= 0.0 {
            dynamic.elapsed_seconds = sea.time * sea.time_scale;
        }
    }
}
