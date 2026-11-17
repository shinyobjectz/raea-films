# lighthouse/fence-run: a plain 10.8 m run of the same white post-and-rail fence (seven posts, three rails), to carry
# lighthouse/fence on along the cliff edge: copies end to end, each turned to follow the edge. Its origin is its left
# end's foot. No rig. Built by fence.py's own shapes.
import os, sys
os.environ["FENCE_RUN"] = "1"
here = os.path.dirname(os.path.abspath(__file__))
exec(compile(open(os.path.join(here, "fence.py")).read(), os.path.join(here, "fence.py"), "exec"))
