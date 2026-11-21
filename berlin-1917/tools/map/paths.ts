// Where a slice's inputs and products live (the TypeScript side of slicevars.sh). A city sheet shares one tile cache,
// and one with no survey of its own takes the scan offset measured on another slice (`align`, as trace.sh reads it).
export async function slicePaths(path: string) {
  const slice = await Bun.file(path).json();
  const root = `${import.meta.dir}/../..`;
  const cache = `${root}/cache/${slice.cache ?? slice.name}`;
  const own = slice.cache ? `${cache}/sheets/${slice.name}` : cache;
  const map = `${root}/${slice.out ?? "map/1917"}`;
  const align = slice.align ? `${import.meta.dir}/${slice.align}` : `${own}/align_straube_alkis.json`;
  return { slice, root, cache, own, map, align };
}
