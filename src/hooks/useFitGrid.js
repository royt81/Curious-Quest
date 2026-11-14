import useElementSize from './useElementSize'

// Finds the arrangement of `count` square tiles (e.g. 6×4, 4×6, 8×3) that makes
// the tiles as big as possible inside the measured element — so a board uses
// the whole screen whether the device is upright or sideways.
// Returns [ref, { cols, cell }]: put `ref` on the element that holds the board.
export default function useFitGrid(count, { gap = 8, maxCell = 220, minCols = 2, maxCols = 8 } = {}) {
  const [ref, { width: W, height: H }] = useElementSize()
  let best = { cols: Math.ceil(Math.sqrt(count)), cell: 80 }
  if (W && H) {
    let found = null
    for (let cols = minCols; cols <= maxCols; cols++) {
      if (count % cols) continue                      // only full rows
      const rows = count / cols
      const cell = Math.min((W - gap * (cols - 1)) / cols, (H - gap * (rows - 1)) / rows)
      if (!found || cell > found.cell) found = { cols, cell }
    }
    if (found) best = { cols: found.cols, cell: Math.max(30, Math.min(maxCell, Math.floor(found.cell))) }
  }
  return [ref, best]
}
