import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import ThemeIcon from '../../components/ThemeIcon'
import './Domino.css'
import { playMove, playDraw, playWin } from '../../sound/sfx'

// ─── domino helpers ───────────────────────────────────────────────────────────
// A tile is { a, b, id }. The "line" stores oriented tiles { left, right, id }.
function buildSet() {
  const tiles = []
  for (let a = 0; a <= 6; a++)
    for (let b = a; b <= 6; b++)
      tiles.push({ a, b, id: `${a}-${b}` })
  return tiles
}
function shuffle(arr) {
  const x = [...arr]
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]]
  }
  return x
}

const pipTotal = (hand) => hand.reduce((s, t) => s + t.a + t.b, 0)

// can a tile play on a given open end value?
const tileMatches = (tile, end) => tile.a === end || tile.b === end

const AI_DELAY = 850

const gameoverVariants = {
  initial: { opacity: 0, scale: 0.85, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
}

// Tile artwork lives in /public/domino as `lo-hi.svg` — a standing tile with
// the lower number on top. We pick the file and rotate it to the right pose.
function DominoTile({ a, b, vertical, unit = 44, className = '', onClick, style }) {
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  const src = `/domino/${lo}-${hi}.svg`
  // Source image: `lo` on top, `hi` on the bottom.
  let rot
  if (vertical) {
    rot = a === lo ? 0 : 180          // standing; show `a` on top
  } else {
    rot = a === lo ? -90 : 90         // lying down; show `a` on the left end
  }
  // `unit` is the domino's short side. Standing = unit × 2·unit; lying = 2·unit × unit.
  const boxW = vertical ? unit : unit * 2
  const boxH = vertical ? unit * 2 : unit
  return (
    <div
      className={`domino-tile ${vertical ? 'vertical' : 'horizontal'} ${className}`}
      onClick={onClick}
      style={{ width: boxW, height: boxH, ...style }}
    >
      <img
        className="domino-img"
        src={src}
        alt={`${a}-${b}`}
        draggable={false}
        style={{ width: unit, height: unit * 2, transform: `rotate(${rot}deg)` }}
      />
    </div>
  )
}

const HAND_UNIT = 56  // hand tiles are fixed and chunky

export default function DominoGame({ onBack }) {
  const { themeId } = useTheme()

  const [hand,    setHand]    = useState([])   // human
  const [aiHand,  setAiHand]  = useState([])
  const [line,    setLine]    = useState([])   // [{left,right,id}] left→right
  const [boneyard, setBoneyard] = useState([])
  const [turn,    setTurn]    = useState('human')
  const [gameOver, setGameOver] = useState(false)
  const [winner,  setWinner]  = useState(null)
  const [winReason, setWinReason] = useState('')
  const [pendingTile, setPendingTile] = useState(null) // tile awaiting end choice
  const [aiThinking, setAiThinking] = useState(false)
  const [log,     setLog]     = useState(['New game! Match the open ends.'])

  const aiTimer = useRef(null)
  const stateRef = useRef({})
  stateRef.current = { aiHand, line, boneyard, gameOver, hand, turn, aiThinking }

  const addLog = (msg) => setLog(prev => [msg, ...prev].slice(0, 4))

  const ends = line.length ? [line[0].left, line[line.length - 1].right] : null
  const leftEnd  = ends ? ends[0] : null
  const rightEnd = ends ? ends[1] : null

  // Auto-size the played line so every tile stays visible: shrink the unit as
  // the line grows, only falling back to scrolling once tiles hit the minimum.
  const lineWrapRef = useRef(null)
  const [boardUnit, setBoardUnit] = useState(34)
  useEffect(() => {
    const el = lineWrapRef.current
    if (!el) return undefined
    const GAP = 2, PAD = 30, MIN = 14, MAX = 44
    const ro = new ResizeObserver(() => {
      const avail = el.clientWidth - PAD
      const weighted = line.reduce((s, t) => s + (t.left === t.right ? 1 : 2), 0) || 1
      const gaps = Math.max(0, line.length - 1) * GAP
      const u = Math.floor((avail - gaps) / weighted)
      setBoardUnit(Math.max(MIN, Math.min(MAX, u)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [line])

  const restart = () => {
    if (aiTimer.current) { clearTimeout(aiTimer.current); aiTimer.current = null }
    const deck = shuffle(buildSet())
    const h0 = deck.slice(0, 7)
    const h1 = deck.slice(7, 14)
    const rest = deck.slice(14)
    setHand(h0); setAiHand(h1); setBoneyard(rest)
    setLine([]); setTurn('human')
    setGameOver(false); setWinner(null); setWinReason('')
    setPendingTile(null); setAiThinking(false)
    setLog(['New game! Play any tile to start.'])
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { restart() }, [])
  useEffect(() => () => { if (aiTimer.current) clearTimeout(aiTimer.current) }, [])

  // can a hand make any move given current line ends?
  const hasMove = (h, ln) => {
    if (ln.length === 0) return h.length > 0
    const l = ln[0].left, r = ln[ln.length - 1].right
    return h.some(t => tileMatches(t, l) || tileMatches(t, r))
  }

  // place a tile from hand onto a chosen end ('left'|'right'|'start')
  const placeTile = (tile, side, fromHuman) => {
    let newLine
    if (line.length === 0) {
      newLine = [{ left: tile.a, right: tile.b, id: tile.id }]
    } else if (side === 'left') {
      // tile must connect to current left end; orient so its matching value is on the right (touching the line)
      const end = line[0].left
      const oriented = tile.b === end
        ? { left: tile.a, right: tile.b, id: tile.id }
        : { left: tile.b, right: tile.a, id: tile.id }
      newLine = [oriented, ...line]
    } else {
      const end = line[line.length - 1].right
      const oriented = tile.a === end
        ? { left: tile.a, right: tile.b, id: tile.id }
        : { left: tile.b, right: tile.a, id: tile.id }
      newLine = [...line, oriented]
    }
    setLine(newLine)
    playMove()

    if (fromHuman) {
      const nh = hand.filter(t => t.id !== tile.id)
      setHand(nh)
      addLog(`You played ${tile.a}|${tile.b}.`)
      if (nh.length === 0) return endGame('human', 'emptied their hand')
      setTurn('ai')
    } else {
      const nh = aiHand.filter(t => t.id !== tile.id)
      setAiHand(nh)
      addLog(`🤖 played ${tile.a}|${tile.b}.`)
      if (nh.length === 0) return endGame('comp', 'emptied their hand')
      setTurn('human')
    }
    return newLine
  }

  const endGame = (who, reason) => {
    playWin()
    setGameOver(true); setWinner(who); setWinReason(reason)
    setAiThinking(false)
  }

  // resolve a blocked game by pip count
  const resolveBlocked = (humanHand, compHand) => {
    const hp = pipTotal(humanHand), cp = pipTotal(compHand)
    if (hp < cp)      endGame('human', `lower pips (${hp} vs ${cp})`)
    else if (cp < hp) endGame('comp',  `lower pips (${cp} vs ${hp})`)
    else              endGame('human', `tie on pips (${hp}) — you win!`)
  }

  // ── human actions ─────────────────────────────────────────────────────────
  const playableEnds = (tile) => {
    if (line.length === 0) return ['start']
    const out = []
    if (tileMatches(tile, leftEnd)) out.push('left')
    if (tileMatches(tile, rightEnd)) out.push('right')
    return out
  }

  // Read LIVE state: a tile that is fading out of the hand keeps its old click
  // handler for a moment, so stale closures must not be trusted here.
  const humanMayAct = (tile) => {
    const live = stateRef.current
    if (live.turn !== 'human' || live.gameOver || live.aiThinking) return false
    return !tile || live.hand.some(t => t.id === tile.id)
  }

  const handleTileClick = (tile) => {
    if (!humanMayAct(tile)) return
    const opts = playableEnds(tile)
    if (opts.length === 0) return
    if (opts.length === 1) {
      setPendingTile(null)
      placeTile(tile, opts[0], true)
    } else {
      // both ends match — ask which
      setPendingTile(tile)
    }
  }

  const chooseEnd = (side) => {
    if (!pendingTile || !humanMayAct(pendingTile)) { setPendingTile(null); return }
    const t = pendingTile
    setPendingTile(null)
    placeTile(t, side, true)
  }

  const handleDrawOrPass = () => {
    if (!humanMayAct()) return
    // draw until playable or boneyard empty
    let yard = [...boneyard]
    let h = [...hand]
    let drew = false
    while (yard.length && !hasMove(h, line)) {
      h.push(yard.shift())
      drew = true
    }
    if (drew) playDraw()
    setBoneyard(yard)
    setHand(h)
    if (hasMove(h, line)) {
      addLog(drew ? 'You drew a tile — now play it!' : 'You can play!')
      return // stay on human turn to play the drawn tile
    }
    // cannot move at all → pass
    addLog(drew ? 'You drew but still cannot play — pass.' : 'No moves — you pass.')
    // if neither side can move and boneyard empty → blocked
    if (yard.length === 0 && !hasMove(aiHand, line)) {
      return resolveBlocked(h, aiHand)
    }
    setTurn('ai')
  }

  const humanCanPlay = turn === 'human' && !gameOver && !aiThinking &&
    hand.some(t => playableEnds(t).length > 0)

  // ── AI turn ─────────────────────────────────────────────────────────────────
  const runAI = () => {
    const { aiHand: ah, line: ln, boneyard: by, gameOver: go } = stateRef.current
    if (go) { setAiThinking(false); return }

    let yard = [...by]
    let hand2 = [...ah]
    // draw until can move or yard empty
    while (yard.length && !hasMove(hand2, ln)) {
      hand2.push(yard.shift())
    }
    if (yard.length !== by.length) {
      setBoneyard(yard)
      setAiHand(hand2)
      addLog('🤖 drew from the boneyard.')
    }

    if (!hasMove(hand2, ln)) {
      // AI passes
      addLog('🤖 cannot play — passes.')
      setAiThinking(false)
      // blocked check: human also stuck & yard empty
      if (yard.length === 0 && !hasMove(hand, ln)) {
        return resolveBlocked(hand, hand2)
      }
      setTurn('human')
      return
    }

    // choose a tile: simple AI prefers dumping highest pip tile that fits
    const l = ln.length ? ln[0].left : null
    const r = ln.length ? ln[ln.length - 1].right : null
    const candidates = hand2
      .map(t => {
        let side = null
        if (ln.length === 0) side = 'start'
        else if (tileMatches(t, r)) side = 'right'
        else if (tileMatches(t, l)) side = 'left'
        return side ? { t, side, weight: t.a + t.b } : null
      })
      .filter(Boolean)
      .sort((x, y) => y.weight - x.weight)

    const pick = candidates[0]
    setAiThinking(false)
    // place using the freshly-drawn hand
    placeTileFor(pick.t, pick.side, hand2, ln)
  }

  // variant of placeTile that uses explicit ai hand/line (post-draw)
  const placeTileFor = (tile, side, aiHandNow, lineNow) => {
    let newLine
    if (lineNow.length === 0) {
      newLine = [{ left: tile.a, right: tile.b, id: tile.id }]
    } else if (side === 'left') {
      const end = lineNow[0].left
      const oriented = tile.b === end
        ? { left: tile.a, right: tile.b, id: tile.id }
        : { left: tile.b, right: tile.a, id: tile.id }
      newLine = [oriented, ...lineNow]
    } else {
      const end = lineNow[lineNow.length - 1].right
      const oriented = tile.a === end
        ? { left: tile.a, right: tile.b, id: tile.id }
        : { left: tile.b, right: tile.a, id: tile.id }
      newLine = [...lineNow, oriented]
    }
    setLine(newLine)
    playMove()
    const nh = aiHandNow.filter(t => t.id !== tile.id)
    setAiHand(nh)
    addLog(`🤖 played ${tile.a}|${tile.b}.`)
    if (nh.length === 0) return endGame('comp', 'emptied their hand')
    setTurn('human')
  }

  useEffect(() => {
    if (turn !== 'ai' || gameOver) return
    setAiThinking(true)
    aiTimer.current = setTimeout(runAI, AI_DELAY)
    return () => { if (aiTimer.current) clearTimeout(aiTimer.current) }
  }, [turn, gameOver]) // eslint-disable-line

  const status = gameOver
    ? ''
    : aiThinking ? '🤖 Computer is thinking...'
    : turn === 'human'
      ? (humanCanPlay ? 'Your turn — tap a playable tile.' : 'No play — tap Draw / Pass.')
      : "Computer's turn"

  return (
    <div className="domino-screen screen">
      <div className="game-header">
        <button className="btn btn-secondary back-btn" onClick={onBack}>← Back</button>
        <h2><span style={{ display: 'inline-flex', verticalAlign: '-0.2em' }}><ThemeIcon themeId={themeId} size={28} /></span> Dominoes</h2>
        <div className="scores">
          <span className="score p1">🙂 {hand.length}</span>
          <span className="score p2">🤖 {aiHand.length}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {gameOver ? (
          <motion.div
            key="gameover"
            className="gameover"
            variants={gameoverVariants}
            initial="initial"
            animate="animate"
          >
            <div className="gameover-emoji">{winner === 'human' ? '🏆' : '🤖'}</div>
            <h2>{winner === 'human' ? 'You win!' : 'Computer wins!'}</h2>
            <p>{winReason ? `Won by ${winReason}.` : ''}</p>
            <div className="gameover-btns">
              <button className="btn btn-primary" onClick={restart}>Play Again</button>
              <button className="btn btn-secondary" onClick={onBack}>Menu</button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="playing"
            className="domino-play"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.3 } }}
          >
            <div className="turn-banner">{status}</div>

            <div className="domino-info">
              <span>Boneyard: {boneyard.length}</span>
              {ends && <span>Open ends: {leftEnd} &nbsp;…&nbsp; {rightEnd}</span>}
            </div>

            {/* played line */}
            <div className="domino-line-wrap" ref={lineWrapRef}>
              <div className="domino-line">
                {line.length === 0 && <div className="domino-empty">Play your first tile here ↓</div>}
                <AnimatePresence>
                  {line.map(t => {
                    const isDouble = t.left === t.right
                    return (
                      <motion.div
                        key={t.id}
                        layout="position"
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.7, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 280, damping: 30, mass: 0.9 }}
                      >
                        <DominoTile a={t.left} b={t.right} vertical={isDouble} unit={boardUnit} className="placed" />
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* end picker */}
            <AnimatePresence>
              {pendingTile && (
                <motion.div
                  className="end-picker"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <span>Play {pendingTile.a}|{pendingTile.b} on which end?</span>
                  <button className="btn btn-primary" onClick={() => chooseEnd('left')}>Left ({leftEnd})</button>
                  <button className="btn btn-primary" onClick={() => chooseEnd('right')}>Right ({rightEnd})</button>
                  <button className="btn btn-secondary" onClick={() => setPendingTile(null)}>Cancel</button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* human hand */}
            <div className="domino-hand-label">Your tiles</div>
            <div className="domino-hand">
              <AnimatePresence>
                {hand.map(t => {
                  const playable = turn === 'human' && !aiThinking && playableEnds(t).length > 0
                  return (
                    <motion.div
                      key={t.id}
                      layout="position"
                      initial={{ y: 30, opacity: 0, scale: 0.9 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: -24, opacity: 0, scale: 0.9, transition: { duration: 0.28, ease: 'easeInOut' } }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      whileHover={playable ? { y: -10, scale: 1.06 } : {}}
                      whileTap={playable ? { scale: 0.95 } : {}}
                    >
                      <DominoTile
                        a={t.a}
                        b={t.b}
                        vertical
                        unit={HAND_UNIT}
                        className={`hand-tile ${playable ? 'playable' : 'dim'}`}
                        onClick={() => playable && handleTileClick(t)}
                      />
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {turn === 'human' && !humanCanPlay && !gameOver && (
              <button className="btn btn-primary" onClick={handleDrawOrPass}>
                {boneyard.length ? 'Draw a tile' : 'Pass'}
              </button>
            )}

            <div className="log-box">
              {log.map((l, i) => <div key={i} className={`log-line ${i === 0 ? 'new' : ''}`}>{l}</div>)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
