import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UNO_COLORS, UNO_COLOR_HEX, UNO_COLOR_EMOJIS } from '../../data/animals'
import { useTheme } from '../../context/ThemeContext'
import ThemeIcon from '../../components/ThemeIcon'
import './Uno.css'
import { playCard, playDraw, playWin } from '../../sound/sfx'

// ─── Card back showing the active theme icon ──────────────────────────────────
function CardBack({ themeId, small, onClick, clickable }) {
  return (
    <div
      className={`uno-card-back${small ? ' small' : ''}${clickable ? ' clickable' : ''}`}
      onClick={onClick}
    >
      <span className="card-back-medallion">
        <ThemeIcon themeId={themeId} size={small ? 26 : 34} />
      </span>
    </div>
  )
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function buildDeck(colors) {
  const deck = []
  colors.forEach(color => {
    for (let n = 0; n <= 9; n++) {
      deck.push({ type: 'number', color, value: n, id: `${color}-${n}-a` })
      if (n > 0) deck.push({ type: 'number', color, value: n, id: `${color}-${n}-b` })
    }
    for (const s of ['skip', 'reverse', 'draw2']) {
      deck.push({ type: 'special', color, value: s, id: `${color}-${s}-a` })
      deck.push({ type: 'special', color, value: s, id: `${color}-${s}-b` })
    }
  })
  for (let i = 0; i < 4; i++) {
    deck.push({ type: 'wild', color: 'wild', value: 'wild',  id: `wild-${i}`  })
    deck.push({ type: 'wild', color: 'wild', value: 'wild4', id: `wild4-${i}` })
  }
  return deck
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// When the draw pile can't cover `need` cards, shuffle the played cards
// (everything except the top card) back into it — like the real game.
function refillDeck(deck, pile, need) {
  if (deck.length >= need || pile.length <= 1) return { deck, pile, reshuffled: false }
  return {
    deck: [...deck, ...shuffle(pile.slice(0, -1))],
    pile: [pile[pile.length - 1]],
    reshuffled: true,
  }
}

function canPlay(card, top, activeColor) {
  if (!top) return false
  if (card.type === 'wild') return true
  const col = activeColor || top.color
  if (card.color === col) return true
  if (card.type === 'number'  && top.type === 'number'  && card.value === top.value) return true
  if (card.type === 'special' && top.type === 'special' && card.value === top.value) return true
  return false
}

function label(card) {
  if (!card) return ''
  if (card.type === 'number') return String(card.value)
  const map = { skip: '🚫', reverse: '🔄', draw2: '+2', wild: '🌈', wild4: '🌈+4' }
  return map[card.value] ?? '?'
}

const COLOR_SORT = ['red', 'green', 'blue', 'yellow', 'wild']
const VALUE_SORT = [0,1,2,3,4,5,6,7,8,9,'skip','reverse','draw2','wild','wild4']

function sortHand(hand) {
  return [...hand].sort((a, b) => {
    const ci = COLOR_SORT.indexOf(a.color) - COLOR_SORT.indexOf(b.color)
    if (ci !== 0) return ci
    return VALUE_SORT.indexOf(a.value) - VALUE_SORT.indexOf(b.value)
  })
}

// ─── component ───────────────────────────────────────────────────────────────

// ─── Scoring helpers ─────────────────────────────────────────────────────────

function calcScore(hand) {
  return hand.reduce((sum, c) => sum + (c.type === 'number' ? 1 : 2), 0)
}

function loadScores() {
  try { return JSON.parse(localStorage.getItem('uno-scores') || '[]') } catch { return [] }
}

function persistScore(entry) {
  const list = [...loadScores(), entry]
  list.sort((a, b) => b.score - a.score)
  const top5 = list.slice(0, 5)
  localStorage.setItem('uno-scores', JSON.stringify(top5))
  return top5
}

const AI_DELAY = 900

const gameoverVariants = {
  initial: { opacity: 0, scale: 0.85, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
}

export default function UnoGame({ mode, onBack }) {
  const { themeId } = useTheme()
  const is2P = mode === '2player'
  const [colorCount, setColorCount] = useState(4)

  // game state
  const [deck,          setDeck]          = useState([])
  const [hands,         setHands]         = useState([[], []])
  const [pile,          setPile]          = useState([])
  const [activeColor,   setActiveColor]   = useState(null)
  const [turn,          setTurn]          = useState(0)
  const [gameOver,      setGameOver]      = useState(false)
  const [winner,        setWinner]        = useState(null)
  const [log,           setLog]           = useState([])
  const [aiThinking,    setAiThinking]    = useState(false)
  const [choosingColor, setChoosingColor] = useState(false)
  const [pendingWild,   setPendingWild]   = useState(null)
  const [gameScore,     setGameScore]     = useState(null)
  const [newScoreId,    setNewScoreId]    = useState(null)
  const [allScores,     setAllScores]     = useState(loadScores)

  // refs — avoid stale closures in AI timer without triggering re-renders
  const stateRef  = useRef({})
  const aiLock    = useRef(false)
  const aiTimer   = useRef(null)

  stateRef.current = { deck, hands, pile, activeColor, turn, gameOver, colorCount }

  const addLog = (msg) => setLog(prev => [msg, ...prev].slice(0, 5))

  // ── start / restart ───────────────────────────────────────────────────────
  const startGame = (colors) => {
    if (aiTimer.current) { clearTimeout(aiTimer.current); aiTimer.current = null }
    aiLock.current = false

    const full = shuffle(buildDeck(colors))
    const h0   = full.slice(0, 7)
    const h1   = full.slice(7, 14)
    let si = 14
    while (full[si] && full[si].type !== 'number') si++
    const top  = full[si]
    const rest = full.filter((_, i) => i < 14 || i === si ? false : true)

    setDeck(rest); setHands([h0, h1]); setPile([top])
    setActiveColor(top.color); setTurn(0)
    setGameOver(false); setWinner(null); setGameScore(null); setNewScoreId(null)
    setLog(['Game started! Match colour or number.'])
    setAiThinking(false); setChoosingColor(false); setPendingWild(null)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { startGame(UNO_COLORS.slice(0, colorCount)) }, [])

  // ── core play-card logic (reads fresh state via ref) ──────────────────────
  const applyCard = (cardId, chosenColor) => {
    const { deck: d, hands: h, pile: p, activeColor: ac, turn: t } = stateRef.current
    const hand     = h[t]
    const cardIdx  = hand.findIndex(c => c.id === cardId)
    if (cardIdx === -1) return false

    const card    = hand[cardIdx]
    const topCard = p[p.length - 1]
    if (!canPlay(card, topCard, ac)) return false

    const newHand  = hand.filter((_, i) => i !== cardIdx)
    let   newHands = h.map((hh, i) => i === t ? newHand : [...hh])
    const need     = card.value === 'draw2' ? 2 : card.value === 'wild4' ? 4 : 0
    const refill   = refillDeck(d, p, need)
    let   newDeck  = [...refill.deck]
    if (refill.reshuffled) addLog('🔀 Shuffled the played cards back into the deck.')
    let   goAgain  = false
    const newColor = card.type === 'wild' ? chosenColor : card.color

    if (card.value === 'skip' || card.value === 'reverse') {
      goAgain = true
      addLog(`${t === 0 ? (is2P ? 'P1' : 'You') : (is2P ? 'P2' : '🤖')} plays ${label(card)}!`)
    } else if (card.value === 'draw2') {
      newHands[1 - t] = [...newHands[1 - t], ...newDeck.splice(0, 2)]
      goAgain = true
      addLog(`${t === 0 ? (is2P ? 'P1' : 'You') : (is2P ? 'P2' : '🤖')} plays +2! 😬`)
    } else if (card.value === 'wild4') {
      newHands[1 - t] = [...newHands[1 - t], ...newDeck.splice(0, 4)]
      goAgain = true
      addLog(`${t === 0 ? (is2P ? 'P1' : 'You') : (is2P ? 'P2' : '🤖')} plays Wild +4! 🌈`)
    } else if (card.value === 'wild') {
      addLog(`${t === 0 ? (is2P ? 'P1' : 'You') : (is2P ? 'P2' : '🤖')} plays Wild → ${chosenColor}!`)
    } else {
      addLog(`${t === 0 ? (is2P ? 'P1' : 'You') : (is2P ? 'P2' : '🤖')} plays ${label(card)} ${UNO_COLOR_EMOJIS[card.color] ?? ''}`)
    }

    playCard()
    setHands(newHands)
    setPile([...refill.pile, card])
    setActiveColor(newColor)
    setDeck(newDeck)

    if (newHand.length === 0) {
      const pts      = calcScore(newHands[1 - t])
      const winName  = t === 0 ? (is2P ? 'Player 1' : 'You') : (is2P ? 'Player 2' : 'Computer')
      const sid      = Date.now()
      const entry    = {
        winner: winName, score: pts, id: sid,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      }
      const top5 = persistScore(entry)
      setGameScore(pts)
      setNewScoreId(sid)
      setAllScores(top5)
      playWin()
      setGameOver(true)
      setWinner(t)
      return false
    }

    setTurn(goAgain ? t : 1 - t)
    return goAgain
  }

  // ── AI ────────────────────────────────────────────────────────────────────
  const runAI = () => {
    const { deck: d, hands: h, pile: p, activeColor: ac, gameOver: go, colorCount: cc } = stateRef.current
    if (go) { aiLock.current = false; setAiThinking(false); return }

    const colors  = UNO_COLORS.slice(0, cc)
    const aiHand  = h[1]
    const top     = p[p.length - 1]
    const playable = aiHand.filter(c => canPlay(c, top, ac))

    let goAgain = false

    if (playable.length === 0) {
      const refill = refillDeck(d, p, 1)
      if (refill.reshuffled) { setPile(refill.pile); addLog('🔀 Shuffled the played cards back into the deck.') }
      if (refill.deck.length > 0) {
        const drawn = refill.deck[0]
        playDraw()
        setHands(prev => prev.map((hh, i) => i === 1 ? [...hh, drawn] : hh))
        setDeck(refill.deck.slice(1))
        addLog('🤖 Computer draws a card.')
      }
      setTurn(0)
    } else {
      const chosen = playable.find(c => c.type === 'special')
                  ?? playable.find(c => c.type === 'wild')
                  ?? playable[0]

      if (chosen.type === 'wild') {
        const counts = {}
        aiHand.forEach(c => { if (c.color !== 'wild') counts[c.color] = (counts[c.color] || 0) + 1 })
        const best = colors.reduce((a, b) => (counts[b] || 0) > (counts[a] || 0) ? b : a, colors[0])
        goAgain = applyCard(chosen.id, best)
      } else {
        goAgain = applyCard(chosen.id)
      }
    }

    if (goAgain && !stateRef.current.gameOver) {
      aiTimer.current = setTimeout(runAI, AI_DELAY)
    } else {
      aiLock.current = false
      setAiThinking(false)
    }
  }

  useEffect(() => {
    if (is2P || turn !== 1 || gameOver || choosingColor) return
    if (aiLock.current) return

    aiLock.current = true
    setAiThinking(true)
    aiTimer.current = setTimeout(runAI, AI_DELAY)
  }, [turn, gameOver, choosingColor]) // eslint-disable-line

  // ── player actions ────────────────────────────────────────────────────────
  const handlePlayerCard = (cardId) => {
    if (aiThinking || gameOver) return
    if (!is2P && turn !== 0) return
    const card = hands[turn].find(c => c.id === cardId)
    if (!card || !canPlay(card, pile[pile.length - 1], activeColor)) return
    if (card.type === 'wild') { setPendingWild(cardId); setChoosingColor(true); return }
    applyCard(cardId)
  }

  const handleColorChoice = (color) => {
    setChoosingColor(false)
    if (pendingWild) applyCard(pendingWild, color)
    setPendingWild(null)
  }

  const handleDraw = () => {
    if (aiThinking || gameOver) return
    if (!is2P && turn !== 0) return
    const drawer = turn
    const refill = refillDeck(deck, pile, 1)
    if (refill.reshuffled) { setPile(refill.pile); addLog('🔀 Shuffled the played cards back into the deck.') }
    if (refill.deck.length > 0) {
      const drawn = refill.deck[0]
      playDraw()
      setHands(prev => prev.map((h, i) => i === drawer ? [...h, drawn] : h))
      setDeck(refill.deck.slice(1))
      addLog(drawer === 0 ? (is2P ? 'Player 1 drew a card.' : 'You drew a card.') : 'Player 2 drew a card.')
    } else {
      addLog('No cards left to draw — turn passes.')
    }
    setTurn(1 - drawer)
  }

  // ── render ────────────────────────────────────────────────────────────────
  const topCard = pile[pile.length - 1]
  if (!topCard) return null

  const colors = UNO_COLORS.slice(0, colorCount)

  return (
    <div className="uno-screen screen">
      <div className="game-header">
        <button className="btn btn-secondary back-btn" onClick={onBack}>← Back</button>
        <h2>🎴 Colour Clash</h2>
        <div className="uno-header-right">
          <div className="color-count-toggle">
            <button className={colorCount === 2 ? 'active' : ''} onClick={() => { setColorCount(2); startGame(UNO_COLORS.slice(0, 2)) }}>2 colours</button>
            <button className={colorCount === 4 ? 'active' : ''} onClick={() => { setColorCount(4); startGame(UNO_COLORS.slice(0, 4)) }}>4 colours</button>
          </div>
          <div className="scores">
            <span className="score p1">🙂 {hands[0].length}</span>
            <span className="score p2">{is2P ? '👤' : '🤖'} {hands[1].length}</span>
          </div>
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
            <div className="gameover-emoji">🎉</div>
            <h2>{winner === 0 ? (is2P ? 'Player 1 wins!' : 'You win!') : (is2P ? 'Player 2 wins!' : 'Computer wins!')}</h2>

            {gameScore !== null && (
              <div className="score-earned">
                Points scored this round
                <strong>{gameScore} pts</strong>
              </div>
            )}

            <div className="scoreboard">
              <div className="scoreboard-title">Top 5 Games</div>
              {allScores.length === 0
                ? <div className="scoreboard-empty">No games recorded yet</div>
                : allScores.map((s, i) => (
                    <div key={s.id ?? i} className={`scoreboard-row${s.id === newScoreId ? ' is-new' : ''}`}>
                      <span className={`scoreboard-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}`}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                      </span>
                      <span className="scoreboard-winner">{s.winner}</span>
                      <span className="scoreboard-pts">{s.score} pts</span>
                      <span className="scoreboard-date">{s.date}</span>
                    </div>
                  ))
              }
            </div>

            <div className="gameover-btns">
              <button className="btn btn-primary" onClick={() => startGame(colors)}>Play Again</button>
              <button className="btn btn-secondary" onClick={onBack}>Menu</button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="playing"
            className="uno-play"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.3 } }}
          >
            {/* Opponent hand */}
            <div className={`opponent-hand${is2P ? ' peek-hand' : ''}`} style={{ '--n': hands[1].length }}>
              <AnimatePresence>
                {sortHand(hands[1]).map(c => (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ y: -30, opacity: 0, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -20, opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  >
                    {is2P ? (
                      <div
                        className={`uno-card peek${turn === 1 ? ' clickable' : ''}`}
                        data-color={c.color}
                        style={{ '--card-bg': UNO_COLOR_HEX[c.color] ?? '#555' }}
                        onClick={() => turn === 1 && handlePlayerCard(c.id)}
                      >
                        <span className="card-corner card-tl">{label(c)}</span>
                        <span className="uno-card-val">{label(c)}</span>
                        <span className="card-corner card-br">{label(c)}</span>
                      </div>
                    ) : (
                      <CardBack themeId={themeId} />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Center area */}
            <div className="uno-center">
              <motion.div
                className="deck-pile"
                onClick={handleDraw}
                whileHover={{ scale: 1.08, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.95 }}
              >
                <CardBack themeId={themeId} />
                <div className="deck-count">{deck.length}</div>
              </motion.div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={topCard.id}
                  className="top-card"
                  data-color={topCard.color === 'wild' ? 'wild' : activeColor}
                  style={{ '--card-bg': UNO_COLOR_HEX[activeColor] ?? '#555' }}
                  initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                >
                  <span className="card-corner card-tl">{label(topCard)}</span>
                  <div className="card-center-val">{label(topCard)}</div>
                  <span className="card-corner card-br">{label(topCard)}</span>
                </motion.div>
              </AnimatePresence>

              <div className="active-color-badge" style={{ background: UNO_COLOR_HEX[activeColor] }}>
                {UNO_COLOR_EMOJIS[activeColor]} {activeColor}
              </div>
            </div>

            <div className="turn-banner">
              {aiThinking ? 'Thinking...'
                : turn === 0 ? (is2P ? "Player 1's turn" : 'Your turn — tap a card or draw!')
                : (is2P ? "Player 2's turn" : "Computer's turn")}
            </div>

            {/* Player hand */}
            <div className="player-hand">
              <AnimatePresence>
                {sortHand(hands[0]).map((card, i) => {
                  const playable = turn === 0 && !aiThinking && canPlay(card, topCard, activeColor)
                  return (
                    <motion.div
                      key={card.id}
                      layout
                      className={`uno-card ${playable ? 'playable' : 'not-playable'}`}
                      data-color={card.color}
                      style={{ '--card-bg': UNO_COLOR_HEX[card.color] ?? '#555' }}
                      initial={{ y: 60, opacity: 0, scale: 0.8 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: -30, opacity: 0, scale: 0.85, transition: { duration: 0.22 } }}
                      transition={{ type: 'spring', stiffness: 380, damping: 28, delay: i * 0.02 }}
                      whileHover={playable ? { y: -14, scale: 1.1, transition: { duration: 0.15 } } : {}}
                      whileTap={playable ? { scale: 0.95 } : {}}
                      onClick={() => playable && handlePlayerCard(card.id)}
                    >
                      <span className="card-corner card-tl">{label(card)}</span>
                      <span className="uno-card-val">{label(card)}</span>
                      <span className="card-corner card-br">{label(card)}</span>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* Wild color picker */}
            <AnimatePresence>
              {choosingColor && (
                <motion.div
                  className="color-picker-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="color-picker"
                    initial={{ scale: 0.8, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.8, y: 20 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                  >
                    <p>Choose a colour!</p>
                    <div className="color-btns">
                      {colors.map(c => (
                        <motion.button
                          key={c}
                          className="color-btn"
                          style={{ background: UNO_COLOR_HEX[c] }}
                          whileHover={{ scale: 1.25, transition: { duration: 0.12 } }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleColorChoice(c)}
                        >
                          {UNO_COLOR_EMOJIS[c]}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="log-box">
              {log.map((l, i) => <div key={i} className={`log-line ${i === 0 ? 'new' : ''}`}>{l}</div>)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
