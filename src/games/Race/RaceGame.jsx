import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import RacerAvatar from '../../components/RacerAvatar'
import './Race.css'
import { playDraw, playWin } from '../../sound/sfx'

const TRACK_LENGTH  = 20
const PLACES_NEEDED = 3   // race ends once this many racers have finished

const MEDALS = ['🥇', '🥈', '🥉']

// excludeIds: racer ids to omit (already finished — their cards are retired)
function buildRaceDeck(racers, excludeIds = []) {
  const cards = []
  racers.filter(r => !excludeIds.includes(r.id)).forEach((animal) => {
    for (let n = 1; n <= 5; n++) {
      for (let k = 0; k < 2; k++) {
        cards.push({ id: `${animal.id}-${n}-${k}`, type: 'move', animal: animal.id, steps: n, color: animal.color })
      }
    }
  })
  const events = ['storm', 'boost', 'swap']
  events.forEach((e) => {
    for (let k = 0; k < 3; k++) {
      cards.push({ id: `event-${e}-${k}`, type: 'event', event: e })
    }
  })
  return cards
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function eventLabel(event) {
  if (event === 'storm') return '⛈️ Storm! Racers still going go back 1 (finishers are safe)'
  if (event === 'boost') return '🚀 Boost! Leading racer +2'
  if (event === 'swap') return '🔀 Swap! Leader and last racer swap'
  return '?'
}

const PLACE_LABELS = ['1st', '2nd', '3rd', '4th']

export default function RaceGame({ mode, onBack }) {
  const is2P = mode === '2player'
  const { theme } = useTheme()
  const RACERS = theme.raceRacers

  const [deck,        setDeck]        = useState([])
  const [positions,   setPositions]   = useState(() => RACERS.map(() => 0))
  const [currentCard, setCurrentCard] = useState(null)
  const [log,         setLog]         = useState([])
  const [gameOver,    setGameOver]    = useState(false)
  const [finishOrder, setFinishOrder] = useState([])   // racer indices in order they finished
  const [turn,        setTurn]        = useState(0)
  const [animating,   setAnimating]   = useState(false)

  const addLog = (msg) => setLog(prev => [msg, ...prev].slice(0, 6))

  const initGame = useCallback(() => {
    setDeck(shuffle(buildRaceDeck(RACERS)))
    setPositions(RACERS.map(() => 0))
    setCurrentCard(null)
    setLog(['Race starts! Draw a card!'])
    setGameOver(false)
    setFinishOrder([])
    setTurn(0)
    setAnimating(false)
  }, [theme])

  useEffect(() => { initGame() }, [initGame])

  const applyCard = useCallback((card, pos) => {
    let newPos = [...pos]
    // A racer that has reached the finish line is locked there — no event can move it.
    const isFinished = (p) => p >= TRACK_LENGTH
    if (card.type === 'move') {
      const idx = RACERS.findIndex(a => a.id === card.animal)
      newPos[idx] = Math.min(TRACK_LENGTH, newPos[idx] + card.steps)
      addLog(`${RACERS[idx].emoji} ${RACERS[idx].name} moves +${card.steps}!`)
    } else if (card.event === 'storm') {
      // Finishers stay put; everyone still racing slips back one.
      newPos = newPos.map(p => isFinished(p) ? p : Math.max(0, p - 1))
      addLog(eventLabel('storm'))
    } else if (card.event === 'boost') {
      // Boost the furthest racer that hasn't finished yet.
      const contenders = newPos.map((p, i) => ({ p, i })).filter(({ p }) => !isFinished(p))
      if (contenders.length > 0) {
        const target = contenders.reduce((a, b) => (b.p > a.p ? b : a))
        newPos[target.i] = Math.min(TRACK_LENGTH, newPos[target.i] + 2)
      }
      addLog(eventLabel('boost'))
    } else if (card.event === 'swap') {
      // Swap leader and straggler — but only among racers still in the race.
      const contenders = newPos.map((p, i) => ({ p, i })).filter(({ p }) => !isFinished(p))
      if (contenders.length >= 2) {
        const maxItem = contenders.reduce((a, b) => (b.p > a.p ? b : a))
        const minItem = contenders.reduce((a, b) => (b.p < a.p ? b : a))
        if (maxItem.i !== minItem.i) {
          [newPos[maxItem.i], newPos[minItem.i]] = [newPos[minItem.i], newPos[maxItem.i]]
        }
      }
      addLog(eventLabel('swap'))
    }
    return newPos
  }, [RACERS])

  // In 2P mode: Player 0 owns racers 0-1, Player 1 owns racers 2-3
  const half = Math.floor(RACERS.length / 2)
  const currentPlayerDone = useMemo(() => {
    if (!is2P) return false
    const owned = RACERS.map((_, i) => i).filter(i => turn === 0 ? i < half : i >= half)
    return owned.every(i => finishOrder.includes(i))
  }, [is2P, turn, finishOrder])

  // Auto-skip when the current player's racers have all finished
  useEffect(() => {
    if (!is2P || gameOver || animating || !currentPlayerDone) return
    setTurn(t => 1 - t)
  }, [currentPlayerDone, is2P, gameOver, animating])

  const drawAndPlay = useCallback(() => {
    if (gameOver || animating || deck.length === 0 || currentPlayerDone) return
    playDraw()
    const card = deck[0]

    // Build the "after draw" deck — when empty, rebuild excluding already-finished racers
    const finishedIds = finishOrder.map(fi => RACERS[fi].id)
    const remaining   = deck.slice(1)
    const newDeck     = remaining.length > 0
      ? remaining
      : shuffle(buildRaceDeck(RACERS, finishedIds))

    setCurrentCard(card)
    setDeck(newDeck)
    setAnimating(true)

    setTimeout(() => {
      const newPos = applyCard(card, positions)
      setPositions(newPos)
      setAnimating(false)

      // Detect racers newly crossing the finish line
      const newFinishers = newPos
        .map((p, idx) => ({ p, idx }))
        .filter(({ p, idx }) => p >= TRACK_LENGTH && !finishOrder.includes(idx))
        .map(({ idx }) => idx)

      if (newFinishers.length > 0) {
        const updatedOrder = [...finishOrder, ...newFinishers]
        setFinishOrder(updatedOrder)
        newFinishers.forEach((idx, i) => {
          const place = finishOrder.length + i
          addLog(`${RACERS[idx].emoji} ${RACERS[idx].name} finishes ${PLACE_LABELS[place]}! ${MEDALS[place] ?? ''}`)
        })

        // Purge finished racers' cards from the remaining deck immediately
        const newlyFinishedIds = newFinishers.map(fi => RACERS[fi].id)
        const allFinishedIds   = [...finishedIds, ...newlyFinishedIds]
        const prunedDeck = newDeck.filter(
          c => c.type !== 'move' || !newlyFinishedIds.includes(c.animal)
        )
        // If pruning left the deck too thin, top it up with a fresh shuffle
        const finalDeck = prunedDeck.length >= 5
          ? prunedDeck
          : [...prunedDeck, ...shuffle(buildRaceDeck(RACERS, allFinishedIds))]
        setDeck(finalDeck)

        if (updatedOrder.length >= PLACES_NEEDED) {
          playWin()
          setGameOver(true)
        }
      }

      if (is2P) setTurn(t => 1 - t)
    }, 500)
  }, [gameOver, animating, deck, positions, applyCard, is2P, finishOrder, currentPlayerDone])

  // place of each racer (0-based) or -1 if not yet finished
  const placeOf = (idx) => finishOrder.indexOf(idx)

  return (
    <div className="race-screen screen">
      {is2P && !gameOver && (
        <div className="turn-badge">
          {turn === 0 ? '🙂 Player 1' : '👤 Player 2'}
        </div>
      )}

      {/* ── Track — always visible ── */}
      <div className="race-play">
        <LayoutGroup>
          <div className="race-track">
            {RACERS.map((animal, idx) => {
              const place = placeOf(idx)
              const finished = place !== -1
              return (
                <div
                  key={animal.id}
                  className={`track-lane${finished ? ' winner-lane' : ''}`}
                >
                  <div className="lane-label" style={{ color: animal.color }}>
                    <RacerAvatar racer={animal} /> {animal.name}
                    {finished && (
                      <span className="lane-medal">{MEDALS[place]}</span>
                    )}
                  </div>
                  <div className="lane-bar">
                    {Array.from({ length: TRACK_LENGTH + 1 }).map((_, step) => (
                      <div key={step} className={`track-cell ${step === TRACK_LENGTH ? 'finish' : ''}`}>
                        {step === TRACK_LENGTH ? '🏁' : ''}
                        {positions[idx] === step && (
                          <motion.span
                            layoutId={`token-${animal.id}`}
                            className={`animal-token${finished ? ' winner-token' : ''}`}
                            style={{ background: animal.color }}
                            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                          >
                            <RacerAvatar racer={animal} />
                          </motion.span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="pos-label">{positions[idx]}/{TRACK_LENGTH}</div>
                </div>
              )
            })}
          </div>
        </LayoutGroup>

        {/* Card + Log row */}
        {!gameOver && (
          <div className="card-row">
            {/* Left: card + draw button */}
            <div className="card-col">
              <div className="card-area">
                <AnimatePresence mode="wait">
                  {currentCard && (
                    <motion.div
                      key={currentCard.id}
                      className="drawn-card"
                      style={{ '--card-bg': currentCard.type === 'move' ? currentCard.color : '#9c27b0' }}
                      initial={{ y: -50, opacity: 0, scale: 0.7, rotate: -12 }}
                      animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ y: 20, opacity: 0, scale: 0.85 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                    >
                      {currentCard.type === 'move' ? (
                        <>
                          <span className="drawn-emoji"><RacerAvatar racer={RACERS.find(a => a.id === currentCard.animal)} /></span>
                          <span className="drawn-steps">+{currentCard.steps}</span>
                        </>
                      ) : (
                        <span className="drawn-event">{
                          currentCard.event === 'storm' ? '⛈️' :
                          currentCard.event === 'boost' ? '🚀' : '🔀'
                        }</span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <motion.button
                className="btn btn-primary draw-btn"
                onClick={drawAndPlay}
                disabled={animating || currentPlayerDone}
                whileHover={!animating && !currentPlayerDone ? { scale: 1.06, transition: { duration: 0.15 } } : {}}
                whileTap={!animating && !currentPlayerDone ? { scale: 0.95 } : {}}
              >
                {animating
                  ? '✨ Moving...'
                  : currentPlayerDone
                    ? '⏭️ Skipping...'
                    : `🎴 ${is2P ? (turn === 0 ? 'P1: ' : 'P2: ') : ''}Draw!`}
              </motion.button>
            </div>

            {/* Right: log */}
            <div className="log-box">
              {log.map((l, i) => (
                <div key={i} className={`log-line ${i === 0 ? 'new' : ''}`}>{l}</div>
              ))}
            </div>
          </div>
        )}

        {/* ── Winner overlay — covers track, adds zero height ── */}
        <AnimatePresence>
          {gameOver && (
            <motion.div
              key="winner-overlay"
              className="race-winner-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="race-winner-banner"
                initial={{ opacity: 0, scale: 0.85, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0,
                  transition: { type: 'spring', stiffness: 300, damping: 24, delay: 0.18 } }}
              >
                <h2><img src="/other-icons/race.svg" alt="" style={{ width: '1em', height: '1em', objectFit: 'contain', display: 'inline-block', verticalAlign: '-0.15em' }} /> Race Finished!</h2>

                {/* Podium */}
                <div className="race-podium">
                  {finishOrder.slice(0, PLACES_NEEDED).map((racerIdx, place) => (
                    <motion.div
                      key={racerIdx}
                      className={`podium-place podium-${place + 1}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0,
                        transition: { delay: 0.28 + place * 0.12 } }}
                    >
                      <div className="podium-medal">{MEDALS[place]}</div>
                      <div className="podium-emoji"><RacerAvatar racer={RACERS[racerIdx]} /></div>
                      <div className="podium-name">{RACERS[racerIdx].name}</div>
                    </motion.div>
                  ))}
                </div>

                {is2P && (
                  <p className="winner-player">
                    {finishOrder[0] < 2 ? 'Player 1' : 'Player 2'} wins!
                  </p>
                )}

                <div className="gameover-btns">
                  <button className="btn btn-primary"   onClick={initGame}>Race Again</button>
                  <button className="btn btn-secondary" onClick={onBack}>Menu</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
