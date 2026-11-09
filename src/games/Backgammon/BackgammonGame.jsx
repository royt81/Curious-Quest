import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import { themePieces } from '../../data/pieces'
import './Backgammon.css'
import { playMove, playCapture, playWin, playDiceRoll, playDiceSettle } from '../../sound/sfx'
import { useT, tr } from '../../i18n'

/* ════════════════════════════════════════════════════════════════════════════
   BACKGAMMON — human (HUMAN, positive checkers) vs computer (COMP, negative).
   ────────────────────────────────────────────────────────────────────────────
   BOARD MODEL
   - `points` is an array of 24 ints, index 0..23.
       value > 0  → that many HUMAN checkers on the point
       value < 0  → that many COMPUTER checkers on the point (abs = count)
       value === 0 → empty
   - Bars and off-trays are tracked separately as plain counts.

   DIRECTION OF TRAVEL
   - HUMAN moves from HIGH index toward LOW index (idx 23 → idx 0).
       a die value v moves a checker from point p to point (p - v).
       HUMAN home board = indices 0..5; bears off past index 0.
   - COMP moves from LOW index toward HIGH index (idx 0 → idx 23).
       a die value v moves a checker from point p to point (p + v).
       COMP home board = indices 18..23; bears off past index 23.
   - When a player has checkers on the bar they MUST re-enter first:
       HUMAN re-enters in the COMP home board (indices 23..18) — a die v
         brings the checker to index (24 - v)  [v=1 → idx23 ... v=6 → idx18].
       COMP re-enters in the HUMAN home board (indices 0..5) — a die v
         brings the checker to index (v - 1)   [v=1 → idx0 ... v=6 → idx5].

   SIMPLIFICATIONS (clearly noted):
   - No doubling cube (per spec).
   - Bearing off uses the standard rule including the "overshoot" allowance:
     a higher die may bear off a checker from a lower point ONLY when no
     checker sits on a higher home point that could use that exact die.
   - The AI is naive: it enumerates legal single moves greedily for each die
     in turn, preferring (1) hitting a blot, (2) making/landing safely, else a
     random legal move. It never plays an illegal move, but it does not search
     for the move sequence that maximises pip usage — so in rare positions it
     might leave a die unused that a perfect player could have used. This keeps
     it simple while always remaining legal.
   ════════════════════════════════════════════════════════════════════════════ */

const HUMAN = 1
const COMP = -1

// Pip layout for a real die face — [column, row] in a 3×3 grid.
const PIP_LAYOUT = {
  1: [[2, 2]],
  2: [[1, 1], [3, 3]],
  3: [[1, 1], [2, 2], [3, 3]],
  4: [[1, 1], [3, 1], [1, 3], [3, 3]],
  5: [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]],
  6: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3], [3, 3]],
}

const gameoverVariants = {
  initial: { opacity: 0, scale: 0.85, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
}

const AI_DELAY = 850

// ── Starting position ────────────────────────────────────────────────────────
function startingPoints() {
  const p = new Array(24).fill(0)
  // HUMAN (positive) — travelling toward index 0
  p[23] = 2
  p[12] = 5
  p[7] = 3
  p[5] = 5
  // COMP (negative) — mirror image, travelling toward index 23
  p[0] = -2
  p[11] = -5
  p[16] = -3
  p[18] = -5
  return p
}

function rollDie() { return 1 + Math.floor(Math.random() * 6) }

// ── Board-state helpers (pure; operate on a {points, barH, barC, offH, offC}) ──
function ownerOf(points, idx) {
  const v = points[idx]
  if (v > 0) return HUMAN
  if (v < 0) return COMP
  return 0
}

// All HUMAN checkers in home board (idx 0..5)?  (bar must be empty too)
function humanAllHome(state) {
  if (state.barH > 0) return false
  for (let i = 6; i < 24; i++) if (state.points[i] > 0) return false
  return true
}
function compAllHome(state) {
  if (state.barC > 0) return false
  for (let i = 0; i < 18; i++) if (state.points[i] < 0) return false
  return true
}

// Highest occupied home point for bear-off overshoot check.
// For HUMAN, "highest" pip distance = largest index in 0..5 that is occupied.
function humanHighestHomeIdx(state) {
  for (let i = 5; i >= 0; i--) if (state.points[i] > 0) return i
  return -1
}
// For COMP, the point furthest from bear-off (lowest index in 18..23).
function compLowestHomeIdx(state) {
  for (let i = 18; i <= 23; i++) if (state.points[i] < 0) return i
  return 99
}

/* Given a source ('bar' or an index), a die value, and whose turn it is,
   return the resulting destination as { kind:'point', idx } | { kind:'off' }
   | null (illegal). This is the single-checker legality core. */
function destFor(state, player, src, die) {
  if (player === HUMAN) {
    // Must re-enter from bar first.
    if (state.barH > 0 && src !== 'bar') return null
    if (src === 'bar') {
      const idx = 24 - die // v=1→23 ... v=6→18
      if (idx < 18 || idx > 23) return null
      const o = ownerOf(state.points, idx)
      if (o === COMP && state.points[idx] <= -2) return null
      return { kind: 'point', idx }
    }
    const from = src
    if (state.points[from] <= 0) return null // not a human checker
    const to = from - die
    if (to >= 0) {
      const o = ownerOf(state.points, to)
      if (o === COMP && state.points[to] <= -2) return null // blocked
      return { kind: 'point', idx: to }
    }
    // to < 0 → bearing off territory
    if (!humanAllHome(state)) return null
    if (from === die - 1) return { kind: 'off' } // exact bear-off (idx = die-1)
    // overshoot: die larger than the point — only if no checker on a higher point
    const highest = humanHighestHomeIdx(state)
    if (from === highest && to < 0) return { kind: 'off' }
    return null
  } else {
    // COMP
    if (state.barC > 0 && src !== 'bar') return null
    if (src === 'bar') {
      const idx = die - 1 // v=1→0 ... v=6→5
      if (idx < 0 || idx > 5) return null
      const o = ownerOf(state.points, idx)
      if (o === HUMAN && state.points[idx] >= 2) return null
      return { kind: 'point', idx }
    }
    const from = src
    if (state.points[from] >= 0) return null // not a comp checker
    const to = from + die
    if (to <= 23) {
      const o = ownerOf(state.points, to)
      if (o === HUMAN && state.points[to] >= 2) return null
      return { kind: 'point', idx: to }
    }
    // to > 23 → bear off
    if (!compAllHome(state)) return null
    if (from === 24 - die) return { kind: 'off' } // exact (idx = 23-(die-1) = 24-die)
    const lowest = compLowestHomeIdx(state)
    if (from === lowest && to > 23) return { kind: 'off' }
    return null
  }
}

// Apply a single move, returning a NEW state (immutable). Caller guarantees legal.
function applyMove(state, player, src, die) {
  const dest = destFor(state, player, src, die)
  if (!dest) return state
  const points = [...state.points]
  let { barH, barC, offH, offC } = state

  // remove from source
  if (src === 'bar') {
    if (player === HUMAN) barH -= 1; else barC -= 1
  } else {
    points[src] -= player // player is +1 or -1
  }

  if (dest.kind === 'off') {
    if (player === HUMAN) offH += 1; else offC += 1
  } else {
    const idx = dest.idx
    const occupant = ownerOf(points, idx)
    if (occupant !== 0 && occupant !== player) {
      // hitting a blot (single enemy checker) → send to bar
      points[idx] = 0
      if (player === HUMAN) barC += 1; else barH += 1
    }
    points[idx] += player
  }
  return { points, barH, barC, offH, offC }
}

// Sources a player can legally move FROM (for a given set of remaining dice).
function legalSources(state, player, dice) {
  const onBar = player === HUMAN ? state.barH > 0 : state.barC > 0
  const srcs = []
  if (onBar) {
    for (const d of dice) if (destFor(state, player, 'bar', d)) { srcs.push('bar'); break }
    if (srcs.length === 0 && comboForSource(state, player, 'bar', dice).length > 0) srcs.push('bar')
    return srcs
  }
  for (let i = 0; i < 24; i++) {
    if (player === HUMAN ? state.points[i] > 0 : state.points[i] < 0) {
      let ok = false
      for (const d of dice) {
        if (destFor(state, player, i, d)) { ok = true; break }
      }
      if (!ok && comboForSource(state, player, i, dice).length > 0) ok = true
      if (ok) srcs.push(i)
    }
  }
  return srcs
}

// For a chosen source, which die values are usable, and where do they land.
function legalForSource(state, player, src, dice) {
  const out = [] // { die, dest }
  const seen = new Set()
  for (const d of dice) {
    if (seen.has(d)) continue
    const dest = destFor(state, player, src, d)
    if (dest) { out.push({ die: d, dest }); seen.add(d) }
  }
  return out
}

// Combined moves: play two of the remaining dice back-to-back on the SAME
// checker (e.g. rolled 2 & 3 → can also move 5 in one go), as long as the
// intermediate landing point is itself a legal stop. Returns
// { die: sum, uses: [d1, d2], mid, dest } entries, deduped by destination.
function comboForSource(state, player, src, dice) {
  const out = []
  for (let i = 0; i < dice.length; i++) {
    for (let j = 0; j < dice.length; j++) {
      if (i === j) continue
      const d1 = dice[i], d2 = dice[j]
      const mid = destFor(state, player, src, d1)
      if (!mid || mid.kind !== 'point') continue
      const midState = applyMove(state, player, src, d1)
      const fin = destFor(midState, player, mid.idx, d2)
      if (!fin) continue
      const dup = out.some(o =>
        (fin.kind === 'off' && o.dest.kind === 'off') ||
        (fin.kind === 'point' && o.dest.kind === 'point' && o.dest.idx === fin.idx))
      if (dup) continue
      out.push({ die: d1 + d2, uses: [d1, d2], mid: mid.idx, dest: fin })
    }
  }
  return out
}

function anyLegalMove(state, player, dice) {
  return legalSources(state, player, dice).length > 0
}

// ── AI: greedily play out its dice with simple heuristics ─────────────────────
function aiChooseSequence(startState, dice) {
  // returns array of { src, die } moves, applied left to right
  const moves = []
  let state = startState
  let remaining = [...dice]

  while (remaining.length > 0) {
    const srcs = legalSources(state, COMP, remaining)
    if (srcs.length === 0) break

    // Enumerate every (src, die) candidate.
    const candidates = []
    for (const src of srcs) {
      for (const { die, dest } of legalForSource(state, COMP, src, remaining)) {
        let score = 0
        if (dest.kind === 'point') {
          const occ = ownerOf(state.points, dest.idx)
          if (occ === HUMAN && state.points[dest.idx] === 1) score += 100 // hit a blot
          // making a point (landing where we already have one) is safe
          if (occ === COMP) score += 20
          // advancing toward home (higher index) slightly preferred
          score += dest.idx * 0.5
        } else {
          score += 60 // bearing off is good
        }
        candidates.push({ src, die, score })
      }
    }
    if (candidates.length === 0) break
    candidates.sort((a, b) => b.score - a.score)
    // pick among the best (tie-break randomly for variety)
    const best = candidates[0].score
    const top = candidates.filter(c => c.score >= best - 0.01)
    const pick = top[Math.floor(Math.random() * top.length)]

    state = applyMove(state, COMP, pick.src, pick.die)
    moves.push({ src: pick.src, die: pick.die })
    // consume one instance of that die
    const di = remaining.indexOf(pick.die)
    if (di !== -1) remaining.splice(di, 1)
  }
  return moves
}

// ════════════════════════════════════════════════════════════════════════════

export default function BackgammonGame({ onBack }) {
  const t = useT()
  const { theme } = useTheme()

  const [state, setState] = useState(() => ({
    points: startingPoints(), barH: 0, barC: 0, offH: 0, offC: 0,
  }))
  const [dice, setDice] = useState([])        // remaining usable die values
  const [allDice, setAllDice] = useState([])  // full roll (for display)
  const [turn, setTurn] = useState(HUMAN)
  const [rolled, setRolled] = useState(false)
  const [selected, setSelected] = useState(null) // source index or 'bar'
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)
  const [log, setLog] = useState(() => [tr('Roll the dice to begin!')])
  const [aiThinking, setAiThinking] = useState(false)

  const stateRef = useRef({})
  stateRef.current = { state, dice, turn, rolled, gameOver }
  const aiTimer = useRef(null)

  // ── Flying checker animation ─────────────────────────────────────────────────
  const boardRef    = useRef(null)
  const pointRefs   = useRef({})   // pointRefs.current[idx] = DOM el
  const barHRef     = useRef(null)
  const barCRef     = useRef(null)
  const [flyChecker, setFlyChecker] = useState(null) // { x,y,tx,ty,isHuman }

  const getCenter = (el) => {
    if (!el || !boardRef.current) return null
    const br = boardRef.current.getBoundingClientRect()
    const er = el.getBoundingClientRect()
    return { x: er.left + er.width / 2 - br.left, y: er.top + er.height / 2 - br.top }
  }

  // Animate a checker flying from src→dest then call commit() to apply state.
  const flyAndCommit = (src, dest, isHuman, commit) => {
    const fromEl = src === 'bar'
      ? (isHuman ? barHRef.current : barCRef.current)
      : pointRefs.current[src]
    const toEl = (!dest || dest === 'off')
      ? null
      : (dest === 'bar'
          ? (isHuman ? barHRef.current : barCRef.current)
          : pointRefs.current[dest])
    const from = getCenter(fromEl)
    const to   = toEl ? getCenter(toEl) : null
    if (!from || !to) { commit(); return }
    setFlyChecker({ x: from.x, y: from.y, tx: to.x, ty: to.y, isHuman })
    setTimeout(() => { setFlyChecker(null); commit() }, 550)
  }

  const addLog = (msg) => setLog(prev => [msg, ...prev].slice(0, 5))

  const reset = () => {
    if (aiTimer.current) { clearTimeout(aiTimer.current); aiTimer.current = null }
    setState({ points: startingPoints(), barH: 0, barC: 0, offH: 0, offC: 0 })
    setDice([]); setAllDice([]); setTurn(HUMAN); setRolled(false)
    setSelected(null); setGameOver(false); setWinner(null)
    setLog([tr('Roll the dice to begin!')]); setAiThinking(false)
  }

  // ── Roll dice for the current player ────────────────────────────────────────
  const doRoll = () => {
    if (rolled || gameOver) return
    const a = rollDie(), b = rollDie()
    const roll = a === b ? [a, a, a, a] : [a, b]
    playDiceRoll(); playDiceSettle()
    setAllDice([a, b])
    setDice(roll)
    setRolled(true)
    setSelected(null)
    addLog((turn === HUMAN ? tr('You rolled {a} & {b}', { a, b }) : tr('Computer rolled {a} & {b}', { a, b })) + (a === b ? ' ' + tr('(doubles!)') : ''))

    // If no legal move at all, skip turn.
    if (!anyLegalMove(state, turn, roll)) {
      addLog(turn === HUMAN ? tr('You have no legal moves — turn skipped.') : tr('Computer has no legal moves — turn skipped.'))
      // small delay so the player sees the dice
      setTimeout(() => endTurn(), 700)
    }
  }

  // ── End the current turn → switch player ────────────────────────────────────
  const endTurn = () => {
    setDice([]); setAllDice([]); setRolled(false); setSelected(null)
    setTurn(t => (t === HUMAN ? COMP : HUMAN))
  }

  // Check for win on a given state.
  const checkWin = (s) => {
    if (s.offH >= 15 || s.offC >= 15) playWin()
    if (s.offH >= 15) { setGameOver(true); setWinner(HUMAN); return true }
    if (s.offC >= 15) { setGameOver(true); setWinner(COMP); return true }
    return false
  }

  // ── Human interaction ────────────────────────────────────────────────────────
  const handleSelectSource = (src) => {
    if (turn !== HUMAN || !rolled || gameOver || flyChecker) return
    // must enter from bar first
    if (state.barH > 0 && src !== 'bar') return
    const opts = legalForSource(state, HUMAN, src, dice)
    const combos = comboForSource(state, HUMAN, src, dice)
    if (opts.length === 0 && combos.length === 0) return
    setSelected(prev => (prev === src ? null : src))
  }

  const handleMoveTo = (target) => {
    // target is { kind:'point', idx } or { kind:'off' }
    if (selected === null || flyChecker) return
    const opts = legalForSource(state, HUMAN, selected, dice)
    let match = opts.find(o =>
      (target.kind === 'off' && o.dest.kind === 'off') ||
      (target.kind === 'point' && o.dest.kind === 'point' && o.dest.idx === target.idx))

    let combo = null
    if (!match) {
      combo = comboForSource(state, HUMAN, selected, dice).find(o =>
        (target.kind === 'off' && o.dest.kind === 'off') ||
        (target.kind === 'point' && o.dest.kind === 'point' && o.dest.idx === target.idx))
    }
    if (!match && !combo) return

    const src = selected
    const finalDest = match ? match.dest : combo.dest
    const destIdx = finalDest.kind === 'point' ? finalDest.idx : 'off'
    setSelected(null)

    flyAndCommit(src, destIdx, true, () => {
      let newState, remaining = [...dice]

      if (match) {
        newState = applyMove(state, HUMAN, src, match.die)
        const di = remaining.indexOf(match.die)
        if (di !== -1) remaining.splice(di, 1)
      } else {
        const midState = applyMove(state, HUMAN, src, combo.uses[0])
        newState = applyMove(midState, HUMAN, combo.mid, combo.uses[1])
        for (const d of combo.uses) {
          const di = remaining.indexOf(d)
          if (di !== -1) remaining.splice(di, 1)
        }
        addLog(tr('You moved {a} + {b} = {n} steps!', { a: combo.uses[0], b: combo.uses[1], n: combo.die }))
      }

      if (newState.barC > state.barC) playCapture(); else playMove()
      if (finalDest.kind === 'off') addLog(tr('You bear off a checker!'))
      else if (newState.barC > state.barC) addLog(tr('You hit a blot!') + ' 🎯')

      setState(newState)
      setDice(remaining)

      if (checkWin(newState)) return

      if (remaining.length === 0 || !anyLegalMove(newState, HUMAN, remaining)) {
        if (remaining.length > 0) addLog(tr('No more legal moves — turn passes.'))
        setTimeout(() => endTurn(), 500)
      }
    })
  }

  // ── Computer turn ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (turn !== COMP || gameOver) return
    setAiThinking(true)
    // 1) roll
    aiTimer.current = setTimeout(() => {
      const a = rollDie(), b = rollDie()
      const roll = a === b ? [a, a, a, a] : [a, b]
      playDiceRoll(); playDiceSettle()
      setAllDice([a, b]); setDice(roll); setRolled(true)
      addLog(tr('Computer rolled {a} & {b}', { a, b }) + (a === b ? ' ' + tr('(doubles!)') : ''))

      const s0 = stateRef.current.state
      if (!anyLegalMove(s0, COMP, roll)) {
        addLog(tr('Computer has no legal moves — turn skipped.'))
        aiTimer.current = setTimeout(() => { setAiThinking(false); endTurn() }, 800)
        return
      }

      // 2) compute full sequence, then animate it move-by-move
      const seq = aiChooseSequence(s0, roll)
      let s = s0
      let i = 0
      const step = () => {
        if (i >= seq.length) {
          if (checkWin(s)) { setAiThinking(false); return }
          aiTimer.current = setTimeout(() => { setAiThinking(false); endTurn() }, 500)
          return
        }
        const m = seq[i]
        const destResult = destFor(s, COMP, m.src, m.die)
        const destIdx = destResult?.kind === 'point' ? destResult.idx : 'off'
        i += 1
        flyAndCommit(m.src, destIdx, false, () => {
          const before = s
          s = applyMove(s, COMP, m.src, m.die)
          if (s.barH > before.barH) { playCapture(); addLog(tr('Computer hit your blot!') + ' 😬') } else playMove()
          setState(s)
          setDice(prev => {
            const r = [...prev]; const di = r.indexOf(m.die); if (di !== -1) r.splice(di, 1); return r
          })
          if (checkWin(s)) { setAiThinking(false); return }
          aiTimer.current = setTimeout(step, 300)
        })
      }
      aiTimer.current = setTimeout(step, 800)
    }, AI_DELAY)

    return () => { if (aiTimer.current) clearTimeout(aiTimer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, gameOver])

  // ── Derived: which destinations are highlighted for the selected source ───────
  const highlightDest = (() => {
    if (selected === null || turn !== HUMAN) return { points: new Set(), off: false }
    const opts = legalForSource(state, HUMAN, selected, dice)
    const combos = comboForSource(state, HUMAN, selected, dice)
    const pts = new Set()
    let off = false
    for (const o of [...opts, ...combos]) {
      if (o.dest.kind === 'off') off = true
      else pts.add(o.dest.idx)
    }
    return { points: pts, off }
  })()

  // sources the human could click right now (for subtle hinting)
  const movableSources = (() => {
    if (turn !== HUMAN || !rolled || gameOver) return new Set()
    return new Set(legalSources(state, HUMAN, dice).map(s => (s === 'bar' ? 'bar' : s)))
  })()

  const humanCanRoll = turn === HUMAN && !rolled && !gameOver
  const accentInk = theme?.accent || 'var(--accent)'
  const pieces = themePieces(theme)
  // A checker face: the theme character, or a number badge on a tall stack.
  const face = (isHuman, label) => (
    <>
      <img className="bg-face" draggable="false" alt="" src={isHuman ? pieces.human.image : pieces.comp.image} />
      {label ? <span className="bg-count">{label}</span> : null}
    </>
  )

  // ── Rendering a single point (triangle + stacked checkers) ────────────────────
  const renderPoint = (idx) => {
    const v = state.points[idx]
    const count = Math.abs(v)
    const owner = v > 0 ? HUMAN : v < 0 ? COMP : 0
    const isTop = idx >= 12 // top row holds indices 12..23, bottom 0..11
    const isHighlight = highlightDest.points.has(idx)
    const isMovable = movableSources.has(idx)
    const isSelected = selected === idx
    // alternating triangle tint
    const dark = idx % 2 === 0
    return (
      <div
        key={idx}
        ref={el => { pointRefs.current[idx] = el }}
        className={[
          'bg-point',
          isTop ? 'top' : 'bottom',
          dark ? 'dark' : 'light',
          isHighlight ? 'highlight' : '',
          isMovable ? 'movable' : '',
          isSelected ? 'selected' : '',
        ].join(' ')}
        onClick={() => {
          if (isHighlight) handleMoveTo({ kind: 'point', idx })
          else handleSelectSource(idx)
        }}
      >
        <div className="bg-triangle" />
        <div className="bg-stack">
          {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
            <motion.div
              key={`${owner === HUMAN ? 'h' : 'c'}-${idx}-${i}`}
              layoutId={`checker-${owner === HUMAN ? 'h' : 'c'}-${idx}-${i}`}
              className={`bg-checker ${owner === HUMAN ? 'human' : 'comp'}`}
              style={owner === HUMAN ? { background: accentInk } : undefined}
              layout
              transition={{ type: 'spring', stiffness: 90, damping: 22, mass: 1.2 }}
            >
              {face(owner === HUMAN, i === 4 && count > 5 ? count : '')}
            </motion.div>
          ))}
        </div>
        <span className="bg-point-num">{idx + 1}</span>
      </div>
    )
  }

  // top row: indices 23 down to 12 (left→right shows 24pt..13pt) — keep simple 12..23
  const topRow = []
  for (let i = 23; i >= 12; i--) topRow.push(i)
  const bottomRow = []
  for (let i = 0; i <= 11; i++) bottomRow.push(i)

  return (
    <div className="backgammon-screen screen">

      {/* ── Side panel ── */}
      <div className="bg-sidebar">
        <button className="btn btn-secondary back-btn" onClick={onBack}>← {t('Back')}</button>
        <div className="bg-sidebar-title">{theme?.emoji || '🎲'} Backgammon</div>
        <div className="bg-legend">
          <span><img src={pieces.human.image} alt="" /> {t('You')}</span>
          <span className="bg-legend-vs">{t('vs')}</span>
          <span><img src={pieces.comp.image} alt="" /> {t('Computer')}</span>
        </div>

        {/* Turn info */}
        <AnimatePresence mode="wait">
          <motion.div
            key={gameOver ? 'over' : aiThinking ? 'thinking' : turn === HUMAN ? (rolled ? 'move' : 'roll') : 'comp'}
            className="turn-banner bg-turn"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }}
            exit={{ opacity: 0, y: 6, transition: { duration: 0.18 } }}
          >
            {gameOver ? t('Game over')
              : aiThinking ? '🤖 ' + t('Thinking…')
              : turn === HUMAN
                ? (rolled ? t('Your move') : t('Your roll'))
                : t('Computer')}
          </motion.div>
        </AnimatePresence>

        {/* Dice */}
        <div className="bg-dice-row">
          <AnimatePresence mode="popLayout">
            {allDice.length === 0
              ? <motion.span key="empty" className="bg-dice-empty"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}>🎲</motion.span>
              : allDice.map((d, i) => (
                  <motion.span key={`${i}-${d}`} className="bg-die"
                    initial={{ opacity: 0, scale: 0.6, rotate: -15 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 260, damping: 20, delay: i * 0.07 } }}
                    exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.15 } }}
                  >
                    {(PIP_LAYOUT[d] || []).map(([col, row], k) => (
                      <span key={k} className="bg-pip" style={{ gridColumnStart: col, gridRowStart: row }} />
                    ))}
                  </motion.span>
                ))}
          </AnimatePresence>
        </div>

        {/* Controls */}
        {!gameOver && (
          <>
            <button className="btn btn-primary bg-roll-btn" disabled={!humanCanRoll} onClick={doRoll}>
              🎲 {t('Roll')}
            </button>
            <AnimatePresence>
              {turn === HUMAN && rolled && dice.length > 0 && (
                <motion.div className="bg-remaining"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto', transition: { duration: 0.28, ease: 'easeOut' } }}
                  exit={{ opacity: 0, height: 0, transition: { duration: 0.18 } }}
                >
                  {t('Dice left:')} {dice.join(' · ')}
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {selected !== null && (
                <motion.button className="btn btn-secondary"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.22 } }}
                  exit={{ opacity: 0, y: 6, transition: { duration: 0.15 } }}
                  onClick={() => setSelected(null)}
                >{t('Deselect')}</motion.button>
              )}
            </AnimatePresence>
          </>
        )}
        <AnimatePresence>
          {gameOver && (
            <motion.div className="bg-gameover-btns"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }}
              exit={{ opacity: 0 }}
            >
              <button className="btn btn-primary" onClick={reset}>{t('Play Again')}</button>
              <button className="btn btn-secondary" onClick={onBack}>{t('Menu')}</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Log */}
        <div className="log-box bg-log">
          {log.map((l, i) => <div key={i} className={`log-line ${i === 0 ? 'new' : ''}`}>{l}</div>)}
        </div>
      </div>

      {/* ── Board area ── */}
      <div className="bg-main">
        <AnimatePresence mode="wait">
          {gameOver ? (
            <motion.div key="over" className="gameover" variants={gameoverVariants} initial="initial" animate="animate">
              <div className="gameover-emoji">{winner === HUMAN ? '🏆' : '🤖'}</div>
              <h2>{winner === HUMAN ? t('You win!') : t('{name} wins!', { name: t('Computer') })}</h2>
              <p>{winner === HUMAN ? t('All 15 checkers borne off!') : t('Better luck next time!')}</p>
            </motion.div>
          ) : (
            <motion.div key="play" className="bg-table-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.3 } }}>
              <LayoutGroup>
              {/* Off trays */}
              <div className="bg-side">
                <div className="bg-off comp" title={t('Computer borne off')}>
                  <span className="bg-off-label">🤖 {t('off')}</span>
                  <span className="bg-off-count">{state.offC}</span>
                </div>
                <div
                  className={`bg-off human ${highlightDest.off ? 'highlight' : ''}`}
                  style={highlightDest.off ? { '--off-accent': accentInk } : undefined}
                  onClick={() => highlightDest.off && handleMoveTo({ kind: 'off' })}
                  title={t('Your bear-off tray')}
                >
                  <span className="bg-off-label">🙂 {t('off')}</span>
                  <span className="bg-off-count">{state.offH}</span>
                </div>
              </div>

              <div className="bg-table" ref={boardRef} style={{ position: 'relative' }}>
                {/* Flying checker overlay */}
                <AnimatePresence>
                  {flyChecker && (
                    <motion.div
                      className={`bg-checker ${flyChecker.isHuman ? 'human' : 'comp'} fly-checker`}
                      style={{
                        position: 'absolute',
                        left: flyChecker.x - 17,
                        top:  flyChecker.y - 17,
                        zIndex: 200,
                        pointerEvents: 'none',
                        ...(flyChecker.isHuman ? { background: accentInk } : {}),
                      }}
                      initial={{ x: 0, y: 0, scale: 1.15, opacity: 1 }}
                      animate={{
                        x: flyChecker.tx - flyChecker.x,
                        y: flyChecker.ty - flyChecker.y,
                        scale: 1,
                        opacity: 1,
                      }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.48, ease: [0.25, 0.1, 0.25, 1] }}
                    >{face(flyChecker.isHuman)}</motion.div>
                  )}
                </AnimatePresence>
                <div className="bg-row bg-top">
                  {topRow.slice(0, 6).map(renderPoint)}
                  <div className="bg-rail" />
                  {topRow.slice(6).map(renderPoint)}
                </div>
                <div className="bg-bar">
                  <div className="bg-bar-cell comp" ref={barCRef} title={t('Computer bar')}>
                    {state.barC > 0 && (
                      <motion.div layoutId="checker-c-bar-0" layout
                        transition={{ type: 'spring', stiffness: 90, damping: 22, mass: 1.2 }}
                        className="bg-checker comp bar-checker">{face(false, state.barC > 1 ? state.barC : '')}</motion.div>
                    )}
                  </div>
                  <div className="bg-bar-mid" />
                  <div
                    className={`bg-bar-cell human ${state.barH > 0 && movableSources.has('bar') ? 'movable' : ''} ${selected === 'bar' ? 'selected' : ''}`}
                    ref={barHRef}
                    onClick={() => handleSelectSource('bar')}
                    title={t('Your bar — re-enter first!')}
                  >
                    {state.barH > 0 && (
                      <motion.div layoutId="checker-h-bar-0" layout
                        transition={{ type: 'spring', stiffness: 90, damping: 22, mass: 1.2 }}
                        className="bg-checker human bar-checker" style={{ background: accentInk }}>
                        {face(true, state.barH > 1 ? state.barH : '')}
                      </motion.div>
                    )}
                  </div>
                </div>
                <div className="bg-row bg-bottom">
                  {bottomRow.slice(0, 6).map(renderPoint)}
                  <div className="bg-rail" />
                  {bottomRow.slice(6).map(renderPoint)}
                </div>
              </div>
              </LayoutGroup>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  )
}
