import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import { playTap } from '../../sound/sfx'
import './GameOfLife.css'
import { useT, tr } from '../../i18n'

/* ════════════════════════════════════════════════════════════════════════════
   CONWAY'S GAME OF LIFE — the famous "no-player" cellular automaton.
   Tap cells to bring them to life, press Play, and watch them grow and fade by
   four simple rules:
     • A living cell with 2 or 3 living neighbours survives.
     • A living cell with fewer than 2 (lonely) or more than 3 (crowded) dies.
     • A dead cell with exactly 3 living neighbours comes to life.
   Single-player sandbox — no opponent, just patterns to discover.
   ════════════════════════════════════════════════════════════════════════════ */

const ROWS = 30   // 40 × 30 (same 4:3 shape as before) so the Glider Gun (36 wide) fits
const COLS = 40

// Normal is calm enough to follow each step; fast-forward to see where it goes.
const SPEEDS = [
  { id: 'normal', label: 'Normal',       emoji: '▶️', ms: 600 },
  { id: 'ff',     label: 'Fast forward', emoji: '⏩', ms: 280 },
  { id: 'ff2',    label: '×2',           emoji: '⏩⏩', ms: 140 },
]

// ── Grid helpers ─────────────────────────────────────────────────────────────
function emptyGrid() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(false))
}

function randomGrid() {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => Math.random() < 0.28))
}

// Count the 8 living neighbours of (r, c). Edges are treated as dead (no wrap).
function liveNeighbours(grid, r, c) {
  let n = 0
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const rr = r + dr
      const cc = c + dc
      if (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && grid[rr][cc]) n++
    }
  }
  return n
}

// Pure: compute the next generation from the four Conway rules.
function nextGen(grid) {
  return grid.map((row, r) =>
    row.map((alive, c) => {
      const n = liveNeighbours(grid, r, c)
      return alive ? (n === 2 || n === 3) : n === 3
    }))
}

function countAlive(grid) {
  let n = 0
  for (const row of grid) for (const cell of row) if (cell) n++
  return n
}

// A compact fingerprint of a board, used to spot "nothing changes" and loops.
const gridKey = (grid) => grid.map(row => row.map(c => (c ? '1' : '0')).join('')).join('')

// How many generations a repeating pattern may keep looping before we pause.
const LOOP_GRACE = 8
const HISTORY = 40

// ── The four rules, each shown as a tiny 3×3 before → after picture ──────────
// 1 = alive, 0 = empty. Only the MIDDLE cell changes; the ring is its neighbours.
const RULES = [
  { emoji: '😢', title: 'Too lonely', text: 'A living cell with 0 or 1 neighbours dies.',
    before: [0,0,0, 0,1,0, 0,0,1], after: [0,0,0, 0,0,0, 0,0,1] },
  { emoji: '😊', title: 'Just right', text: 'A living cell with 2 or 3 neighbours stays alive.',
    before: [1,0,0, 0,1,0, 0,0,1], after: [1,0,0, 0,1,0, 0,0,1] },
  { emoji: '😫', title: 'Too crowded', text: 'A living cell with 4 or more neighbours dies.',
    before: [1,1,0, 1,1,0, 0,1,1], after: [1,1,0, 1,0,0, 0,1,1] },
  { emoji: '🐣', title: 'A new cell is born', text: 'An empty square with exactly 3 neighbours comes to life.',
    before: [1,0,1, 0,0,0, 0,1,0], after: [1,0,1, 0,1,0, 0,1,0] },
]

function MiniGrid({ cells }) {
  return (
    <div className="gol-mini">
      {cells.map((v, i) => (
        <span key={i} className={`gol-mini-cell${v ? ' alive' : ''}${i === 4 ? ' centre' : ''}`} />
      ))}
    </div>
  )
}

function RulesModal({ onClose }) {
  const t = useT()
  return (
    <motion.div className="gol-rules-overlay" onClick={onClose}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="gol-rules" onClick={e => e.stopPropagation()}
        initial={{ y: 30, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.95 }}>
        <h3>🔬 {t('How the Game of Life works')}</h3>
        <p className="gol-rules-intro">
          {t('Every square is a cell. It is either alive 🟩 or empty ⬛. Each cell looks at the 8 squares around it — its neighbours. When you press Play, all cells follow these rules at the same time, again and again:')}
        </p>
        <div className="gol-rules-list">
          {RULES.map(r => (
            <div key={r.title} className="gol-rule">
              <div className="gol-rule-pics">
                <MiniGrid cells={r.before} /><span className="gol-rule-arrow">→</span><MiniGrid cells={r.after} />
              </div>
              <div className="gol-rule-text"><b>{r.emoji} {t(r.title)}</b><span>{t(r.text)}</span></div>
            </div>
          ))}
        </div>
        <p className="gol-rules-intro">
          {t("That's all! Nobody wins or loses — you draw a starting shape and watch what grows. The game stops by itself when all cells are gone, when nothing can change any more, or when the same shapes keep repeating.")}
        </p>
        <p className="gol-rules-tip">💡 {t('Try it: draw 3 cells in a row, then press Step a few times.')}</p>
        <button className="btn btn-primary" onClick={onClose}>{t('Got it!')}</button>
      </motion.div>
    </motion.div>
  )
}

// ── Starter patterns (relative coords, stamped near the centre) ───────────────
const PATTERNS = [
  {
    id: 'glider',
    label: 'Glider',
    emoji: '🛸',
    cells: [[0, 1], [1, 2], [2, 0], [2, 1], [2, 2]],
  },
  {
    id: 'blinker',
    label: 'Blinker',
    emoji: '✨',
    cells: [[0, 0], [0, 1], [0, 2]],
  },
  {
    id: 'pulsar',
    label: 'Pulsar',
    emoji: '💫',
    cells: [
      // a classic period-3 oscillator
      [0, 2], [0, 3], [0, 4], [0, 8], [0, 9], [0, 10],
      [2, 0], [2, 5], [2, 7], [2, 12],
      [3, 0], [3, 5], [3, 7], [3, 12],
      [4, 0], [4, 5], [4, 7], [4, 12],
      [5, 2], [5, 3], [5, 4], [5, 8], [5, 9], [5, 10],
      [7, 2], [7, 3], [7, 4], [7, 8], [7, 9], [7, 10],
      [8, 0], [8, 5], [8, 7], [8, 12],
      [9, 0], [9, 5], [9, 7], [9, 12],
      [10, 0], [10, 5], [10, 7], [10, 12],
      [12, 2], [12, 3], [12, 4], [12, 8], [12, 9], [12, 10],
    ],
  },
  {
    id: 'glidergun',
    label: 'Glider Gun',
    emoji: '🔫',
    cells: [
      [0, 24],
      [1, 22], [1, 24],
      [2, 12], [2, 13], [2, 20], [2, 21], [2, 34], [2, 35],
      [3, 11], [3, 15], [3, 20], [3, 21], [3, 34], [3, 35],
      [4, 0], [4, 1], [4, 10], [4, 16], [4, 20], [4, 21],
      [5, 0], [5, 1], [5, 10], [5, 14], [5, 16], [5, 17], [5, 22], [5, 24],
      [6, 10], [6, 16], [6, 24],
      [7, 11], [7, 15],
      [8, 12], [8, 13],
    ],
  },
]

// Size of a pattern (rows, cols).
function patternSize(cells) {
  return [Math.max(...cells.map(([r]) => r)) + 1, Math.max(...cells.map(([, c]) => c)) + 1]
}
// Turn a pattern a quarter turn clockwise.
function rotatePattern(cells) {
  const [h] = patternSize(cells)
  return cells.map(([r, c]) => [c, h - 1 - r])
}
// Board positions a stamp covers when centred on (r, c), kept inside the board.
function stampCells(cells, r, c) {
  const [h, w] = patternSize(cells)
  const offR = Math.max(0, Math.min(ROWS - h, r - Math.floor(h / 2)))
  const offC = Math.max(0, Math.min(COLS - w, c - Math.floor(w / 2)))
  return cells.map(([pr, pc]) => [pr + offR, pc + offC]).filter(([rr, cc]) => rr < ROWS && cc < COLS)
}

// Stamp a pattern's cells onto a fresh grid, centred (clipped to the board).
function stampPattern(cells) {
  const maxR = Math.max(...cells.map(([r]) => r))
  const maxC = Math.max(...cells.map(([, c]) => c))
  const offR = Math.max(0, Math.floor((ROWS - maxR) / 2))
  const offC = Math.max(0, Math.floor((COLS - maxC) / 2))
  const grid = emptyGrid()
  for (const [r, c] of cells) {
    const rr = r + offR
    const cc = c + offC
    if (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS) grid[rr][cc] = true
  }
  return grid
}

export default function GameOfLifeGame({ onBack }) {
  const t = useT()
  const { theme } = useTheme()
  const [grid, setGrid] = useState(() => stampPattern(PATTERNS[0].cells))
  const [running, setRunning] = useState(false)
  const [gen, setGen] = useState(0)
  const [speedId, setSpeedId] = useState('normal')
  const [showRules, setShowRules] = useState(false)
  const [endMsg, setEndMsg] = useState(null)

  // live copies for the timer, plus recent board fingerprints for loop checks
  const gridRef = useRef(grid)
  const genRef = useRef(gen)
  useEffect(() => { gridRef.current = grid; genRef.current = gen }, [grid, gen])
  const history = useRef(new Map())   // fingerprint → generation it was seen
  const loopSince = useRef(null)      // generation a loop was first detected

  // Paint state for click-and-drag drawing.
  const painting = useRef(false)
  const paintValue = useRef(true)
  // Stamp tool: null = draw with your finger; otherwise the chosen pattern
  // (already turned the way the player wants) is stamped wherever they tap.
  const [stampId, setStampId] = useState(null)
  const [turns, setTurns] = useState(0)
  const [hover, setHover] = useState(null)        // [r, c] under the mouse, for the preview
  const stampShape = useMemo(() => {
    const p = PATTERNS.find(x => x.id === stampId)
    if (!p) return null
    let cells = p.cells
    for (let i = 0; i < turns % 4; i++) cells = rotatePattern(cells)
    return cells
  }, [stampId, turns])
  const preview = useMemo(() => {
    if (!stampShape || !hover) return null
    return new Set(stampCells(stampShape, hover[0], hover[1]).map(([r, c]) => r * COLS + c))
  }, [stampShape, hover])

  const speed = SPEEDS.find(s => s.id === speedId) ?? SPEEDS[0]
  const alive = countAlive(grid)

  // ── One generation forward. Returns a message if the board has "finished". ──
  const advance = useCallback(() => {
    const prev = gridRef.current
    const next = nextGen(prev)
    const g = genRef.current + 1
    const key = gridKey(next)
    let msg = null
    if (countAlive(next) === 0) {
      msg = '💤 ' + tr('All the cells are gone — nothing left to grow.')
    } else if (key === gridKey(prev)) {
      msg = '🧊 ' + tr('Everything froze — no cell can change any more.')
    } else if (history.current.has(key)) {
      if (loopSince.current === null) loopSince.current = g
      const period = g - history.current.get(key)
      if (g - loopSince.current >= Math.max(LOOP_GRACE, period * 3)) {
        msg = '🔁 ' + (period > 1 ? tr('The shapes are repeating every {n} steps — it would go on forever.', { n: period }) : tr('The shapes are repeating every step — it would go on forever.'))
      }
    }
    history.current.set(key, g)
    if (history.current.size > HISTORY) history.current.delete(history.current.keys().next().value)
    gridRef.current = next
    genRef.current = g
    setGrid(next)
    setGen(g)
    return msg
  }, [])

  const clearHistory = () => { history.current = new Map(); loopSince.current = null; setEndMsg(null) }

  // ── The simulation loop ──────────────────────────────────────────────────
  useEffect(() => {
    if (!running) return undefined
    const tick = setInterval(() => {
      const msg = advance()
      if (msg) { setRunning(false); setEndMsg(msg) }
    }, speed.ms)
    return () => clearInterval(tick)
  }, [running, speed.ms, advance])

  const toggleCell = useCallback((r, c, forced) => {
    history.current = new Map(); loopSince.current = null; setEndMsg(null)
    setGrid(prev => {
      const next = prev.map(row => [...row])
      next[r][c] = forced === undefined ? !next[r][c] : forced
      return next
    })
  }, [])

  const placeStamp = (r, c) => {
    history.current = new Map(); loopSince.current = null; setEndMsg(null)
    const spots = stampCells(stampShape, r, c)
    setGrid(prev => {
      const next = prev.map(row => [...row])
      for (const [rr, cc] of spots) next[rr][cc] = true
      return next
    })
    playTap()
  }

  const handleDown = (r, c) => {
    if (stampShape) { placeStamp(r, c); return }      // stamping works even while it runs
    if (running) return
    painting.current = true
    paintValue.current = !grid[r][c]
    toggleCell(r, c, paintValue.current)
  }
  const handleEnter = (r, c) => {
    if (stampShape) { setHover([r, c]); return }
    if (running || !painting.current) return
    toggleCell(r, c, paintValue.current)
  }
  const stopPaint = () => { painting.current = false }

  useEffect(() => {
    window.addEventListener('mouseup', stopPaint)
    window.addEventListener('touchend', stopPaint)
    return () => {
      window.removeEventListener('mouseup', stopPaint)
      window.removeEventListener('touchend', stopPaint)
    }
  }, [])

  const reset = (newGrid) => {
    clearHistory()
    setRunning(false)
    setGen(0)
    setGrid(newGrid)
  }

  const stepOnce = () => {
    const msg = advance()
    if (msg) setEndMsg(msg)
  }

  const togglePlay = () => {
    if (!running) {
      // pressing Play again after an auto-stop starts a fresh check
      clearHistory()
      if (countAlive(grid) === 0) { setEndMsg('✏️ ' + t('Draw some cells first, or pick a pattern!')); return }
    }
    setRunning(r => !r)
  }

  return (
    <div className="gol-screen screen">
      {/* Header */}
      <div className="game-header gol-header">
        <button className="btn btn-secondary back-btn" onClick={onBack}>← {t('Back')}</button>
        <h2>🔬 {t('Game of Life')}</h2>
        <button className="btn btn-secondary gol-rules-btn" onClick={() => setShowRules(true)}>❓ {t('How it works')}</button>
        <div className="gol-stats">
          <span className="gol-stat" title={t('Generations elapsed')}>{t('Gen {n}', { n: gen })}</span>
          <span className="gol-stat" title={t('Living cells')}>{t('{n} alive', { n: alive })}</span>
        </div>
      </div>

      {/* Board (left, grows) + control panel (right) */}
      <div className="gol-body">
        <motion.div
          className="gol-board-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.35 } }}
        >
          <div
            className="gol-board"
            style={{
              gridTemplateColumns: `repeat(${COLS}, 1fr)`,
              gridTemplateRows: `repeat(${ROWS}, 1fr)`,
            }}
            onDragStart={(e) => e.preventDefault()}
            onMouseLeave={() => setHover(null)}
          >
            {grid.map((row, r) =>
              row.map((aliveCell, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`gol-cell ${aliveCell ? 'alive' : ''}${preview?.has(r * COLS + c) ? ' preview' : ''}`}
                  onMouseDown={() => handleDown(r, c)}
                  onMouseEnter={() => handleEnter(r, c)}
                  onTouchStart={() => handleDown(r, c)}
                />
              ))
            )}
          </div>
        </motion.div>

        <div className="gol-panel">
          <div className="gol-controls">
            <motion.button
              className={`btn ${running ? 'btn-danger' : 'btn-primary'} gol-play`}
              onClick={togglePlay}
              whileTap={{ scale: 0.95 }}
            >
              {running ? '⏸ ' + t('Pause') : '▶ ' + t('Play')}
            </motion.button>
            <button className="btn btn-secondary" onClick={stepOnce} disabled={running}>⏭ {t('Step')}</button>
            <button className="btn btn-secondary" onClick={() => reset(randomGrid())}>🎲 {t('Random')}</button>
            <button className="btn btn-secondary" onClick={() => reset(emptyGrid())}>🧹 {t('Clear')}</button>
          </div>

          <AnimatePresence>
            {endMsg && (
              <motion.div className="gol-endmsg" key={endMsg}
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {endMsg}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="gol-row">
            <span className="gol-row-label">{t('Speed')}</span>
            <div className="gol-chip-row">
              {SPEEDS.map(s => (
                <button
                  key={s.id}
                  className={`gol-chip ${speedId === s.id ? 'selected' : ''}`}
                  onClick={() => setSpeedId(s.id)}
                >
                  <span className="gol-chip-emoji">{s.emoji}</span>{t(s.label)}
                </button>
              ))}
            </div>
          </div>

          <div className="gol-row">
            <span className="gol-row-label">{t('Draw or stamp')}</span>
            <div className="gol-chip-row">
              <button
                className={`gol-chip ${stampId === null ? 'selected' : ''}`}
                onClick={() => { setStampId(null); setHover(null); playTap() }}
              >
                <span className="gol-chip-emoji">✏️</span>{t('Draw')}
              </button>
              {PATTERNS.map(p => (
                <button
                  key={p.id}
                  className={`gol-chip ${stampId === p.id ? 'selected' : ''}`}
                  onClick={() => { setStampId(p.id); setTurns(0); playTap() }}
                  title={t('Stamp a {name} — tap the board to place it', { name: t(p.label) })}
                >
                  <span className="gol-chip-emoji">{p.emoji}</span>{t(p.label)}
                </button>
              ))}
              {stampId && (
                <button className="gol-chip gol-turn" onClick={() => { setTurns(t => t + 1); playTap() }} title={t('Turn the stamp')}>
                  <span className="gol-chip-emoji">🔄</span>{t('Turn')}
                </button>
              )}
            </div>
          </div>

          <p className="gol-hint">
            {stampId
              ? t('Tap the board to stamp a {name} — as many as you like! Press ✏️ Draw to draw again.', { name: t(PATTERNS.find(p => p.id === stampId)?.label ?? '') })
              : t('Tap or drag on the grid to draw, or pick a stamp, then press Play to watch your cells come alive!')}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      </AnimatePresence>
    </div>
  )
}
