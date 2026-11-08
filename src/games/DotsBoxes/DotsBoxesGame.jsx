import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import RacerAvatar from '../../components/RacerAvatar'
import './DotsBoxes.css'
import { playMove, playMatch, playWin } from '../../sound/sfx'

/* ════════════════════════════════════════════════════════════════════════════
   DOTS & BOXES — the classic pen-and-paper travel game.
   Players take turns drawing one line between two dots. Completing the 4th side
   of a box claims it (marked with that player's theme icon) and earns another
   turn. Most boxes when the grid is full wins.
   ════════════════════════════════════════════════════════════════════════════ */

const SIZES = [
  { id: 'small',  label: 'Quick',   rows: 3, cols: 3, emoji: '🐣', desc: '3 × 3 boxes' },
  { id: 'medium', label: 'Classic', rows: 4, cols: 4, emoji: '🦊', desc: '4 × 4 boxes' },
  { id: 'large',  label: 'Long',    rows: 5, cols: 5, emoji: '🦁', desc: '5 × 5 boxes' },
]

const AI_DELAY = 650

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

// Build empty board state: h-edges (rows+1 × cols), v-edges (rows × cols+1), boxes (rows × cols).
function emptyBoard(rows, cols) {
  const h = Array.from({ length: rows + 1 }, () => Array(cols).fill(null))
  const v = Array.from({ length: rows }, () => Array(cols + 1).fill(null))
  const boxes = Array.from({ length: rows }, () => Array(cols).fill(null))
  return { h, v, boxes }
}

// Pure: draw an edge for `player`, claim any newly-completed boxes, return new board + completed count.
function drawEdge(board, rows, cols, type, r, c, player) {
  const h = board.h.map(row => [...row])
  const v = board.v.map(row => [...row])
  const boxes = board.boxes.map(row => [...row])
  if (type === 'h') h[r][c] = player
  else v[r][c] = player

  let completed = 0
  const checkBox = (br, bc) => {
    if (br < 0 || bc < 0 || br >= rows || bc >= cols) return
    if (boxes[br][bc] !== null) return
    if (h[br][bc] !== null && h[br + 1][bc] !== null && v[br][bc] !== null && v[br][bc + 1] !== null) {
      boxes[br][bc] = player
      completed++
    }
  }
  if (type === 'h') { checkBox(r - 1, c); checkBox(r, c) }
  else { checkBox(r, c - 1); checkBox(r, c) }

  return { h, v, boxes, completed }
}

// How many sides of box (br,bc) are currently drawn?
function sideCount(board, br, bc) {
  let n = 0
  if (board.h[br][bc] !== null) n++
  if (board.h[br + 1][bc] !== null) n++
  if (board.v[br][bc] !== null) n++
  if (board.v[br][bc + 1] !== null) n++
  return n
}

// List every undrawn edge.
function undrawnEdges(board, rows, cols) {
  const out = []
  for (let r = 0; r <= rows; r++) for (let c = 0; c < cols; c++) if (board.h[r][c] === null) out.push({ type: 'h', r, c })
  for (let r = 0; r < rows; r++) for (let c = 0; c <= cols; c++) if (board.v[r][c] === null) out.push({ type: 'v', r, c })
  return out
}

// A move is "safe" if it doesn't hand the opponent a box (no adjacent box reaches 3 sides).
function isSafe(board, rows, cols, mv) {
  const adj = mv.type === 'h'
    ? [[mv.r - 1, mv.c], [mv.r, mv.c]]
    : [[mv.r, mv.c - 1], [mv.r, mv.c]]
  for (const [br, bc] of adj) {
    if (br < 0 || bc < 0 || br >= rows || bc >= cols) continue
    if (sideCount(board, br, bc) === 2) return false
  }
  return true
}

// Greedy AI: take boxes when offered, otherwise play a safe edge, otherwise sacrifice.
function chooseAiMove(board, rows, cols, player) {
  const edges = undrawnEdges(board, rows, cols)
  if (edges.length === 0) return null

  let best = null, bestCount = 0
  for (const mv of edges) {
    const res = drawEdge(board, rows, cols, mv.type, mv.r, mv.c, player)
    if (res.completed > bestCount) { bestCount = res.completed; best = mv }
  }
  if (best && bestCount > 0) return best

  const safe = edges.filter(mv => isSafe(board, rows, cols, mv))
  if (safe.length) return pick(safe)

  return pick(edges)
}

// ── Geometry for rendering ────────────────────────────────────────────────────
const GAP = 62
const PAD = 26
const DOT_R = 5.5

const gameoverVariants = {
  initial: { opacity: 0, scale: 0.85, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
}

export default function DotsBoxesGame({ onBack }) {
  const { theme } = useTheme()

  const [phase, setPhase] = useState('setup')      // 'setup' | 'playing' | 'gameover'
  const [sizeId, setSizeId] = useState('medium')
  const [mode, setMode] = useState('cpu')          // 'cpu' | 'hotseat'

  const size = SIZES.find(s => s.id === sizeId)
  const rows = size.rows, cols = size.cols

  const [players, setPlayers] = useState([])
  const [board, setBoard] = useState(() => emptyBoard(rows, cols))
  const [turn, setTurn] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [hovered, setHovered] = useState(null)
  const [aiNonce, setAiNonce] = useState(0)
  const [lastClaim, setLastClaim] = useState(null) // {r,c} for pop animation

  const aiTimer = useRef(null)

  const buildPlayers = useCallback(() => {
    const r = theme.raceRacers
    if (mode === 'cpu') {
      return [
        { ...r[0], id: 'you', name: 'You', isCpu: false },
        { ...r[1], id: 'cpu', name: 'Computer', isCpu: true },
      ]
    }
    return [
      { ...r[0], id: 'p1', name: 'Player 1', isCpu: false },
      { ...r[1], id: 'p2', name: 'Player 2', isCpu: false },
    ]
  }, [theme, mode])

  const startGame = useCallback(() => {
    if (aiTimer.current) clearTimeout(aiTimer.current)
    setPlayers(buildPlayers())
    setBoard(emptyBoard(rows, cols))
    setTurn(0)
    setGameOver(false)
    setHovered(null)
    setLastClaim(null)
    setAiNonce(0)
    setPhase('playing')
  }, [buildPlayers, rows, cols])

  useEffect(() => () => { if (aiTimer.current) clearTimeout(aiTimer.current) }, [])

  // Apply a move (used by both human clicks and the AI). Computed from the
  // current board in closure — moves are always sequential, one per render.
  const playEdge = useCallback((type, r, c) => {
    const already = type === 'h' ? board.h[r][c] !== null : board.v[r][c] !== null
    if (already || gameOver) return
    const player = turn
    const res = drawEdge(board, rows, cols, type, r, c, player)
    const claimed = res.boxes.flat().filter(x => x !== null).length

    let claim = null
    if (res.completed > 0) {
      for (let br = 0; br < rows; br++) for (let bc = 0; bc < cols; bc++) {
        if (res.boxes[br][bc] === player && board.boxes[br][bc] === null) claim = { r: br, c: bc }
      }
    }
    setLastClaim(claim)
    setBoard({ h: res.h, v: res.v, boxes: res.boxes })

    if (claimed === rows * cols) playWin()
    else if (res.completed > 0) playMatch()
    else playMove()
    if (claimed === rows * cols) { setGameOver(true); setPhase('gameover') }
    else if (res.completed === 0) setTurn(1 - player)

    setAiNonce(n => n + 1)
  }, [board, turn, gameOver, rows, cols])

  // Computer turn
  useEffect(() => {
    if (phase !== 'playing' || gameOver) return
    const active = players[turn]
    if (!active || !active.isCpu) return
    aiTimer.current = setTimeout(() => {
      const mv = chooseAiMove(board, rows, cols, turn)
      if (mv) playEdge(mv.type, mv.r, mv.c)
    }, AI_DELAY)
    return () => { if (aiTimer.current) clearTimeout(aiTimer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, aiNonce, gameOver, phase, players])

  const canHumanPlay = phase === 'playing' && !gameOver && players[turn] && !players[turn].isCpu

  const handleEdge = (type, r, c) => {
    if (!canHumanPlay) return
    const already = type === 'h' ? board.h[r][c] !== null : board.v[r][c] !== null
    if (already) return
    playEdge(type, r, c)
  }

  const scores = players.map((_, i) => board.boxes.flat().filter(x => x === i).length)

  // ── Setup screen ──────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="dotsboxes-screen screen">
        <motion.div
          className="db-setup"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } }}
        >
          <div className="db-setup-header">
            <button className="btn btn-secondary back-btn" onClick={onBack}>← Back</button>
            <h2 className="db-setup-title">⬛ Dots &amp; Boxes</h2>
            <div />
          </div>

          <h3 className="db-setup-h">Board size</h3>
          <div className="db-size-btns">
            {SIZES.map(s => (
              <motion.button
                key={s.id}
                className={`db-size-btn ${sizeId === s.id ? 'selected' : ''}`}
                onClick={() => setSizeId(s.id)}
                whileHover={{ scale: 1.05, transition: { duration: 0.13 } }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="db-size-emoji">{s.emoji}</span>
                <span className="db-size-label">{s.label}</span>
                <span className="db-size-desc">{s.desc}</span>
              </motion.button>
            ))}
          </div>

          <h3 className="db-setup-h">Who is playing?</h3>
          <div className="db-mode-btns">
            <motion.button
              className={`db-mode-btn ${mode === 'cpu' ? 'selected' : ''}`}
              onClick={() => setMode('cpu')}
              whileHover={{ scale: 1.05, transition: { duration: 0.13 } }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="db-mode-racers">
                <RacerAvatar racer={theme.raceRacers[0]} />
                <span className="db-vs">vs</span>
                <img src="/other-icons/vs-pc.svg" alt="" style={{ width: '1em', height: '1em', objectFit: 'contain', display: 'block' }} />
              </span>
              <span className="db-mode-label">1 vs Computer</span>
            </motion.button>
            <motion.button
              className={`db-mode-btn ${mode === 'hotseat' ? 'selected' : ''}`}
              onClick={() => setMode('hotseat')}
              whileHover={{ scale: 1.05, transition: { duration: 0.13 } }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="db-mode-racers">
                {theme.raceRacers.slice(0, 2).map(r => <RacerAvatar key={r.id} racer={r} />)}
              </span>
              <span className="db-mode-label">Friends (pass &amp; play)</span>
            </motion.button>
          </div>

          <motion.button
            className="btn btn-primary db-start-btn"
            onClick={startGame}
            whileHover={{ scale: 1.06, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.95 }}
          >
            Start Game!
          </motion.button>
        </motion.div>
      </div>
    )
  }

  // ── Game-over screen ──────────────────────────────────────────────────────
  if (phase === 'gameover') {
    const max = Math.max(...scores)
    const winners = players.filter((_, i) => scores[i] === max)
    const tie = winners.length > 1
    return (
      <div className="dotsboxes-screen screen">
        <div className="game-header">
          <button className="btn btn-secondary back-btn" onClick={onBack}>← Back</button>
          <h2>⬛ Dots &amp; Boxes</h2>
          <div />
        </div>
        <motion.div className="gameover" variants={gameoverVariants} initial="initial" animate="animate">
          <div className="gameover-emoji">{tie ? '🤝' : <RacerAvatar racer={winners[0]} />}</div>
          <h2>{tie ? "It's a tie!" : `${winners[0].name} win${winners[0].name === 'You' ? '' : 's'}!`}</h2>
          <div className="db-final-scores">
            {players.map((p, i) => (
              <div key={p.id} className="db-final-row" style={{ '--p-col': p.color }}>
                <span className="db-final-emoji"><RacerAvatar racer={p} /></span>
                <span className="db-final-name">{p.name}</span>
                <span className="db-final-pts">{scores[i]} boxes</span>
              </div>
            ))}
          </div>
          <div className="gameover-btns">
            <button className="btn btn-primary" onClick={startGame}>Play Again</button>
            <button className="btn btn-secondary" onClick={() => setPhase('setup')}>Change Setup</button>
            <button className="btn btn-secondary" onClick={onBack}>Menu</button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── Playing screen ────────────────────────────────────────────────────────
  const width = PAD * 2 + cols * GAP
  const height = PAD * 2 + rows * GAP
  const active = players[turn]
  const turnCol = active?.color || 'var(--accent)'

  const previewEq = (type, r, c) => hovered && hovered.type === type && hovered.r === r && hovered.c === c

  return (
    <div className="dotsboxes-screen screen">
      <div className="db-play">
        {/* Scoreboard */}
        <div className="db-scorebar">
          {players.map((p, i) => (
            <div key={p.id} className={`db-score${turn === i ? ' active' : ''}`} style={{ '--p-col': p.color }}>
              <span className="db-score-emoji"><RacerAvatar racer={p} /></span>
              <span className="db-score-name">{p.name}</span>
              <span className="db-score-pts">{scores[i]}</span>
              {turn === i && <span className="db-score-turn">●</span>}
            </div>
          ))}
        </div>

        <div className="db-turn-banner" style={{ '--turn-col': turnCol }}>
          {active?.isCpu
            ? '🤖 Computer is thinking…'
            : <><RacerAvatar racer={active} /> {active?.name}'s turn</>}
        </div>

        {/* Board */}
        <div className="db-board-wrap">
          <svg
            className="db-board"
            viewBox={`0 0 ${width} ${height}`}
            style={{ '--turn-col': turnCol, maxWidth: width, pointerEvents: canHumanPlay ? 'auto' : 'none' }}
          >
            {/* Box fills */}
            {board.boxes.map((row, br) => row.map((owner, bc) => {
              if (owner === null) return null
              const p = players[owner]
              const x = PAD + bc * GAP, y = PAD + br * GAP
              const isPop = lastClaim && lastClaim.r === br && lastClaim.c === bc
              return (
                <g key={`box-${br}-${bc}`}>
                  <rect x={x + 3} y={y + 3} width={GAP - 6} height={GAP - 6} rx="7"
                        fill={p.color} opacity="0.30" />
                  {p.image ? (
                    <motion.image
                      href={p.image}
                      x={x + GAP / 2 - GAP * 0.3} y={y + GAP / 2 - GAP * 0.3}
                      width={GAP * 0.6} height={GAP * 0.6}
                      preserveAspectRatio="xMidYMid meet"
                      initial={isPop ? { scale: 0, opacity: 0 } : false}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                      style={{ transformOrigin: `${x + GAP / 2}px ${y + GAP / 2}px` }}
                    />
                  ) : (
                    <motion.text
                      x={x + GAP / 2} y={y + GAP / 2}
                      textAnchor="middle" dominantBaseline="central"
                      fontSize={GAP * 0.5}
                      initial={isPop ? { scale: 0, opacity: 0 } : false}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                      style={{ transformOrigin: `${x + GAP / 2}px ${y + GAP / 2}px` }}
                    >
                      {p.emoji}
                    </motion.text>
                  )}
                </g>
              )
            }))}

            {/* Horizontal edges */}
            {board.h.map((row, r) => row.map((owner, c) => {
              const x1 = PAD + c * GAP, y = PAD + r * GAP, x2 = x1 + GAP
              const drawn = owner !== null
              return (
                <g key={`h-${r}-${c}`}>
                  <line x1={x1} y1={y} x2={x2} y2={y} className="db-edge-base" />
                  {drawn && (
                    <line x1={x1} y1={y} x2={x2} y2={y} className="db-edge-drawn"
                          stroke={players[owner].color} />
                  )}
                  {!drawn && previewEq('h', r, c) && (
                    <line x1={x1} y1={y} x2={x2} y2={y} className="db-edge-preview" />
                  )}
                  {!drawn && (
                    <line x1={x1} y1={y} x2={x2} y2={y} className="db-edge-hit"
                          onMouseEnter={() => setHovered({ type: 'h', r, c })}
                          onMouseLeave={() => setHovered(null)}
                          onClick={() => handleEdge('h', r, c)} />
                  )}
                </g>
              )
            }))}

            {/* Vertical edges */}
            {board.v.map((row, r) => row.map((owner, c) => {
              const x = PAD + c * GAP, y1 = PAD + r * GAP, y2 = y1 + GAP
              const drawn = owner !== null
              return (
                <g key={`v-${r}-${c}`}>
                  <line x1={x} y1={y1} x2={x} y2={y2} className="db-edge-base" />
                  {drawn && (
                    <line x1={x} y1={y1} x2={x} y2={y2} className="db-edge-drawn"
                          stroke={players[owner].color} />
                  )}
                  {!drawn && previewEq('v', r, c) && (
                    <line x1={x} y1={y1} x2={x} y2={y2} className="db-edge-preview" />
                  )}
                  {!drawn && (
                    <line x1={x} y1={y1} x2={x} y2={y2} className="db-edge-hit"
                          onMouseEnter={() => setHovered({ type: 'v', r, c })}
                          onMouseLeave={() => setHovered(null)}
                          onClick={() => handleEdge('v', r, c)} />
                  )}
                </g>
              )
            }))}

            {/* Dots */}
            {Array.from({ length: rows + 1 }).map((_, r) =>
              Array.from({ length: cols + 1 }).map((_, c) => (
                <circle key={`dot-${r}-${c}`} cx={PAD + c * GAP} cy={PAD + r * GAP} r={DOT_R} className="db-dot" />
              ))
            )}
          </svg>
        </div>

        <div className="db-controls">
          <button className="btn btn-secondary" onClick={() => setPhase('setup')}>↺ New Game</button>
          <button className="btn btn-secondary back-btn" onClick={onBack}>← Menu</button>
        </div>
      </div>
    </div>
  )
}
