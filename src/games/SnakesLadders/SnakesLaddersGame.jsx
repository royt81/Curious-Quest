import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import RacerAvatar from '../../components/RacerAvatar'
import { playTap, playDiceRoll, playDiceClack, playDiceSettle, playClimb, playSlide, playWin } from '../../sound/sfx'
import './SnakesLadders.css'
import { useT, tr } from '../../i18n'

/* ════════════════════════════════════════════════════════════════════════════
   SNAKES & LADDERS — a 64-square dice climb. Pure luck, great for travel.
   Land on the foot of a ladder to climb; land on a snake's head to slide down.
   First to land exactly on 64 wins.
   ════════════════════════════════════════════════════════════════════════════ */

const STEP_MS = 230
const AI_DELAY = 900
const BOARD_SIZE = 64
const COLS = 8

// Board layout for 8×8 grid — matching the board image.
const LADDERS = { 2: 17, 4: 23, 14: 30, 35: 46, 48: 63, 56: 58, 27: 38 }
const SNAKES  = { 39: 23, 28: 19, 34: 18, 52: 29, 60: 41, 61: 33, 44: 22 }
const PORTALS = { ...LADDERS, ...SNAKES }

// Per-theme emoji for the "climb up" (ladder) and "slide down" (snake) cell markers.
const THEME_MARKS = {
  animals:   { up: '🪜', down: '🐍' },
  dinosaurs: { up: '🌿', down: '🦕' },
  space:     { up: '🚀', down: '☄️' },
  robots:    { up: '🔧', down: '⚡' },
  sea:       { up: '🫧', down: '🐙' },
}

// Cell n (1..64) → its centre as a percentage of the square board.
// n === 0 → the "START" tile, which sits just outside the board's bottom-left corner.
function cellCenter(n) {
  if (n === 0) return { x: -7, y: 107 }
  const rowFromBottom = Math.floor((n - 1) / COLS)
  const idx = (n - 1) % COLS
  const col = rowFromBottom % 2 === 0 ? idx : COLS - 1 - idx
  const displayRow = (BOARD_SIZE / COLS) - 1 - rowFromBottom
  return { x: (col + 0.5) * (100 / COLS), y: (displayRow + 0.5) * (100 / COLS) }
}

// Token offsets so several players on one square don't overlap exactly.
const T_OFF = [{ dx: -1.8, dy: -1.8 }, { dx: 1.8, dy: -1.8 }, { dx: -1.8, dy: 1.8 }, { dx: 1.8, dy: 1.8 }]

// ── Dice face (pips) ──────────────────────────────────────────────────────────
const DICE_DOTS = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[30, 30], [50, 50], [70, 70]],
  4: [[30, 30], [70, 30], [30, 70], [70, 70]],
  5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
  6: [[30, 28], [70, 28], [30, 50], [70, 50], [30, 72], [70, 72]],
}
function DiceFace({ value, rolling }) {
  if (!value) return <div className="sl-dice-empty">🎲</div>
  return (
    <svg className={`sl-dice${rolling ? ' rolling' : ''}`} viewBox="0 0 100 100" width="68" height="68">
      <rect x="8" y="10" width="86" height="86" rx="15" fill="rgba(0,0,0,0.28)" />
      <rect x="5" y="5" width="88" height="88" rx="15" fill="#f7efda" stroke="#c8a040" strokeWidth="3" />
      {(DICE_DOTS[value] || []).map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r="9" fill="#2a1800" />)}
    </svg>
  )
}

const gameoverVariants = {
  initial: { opacity: 0, scale: 0.85, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
}

export default function SnakesLaddersGame({ onBack }) {
  const t = useT()
  const { theme } = useTheme()

  const [phase, setPhase] = useState('setup')   // 'setup' | 'playing' | 'gameover'
  const [mode, setMode] = useState('friends')   // 'friends' | 'cpu'
  const [playerCount, setPlayerCount] = useState(2)

  const [players, setPlayers] = useState([])
  const [positions, setPositions] = useState([])
  const [displayPos, setDisplayPos] = useState([])
  const [currentPlayer, setCurrentPlayer] = useState(0)
  const [diceValue, setDiceValue] = useState(null)
  const [rolling, setRolling] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [winner, setWinner] = useState(null)
  const [log, setLog] = useState([])

  const rollTimer = useRef(null)
  const moveTimer = useRef(null)

  useEffect(() => () => {
    if (rollTimer.current) clearTimeout(rollTimer.current)
    if (moveTimer.current) clearTimeout(moveTimer.current)
  }, [])

  const addLog = (msg) => setLog(prev => [msg, ...prev].slice(0, 3))

  const buildPlayers = useCallback((count) => {
    const r = theme.raceRacers
    if (mode === 'cpu') {
      return [
        { ...r[0], pid: 'you', name: 'You', isCpu: false },
        { ...r[1], pid: 'cpu', name: 'Computer', isCpu: true },
      ]
    }
    return r.slice(0, count).map((rr, i) => ({ ...rr, pid: `p${i}`, name: `Player ${i + 1}`, isCpu: false }))
  }, [theme, mode])

  const startGame = useCallback(() => {
    if (rollTimer.current) clearTimeout(rollTimer.current)
    if (moveTimer.current) clearTimeout(moveTimer.current)
    const count = mode === 'cpu' ? 2 : playerCount
    const p = buildPlayers(count)
    setPlayers(p)
    setPositions(Array(p.length).fill(0))
    setDisplayPos(Array(p.length).fill(0))
    setCurrentPlayer(0)
    setDiceValue(null)
    setRolling(false)
    setAnimating(false)
    setWinner(null)
    setLog(['🎲 ' + tr('Roll the dice to begin!')])
    setPhase('playing')
  }, [mode, playerCount, buildPlayers])

  // Walk a token one cell at a time from `from` → `to`.
  const animateSteps = useCallback((pIdx, from, to, ms, onDone) => {
    if (from === to) { onDone(); return }
    const dir = to > from ? 1 : -1
    let cur = from
    const advance = () => {
      cur += dir
      setDisplayPos(prev => prev.map((p, i) => i === pIdx ? cur : p))
      playTap()
      if (cur !== to) moveTimer.current = setTimeout(advance, ms)
      else onDone()
    }
    moveTimer.current = setTimeout(advance, ms)
  }, [])

  const finishTurn = useCallback((pIdx, finalPos) => {
    if (finalPos === BOARD_SIZE) {
      playWin()
      setWinner(pIdx)
      setPhase('gameover')
      setAnimating(false)
      return
    }
    setCurrentPlayer(prev => (prev + 1) % players.length)
    setAnimating(false)
  }, [players])

  const doMove = useCallback((pIdx, roll) => {
    const from = positions[pIdx]
    const target = from + roll
    const racer = players[pIdx]

    if (target > BOARD_SIZE) {
      addLog(`${racer.emoji} ` + tr('{name} rolls {n} — needs the exact number, stays put.', { name: tr(racer.name), n: roll }))
      moveTimer.current = setTimeout(() => finishTurn(pIdx, from), 600)
      return
    }

    addLog(`${racer.emoji} ` + tr('{name} rolls {n} → square {sq}', { name: tr(racer.name), n: roll, sq: target }))
    setPositions(prev => prev.map((p, i) => i === pIdx ? target : p))

    animateSteps(pIdx, from, target, STEP_MS, () => {
      const dest = PORTALS[target]
      if (dest != null) {
        const isLadder = dest > target
        if (isLadder) playClimb()
        else playSlide()
        addLog(isLadder
          ? '🪜 ' + tr('Ladder!') + ` ${racer.emoji} ${target} → ${dest}!`
          : '🐍 ' + tr('Snake!') + ` ${racer.emoji} ${target} → ${dest}!`)
        setPositions(prev => prev.map((p, i) => i === pIdx ? dest : p))
        setDisplayPos(prev => prev.map((p, i) => i === pIdx ? dest : p))
        moveTimer.current = setTimeout(() => finishTurn(pIdx, dest), 780)
      } else {
        finishTurn(pIdx, target)
      }
    })
  }, [positions, players, animateSteps, finishTurn])

  const rollDice = useCallback(() => {
    if (animating || rolling || phase !== 'playing') return
    setRolling(true)
    setAnimating(true)
    playDiceRoll()  // plays a recording if present; otherwise the per-flip clacks below
    let count = 0
    const rnd = () => 1 + Math.floor(Math.random() * 6)
    const tick = () => {
      setDiceValue(rnd())
      count++
      if (count < 6) {
        playDiceClack()                       // one clack per visible face flip
        // uneven, decelerating gaps so the tumble doesn't feel metronomic
        rollTimer.current = setTimeout(tick, 80 + count * 16 + Math.random() * 40)
      } else {
        const finalRoll = rnd()
        setDiceValue(finalRoll)
        playDiceSettle()                       // heavier hit as it lands
        setRolling(false)
        rollTimer.current = setTimeout(() => doMove(currentPlayer, finalRoll), 350)
      }
    }
    rollTimer.current = setTimeout(tick, 70)
  }, [animating, rolling, phase, currentPlayer, doMove])

  // Computer auto-rolls on its turn.
  useEffect(() => {
    if (phase !== 'playing' || animating || rolling) return
    const active = players[currentPlayer]
    if (!active || !active.isCpu) return
    const t = setTimeout(() => rollDice(), AI_DELAY)
    return () => clearTimeout(t)
  }, [phase, animating, rolling, currentPlayer, players, rollDice])

  // ── Setup ──────────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="snakes-screen screen">
        <motion.div
          className="sl-setup"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } }}
        >
          <div className="sl-setup-header">
            <button className="btn btn-secondary back-btn" onClick={onBack}>← {t('Back')}</button>
            <h2 className="sl-setup-title"><img src="/other-icons/snake.svg" alt="" style={{ width: '1em', height: '1em', objectFit: 'contain', display: 'inline-block', verticalAlign: '-0.15em' }} /> {t('Snakes & Ladders')}</h2>
            <div />
          </div>

          <h3 className="sl-setup-h">{t('Who is playing?')}</h3>
          <div className="sl-mode-btns">
            <motion.button
              className={`sl-mode-btn ${mode === 'cpu' ? 'selected' : ''}`}
              onClick={() => setMode('cpu')}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
              <span className="sl-mode-racers"><RacerAvatar racer={theme.raceRacers[0]} /><span className="sl-vs">{t('vs')}</span><img src="/other-icons/vs-pc.svg" alt="" style={{ width: '1em', height: '1em', objectFit: 'contain', display: 'inline-block', verticalAlign: '-0.15em' }} /></span>
              <span className="sl-mode-label">{t('1 vs Computer')}</span>
            </motion.button>
            <motion.button
              className={`sl-mode-btn ${mode === 'friends' ? 'selected' : ''}`}
              onClick={() => setMode('friends')}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
              <span className="sl-mode-racers">{theme.raceRacers.slice(0, 2).map(r => <RacerAvatar key={r.id} racer={r} />)}</span>
              <span className="sl-mode-label">{t('Friends (pass & play)')}</span>
            </motion.button>
          </div>

          {mode === 'friends' && (
            <>
              <h3 className="sl-setup-h">{t('How many players?')}</h3>
              <div className="sl-count-btns">
                {[2, 3, 4].map(n => (
                  <motion.button
                    key={n}
                    className={`sl-count-btn ${playerCount === n ? 'selected' : ''}`}
                    onClick={() => setPlayerCount(n)}
                    whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                  >
                    <div className="sl-count-racers">{theme.raceRacers.slice(0, n).map(r => <RacerAvatar key={r.id} racer={r} />)}</div>
                    <div className="sl-count-label">{t('{n} Players', { n })}</div>
                  </motion.button>
                ))}
              </div>
            </>
          )}

          <motion.button
            className="btn btn-primary sl-start-btn"
            onClick={startGame}
            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
          >
            {t('Start Climbing!')}
          </motion.button>
        </motion.div>
      </div>
    )
  }

  // ── Game over ────────────────────────────────────────────────────────────────
  if (phase === 'gameover') {
    return (
      <div className="snakes-screen screen">
        <div className="game-header">
          <button className="btn btn-secondary back-btn" onClick={onBack}>← {t('Back')}</button>
          <h2><img src="/other-icons/snake.svg" alt="" style={{ width: '1em', height: '1em', objectFit: 'contain', display: 'inline-block', verticalAlign: '-0.15em' }} /> {t('Snakes & Ladders')}</h2>
          <div />
        </div>
        <motion.div className="gameover" variants={gameoverVariants} initial="initial" animate="animate">
          <div className="gameover-emoji"><RacerAvatar racer={players[winner]} /></div>
          <h2>{players[winner]?.pid === 'you' ? t('You reach square {n}!', { n: BOARD_SIZE }) : t('{name} reaches square {n}!', { name: t(players[winner]?.name ?? ''), n: BOARD_SIZE })} 🏆</h2>
          <div className="gameover-btns">
            <button className="btn btn-primary" onClick={startGame}>{t('Play Again')}</button>
            <button className="btn btn-secondary" onClick={() => setPhase('setup')}>{t('Change Players')}</button>
            <button className="btn btn-secondary" onClick={onBack}>{t('Menu')}</button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── Playing ──────────────────────────────────────────────────────────────────
  // Build the cells in display order (top row first).
  const cells = []
  const numRows = BOARD_SIZE / COLS
  for (let displayRow = 0; displayRow < numRows; displayRow++) {
    const rowFromBottom = numRows - 1 - displayRow
    const base = rowFromBottom * COLS
    const nums = []
    for (let i = 0; i < COLS; i++) nums.push(base + i + 1)
    if (rowFromBottom % 2 === 1) nums.reverse()
    cells.push(...nums)
  }

  const current = players[currentPlayer]
  const marks = THEME_MARKS[theme.id] || THEME_MARKS.animals

  // SVG overlays for ladders & snakes (coordinates are 0..100 percentages).
  const ladderPaths = Object.entries(LADDERS).map(([s, e]) => {
    const a = cellCenter(+s), b = cellCenter(+e)
    const dx = b.x - a.x, dy = b.y - a.y
    const len = Math.hypot(dx, dy) || 1
    const ux = dx / len, uy = dy / len
    const nx = -uy, ny = ux
    const w = 2.5
    const rails = [
      `M ${a.x + nx * w} ${a.y + ny * w} L ${b.x + nx * w} ${b.y + ny * w}`,
      `M ${a.x - nx * w} ${a.y - ny * w} L ${b.x - nx * w} ${b.y - ny * w}`,
    ]
    const shines = [
      `M ${a.x + nx * (w - 0.8)} ${a.y + ny * (w - 0.8)} L ${b.x + nx * (w - 0.8)} ${b.y + ny * (w - 0.8)}`,
      `M ${a.x - nx * (w - 0.8)} ${a.y - ny * (w - 0.8)} L ${b.x - nx * (w - 0.8)} ${b.y - ny * (w - 0.8)}`,
    ]
    const rungs = []
    const rungShadows = []
    const steps = Math.max(2, Math.round(len / 4.5))
    for (let i = 1; i < steps; i++) {
      const t = i / steps
      const cx = a.x + dx * t, cy = a.y + dy * t
      rungs.push(`M ${cx + nx * w} ${cy + ny * w} L ${cx - nx * w} ${cy - ny * w}`)
      rungShadows.push(`M ${cx + nx * w + 0.3} ${cy + ny * w + 0.4} L ${cx - nx * w + 0.3} ${cy - ny * w + 0.4}`)
    }
    return { s: +s, e: +e, rails, shines, rungs, rungShadows }
  })

  const snakePaths = Object.entries(SNAKES).map(([s, e], idx) => {
    const a = cellCenter(+s), b = cellCenter(+e)  // a = head (high), b = tail (low)
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
    const dx = b.x - a.x, dy = b.y - a.y
    const len = Math.hypot(dx, dy) || 1
    const nx = -dy / len, ny = dx / len
    // alternate the bend direction so neighbouring snakes don't overlap visually
    const bend = (idx % 2 === 0 ? 1 : -1) * (8 + (idx % 3) * 2)
    const c1x = mx + nx * bend, c1y = my + ny * bend
    const c2x = mx - nx * bend, c2y = my - ny * bend
    const d = `M ${a.x} ${a.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${b.x} ${b.y}`

    // Sample the cubic bezier to scatter scale markings, find the tail tangent
    // and the tangent near the head (used to orient the hood & eyes).
    const bez = (t) => {
      const mt = 1 - t
      const x = mt ** 3 * a.x + 3 * mt ** 2 * t * c1x + 3 * mt * t ** 2 * c2x + t ** 3 * b.x
      const y = mt ** 3 * a.y + 3 * mt ** 2 * t * c1y + 3 * mt * t ** 2 * c2y + t ** 3 * b.y
      return { x, y }
    }
    const scales = []
    const nScales = Math.max(5, Math.round(len / 5))
    for (let i = 1; i < nScales; i++) {
      const t = i / nScales
      const p0 = bez(Math.max(0, t - 0.01))
      const p1 = bez(Math.min(1, t + 0.01))
      const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x) * (180 / Math.PI)
      const p = bez(t)
      scales.push({ x: p.x, y: p.y, angle, alt: i % 2 === 0 })
    }
    const tailEnd = bez(0.96)
    const headTangentPt = bez(0.07)
    return { s: +s, e: +e, d, head: a, tail: b, tailEnd, headTangentPt, scales, colorIdx: idx % 4 }
  })

  return (
    <div className="snakes-screen screen">
      <div className="sl-play">
        {/* Board */}
        <div className="sl-board-wrap">
          <div className="sl-board">
            {cells.map(n => {
              const isLadderFoot = LADDERS[n] != null
              const isSnakeHead = SNAKES[n] != null
              return (
                <div key={n} className={`sl-cell${n === BOARD_SIZE ? ' finish' : ''}${n % 2 === 0 ? ' even' : ' odd'}`}>
                  <span className="sl-cell-num">{n}</span>
                  {n === BOARD_SIZE && <span className="sl-cell-flag">🏁</span>}
                  {isLadderFoot && <span className="sl-cell-mark sl-mark-ladder"><img src="/other-icons/goal.svg" alt={t('ladder')} style={{ width: '1.1em', height: '1.1em', objectFit: 'contain', display: 'block' }} /></span>}
                  {isSnakeHead && <span className="sl-cell-mark sl-mark-snake"><img src="/other-icons/snake-1.svg" alt={t('snake')} style={{ width: '1.1em', height: '1.1em', objectFit: 'contain', display: 'block' }} /></span>}
                </div>
              )
            })}

          </div>

          {/* START tile — sits just outside the board, bottom-left */}
          <div className="sl-start-tile">
            <span className="sl-start-emoji">🏁</span>
            <span className="sl-start-label">{t('START')}</span>
          </div>

          {/* Tokens — positioned relative to sl-board-wrap so the START tile isn't clipped */}
          {players.map((p, pIdx) => {
            const pos = displayPos[pIdx] ?? 0
            const c = cellCenter(pos)
            const sameCell = players.slice(0, pIdx).filter((_, i) => (displayPos[i] ?? 0) === pos).length
            const off = T_OFF[sameCell] || { dx: 0, dy: 0 }
            return (
              <motion.div
                key={p.pid}
                className={`sl-token${pIdx === currentPlayer && !animating ? ' is-current' : ''}`}
                style={{ '--tok-col': p.color }}
                animate={{ left: `${c.x + (pos === 0 ? 0 : off.dx)}%`, top: `${c.y + (pos === 0 ? 0 : off.dy)}%` }}
                transition={{ type: 'spring', stiffness: 280, damping: 28, mass: 0.6 }}
              >
                <RacerAvatar racer={p} />
              </motion.div>
            )
          })}
        </div>

        {/* Sidebar */}
        <div className="sl-sidebar">
          <div className="sl-sidebar-title"><img src="/other-icons/snake.svg" alt="" style={{ width: '1em', height: '1em', objectFit: 'contain', display: 'inline-block', verticalAlign: '-0.15em' }} /> {t('Snakes & Ladders')}</div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current?.pid}
              className="sl-turn"
              style={{ '--turn-col': current?.color }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } }}
              exit={{ opacity: 0, y: 8, transition: { duration: 0.14, ease: 'easeIn' } }}
            >
              <span className="sl-turn-emoji">{animating && !rolling ? '✨' : <RacerAvatar racer={current} />}</span>
              <span>{animating && !rolling ? t('Moving…') : current?.pid === 'you' ? t('Your turn') : t("{name}'s turn", { name: t(current?.name ?? '') })}</span>
            </motion.div>
          </AnimatePresence>

          <div className="sl-players">
            {players.map((p, i) => (
              <div key={p.pid} className={`sl-player-row${i === currentPlayer && !animating ? ' active' : ''}`} style={{ '--row-col': p.color }}>
                {i === currentPlayer && !animating && <span className="sl-player-arrow">▶</span>}
                <span className="sl-player-emoji"><RacerAvatar racer={p} /></span>
                <span className="sl-player-name">{t(p.name)}</span>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={positions[i] ?? 0}
                    className="sl-player-pos"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } }}
                    exit={{ opacity: 0, y: 6, transition: { duration: 0.12 } }}
                  >{positions[i] ?? 0}/{BOARD_SIZE}</motion.span>
                </AnimatePresence>
              </div>
            ))}
          </div>

          <div className="sl-dice-area"><DiceFace value={diceValue} rolling={rolling} /></div>

          <motion.button
            className="btn btn-primary sl-roll-btn"
            onClick={rollDice}
            disabled={animating || rolling || current?.isCpu}
            whileHover={!animating && !rolling && !current?.isCpu ? { scale: 1.04 } : {}}
            whileTap={!animating && !rolling && !current?.isCpu ? { scale: 0.95 } : {}}
          >
            {current?.isCpu ? '🤖 ' + t('Computer…') : rolling ? '🎲 ' + t('Rolling…') : animating ? '✨ ' + t('Moving…') : '🎲 ' + t('Roll Dice!')}
          </motion.button>

          <div className="log-box sl-log">
            <AnimatePresence initial={false}>
              {log.map((l, i) => (
                <motion.div
                  key={l + i}
                  className="log-line"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0, transition: { duration: 0.28, ease: 'easeOut' } }}
                  exit={{ opacity: 0, transition: { duration: 0.18, ease: 'easeIn' } }}
                >{l}</motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
