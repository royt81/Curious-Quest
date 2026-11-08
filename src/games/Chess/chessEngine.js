// ─── Chess engine ─────────────────────────────────────────────────────────────
// Full rules: all piece moves, castling, en passant, pawn promotion (auto-queen),
// and check / checkmate / stalemate detection.
//
// Board: 8×8 array, row 0 = top (Black home), row 7 = bottom (White home).
// Each cell is null or { side:'w'|'b', type:'p'|'n'|'b'|'r'|'q'|'k', moved:bool }.
// White = human (bottom, moves up / row decreases). Black = computer (top).

export const SIZE = 8
export const WHITE = 'w'
export const BLACK = 'b'

export const inBounds = (r, c) => r >= 0 && r < SIZE && c >= 0 && c < SIZE
export const clone = (b) => b.map(row => row.map(cell => (cell ? { ...cell } : null)))
const opp = (s) => (s === WHITE ? BLACK : WHITE)

export function makeInitialBoard() {
  const b = Array.from({ length: SIZE }, () => Array(SIZE).fill(null))
  const back = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r']
  for (let c = 0; c < SIZE; c++) {
    b[0][c] = { side: BLACK, type: back[c], moved: false }
    b[1][c] = { side: BLACK, type: 'p', moved: false }
    b[6][c] = { side: WHITE, type: 'p', moved: false }
    b[7][c] = { side: WHITE, type: back[c], moved: false }
  }
  return b
}

const KNIGHT_D = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]
const KING_D   = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]
const ROOK_D   = [[-1, 0], [1, 0], [0, -1], [0, 1]]
const BISHOP_D = [[-1, -1], [-1, 1], [1, -1], [1, 1]]

// Is square (tr,tc) attacked by `bySide`? (ignores pins/castling — used for check tests)
export function isAttacked(board, tr, tc, bySide) {
  // pawns: a bySide pawn attacks diagonally forward
  const pawnDir = bySide === WHITE ? -1 : 1 // white pawns move up (toward row 0)
  for (const dc of [-1, 1]) {
    const pr = tr - pawnDir, pc = tc + dc
    if (inBounds(pr, pc)) {
      const p = board[pr][pc]
      if (p && p.side === bySide && p.type === 'p') return true
    }
  }
  // knights
  for (const [dr, dc] of KNIGHT_D) {
    const r = tr + dr, c = tc + dc
    if (inBounds(r, c)) {
      const p = board[r][c]
      if (p && p.side === bySide && p.type === 'n') return true
    }
  }
  // king (adjacent)
  for (const [dr, dc] of KING_D) {
    const r = tr + dr, c = tc + dc
    if (inBounds(r, c)) {
      const p = board[r][c]
      if (p && p.side === bySide && p.type === 'k') return true
    }
  }
  // sliding: rook/queen orthogonal
  for (const [dr, dc] of ROOK_D) {
    let r = tr + dr, c = tc + dc
    while (inBounds(r, c)) {
      const p = board[r][c]
      if (p) {
        if (p.side === bySide && (p.type === 'r' || p.type === 'q')) return true
        break
      }
      r += dr; c += dc
    }
  }
  // sliding: bishop/queen diagonal
  for (const [dr, dc] of BISHOP_D) {
    let r = tr + dr, c = tc + dc
    while (inBounds(r, c)) {
      const p = board[r][c]
      if (p) {
        if (p.side === bySide && (p.type === 'b' || p.type === 'q')) return true
        break
      }
      r += dr; c += dc
    }
  }
  return false
}

export function findKing(board, side) {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      const p = board[r][c]
      if (p && p.side === side && p.type === 'k') return [r, c]
    }
  return null
}

export function inCheck(board, side) {
  const k = findKing(board, side)
  if (!k) return false
  return isAttacked(board, k[0], k[1], opp(side))
}

// Pseudo-legal moves for the piece at (r,c) — does NOT check whether the mover's
// own king is left in check. `enPassant` is the target square [r,c] or null.
function pseudoMoves(board, r, c, enPassant) {
  const piece = board[r][c]
  if (!piece) return []
  const out = []
  const side = piece.side
  const add = (tr, tc, extra = {}) => out.push({ from: [r, c], to: [tr, tc], ...extra })

  const slide = (dirs) => {
    for (const [dr, dc] of dirs) {
      let nr = r + dr, nc = c + dc
      while (inBounds(nr, nc)) {
        const t = board[nr][nc]
        if (!t) add(nr, nc, { capture: null })
        else {
          if (t.side !== side) add(nr, nc, { capture: [nr, nc] })
          break
        }
        nr += dr; nc += dc
      }
    }
  }

  switch (piece.type) {
    case 'p': {
      const dir = side === WHITE ? -1 : 1
      const startRow = side === WHITE ? 6 : 1
      const promoRow = side === WHITE ? 0 : 7
      const one = r + dir
      if (inBounds(one, c) && !board[one][c]) {
        if (one === promoRow) add(one, c, { capture: null, promote: true })
        else add(one, c, { capture: null })
        const two = r + dir * 2
        if (r === startRow && !board[two][c]) add(two, c, { capture: null, double: true })
      }
      for (const dc of [-1, 1]) {
        const nr = r + dir, nc = c + dc
        if (!inBounds(nr, nc)) continue
        const t = board[nr][nc]
        if (t && t.side !== side) {
          if (nr === promoRow) add(nr, nc, { capture: [nr, nc], promote: true })
          else add(nr, nc, { capture: [nr, nc] })
        } else if (!t && enPassant && enPassant[0] === nr && enPassant[1] === nc) {
          add(nr, nc, { capture: [r, nc], enPassant: true })
        }
      }
      break
    }
    case 'n':
      for (const [dr, dc] of KNIGHT_D) {
        const nr = r + dr, nc = c + dc
        if (!inBounds(nr, nc)) continue
        const t = board[nr][nc]
        if (!t) add(nr, nc, { capture: null })
        else if (t.side !== side) add(nr, nc, { capture: [nr, nc] })
      }
      break
    case 'b': slide(BISHOP_D); break
    case 'r': slide(ROOK_D); break
    case 'q': slide([...ROOK_D, ...BISHOP_D]); break
    case 'k': {
      for (const [dr, dc] of KING_D) {
        const nr = r + dr, nc = c + dc
        if (!inBounds(nr, nc)) continue
        const t = board[nr][nc]
        if (!t) add(nr, nc, { capture: null })
        else if (t.side !== side) add(nr, nc, { capture: [nr, nc] })
      }
      // Castling
      if (!piece.moved && !isAttacked(board, r, c, opp(side))) {
        // king-side (rook at col 7)
        const rookK = board[r][7]
        if (rookK && rookK.type === 'r' && rookK.side === side && !rookK.moved &&
            !board[r][5] && !board[r][6] &&
            !isAttacked(board, r, 5, opp(side)) && !isAttacked(board, r, 6, opp(side))) {
          add(r, 6, { capture: null, castle: 'k' })
        }
        // queen-side (rook at col 0)
        const rookQ = board[r][0]
        if (rookQ && rookQ.type === 'r' && rookQ.side === side && !rookQ.moved &&
            !board[r][1] && !board[r][2] && !board[r][3] &&
            !isAttacked(board, r, 3, opp(side)) && !isAttacked(board, r, 2, opp(side))) {
          add(r, 2, { capture: null, castle: 'q' })
        }
      }
      break
    }
    default: break
  }
  return out
}

// Apply a move to a board copy. Returns { board, captured, promoted, castle }.
// Promotion auto-queens.
export function applyMove(board, move) {
  const b = clone(board)
  const [fr, fc] = move.from
  const [tr, tc] = move.to
  const piece = { ...b[fr][fc], moved: true }
  let captured = !!move.capture

  if (move.capture) {
    const [cr, cc] = move.capture
    b[cr][cc] = null
  }
  b[fr][fc] = null

  if (move.promote) piece.type = 'q'
  b[tr][tc] = piece

  if (move.castle === 'k') {
    const rook = { ...b[tr][7], moved: true }
    b[tr][7] = null
    b[tr][5] = rook
  } else if (move.castle === 'q') {
    const rook = { ...b[tr][0], moved: true }
    b[tr][0] = null
    b[tr][3] = rook
  }

  return { board: b, captured, promoted: !!move.promote, castle: move.castle || null }
}

// All fully-legal moves for `side` given the current `enPassant` target.
export function legalMoves(board, side, enPassant = null) {
  const out = []
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const p = board[r][c]
      if (!p || p.side !== side) continue
      for (const m of pseudoMoves(board, r, c, enPassant)) {
        const { board: nb } = applyMove(board, m)
        if (!inCheck(nb, side)) out.push(m)
      }
    }
  }
  return out
}

export function legalMovesForPiece(board, r, c, side, enPassant = null) {
  const p = board[r][c]
  if (!p || p.side !== side) return []
  const out = []
  for (const m of pseudoMoves(board, r, c, enPassant)) {
    const { board: nb } = applyMove(board, m)
    if (!inCheck(nb, side)) out.push(m)
  }
  return out
}

// Neither side can ever checkmate: K v K, K+B v K, K+N v K.
export function insufficientMaterial(board) {
  const extra = []
  for (const row of board) for (const p of row) if (p && p.type !== 'k') extra.push(p.type)
  return extra.length === 0 || (extra.length === 1 && (extra[0] === 'b' || extra[0] === 'n'))
}

// 'checkmate' | 'stalemate' | 'insufficient' | null
export function gameStatus(board, side, enPassant = null) {
  if (insufficientMaterial(board)) return 'insufficient'
  const moves = legalMoves(board, side, enPassant)
  if (moves.length > 0) return null
  return inCheck(board, side) ? 'checkmate' : 'stalemate'
}

// The en-passant target square produced by a move (or null).
export function enPassantTargetAfter(move) {
  if (!move.double) return null
  const [fr, fc] = move.from
  const [tr] = move.to
  return [(fr + tr) / 2, fc]
}

// ─── Easy AI ────────────────────────────────────────────────────────────────
// Prefers captures (weighted by victim value), otherwise a random legal move.
const VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

export function pickAIMove(board, side, enPassant = null) {
  const moves = legalMoves(board, side, enPassant)
  if (moves.length === 0) return null
  const captures = moves.filter(m => m.capture)
  if (captures.length) {
    // grab the best available capture (highest victim value), ties broken randomly
    let best = -1
    const pool = []
    for (const m of captures) {
      const [cr, cc] = m.capture
      const victim = board[cr][cc]
      const v = victim ? VALUE[victim.type] : 0
      if (v > best) { best = v; pool.length = 0; pool.push(m) }
      else if (v === best) pool.push(m)
    }
    return pool[Math.floor(Math.random() * pool.length)]
  }
  return moves[Math.floor(Math.random() * moves.length)]
}

export const GLYPH = {
  w: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
}

// Maps engine piece types to the file names in /public/chess-pieces.
// Set 1 (gold/yellow) = White, Set 2 (blue) = Black.
const PIECE_FILE = { k: 'king', q: 'queen', r: 'tower', b: 'bishop', n: 'knight', p: 'pawn' }
export const PIECE_IMG = {
  w: Object.fromEntries(Object.entries(PIECE_FILE).map(([t, f]) => [t, `/chess-pieces/${f}-1.svg`])),
  b: Object.fromEntries(Object.entries(PIECE_FILE).map(([t, f]) => [t, `/chess-pieces/${f}-dark.svg`])),
}

export const NAME = { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' }
