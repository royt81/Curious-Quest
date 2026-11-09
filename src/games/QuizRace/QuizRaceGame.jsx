import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import RacerAvatar from '../../components/RacerAvatar'
import './QuizRace.css'
import { playCorrect, playWrong, playWin } from '../../sound/sfx'
import { speakSteps, stopSpeaking, canSpeak } from '../../sound/speech'
import { WORD_BANKS } from './quizWords'
import { useT, tr, getLang } from '../../i18n'

const TRACK_LENGTH = 10 // spaces from start (0) to finish (10)

const MEDALS = ['🥇', '🥈', '🥉', '🏅']

// i18n: list
const CHEERS = ['Great job! 🎉', 'You got it! ⭐', 'Well done! 🙌', 'Awesome! ✨', 'Nice work! 👏', 'Brilliant! 🌟']
// i18n: list
const TRY_AGAIN = ['Not quite — keep going! 💪', 'Almost! Have another try next time.', 'Oops! Better luck next turn. 🙂', 'Nice try — you can do it!']

// ── Difficulty definitions ──────────────────────────────────────────────────
// hi       = biggest number used in number questions
// ops      = which number-question kinds are allowed
// families = which question families can appear (number / letter / meaning)
// maxLen   = longest word length used for letter questions
// firstOnly = blank is always the first letter (easiest)
// cpuOdds  = probability the computer answers correctly
const DIFFICULTIES = {
  easy: {
    id: 'easy', label: 'Easy', emoji: '🐣', image: '/other-icons/slow.svg',
    desc: 'Adding, taking away & missing letters',
    hi: 10, ops: ['sequence', 'addition', 'subtraction', 'count'],
    families: ['number', 'number', 'letter'],
    maxLen: 3, firstOnly: true, cpuOdds: 0.55,
  },
  hard: {
    id: 'hard', label: 'Hard', emoji: '🦊', image: '/other-icons/high-speed.svg',
    desc: 'Times tables & word meanings',
    // Hard must never be easier than Easy: drop the trivial 'compare' (tap the
    // bigger number) and 'count' tasks — those belong only to Easy. Hard keeps
    // the genuinely harder number tasks plus letter & meaning families.
    // hi   = range for sequences; addHi = bigger range just for add/subtract so
    // those go up to two-digit sums (in line with the times-table answers).
    hi: 30, addHi: 99, ops: ['sequence', 'addition', 'subtraction', 'multiplication'],
    families: ['number', 'number', 'letter', 'meaning'],
    maxLen: 99, firstOnly: false, cpuOdds: 0.82,
  },
}
const DIFF_LIST = [DIFFICULTIES.easy, DIFFICULTIES.hard]

// Word lists (English + German) live in quizWords.js
const bank = () => WORD_BANKS[getLang()] ?? WORD_BANKS.en

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

// Build 4 distinct multiple-choice options around a numeric answer.
// The upper bound stretches to fit big answers (e.g. times-table results).
function makeNumberOptions(answer, hi) {
  const upper = Math.max(hi + 5, answer + 6)
  const opts = new Set([answer])
  let guard = 0
  while (opts.size < 4 && guard++ < 60) {
    let cand = answer + rand(-4, 4)
    if (cand < 1) cand = answer + rand(1, 5)          // no 0 / negative distractors
    if (cand !== answer && cand >= 1 && cand <= upper) opts.add(cand)
  }
  while (opts.size < 4) opts.add(answer + opts.size) // safety fill
  return shuffle([...opts])
}

// Produce ONE question — randomly a number task or a letter task — at the
// given difficulty. `theme` supplies the themed word bank and the count emoji.
function makeQuestion(diff, theme) {
  const countEmoji = theme?.emoji ?? '⭐'
  const family = pick(diff.families ?? ['number', 'number', 'letter'])

  if (family === 'meaning') {
    const entry = pick(bank().VOCAB)
    return {
      family: 'meaning', kind: 'meaning',
      word: entry.word, answer: entry.meaning,
      options: shuffle([entry.meaning, ...entry.wrong]),
      prompt: 'What does this word mean?',
    }
  }

  if (family === 'letter') {
    const { THEME_WORDS, WORDS, ALPHABET, KNOWN_WORDS } = bank()
    // German has few 3-letter words a child can name from a picture, so Easy allows 4 there
    const maxLen = getLang() === 'de' ? Math.max(diff.maxLen, 4) : diff.maxLen
    const themeWords = THEME_WORDS[theme?.id] ?? []
    // theme words of the right length first…
    let pool = themeWords.filter(w => w.word.length <= maxLen)
    // …topped up with generic words so there's always plenty of variety.
    if (pool.length < 5) pool = [...pool, ...WORDS.filter(w => w.word.length <= maxLen)]
    if (pool.length === 0) pool = WORDS
    const entry = pick(pool)
    const word = entry.word
    const blankIdx = diff.firstOnly ? 0 : rand(0, word.length - 1)
    const answer = word[blankIdx]
    const distractors = new Set()
    let tries = 0
    while (distractors.size < 3) {
      const c = pick(ALPHABET)
      const altWord = word.slice(0, blankIdx) + c + word.slice(blankIdx + 1)
      if (c !== answer && (tries++ > 200 || !KNOWN_WORDS.has(altWord))) distractors.add(c)
    }
    return {
      family: 'letter', kind: 'letter',
      word, emoji: entry.emoji, blankIdx, answer,
      options: shuffle([answer, ...distractors]),
      prompt: 'Which letter is missing?',
    }
  }

  // ── number question ──
  const hi = diff.hi
  const kind = pick(diff.ops)

  if (kind === 'sequence') {
    // Easy counts on by 1; Hard skip-counts by 2, 3, 5 or 10.
    const d = diff.id === 'easy' ? 1 : pick([2, 3, 5, 10])
    const start = diff.id === 'easy' ? rand(1, Math.max(2, hi - 2 * d)) : d * rand(0, 6) + (d === 10 ? 0 : rand(0, d - 1))
    const terms = [start, start + d, start + 2 * d]
    const hideIdx = rand(0, 2)
    const answer = terms[hideIdx]
    return { family: 'number', kind, answer, hideIdx, terms, options: makeNumberOptions(answer, hi), prompt: 'What number is missing?' }
  }

  if (kind === 'addition') {
    // Use the bigger add/subtract range when the difficulty defines one.
    const cap = diff.addHi ?? hi
    const a = rand(1, Math.max(1, Math.floor(cap / 2)))
    const b = rand(1, cap - a)
    const answer = a + b
    return { family: 'number', kind, answer, a, b, op: '+', options: makeNumberOptions(answer, cap), prompt: 'Add them up!' }
  }

  if (kind === 'subtraction') {
    const cap = diff.addHi ?? hi
    const a = rand(2, cap)
    const b = rand(1, a - 1)
    const answer = a - b
    return { family: 'number', kind, answer, a, b, op: '−', options: makeNumberOptions(answer, cap), prompt: 'Take them away!' }
  }

  if (kind === 'multiplication') {
    const a = rand(2, 9)
    const b = rand(2, 9)
    const answer = a * b
    return { family: 'number', kind, answer, a, b, op: '×', options: makeNumberOptions(answer, hi), prompt: 'Multiply them!' }
  }

  if (kind === 'compare') {
    let a = rand(1, hi), b = rand(1, hi)
    while (b === a) b = rand(1, hi)
    const answer = Math.max(a, b)
    return { family: 'number', kind, answer, a, b, options: shuffle([a, b]), prompt: 'Tap the BIGGER number' }
  }

  // count
  const n = rand(2, Math.min(10, hi))
  return { family: 'number', kind: 'count', answer: n, n, emoji: countEmoji, options: makeNumberOptions(n, hi), prompt: 'How many do you see?' }
}

// A short signature identifying "the same question" — used for light anti-repeat.
// Letter questions: same word + same blank letter. Number questions: same pair of
// numbers involved (or same sequence/terms).
function questionSignature(t) {
  if (!t) return null
  if (t.family === 'meaning') return `meaning:${t.word}`
  if (t.family === 'letter') return `letter:${t.word}` // same word = repeat, whichever letter is missing
  if (t.kind === 'sequence') return `sequence:${t.terms.join(',')}`
  if (t.kind === 'compare')  return `compare:${[t.a, t.b].sort((x, y) => x - y).join(',')}`
  if (t.kind === 'count')    return `count:${t.n}`
  if (t.kind === 'addition' || t.kind === 'multiplication')
    return `${t.kind}:${[t.a, t.b].sort((x, y) => x - y).join(',')}` // 3+5 and 5+3 count as the same
  return `${t.kind}:${t.a}:${t.b}`
}

// Produce a question not seen yet in THIS race (`seen` is a Set of signatures),
// and preferably not the same type as the previous question, so the race keeps
// changing. Falls back gracefully if a small pool is used up.
function makeQuestionUnique(diff, theme, seen, lastKind) {
  let best = null
  for (let guard = 0; guard < 200; guard++) {
    const q = makeQuestion(diff, theme)
    const fresh = !seen || !seen.has(questionSignature(q))
    const newKind = q.kind !== lastKind
    if (fresh && (newKind || guard > 60)) return q
    if (fresh && !best) best = q
  }
  return best ?? makeQuestion(diff, theme)
}

// ── What the voice says for each kind of question ────────────────────────────
const anA = (w) => (/^[aeiou]/i.test(w) ? 'an' : 'a')
const nounCase = (w) => w.charAt(0) + w.slice(1).toLowerCase()   // HUND → Hund
function spokenQuestionDe(t) {
  switch (t.kind) {
    case 'letter':         return `Welcher Buchstabe fehlt? Auf dem Bild siehst du: ${nounCase(t.word)}.`
    case 'meaning':        return `Was bedeutet das Wort ${t.word.toLowerCase()}?`
    case 'sequence':       return `${t.terms.map((n, i) => (i === t.hideIdx ? 'was' : n)).join(', ')}? Welche Zahl fehlt?`
    case 'addition':       return `Wie viel ist ${t.a} plus ${t.b}?`
    case 'subtraction':    return `Wie viel ist ${t.a} minus ${t.b}?`
    case 'multiplication': return `Wie viel ist ${t.a} mal ${t.b}?`
    case 'compare':        return `Welche Zahl ist größer: ${t.a} oder ${t.b}?`
    case 'count':          return 'Wie viele siehst du? Zähl sie!'
    default:               return tr(t.prompt)
  }
}
function spokenQuestion(t) {
  if (getLang() === 'de') return spokenQuestionDe(t)
  switch (t.kind) {
    case 'letter': {
      const w = t.word.toLowerCase()
      return `Which letter is missing? The picture shows ${anA(w)} ${w}.`
    }
    case 'meaning':        return `What does the word ${t.word.toLowerCase()} mean?`
    case 'sequence':       return `${t.terms.map((n, i) => (i === t.hideIdx ? 'what' : n)).join(', ')}? What number is missing?`
    case 'addition':       return `What is ${t.a} plus ${t.b}?`
    case 'subtraction':    return `What is ${t.a} take away ${t.b}?`
    case 'multiplication': return `What is ${t.a} times ${t.b}?`
    case 'compare':        return `Which number is bigger: ${t.a}, or ${t.b}?`
    case 'count':          return 'How many can you see? Count them!'
    default:               return t.prompt
  }
}

// ── Vertical track for a single player shown beside the question ─────────────
function PlayerTrack({ player, position, isActive, place, color }) {
  const finished = place !== -1
  return (
    <div
      className={`qr-vtrack${isActive ? ' active' : ''}${finished ? ' finished' : ''}`}
      style={isActive ? { '--track-glow': color } : undefined}
    >
      {/* Goal at the top */}
      <div className="qr-vtrack-goal"><img src="/other-icons/finish (1).svg" alt="" style={{ width: '1.8em', height: '1.8em', objectFit: 'contain', display: 'block' }} /></div>

      {/* Cells from top (TRACK_LENGTH) down to 0 */}
      <div className="qr-vtrack-cells">
        {Array.from({ length: TRACK_LENGTH + 1 }).map((_, i) => {
          const step = TRACK_LENGTH - i   // top cell = finish line
          const isHere = position === step
          return (
            <div key={step} className={`qr-vcell${step === TRACK_LENGTH ? ' finish' : ''}${step === 0 ? ' start' : ''}${isHere ? ' occupied' : ''}`}>
              {step === 0 && !isHere && (
                <img src="/other-icons/start.svg" alt="" style={{ width: '1.7em', height: '1.7em', objectFit: 'contain', display: 'block' }} />
              )}
              {isHere && (
                <motion.span
                  layoutId={`qr-token-${player.id}`}
                  className="qr-token"
                  style={{ background: player.color }}
                  transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                >
                  <RacerAvatar racer={player} />
                </motion.span>
              )}
            </div>
          )
        })}
      </div>

      {/* Player label at the bottom */}
      <div className="qr-vtrack-label" style={{ color: player.color }}>
        {finished && <span className="qr-lane-medal">{MEDALS[place]}</span>}
        <RacerAvatar racer={player} />
        <span className="qr-vtrack-name">{tr(player.name)}</span>
        <span className="qr-vtrack-pos">{position}/{TRACK_LENGTH}</span>
      </div>
    </div>
  )
}

// ── Horizontal race track (used in sidebar for cpu mode) ─────────────────────
function RaceTrack({ players, positions, currentIdx, finishOrder, phase }) {
  return (
    <div className="qr-track">
      {players.map((p, idx) => {
        const place = finishOrder.indexOf(idx)
        const finished = place !== -1
        const isActive = phase === 'playing' && idx === currentIdx
        return (
          <div key={p.id} className={`qr-lane${isActive ? ' active' : ''}${finished ? ' finished' : ''}`}>
            <div className="qr-lane-label">
              <span className="qr-lane-emoji"><RacerAvatar racer={p} /></span>
              <span className="qr-lane-name">{tr(p.name)}</span>
              {finished && <span className="qr-lane-medal">{MEDALS[place]}</span>}
            </div>
            <div className="qr-lane-bar">
              {Array.from({ length: TRACK_LENGTH + 1 }).map((_, step) => (
                <div key={step} className={`qr-cell${step === TRACK_LENGTH ? ' finish' : ''}${step === 0 ? ' start' : ''}`}>
                  {step === TRACK_LENGTH && <img src="/other-icons/finish.svg" alt="" style={{ width: '1.5em', height: '1.5em', objectFit: 'contain', display: 'block' }} />}
                  {step === 0 && positions[idx] !== 0 && <img src="/other-icons/start.svg" alt="" style={{ width: '1.4em', height: '1.4em', objectFit: 'contain', display: 'block' }} />}
                  {positions[idx] === step && (
                    <motion.span
                      layoutId={`qr-token-${p.id}`}
                      className="qr-token"
                      style={{ background: p.color }}
                      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                    >
                      <RacerAvatar racer={p} />
                    </motion.span>
                  )}
                </div>
              ))}
            </div>
            <div className="qr-pos">{positions[idx]}/{TRACK_LENGTH}</div>
          </div>
        )
      })}
    </div>
  )
}

function Confetti() {
  const PIECES = ['🎉', '⭐', '✨', '🎊', '🌟', '🏆', '💫']
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
          {PIECES[i % PIECES.length]}
        </span>
      ))}
    </div>
  )
}

export default function QuizRaceGame({ onBack }) {
  const t = useT()
  const { theme } = useTheme()

  // ── setup choices ──
  const [phase, setPhase] = useState('setup') // 'setup' | 'playing' | 'gameover'
  const [diffId, setDiffId] = useState('easy')
  const [mode, setMode] = useState('cpu') // 'cpu' | 'hotseat'
  const playerCount = 2 // hot-seat is always 2 players

  // ── live game state ──
  const [players, setPlayers] = useState([])
  const [positions, setPositions] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [task, setTask] = useState(null)
  const [picked, setPicked] = useState(null)
  const [locked, setLocked] = useState(false)
  const [finishOrder, setFinishOrder] = useState([])
  const [feedback, setFeedback] = useState({ text: '', tone: 'try' })
  const [cpuThinking, setCpuThinking] = useState(false)
  // read-aloud: remembered setting + which part is being read (-1 = question)
  const [readAloud, setReadAloud] = useState(() => {
    try { return localStorage.getItem('qr-read') === '1' } catch { return false }
  })
  const [readingIdx, setReadingIdx] = useState(null)

  // Tracks the signatures of recently-shown questions so the next one avoids
  // repeating any of them — keeps questions from cycling back too soon.
  const seenSigsRef = useRef(new Set())   // every question asked in this race
  const lastKindRef = useRef(null)

  const diff = DIFFICULTIES[diffId]

  const nextQuestion = useCallback(() => {
    const q = makeQuestionUnique(diff, theme, seenSigsRef.current, lastKindRef.current)
    seenSigsRef.current.add(questionSignature(q))
    lastKindRef.current = q.kind
    return q
  }, [diff, theme])

  // Build the player list from the chosen mode
  const buildPlayers = useCallback(() => {
    const racers = theme.raceRacers
    if (mode === 'cpu') {
      return [
        { ...racers[0], id: 'you', name: 'You', isCpu: false },
        { ...racers[1], id: 'cpu', name: 'Computer', isCpu: true },
      ]
    }
    return racers.slice(0, playerCount).map((r, i) => ({
      ...r, id: `p${i}`, name: `Player ${i + 1}`, isCpu: false,
    }))
  }, [theme, mode, playerCount])

  const startGame = useCallback(() => {
    const p = buildPlayers()
    setPlayers(p)
    setPositions(p.map(() => 0))
    setCurrentIdx(0)
    setFinishOrder([])
    seenSigsRef.current = new Set()
    lastKindRef.current = null
    setTask(nextQuestion())
    setPicked(null)
    setLocked(false)
    setCpuThinking(false)
    setFeedback({ text: tr('Answer to move ahead!'), tone: 'try' })
    setPhase('playing')
  }, [buildPlayers, nextQuestion])

  // advance to the next player who has not yet finished, then make a fresh task
  const nextTurn = useCallback((order) => {
    // Compute next index directly — don't call setState inside another setState updater
    setCurrentIdx((cur) => {
      const n = players.length
      for (let i = 1; i <= n; i++) {
        const cand = (cur + i) % n
        if (!order.includes(cand)) return cand
      }
      return cur
    })
    setTask(nextQuestion())
    setPicked(null)
    setLocked(false)
    setFeedback({ text: tr('Answer to move ahead!'), tone: 'try' })
  }, [players, nextQuestion])

  // Resolve one answer (correct?) for the active player, then pass the turn.
  const resolveAnswer = useCallback((correct, chosen) => {
    setPicked(chosen)
    setLocked(true)

    if (correct) {
      playCorrect()
      setFeedback({ text: tr(pick(CHEERS)), tone: 'good' })
    } else {
      playWrong()
      setFeedback({ text: tr(pick(TRY_AGAIN)), tone: 'try' })
    }

    setTimeout(() => {
      let newOrder = finishOrder
      if (correct) {
        setPositions((prev) => {
          const np = [...prev]
          np[currentIdx] = Math.min(TRACK_LENGTH, np[currentIdx] + 1)
          // detect a brand-new finisher
          if (np[currentIdx] >= TRACK_LENGTH && !finishOrder.includes(currentIdx)) {
            newOrder = [...finishOrder, currentIdx]
            setFinishOrder(newOrder)
          }
          return np
        })
      }

      // Give the position update a beat, then decide what happens next.
      setTimeout(() => {
        // End the race once everyone (or all but one) has finished.
        const remaining = players.length - newOrder.length
        if (remaining <= (players.length > 1 ? 1 : 0)) {
          // include the last straggler in the order for the results screen
          if (remaining === 1) {
            const last = players.map((_, i) => i).find(i => !newOrder.includes(i))
            if (last != null) newOrder = [...newOrder, last]
          }
          setFinishOrder(newOrder)
          playWin()
          setPhase('gameover')
          return
        }
        nextTurn(newOrder)
      }, 350)
    }, 850)
  }, [currentIdx, finishOrder, players, nextTurn])

  // Read the current question, then each answer (the answer being read glows).
  const readTask = useCallback((t) => {
    if (!t) return
    speakSteps([
      { text: spokenQuestion(t), onStart: () => setReadingIdx(-1) },
      ...t.options.map((o, i) => ({
        text: `${i === t.options.length - 1 ? tr('or') + ' ' : ''}${o}${i === t.options.length - 1 ? '?' : ','}`,
        onStart: () => setReadingIdx(i),
      })),
    ], () => setReadingIdx(null))
  }, [])

  // Auto-read every new question on a person's turn (not the computer's).
  useEffect(() => {
    if (!readAloud || phase !== 'playing' || !task || players[currentIdx]?.isCpu) return undefined
    const t = setTimeout(() => readTask(task), 450)   // after the card animation
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task, readAloud, phase])

  useEffect(() => () => stopSpeaking(), [])

  // Human taps an option
  const choose = (opt) => {
    if (locked || cpuThinking) return
    if (players[currentIdx]?.isCpu) return
    stopSpeaking()
    setReadingIdx(null)
    resolveAnswer(opt === task.answer, opt)
  }

  // Computer turn: pause to "think", then answer right with diff.cpuOdds.
  useEffect(() => {
    if (phase !== 'playing' || !task || locked) return
    const active = players[currentIdx]
    if (!active || !active.isCpu) return

    setCpuThinking(true)
    setFeedback({ text: '🤖 ' + tr('Computer is thinking…'), tone: 'try' })
    const t = setTimeout(() => {
      const getsItRight = Math.random() < diff.cpuOdds
      let chosen
      if (getsItRight) {
        chosen = task.answer
      } else {
        const wrongs = task.options.filter(o => o !== task.answer)
        chosen = wrongs.length ? pick(wrongs) : task.answer
      }
      setCpuThinking(false)
      resolveAnswer(chosen === task.answer, chosen)
    }, 1100)
    return () => clearTimeout(t)
  }, [phase, task, locked, currentIdx, players, diff, resolveAnswer])

  // ════════════════════════════════════════════════════════════════════════
  // SETUP SCREEN
  // ════════════════════════════════════════════════════════════════════════
  if (phase === 'setup') {
    return (
      <div className="quizrace-screen screen">
        <motion.div
          className="qr-setup"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } }}
        >
          <div className="qr-setup-header">
            <button className="btn btn-secondary back-btn" onClick={onBack}>← {t('Back')}</button>
            <h2 className="qr-setup-title">🏁 {t('Quiz Race')}</h2>
            <div />
          </div>
          <p className="qr-setup-tagline">{t('Answer number & letter questions to race to the finish!')}</p>

          {/* Difficulty */}
          <h3 className="qr-setup-h">{t('Choose difficulty')}</h3>
          <div className="qr-diff-btns">
            {DIFF_LIST.map(d => (
              <motion.button
                key={d.id}
                className={`qr-diff-btn ${diffId === d.id ? 'selected' : ''}`}
                onClick={() => setDiffId(d.id)}
                whileHover={{ scale: 1.05, transition: { duration: 0.13 } }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="qr-diff-emoji">
                  {d.image
                    ? <img src={d.image} alt="" style={{ width: '1em', height: '1em', objectFit: 'contain', display: 'block' }} />
                    : d.emoji}
                </span>
                <span className="qr-diff-label">{t(d.label)}</span>
                <span className="qr-diff-desc">{t(d.desc)}</span>
              </motion.button>
            ))}
          </div>

          {/* Mode */}
          <h3 className="qr-setup-h">{t('Who is playing?')}</h3>
          <div className="qr-mode-btns">
            <motion.button
              className={`qr-mode-btn ${mode === 'cpu' ? 'selected' : ''}`}
              onClick={() => setMode('cpu')}
              whileHover={{ scale: 1.05, transition: { duration: 0.13 } }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="qr-mode-racers">
                <RacerAvatar racer={theme.raceRacers[0]} />
                <span className="qr-vs">{t('vs')}</span>
                <img src="/other-icons/vs-pc.svg" alt="" style={{ width: '1em', height: '1em', objectFit: 'contain', display: 'block' }} />
              </span>
              <span className="qr-mode-label">{t('1 vs Computer')}</span>
            </motion.button>
            <motion.button
              className={`qr-mode-btn ${mode === 'hotseat' ? 'selected' : ''}`}
              onClick={() => setMode('hotseat')}
              whileHover={{ scale: 1.05, transition: { duration: 0.13 } }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="qr-mode-racers">
                {theme.raceRacers.slice(0, 2).map(r => <RacerAvatar key={r.id} racer={r} />)}
              </span>
              <span className="qr-mode-label">{t('Friends (pass & play)')}</span>
            </motion.button>
          </div>

          {canSpeak && (
            <button
              className={`qr-read-toggle${readAloud ? ' on' : ''}`}
              onClick={() => {
                const v = !readAloud
                setReadAloud(v)
                try { localStorage.setItem('qr-read', v ? '1' : '0') } catch { /* ignore */ }
                if (v) speakSteps([{ text: tr('I will read the questions to you.') }])
              }}
              role="switch"
              aria-checked={readAloud}
            >
              <span className="qr-read-icon">{readAloud ? '🔊' : '🔇'}</span>
              <span className="qr-read-text">
                <b>{t('Read the questions to me')}</b>
                <small>{readAloud ? t('On — every question is read aloud') : t('Off — tap 🔊 on a question to hear it')}</small>
              </span>
              <span className="sound-switch"><span className="sound-knob" /></span>
            </button>
          )}

          <motion.button
            className="btn btn-primary qr-start-btn"
            onClick={startGame}
            whileHover={{ scale: 1.06, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.95 }}
          >
            {t('Start Race!')} 🏁
          </motion.button>
        </motion.div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════
  // GAME-OVER SCREEN
  // ════════════════════════════════════════════════════════════════════════
  if (phase === 'gameover') {
    const winnerIdx = finishOrder[0]
    const winner = players[winnerIdx]
    const youWon = winner && !winner.isCpu && winner.id === 'you'
    let title = '🏁 ' + t('Race Finished!')
    if (mode === 'cpu') title = youWon ? '🎉 ' + t('You Won the Race!') : '🤖 ' + t('{name} wins!', { name: t('Computer') })

    return (
      <div className="quizrace-screen screen">
        <div className="gameover">
          <Confetti />
          <div className="gameover-emoji">{winner ? <RacerAvatar racer={winner} /> : '🏆'}</div>
          <h2>{title}</h2>
          {winner && <p>{winner.id === 'you' ? t('You crossed the finish line first!') : t('{name} crossed the finish line first!', { name: t(winner.name) })}</p>}

          <div className="qr-results">
            {finishOrder.map((pIdx, place) => (
              <div key={players[pIdx].id} className={`qr-result-row place-${place + 1}`}>
                <span className="qr-result-medal">{MEDALS[place] ?? `${place + 1}.`}</span>
                <span className="qr-result-emoji"><RacerAvatar racer={players[pIdx]} /></span>
                <span className="qr-result-name">{t(players[pIdx].name)}</span>
              </div>
            ))}
          </div>

          <div className="gameover-btns">
            <button className="btn btn-primary" onClick={startGame}>{t('Play Again')}</button>
            <button className="btn btn-secondary" onClick={() => setPhase('setup')}>{t('Change Setup')}</button>
            <button className="btn btn-secondary" onClick={onBack}>{t('Menu')}</button>
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════
  // PLAYING SCREEN
  // ════════════════════════════════════════════════════════════════════════
  const active = players[currentIdx]
  const cpuTurn = active?.isCpu

  // Guard: players may not be populated yet on the very first render
  if (!players[0] || !players[1]) return null

  return (
    <div className="quizrace-screen screen qr-playing">

      {/* ── Player 1 track (left) ── */}
      <PlayerTrack
        player={players[0]}
        position={positions[0] ?? 0}
        isActive={currentIdx === 0}
        place={finishOrder.indexOf(0)}
        color={players[0].color}
      />

      {/* ── Question area (centre) ── */}
      <div className="qr-main">
        <div className={`quest-feedback ${feedback.tone}`}>{feedback.text}</div>
        <div className="quest-card qr-card">
          <div className="qr-q-tag">{task.family === 'letter' ? '🔤 ' + t('Letter') : task.family === 'meaning' ? '📖 ' + t('Word') : '🔢 ' + t('Number')}</div>
          <div className={`quest-prompt${readingIdx === -1 ? ' reading' : ''}`}>{t(task.prompt)}</div>
          {canSpeak && (
            <button className="qr-listen-btn" onClick={() => readTask(task)} disabled={cpuTurn} title={t('Read it to me')}>
              🔊
            </button>
          )}

          {task.kind === 'meaning' && (
            <div className="word-meaning-word">{task.word}</div>
          )}

          {task.kind === 'letter' && (
            <>
              <div className="word-picture">{task.emoji}</div>
              <div className="word-row">
                {task.word.split('').map((ch, i) => (
                  <div key={i} className={`letter-tile${i === task.blankIdx ? ' blank' : ''}`}>
                    {i === task.blankIdx ? '?' : ch}
                  </div>
                ))}
              </div>
            </>
          )}

          {task.kind === 'sequence' && (
            <div className="seq-row">
              {task.terms.map((t, i) => (
                <div key={i} className={`seq-tile${i === task.hideIdx ? ' blank' : ''}`}>
                  {i === task.hideIdx ? '?' : t}
                </div>
              ))}
            </div>
          )}

          {(task.kind === 'addition' || task.kind === 'subtraction' || task.kind === 'multiplication') && (
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

          <div className="option-grid">
            {task.options.map((opt, i) => {
              const isPicked = picked === opt
              const cls = isPicked ? (opt === task.answer ? 'correct' : 'wrong') : ''
              const textMode = task.family === 'meaning' ? 'opt-text' : ''
              return (
                <button
                  key={i}
                  className={`option-btn ${cls} ${textMode}${readingIdx === i && !picked ? ' reading' : ''}`}
                  onClick={() => choose(opt)}
                  disabled={locked || cpuTurn}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Player 2 track (right) ── */}
      <PlayerTrack
        player={players[1]}
        position={positions[1] ?? 0}
        isActive={currentIdx === 1}
        place={finishOrder.indexOf(1)}
        color={players[1].color}
      />

    </div>
  )
}
