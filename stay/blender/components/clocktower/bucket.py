# clocktower/bucket: a coopered wooden bucket with a rope handle (Poly Haven's wooden_bucket_01, CC0), standing on the floor at the origin.
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("clocktower", "bucket", "wooden_bucket_01", res="1k", origin="floor", turn=0)
lo, hi = comp.box_of(list(parts.values()))
print("parts", {k: [round(v, 3) for v in o.dimensions] for k, o in parts.items()})
comp.export(col, root, "clocktower", "bucket", made="blender/components/clocktower/bucket.py",
            source="https://polyhaven.com/a/wooden_bucket_01", license="CC0", credit=credit)
