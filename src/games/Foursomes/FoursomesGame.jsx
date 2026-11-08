import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import './Foursomes.css'

// --- helpers ---
function buildDeck(families) {
  const cards = []
  families.forEach(fam => {
    fam.cards.forEach(card => {
      cards.push({ ...card, family: fam.id, familyName: fam.name, familyColor: fam.color, stats: fam.stats, statLabels: fam.statLabels })
    })
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

function dealCards(families) {
  const deck = shuffle(buildDeck(families))
  const half = Math.floor(deck.length / 2)
  return [deck.slice(0, half), deck.slice(half)]
}

function countSets(hand) {
  const groups = {}
  hand.forEach(c => { groups[c.family] = (groups[c.family] || 0) + 1 })
  return Object.values(groups).filter(v => v === 4).length
}

function removeCompletedSets(hand) {
  const groups = {}
  hand.forEach(c => { groups[c.family] = (groups[c.family] || 0) + 1 })
  const complete = new Set(Object.entries(groups).filter(([,v]) => v === 4).map(([k]) => k))
  return { remaining: hand.filter(c => !complete.has(c.family)), won: complete.size }
}

const AI_DELAY = 1200

const cardVariants = {
  initial: { opacity: 0, x: -40, rotateY: -15 },
  animate: { opacity: 1, x: 0, rotateY: 0, transition: { type: 'spring', stiffness: 280, damping: 26 } },
  exit:    { opacity: 0, x: 40, rotateY: 15, transition: { duration: 0.22 } },
}

const gameoverVariants = {
  initial: { opacity: 0, scale: 0.85, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
}

export default function FoursomesGame({ mode, onBack }) {
  const is2P = mode === '2player'
  const { theme } = useTheme()
  const [hands, setHands] = useState([[], []])
  const [sets, setSets] = useState([0, 0])
  const [turn, setTurn] = useState(0) // 0 = player1, 1 = player2/AI
  const [selectedStat, setSelectedStat] = useState(null)
  const [log, setLog] = useState([])
  const [gameOver, setGameOver] = useState(false)
  const [aiThinking, setAiThinking] = useState(false)
  const [highlight, setHighlight] = useState(null)

  const addLog = (msg) => setLog(prev => [msg, ...prev].slice(0, 6))

  const initGame = useCallback(() => {
    const [h0, h1] = dealCards(theme.quartettFamilies)
    setHands([h0, h1])
    setSets([0, 0])
    setTurn(0)
    setSelectedStat(null)
    setLog(['Game started! Pick a stat from your top card.'])
    setGameOver(false)
    setAiThinking(false)
    setHighlight(null)
  }, [theme])

  useEffect(() => { initGame() }, [initGame])

  const topCard = (playerIdx) => hands[playerIdx][0] || null

  const playTurn = useCallback((stat) => {
    if (gameOver || aiThinking) return
    const attacker = turn
    const defender = 1 - turn
    const myCard = hands[attacker][0]
    const theirCard = hands[defender][0]
    if (!myCard || !theirCard) return

    const myVal = myCard[stat]
    const theirVal = theirCard[stat]

    let newHands = hands.map(h => [...h])
    let newSets = [...sets]
    let msg = ''

    if (myVal > theirVal) {
      newHands[attacker] = [...newHands[attacker].slice(1), myCard, theirCard]
      newHands[defender] = newHands[defender].slice(1)
      msg = `${attacker === 0 ? (is2P ? 'Player 1' : 'You') : (is2P ? 'Player 2' : 'Computer')} wins with ${myVal} vs ${theirVal}! 🎉`
      setHighlight(theirCard.id)
    } else if (theirVal > myVal) {
      newHands[defender] = [...newHands[defender].slice(1), theirCard, myCard]
      newHands[attacker] = newHands[attacker].slice(1)
      msg = `${defender === 0 ? (is2P ? 'Player 1' : 'You') : (is2P ? 'Player 2' : 'Computer')} wins with ${theirVal} vs ${myVal}! 😮`
      setHighlight(myCard.id)
    } else {
      newHands[attacker] = [...newHands[attacker].slice(1), myCard, theirCard]
      newHands[defender] = newHands[defender].slice(1)
      msg = `Tie! Both cards to ${attacker === 0 ? (is2P ? 'Player 1' : 'your') : (is2P ? 'Player 2\'s' : 'computer\'s')} pile. 🤝`
    }

    const r0 = removeCompletedSets(newHands[0])
    const r1 = removeCompletedSets(newHands[1])
    newHands[0] = r0.remaining
    newHands[1] = r1.remaining
    newSets[0] += r0.won
    newSets[1] += r1.won

    setHands(newHands)
    setSets(newSets)
    setSelectedStat(null)
    addLog(msg)

    if (newHands[0].length === 0 || newHands[1].length === 0 || (newSets[0] + newSets[1] >= theme.quartettFamilies.length)) {
      setGameOver(true)
      return
    }

    setTurn(myVal > theirVal ? attacker : myVal < theirVal ? defender : turn)
  }, [turn, hands, sets, gameOver, aiThinking, is2P])

  // AI turn
  useEffect(() => {
    if (turn === 1 && !is2P && !gameOver && hands[1].length > 0) {
      setAiThinking(true)
      const t = setTimeout(() => {
        const card = hands[1][0]
        if (!card) { setAiThinking(false); return }
        const bestStat = card.stats.reduce((best, s) => card[s] > card[best] ? s : best, card.stats[0])
        setAiThinking(false)
        playTurn(bestStat)
      }, AI_DELAY)
      return () => clearTimeout(t)
    }
  }, [turn, is2P, gameOver, hands, playTurn])

  const myCard = topCard(0)
  const theirCard = topCard(1)

  const winner = gameOver
    ? sets[0] > sets[1] ? (is2P ? 'Player 1' : 'You') : sets[1] > sets[0] ? (is2P ? 'Player 2' : 'Computer') : null
    : null

  return (
    <div className="foursomes-screen screen">
      <div className="game-header">
        <button className="btn btn-secondary back-btn" onClick={onBack}>← Back</button>
        <h2>🃏 Foursomes</h2>
        <div className="scores">
          <span className="score p1">🙂 {sets[0]} sets</span>
          <span className="score p2">{is2P ? '👤' : '🤖'} {sets[1]} sets</span>
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
            <div className="gameover-emoji">{winner ? '🏆' : '🤝'}</div>
            <h2>{winner ? `${winner} wins!` : "It's a tie!"}</h2>
            <p>Final: You {sets[0]} — {sets[1]} {is2P ? 'Player 2' : 'Computer'}</p>
            <div className="gameover-btns">
              <button className="btn btn-primary" onClick={initGame}>Play Again</button>
              <button className="btn btn-secondary" onClick={onBack}>Menu</button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="playing"
            className="foursomes-play"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.3 } }}
          >
            <div className="cards-area">
              {/* Player 1 card */}
              <div className="player-area">
                <div className="player-label">🙂 {is2P ? 'Player 1' : 'You'} — {hands[0].length} cards</div>
                <AnimatePresence mode="wait">
                  {myCard ? (
                    <motion.div
                      key={myCard.id}
                      className="animal-card"
                      style={{ '--card-color': myCard.familyColor }}
                      variants={cardVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <div className="card-emoji">{myCard.emoji}</div>
                      <div className="card-name">{myCard.name}</div>
                      <div className="card-family">{myCard.familyName}</div>
                      <div className="card-stats">
                        {myCard.stats.map(stat => (
                          <motion.button
                            key={stat}
                            className={`stat-btn ${turn === 0 && !aiThinking ? 'clickable' : ''} ${selectedStat === stat ? 'selected' : ''}`}
                            onClick={() => turn === 0 && !aiThinking && playTurn(stat)}
                            disabled={turn !== 0 || aiThinking}
                            whileHover={turn === 0 && !aiThinking ? { scale: 1.04, x: 3, transition: { duration: 0.15 } } : {}}
                            whileTap={turn === 0 && !aiThinking ? { scale: 0.96 } : {}}
                          >
                            <span className="stat-label">{myCard.statLabels[stat]}</span>
                            <span className="stat-val">{myCard[stat]}</span>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="empty-p1" className="no-cards" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      No cards left!
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="vs-badge">VS</div>

              {/* Player 2 / AI card */}
              <div className="player-area">
                <div className="player-label">{is2P ? '👤 Player 2' : '🤖 Computer'} — {hands[1].length} cards</div>
                <AnimatePresence mode="wait">
                  {theirCard ? (
                    <motion.div
                      key={theirCard.id + ((!is2P && turn === 0) ? '-hidden' : '-shown')}
                      className={`animal-card opponent ${!is2P && turn === 0 ? 'face-down' : ''}`}
                      style={{ '--card-color': theirCard.familyColor }}
                      variants={cardVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      {(!is2P && turn === 0) ? (
                        <>
                          <div className="card-emoji">🂠</div>
                          <div className="card-name">Hidden</div>
                        </>
                      ) : (
                        <>
                          <div className="card-emoji">{theirCard.emoji}</div>
                          <div className="card-name">{theirCard.name}</div>
                          <div className="card-family">{theirCard.familyName}</div>
                          <div className="card-stats readonly">
                            {theirCard.stats.map(stat => (
                              <motion.div
                                key={stat}
                                className={`stat-btn ${is2P && turn === 1 ? 'clickable' : ''}`}
                                onClick={() => is2P && turn === 1 && playTurn(stat)}
                                whileHover={is2P && turn === 1 ? { scale: 1.04, x: 3, transition: { duration: 0.15 } } : {}}
                                whileTap={is2P && turn === 1 ? { scale: 0.96 } : {}}
                              >
                                <span className="stat-label">{theirCard.statLabels[stat]}</span>
                                <span className="stat-val">{theirCard[stat]}</span>
                              </motion.div>
                            ))}
                          </div>
                        </>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div key="empty-p2" className="no-cards" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      No cards left!
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="turn-banner">
              {aiThinking ? '🤖 Computer is thinking...' :
               turn === 0 ? `${is2P ? 'Player 1' : 'Your'} turn — tap a stat!` : `${is2P ? 'Player 2' : 'Computer'}'s turn`}
            </div>

            <div className="log-box">
              {log.map((l, i) => <div key={i} className={`log-line ${i === 0 ? 'new' : ''}`}>{l}</div>)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
