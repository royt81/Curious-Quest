import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import './LetterHunt.css'

const GOAL = 8 // words to solve to win

// scattered decorations sprinkled around the board (uses theme emoji)
const DECO_SPOTS = [
  { top: '6%', left: '3%' }, { top: '4%', right: '6%' },
  { bottom: '8%', left: '5%' }, { bottom: '6%', right: '4%' },
  { top: '46%', left: '1%' }, { top: '48%', right: '1%' },
]

const CONFETTI = ['🎉', '⭐', '✨', '🎊', '🌟', '🏆', '💫']

const CHEERS = ['Great spelling! 🎉', 'You found it! ⭐', 'Well done! 🙌', 'Perfect! ✨', 'Nice work! 👏', 'Super! 🌟']
const TRY_AGAIN = ['Not that one — try again! 💪', 'Almost! Listen to the sounds.', 'Have another go! 🙂', 'Keep trying, you can do it!']

// word + a picture (emoji). Kept short and clear for early readers.
const WORDS = [
  { word: 'CAT', emoji: '🐱' }, { word: 'DOG', emoji: '🐶' }, { word: 'SUN', emoji: '☀️' },
  { word: 'BEE', emoji: '🐝' }, { word: 'EGG', emoji: '🥚' }, { word: 'CAR', emoji: '🚗' },
  { word: 'COW', emoji: '🐄' }, { word: 'KEY', emoji: '🔑' }, { word: 'FOX', emoji: '🦊' },
  { word: 'BOOK', emoji: '📖' }, { word: 'FISH', emoji: '🐟' }, { word: 'TREE', emoji: '🌳' },
  { word: 'STAR', emoji: '⭐' }, { word: 'MOON', emoji: '🌙' }, { word: 'CAKE', emoji: '🎂' },
  { word: 'FROG', emoji: '🐸' }, { word: 'BALL', emoji: '⚽' }, { word: 'SOCK', emoji: '🧦' },
  { word: 'APPLE', emoji: '🍎' }, { word: 'HOUSE', emoji: '🏠' }, { word: 'TRAIN', emoji: '🚂' },
  { word: 'PIZZA', emoji: '🍕' }, { word: 'CROWN', emoji: '👑' }, { word: 'LEMON', emoji: '🍋' },
  { word: 'GRAPES', emoji: '🍇' }, { word: 'FLOWER', emoji: '🌸' }, { word: 'ROCKET', emoji: '🚀' },
  { word: 'BANANA', emoji: '🍌' },
]

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function makeTask(step) {
  // Difficulty grows: short words + first-letter blank early; longer words / any position later
  let pool
  if (step < 3) pool = WORDS.filter(w => w.word.length <= 3)
  else if (step < 6) pool = WORDS.filter(w => w.word.length <= 4)
  else pool = WORDS
  if (pool.length === 0) pool = WORDS

  const entry = pick(pool)
  const word = entry.word
  const blankIdx = step < 3 ? 0 : rand(0, word.length - 1)
  const answer = word[blankIdx]

  const distractors = new Set()
  while (distractors.size < 3) {
    const c = pick(ALPHABET)
    if (c !== answer) distractors.add(c)
  }
  const options = shuffle([answer, ...distractors])

  return { word, emoji: entry.emoji, blankIdx, answer, options }
}

// Shared board: a winding snakes-&-ladders path of numbered tiles with a
// START tile, a FINISH treasure tile, themed decorations and a hopping token.
function QuestBoard({ avatar, step, themeEmoji, title }) {
  const COLS = 5
  // tile 0 = START, tiles 1..GOAL-1 = numbered steps, tile GOAL = FINISH 🏆
  const tiles = Array.from({ length: GOAL + 1 }, (_, i) => i)
  return (
    <div className="quest-board">
      <div className="board-title">🗺️ {title} 🗺️</div>
      {DECO_SPOTS.map((pos, i) => (
        <span
          key={i}
          className="board-deco"
          style={{ ...pos, animationDelay: `${i * 0.4}s` }}
        >
          {themeEmoji}
        </span>
      ))}
      <div className="board-path">
        {tiles.map((i) => {
          const row = Math.floor(i / COLS)
          const isGoal = i === GOAL
          const isStart = i === 0
          const done = i < step
          const current = i === step
          const cls = [
            'board-tile',
            row % 2 === 1 ? 'snap-rev' : '',
            done ? 'done' : '',
            current ? 'current' : '',
            isStart ? 'start' : '',
            isGoal ? 'goal' : '',
          ].filter(Boolean).join(' ')
          return (
            <div key={i} className={cls}>
              {isGoal ? '🏆' : isStart ? 'START' : done ? <span className="tile-check">✓</span> : i}
              {current && (
                <motion.span
                  layoutId="quest-token"
                  className="token"
                  transition={{ type: 'spring', stiffness: 520, damping: 24 }}
                >
                  <span className="token-emoji">{avatar}</span>
                </motion.span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Confetti() {
  return (
    <div className="confetti">
      {Array.from({ length: 26 }).map((_, i) => (
        <span
          key={i}
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${1.6 + Math.random() * 1.8}s`,
            animationDelay: `${Math.random() * 0.6}s`,
            fontSize: `${1.2 + Math.random() * 1.4}rem`,
          }}
        >
          {CONFETTI[i % CONFETTI.length]}
        </span>
      ))}
    </div>
  )
}

export default function LetterHuntGame({ onBack }) {
  const { theme } = useTheme()
  const avatar = theme.emoji

  const [step, setStep] = useState(0)
  const [task, setTask] = useState(() => makeTask(0))
  const [picked, setPicked] = useState(null)
  const [locked, setLocked] = useState(false)
  const [tries, setTries] = useState(0)
  const [stars, setStars] = useState(0)
  const [feedback, setFeedback] = useState({ text: 'Find the missing letter!', tone: 'try' })
  const [won, setWon] = useState(false)

  const initGame = useCallback(() => {
    setStep(0)
    setTask(makeTask(0))
    setPicked(null)
    setLocked(false)
    setTries(0)
    setStars(0)
    setFeedback({ text: 'Find the missing letter!', tone: 'try' })
    setWon(false)
  }, [])

  useEffect(() => { initGame() }, [initGame])

  const choose = (letter) => {
    if (locked) return
    setPicked(letter)

    if (letter === task.answer) {
      setLocked(true)
      if (tries === 0) setStars(s => s + 1)
      setFeedback({ text: pick(CHEERS), tone: 'good' })
      setTimeout(() => {
        const next = step + 1
        setStep(next)
        if (next >= GOAL) {
          setWon(true)
        } else {
          setTask(makeTask(next))
          setPicked(null)
          setTries(0)
          setLocked(false)
          setFeedback({ text: 'Next word!', tone: 'try' })
        }
      }, 900)
    } else {
      setTries(t => t + 1)
      setFeedback({ text: pick(TRY_AGAIN), tone: 'try' })
      setTimeout(() => setPicked(null), 450)
    }
  }

  return (
    <div className="letterhunt-screen screen">
      <div className="game-header">
        <button className="btn btn-secondary back-btn" onClick={onBack}>← Back</button>
        <h2>🔤 Letter Hunt</h2>
        <div className="quest-stars">⭐ {stars}</div>
      </div>

      {won ? (
        <div className="gameover">
          <Confetti />
          <div className="gameover-emoji">🏆</div>
          <h2>You spelled your way home!</h2>
          <p>You earned {stars} star{stars === 1 ? '' : 's'} out of {GOAL}.</p>
          <div className="gameover-btns">
            <button className="btn btn-primary" onClick={initGame}>Play Again</button>
            <button className="btn btn-secondary" onClick={onBack}>Menu</button>
          </div>
        </div>
      ) : (
        <div className="letterhunt-play">
          {/* Board */}
          <QuestBoard avatar={avatar} step={step} themeEmoji={theme.emoji} title="Letter Hunt" />

          {/* Task */}
          <div className="quest-card">
            <div className="word-picture">{task.emoji}</div>
            <div className="quest-prompt">Which letter is missing?</div>

            <div className="word-row">
              {task.word.split('').map((ch, i) => (
                <div key={i} className={`letter-tile${i === task.blankIdx ? ' blank' : ''}`}>
                  {i === task.blankIdx ? '?' : ch}
                </div>
              ))}
            </div>

            <div className={`quest-feedback ${feedback.tone}`}>{feedback.text}</div>

            <div className="option-grid">
              {task.options.map((letter, i) => {
                const isPicked = picked === letter
                const cls = isPicked ? (letter === task.answer ? 'correct' : 'wrong') : ''
                return (
                  <button
                    key={i}
                    className={`option-btn ${cls}`}
                    onClick={() => choose(letter)}
                    disabled={locked}
                  >
                    {letter}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
