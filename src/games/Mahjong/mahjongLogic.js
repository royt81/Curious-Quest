// Mahjong Solitaire logic.
// Tile positions use half-tile units: a tile at (x, y) covers x..x+2 and y..y+2,
// so a value of 1 means "shifted by half a tile". z is the layer (0 = table).

function rect(x0, y0, cols, rows, z) {
  const out = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) out.push({ x: x0 + c * 2, y: y0 + r * 2, z })
  return out
}

// Small, kid-friendly layouts. Every layout has an even number of tiles.
export const LAYOUTS = {
  easy: {
    label: 'Easy', icon: '🐣',
    // pyramid 6×4 → 4×2 → 2, plus one "wing" tile on each side = 36 tiles
    positions: [
      ...rect(0, 0, 6, 4, 0),
      ...rect(2, 2, 4, 2, 1),
      ...rect(4, 3, 2, 1, 2),
      { x: -2, y: 3, z: 0 }, { x: 12, y: 3, z: 0 },
    ],
  },
  medium: {
    label: 'Medium', icon: '🦊',
    // 8×4 → 6×2 → 4, plus wings = 50 tiles
    positions: [
      ...rect(0, 0, 8, 4, 0),
      ...rect(2, 2, 6, 2, 1),
      ...rect(4, 3, 4, 1, 2),
      { x: -2, y: 3, z: 0 }, { x: 16, y: 3, z: 0 },
    ],
  },
  hard: {
    label: 'Hard', icon: '🐉',
    // dealt at random: like real Mahjong, a game can end with no way out
    random: true,
    // 8×6 → 6×4 → 4×2 → 2, plus wings = 84 tiles
    positions: [
      ...rect(0, 0, 8, 6, 0),
      ...rect(2, 2, 6, 4, 1),
      ...rect(4, 4, 4, 2, 2),
      ...rect(6, 5, 2, 1, 3),
      { x: -2, y: 5, z: 0 }, { x: 16, y: 5, z: 0 },
    ],
  },
}

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const overlaps = (a, b) => Math.abs(a.x - b.x) < 2 && Math.abs(a.y - b.y) < 2

// A tile is free when nothing lies on top of it and its left OR right side is open.
export function isFree(tile, tiles) {
  let left = false, right = false
  for (const o of tiles) {
    if (o === tile || o.removed) continue
    if (o.z === tile.z + 1 && overlaps(o, tile)) return false
    if (o.z === tile.z && Math.abs(o.y - tile.y) < 2) {
      if (o.x === tile.x - 2) left = true
      else if (o.x === tile.x + 2) right = true
    }
  }
  return !(left && right)
}

// Puts pictures on the given positions so the board can ALWAYS be cleared:
// it takes away random pairs of free tiles from the full board (like playing
// backwards) and gives both tiles of each pair the same picture.
// Returns an array of picture indexes (one per position), or null if it got stuck.
function tryDeal(positions, pairPictures) {
  const work = positions.map((p, i) => ({ ...p, i, removed: false }))
  const result = new Array(positions.length)
  let left = positions.length
  let pair = 0
  while (left > 0) {
    const free = shuffle(work.filter(t => !t.removed && isFree(t, work)))
    if (free.length < 2) return null
    const [a, b] = free
    result[a.i] = pairPictures[pair]
    result[b.i] = pairPictures[pair]
    a.removed = b.removed = true
    left -= 2
    pair++
  }
  return result
}

function randomDeal(positions, pairPictures) {
  return shuffle(positions.map((_, i) => pairPictures[i >> 1]))
}

export function deal(positions, pairPictures, random = false) {
  if (random) return randomDeal(positions, pairPictures)
  for (let attempt = 0; attempt < 200; attempt++) {
    const r = tryDeal(positions, pairPictures)
    if (r) return r
  }
  // practically never happens; fall back to a plain shuffle
  return randomDeal(positions, pairPictures)
}

// Builds a new board: [{ id, x, y, z, pic, removed }]
export function newBoard(layoutId, pictures) {
  const positions = LAYOUTS[layoutId].positions
  const pairs = positions.length / 2
  // one picture per pair when there are enough, otherwise pictures repeat
  let picks = shuffle(pictures)
  while (picks.length < pairs) picks = [...picks, ...shuffle(pictures)]
  const pairPictures = shuffle(picks.slice(0, pairs).map((_, i) => i))
  const assigned = deal(positions, pairPictures, !!LAYOUTS[layoutId].random)
  return {
    pictures: picks.slice(0, pairs),
    tiles: positions.map((p, i) => ({ id: i, ...p, pic: assigned[i], removed: false })),
  }
}

// New pictures for the tiles still on the board — in a way that can be cleared,
// unless `random` is set (Hard level).
export function reshuffle(tiles, random = false) {
  const rest = tiles.filter(t => !t.removed)
  const pics = rest.map(t => t.pic).sort((a, b) => a - b)
  const pairPictures = shuffle(Array.from({ length: pics.length / 2 }, (_, i) => pics[i * 2]))
  const assigned = deal(rest, pairPictures, random)
  const byId = Object.fromEntries(rest.map((t, i) => [t.id, assigned[i]]))
  return tiles.map(t => (t.removed ? t : { ...t, pic: byId[t.id] }))
}

// A pair of free tiles with the same picture, or null.
export function findPair(tiles) {
  const free = tiles.filter(t => !t.removed && isFree(t, tiles))
  const seen = {}
  for (const t of free) {
    if (seen[t.pic] !== undefined) return [seen[t.pic], t.id]
    seen[t.pic] = t.id
  }
  return null
}
