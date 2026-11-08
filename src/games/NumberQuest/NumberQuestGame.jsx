import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import './NumberQuest.css'

const GOAL = 8 // steps along the trail to win

// scattered decorations sprinkled around the board (uses theme emoji)
const DECO_SPOTS = [
  { top: '6%', left: '3%' }, { top: '4%', right: '6%' },
  { bottom: '8%', left: '5%' }, { bottom: '6%', right: '4%' },
  { top: '46%', left: '1%' }, { top: '48%', right: '1%' },
]

const CONFETTI = ['🎉', '⭐', '✨', '🎊', '🌟', '🏆', '💫']

const CHEERS = ['Great job! 🎉', 'Well done! ⭐', 'You got it! 🙌', 'Awesome! ✨', 'Nice work! 👏', 'Brilliant! 🌟']
const TRY_AGAIN = ['Not quite — try again! 💪', 'Almost! Give it another go.', 'Have another try! 🙂', 'Keep going, you can do it!']

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

// Difficulty grows with progress along the trail
function maxFor(step) {
  if (step < 3) return 10
  if (step < 6) return 15
  return 20
}

// Build 4 distinct multiple-choice options around the answer
function makeOptions(answer, hi) {
  const opts = new Set([answer])
  let guard = 0
  while (opts.size < 4 && guard++ < 50) {
    let cand = answer + rand(-3, 3)
    if (cand < 0) cand = answer + rand(1, 4)
    if (cand !== answer && cand >= 0 && cand <= hi + 4) opts.add(cand)
  }
  while (opts.size < 4) opts.add(answer + opts.size) // safety fill
  return shuffle([...opts])
}

function makeTask(step, countEmoji) {
  const hi = maxFor(step)
  const kind = pick(['sequence', 'addition', 'subtraction', 'compare', 'count'])

  if (kind === 'sequence') {
    const d = pick([1, 1, 2])
    const start = rand(1, Math.max(2, hi - 2 * d))
    const terms = [start, start + d, start + 2 * d]
    const hideIdx = rand(0, 2)
    const answer = terms[hideIdx]
    return { kind, answer, hideIdx, terms, options: makeOptions(answer, hi), prompt: 'What number is missing?' }
  }

  if (kind === 'addition') {
    const a = rand(1, Math.max(1, Math.floor(hi / 2)))
    const b = rand(1, hi - a)
    const answer = a + b
    return { kind, answer, a, b, op: '+', options: makeOptions(answer, hi), prompt: 'Add them up!' }
  }

  if (kind === 'subtraction') {
    const a = rand(2, hi)
    const b = rand(1, a - 1)
    const answer = a - b
    return { kind, answer, a, b, op: '−', options: makeOptions(answer, hi), prompt: 'Take them away!' }
  }

  if (kind === 'compare') {
    let a = rand(1, hi), b = rand(1, hi)
    while (b === a) b = rand(1, hi)
    const answer = Math.max(a, b)
    return { kind, answer, a, b, options: shuffle([a, b]), prompt: 'Tap the BIGGER number' }
  }

  // count
  const n = rand(2, Math.min(10, hi))
  return { kind: 'count', answer: n, n, emoji: countEmoji, options: makeOptions(n, hi), prompt: 'How many do you see?' }
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

export default function NumberQuestGame({ onBack }) {
  const { theme } = useTheme()
  const avatar = theme.emoji

  const [step, setStep] = useState(0)
  const [task, setTask] = useState(() => makeTask(0, theme.emoji))
  const [picked, setPicked] = useState(null)
  const [locked, setLocked] = useState(false)
  const [tries, setTries] = useState(0)
  const [stars, setStars] = useState(0)
  const [feedback, setFeedback] = useState({ text: 'Solve the puzzle to move ahead!', tone: 'try' })
  const [won, setWon] = useState(false)

  const initGame = useCallback(() => {
    setStep(0)
    setTask(makeTask(0, theme.emoji))
    setPicked(null)
    setLocked(false)
    setTries(0)
    setStars(0)
    setFeedback({ text: 'Solve the puzzle to move ahead!', tone: 'try' })
    setWon(false)
  }, [theme])

  useEffect(() => { initGame() }, [initGame])

  const choose = (opt) => {
    if (locked) return
    setPicked(opt)

    if (opt === task.answer) {
      setLocked(true)
      if (tries === 0) setStars(s => s + 1)
      setFeedback({ text: pick(CHEERS), tone: 'good' })
      setTimeout(() => {
        const next = step + 1
        setStep(next)
        if (next >= GOAL) {
          setWon(true)
        } else {
          setTask(makeTask(next, theme.emoji))
          setPicked(null)
          setTries(0)
          setLocked(false)
          setFeedback({ text: 'Next challenge!', tone: 'try' })
        }
      }, 850)
    } else {
      setTries(t => t + 1)
      setFeedback({ text: pick(TRY_AGAIN), tone: 'try' })
      setTimeout(() => setPicked(null), 450)
    }
  }

  return (
    <div className="numberquest-screen screen">
      <div className="game-header">
        <button className="btn btn-secondary back-btn" onClick={onBack}>← Back</button>
        <h2>🔢 Number Quest</h2>
        <div className="quest-stars">⭐ {stars}</div>
      </div>

      {won ? (
        <div className="gameover">
          <Confetti />
          <div className="gameover-emoji">🏆</div>
          <h2>You reached the treasure!</h2>
          <p>You earned {stars} star{stars === 1 ? '' : 's'} out of {GOAL}.</p>
          <div className="gameover-btns">
            <button className="btn btn-primary" onClick={initGame}>Play Again</button>
            <button className="btn btn-secondary" onClick={onBack}>Menu</button>
          </div>
        </div>
      ) : (
        <div className="quest-play">
          {/* Board */}
          <QuestBoard avatar={avatar} step={step} themeEmoji={theme.emoji} title="Number Quest" />

          {/* Task */}
          <div className="quest-card">
            <div className="quest-prompt">{task.prompt}</div>

            {task.kind === 'sequence' && (
              <div className="seq-row">
                {task.terms.map((t, i) => (
                  <div key={i} className={`seq-tile${i === task.hideIdx ? ' blank' : ''}`}>
                    {i === task.hideIdx ? '?' : t}
                  </div>
                ))}
              </div>
            )}

            {(task.kind === 'addition' || task.kind === 'subtraction') && (
              <div className="quest-equation">{task.a} {task.op} {task.b} = ?</div>
            )}

            {task.kind === 'compare' && (
              <div className="quest-equation">{task.a} &nbsp; vs &nbsp; {task.b}</div>
            )}

            {task.kind === 'count' && (
              <div className="count-objects">
                {Array.from({ length: task.n }).map((_, i) => <span key={i}>{task.emoji}</span>)}
              </div>
            )}

            <div className={`quest-feedback ${feedback.tone}`}>{feedback.text}</div>

            <div className="option-grid">
              {task.options.map((opt, i) => {
                const isPicked = picked === opt
                const cls = isPicked ? (opt === task.answer ? 'correct' : 'wrong') : ''
                return (
                  <button
                    key={i}
                    className={`option-btn ${cls}`}
                    onClick={() => choose(opt)}
                    disabled={locked}
                  >
                    {opt}
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
