# observatory/bookshelf: the observatory's books: Poly Haven's wooden_bookshelf_worn (CC0), 2.06 m, with four of Poly
# Haven's book_encyclopedia_set_01 (CC0) stood on two of its shelves. No rig.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from mathutils import Vector

col, root, parts, credit = comp.ph_component("observatory", "bookshelf", "wooden_bookshelf_worn", res="2k")
case = list(parts.values())[0]
lo, hi = comp.box_of(case)
# find the shelves: the heights where the case has broad faces looking up
bm = bmesh.new()
bm.from_mesh(case.data)
levels = {}
for f in bm.faces:
    n = case.matrix_world.to_3x3() @ f.normal
    if n.z > 0.9:
        z = round((case.matrix_world @ f.calc_center_median()).z, 2)
        levels[z] = levels.get(z, 0) + f.calc_area()
bm.free()
shelves = sorted(z for z, a in levels.items() if a > 0.15 and z < hi.z - 0.2)
print("bookshelf shelves", shelves, "box", lo, hi)
c2 = ""
inner = (hi.x - lo.x) - 0.12
for k, z in enumerate([s for s in shelves if 0.5 < s < 1.7][:2]):
    for j in range(2):
        books, c2 = _lib.ph_into(col, root, "book_encyclopedia_set_01", f"bookshelf_books_{k + 1}_{j + 1}", at=((j - 0.5) * 0.58, (lo.y + hi.y) / 2 + 0.03, z + 0.002), res="1k")
        for b in books:                           # the set is 67 000 triangles: a quarter of that is plenty on a shelf
            d = b.modifiers.new("decimate", "DECIMATE")
            d.ratio = 0.25
comp.export(col, root, "observatory", "bookshelf", made="blender/components/observatory/bookshelf.py", source="https://polyhaven.com/a/wooden_bookshelf_worn with https://polyhaven.com/a/book_encyclopedia_set_01 on two shelves", license="CC0", credit=f"{credit}; {c2}")
