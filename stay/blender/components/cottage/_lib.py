# cottage/_lib: the garden door's cottage (the director, 11-11: "for the garden greenhouse building on the path we shoudl try to
# rebuild and redesign it as a cottage with crafstman style and ivy/vines, flowwers"). Every cottage component reads
# its sizes from here, so the ivy grows on the walls the house has and the flowers stand in its boxes.
#
# A Craftsman bungalow, low and wide, one storey (from 8 m back the frame shows 5.5 m of height at the wall, so the
# whole house and sky over it are seen as we come up the path):
#   - a side-gabled roof at 25 degrees with deep eaves, exposed rafter tails, purlins and knee braces under the rakes;
#   - a front-gabled porch at 30 degrees on two tapered columns standing on stacked-stone piers, a brick floor and a
#     beadboard ceiling, the front door under it;
#   - walls of sage-stained cedar shingles over a stacked-stone base, cream trim, oxblood 3-over-1 sashes in pairs,
#     window boxes; a stone chimney on the left side.
# Blender frame: z up, the front toward -y (raea +z). The origin is the front door's sill, on the wall's line: in the
# film the house stands at raea [0, 0, -RZ], where the walk's door has always been, and the door (cottage/door) hangs
# on the same hinge as the rooms' doors (sets/rooms.ts DOOR.hinge), so the take's line and the doorway don't move.
import math

PITCH = math.radians(25)            # the main roof
PPITCH = math.radians(30)           # the porch's gable
TAN, PTAN = math.tan(PITCH), math.tan(PPITCH)

FRONT = -0.10                       # the front wall's shingle face (y)
BACK = 6.90                         # the back wall's shingle face
XL, XR = -3.90, 3.90                # the side walls' shingle faces
CORE = 0.20                         # the wall's core behind the shingles (to its inside face)
PLATE = 2.75                        # the walls' top
BASE = 0.45                         # the stone base's top
STONE_OUT = 0.04                    # how far the stone base stands proud of the shingles
FRIEZE = 0.24                       # the frieze board under the eaves
HEEL = 0.20                         # the roof's top surface above the plate, at the wall's line
RIDGE_Y = (FRONT + BACK) / 2
EAVE = 0.60                         # the eaves' overhang (front and back)
RAKE = 0.50                         # the rakes' overhang (the gable ends)
ROOF_T = 0.07                       # the roof's thickness (sheathing and shingles)
ROOF_DZ = ROOF_T / math.cos(PITCH)  # (its thickness measured plumb)


def roof_z(y):
    """the main roof's top surface over y (front or back slope)"""
    d = (y - FRONT) if y <= RIDGE_Y else (BACK - y)
    return PLATE + HEEL + d * TAN


RIDGE_Z = roof_z(RIDGE_Y)

# the door's opening (sets/rooms.ts DOOR: 0.95 x 2.08, the hinge 3 cm in front of the wall's line)
DOOR_W, DOOR_H = 0.95, 2.08
HINGE = (-0.475, -0.03, 0.0)

# the porch: piers and columns at its front corners, its roof's gable over the front beam
PX = 1.68                           # the columns' x (either side)
PY = -1.95                          # the columns' y
PIER, PIER_H = 0.56, 0.95           # the stone piers' width and height
COL_B, COL_T = 0.34, 0.22           # the columns' width at the foot and the head
BEAM_B, BEAM_T = 2.42, 2.78         # the beams' bottom and top
P_EAVE = 2.45                       # the porch roof's eaves (|x|)
P_FRONT = -2.38                     # its front rake (y)
P_HEEL = 3.00                       # its top surface at |x| = 2.0


def porch_z(x):
    return P_HEEL + (2.0 - abs(x)) * PTAN


P_RIDGE = porch_z(0.0)
# (the porch's roof runs back until its ridge dies into the main roof's slope)
P_BACK = FRONT + (P_RIDGE - PLATE - HEEL) / TAN

# windows: (wall, centre along the wall, width, sill, head, panes) where wall is "front", "back", "left", "right"
# and the centre is x for front/back and y for the sides; panes is how many sashes side by side (a pair or one)
SILL, HEAD = 0.92, 2.22
WINDOWS = [
    ("front", -2.93, 1.36, SILL, HEAD, 2),
    ("front", 2.93, 1.36, SILL, HEAD, 2),
    ("front", -1.22, 0.62, SILL, HEAD, 1),
    ("left", 1.0, 0.62, SILL, HEAD, 1),
    ("left", 5.4, 1.36, SILL, HEAD, 2),
    ("right", 1.6, 1.36, SILL, HEAD, 2),
    ("right", 5.2, 0.62, SILL, HEAD, 1),
    ("back", -1.8, 1.36, SILL, HEAD, 2),
    ("back", 2.2, 0.62, SILL, HEAD, 1),
]
CASE = 0.11                         # the casings' width
CASE_OUT = 0.025                    # how far the casings stand proud of the shingles
BOX_Z = (0.57, 0.80)                # the window boxes' bottom and top

# the chimney on the left side wall
CHIM_Y = (2.65, 4.05)               # its base's extent along the wall
CHIM_OUT = 0.62                     # how far it stands out of the wall
CHIM_STACK = (2.95, 3.75)           # the stack's extent, above the shoulder
CHIM_SHOULDER = 2.30
CHIM_TOP = 5.35


def wall_frame(wall):
    """a wall's frame: (origin, along, outward normal, length) with the origin at its left end as seen from outside,
    on its shingle face at z 0"""
    if wall == "front":
        return (XL, FRONT, 0.0), (1, 0, 0), (0, -1, 0), XR - XL
    if wall == "back":
        return (XR, BACK, 0.0), (-1, 0, 0), (0, 1, 0), XR - XL
    if wall == "left":
        return (XL, BACK, 0.0), (0, -1, 0), (-1, 0, 0), BACK - FRONT
    return (XR, FRONT, 0.0), (0, 1, 0), (1, 0, 0), BACK - FRONT


def along(wall, c):
    """a window's centre (x for front and back, y for the sides) as the distance along its wall from the left end"""
    o, a, n, L = wall_frame(wall)
    return (c - o[0]) * a[0] + (c - o[1]) * a[1]


def at(wall, u, z, out=0.0):
    """the world point u along a wall, at height z, `out` metres off its shingle face"""
    o, a, n, L = wall_frame(wall)
    return (o[0] + a[0] * u + n[0] * out, o[1] + a[1] * u + n[1] * out, z)


def holes(wall):
    """the openings in a wall, as (u0, u1, z0, z1) along it"""
    out = []
    for w, c, wd, s, h, _ in WINDOWS:
        if w == wall:
            u = along(wall, c)
            out.append((u - wd / 2, u + wd / 2, s, h))
    if wall == "front":
        u = along("front", 0.0)
        out.append((u - DOOR_W / 2, u + DOOR_W / 2, 0.0, DOOR_H))
    return out


def gable_top(wall, u):
    """the top of a wall's shingles at u: the plate on the front and back, the roof's underside on the gable ends"""
    if wall in ("front", "back"):
        return PLATE - FRIEZE
    y = at(wall, u, 0)[1]
    return roof_z(y) - ROOF_DZ - 0.03
