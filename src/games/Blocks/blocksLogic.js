// Calm Blocks — falling-block puzzle logic (no React here, easy to test).
// The board is a grid of rows; each cell is null or a colour index.

export const LEVELS = {
  easy: {
    label: 'Easy', icon: '🐣',
    cols: 8, rows: 14,
    fallMs: 1200,          // slow and steady
    // small, friendly shapes
    shapes: [
      [[1]],
      [[1, 1]],
      [[1, 1, 1]],
      [[1, 0], [1, 1]],
      [[1, 1], [1, 1]],
    ],
  },
  classic: {
    label: 'Classic', icon: '🦊',
    cols: 10, rows: 16,
    fallMs: 950,
    // the 7 classic four-block shapes
    shapes: [
      [[1, 1, 1, 1]],
      [[1, 1], [1, 1]],
      [[1, 1, 1], [0, 1, 0]],
      [[0, 1, 1], [1, 1, 0]],
      [[1, 1, 0], [0, 1, 1]],
      [[1, 0, 0], [1, 1, 1]],
      [[0, 0, 1], [1, 1, 1]],
    ],
  },
}

// Speeds up only a tiny bit: 4% per 10 rows, never faster than 60% of the start speed
export function fallDelay(level, rowsCleared) {
  const base = LEVELS[level].fallMs
  return Math.max(base * 0.6, base * (1 - 0.04 * Math.floor(rowsCleared / 10)))
}

export const emptyBoard = (cols, rows) => Array.from({ length: rows }, () => Array(cols).fill(null))

export function rotate(shape) {
  // clockwise: new[r][c] = old[h-1-c][r]
  const h = shape.length, w = shape[0].length
  return Array.from({ length: w }, (_, r) => Array.from({ length: h }, (_, c) => shape[h - 1 - c][r]))
}

export function collides(board, piece) {
  const { shape, x, y } = piece
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue
      const bx = x + c, by = y + r
      if (bx < 0 || bx >= board[0].length || by >= board.length) return true
      if (by >= 0 && board[by][bx] !== null) return true
    }
  }
  return false
}

// "Bag" randomiser: every shape comes once before any repeats — no long droughts
export function makeBag(count) {
  const a = Array.from({ length: count }, (_, i) => i)
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function spawn(level, kind, cols) {
  const shape = LEVELS[level].shapes[kind]
  return { kind, shape, x: Math.floor((cols - shape[0].length) / 2), y: 0 }
}

// Rotate with small "wall kicks" so a piece next to a wall still turns
export function tryRotate(board, piece) {
  const shape = rotate(piece.shape)
  for (const dx of [0, -1, 1, -2, 2, -3]) {   // -3: the long piece at the right wall
    const p = { ...piece, shape, x: piece.x + dx }
    if (!collides(board, p)) return p
  }
  return piece
}

export function tryMove(board, piece, dx, dy) {
  const p = { ...piece, x: piece.x + dx, y: piece.y + dy }
  return collides(board, p) ? null : p
}

// Where the piece would land (for the soft "shadow" preview)
export function dropPosition(board, piece) {
  let p = piece
  for (;;) {
    const next = tryMove(board, p, 0, 1)
    if (!next) return p
    p = next
  }
}

export function lockPiece(board, piece) {
  const b = board.map(row => [...row])
  piece.shape.forEach((row, r) => row.forEach((v, c) => {
    if (v && piece.y + r >= 0) b[piece.y + r][piece.x + c] = piece.kind
  }))
  return b
}

export function fullRows(board) {
  return board.map((row, i) => (row.every(v => v !== null) ? i : -1)).filter(i => i >= 0)
}

export function removeRows(board, rows) {
  const kept = board.filter((_, i) => !rows.includes(i))
  const cols = board[0].length
  return [...Array.from({ length: rows.length }, () => Array(cols).fill(null)), ...kept]
}
