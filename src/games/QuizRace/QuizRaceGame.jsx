import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import RacerAvatar from '../../components/RacerAvatar'
import './QuizRace.css'
import { playCorrect, playWrong, playWin } from '../../sound/sfx'
import { speakSteps, stopSpeaking, canSpeak } from '../../sound/speech'

const TRACK_LENGTH = 10 // spaces from start (0) to finish (10)

const MEDALS = ['🥇', '🥈', '🥉', '🏅']

const CHEERS = ['Great job! 🎉', 'You got it! ⭐', 'Well done! 🙌', 'Awesome! ✨', 'Nice work! 👏', 'Brilliant! 🌟']
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

// ── Vocabulary bank for HARD 'what does this word mean?' questions ────────────
// meaning is the correct answer; `wrong` holds three plausible distractors.
const VOCAB = [
  { word: 'ENORMOUS',    meaning: 'Very big',                  wrong: ['Very small', 'Very fast', 'Very loud'] },
  { word: 'GIGANTIC',    meaning: 'Huge',                      wrong: ['Tiny', 'Quiet', 'Slow'] },
  { word: 'ANCIENT',     meaning: 'Very old',                  wrong: ['Brand new', 'Very fast', 'Very tall'] },
  { word: 'RAPID',       meaning: 'Very fast',                 wrong: ['Very slow', 'Very old', 'Very soft'] },
  { word: 'FREEZING',    meaning: 'Very cold',                 wrong: ['Very hot', 'Very bright', 'Very heavy'] },
  { word: 'SCORCHING',   meaning: 'Very hot',                  wrong: ['Very cold', 'Very wet', 'Very dark'] },
  { word: 'BRAVE',       meaning: 'Not afraid',                wrong: ['Very scared', 'Very sleepy', 'Very hungry'] },
  { word: 'TERRIFIED',   meaning: 'Very scared',               wrong: ['Very brave', 'Very calm', 'Very happy'] },
  { word: 'DELICIOUS',   meaning: 'Tastes very good',          wrong: ['Smells bad', 'Looks ugly', 'Feels cold'] },
  { word: 'EXHAUSTED',   meaning: 'Very tired',                wrong: ['Wide awake', 'Very happy', 'Very angry'] },
  { word: 'FURIOUS',     meaning: 'Very angry',                wrong: ['Very calm', 'Very happy', 'Very tired'] },
  { word: 'DELIGHTED',   meaning: 'Very happy',                wrong: ['Very sad', 'Very tired', 'Very angry'] },
  { word: 'TIMID',       meaning: 'Shy',                       wrong: ['Loud', 'Brave', 'Strong'] },
  { word: 'FRAGILE',     meaning: 'Easily broken',             wrong: ['Very strong', 'Very heavy', 'Very fast'] },
  { word: 'TRANSPARENT', meaning: 'You can see through it',    wrong: ['Very colourful', 'Very loud', 'Very heavy'] },
  { word: 'INVISIBLE',   meaning: 'Cannot be seen',            wrong: ['Very loud', 'Very tall', 'Very heavy'] },
  { word: 'GENEROUS',    meaning: 'Likes to share and give',   wrong: ['Greedy', 'Lazy', 'Grumpy'] },
  { word: 'CURIOUS',     meaning: 'Wanting to learn or know',  wrong: ['Bored', 'Sleepy', 'Sad'] },
  { word: 'PECULIAR',    meaning: 'Strange or odd',            wrong: ['Normal', 'Boring', 'Tasty'] },
  { word: 'MASSIVE',     meaning: 'Very large',                wrong: ['Very small', 'Very quiet', 'Very quick'] },
  { word: 'SILENT',      meaning: 'Making no sound',           wrong: ['Very loud', 'Very bright', 'Very fast'] },
  { word: 'WEARY',       meaning: 'Tired',                     wrong: ['Excited', 'Hungry', 'Brave'] },
  { word: 'BRILLIANT',   meaning: 'Very clever or bright',     wrong: ['Very dull', 'Very slow', 'Very sad'] },
  { word: 'VICTORY',     meaning: 'A win',                     wrong: ['A loss', 'A draw', 'A rest'] },
  { word: 'JOURNEY',     meaning: 'A trip from place to place',wrong: ['A short nap', 'A meal', 'A song'] },
  { word: 'ANNUAL',      meaning: 'Happens once a year',       wrong: ['Happens every day', 'Never happens', 'Happens twice a day'] },
]

// ── Word + picture banks for "Which letter is missing?" ───────────────────────
// RULE for every entry: a child must be able to say the word just by looking at
// the picture. So: concrete nouns only, one word per picture, no abstract words
// (CODE, GRAVITY…), no "close enough" pictures (RUN as a T-Rex, EEL as a snake),
// British spelling, and only emoji that also show on older Windows/Android
// (nothing from Emoji 14+, e.g. no 🪸 coral or 🪼 jellyfish).
//
// Generic bank — tops up a world that is short on words of a given length.
const WORDS = [
  { word: 'CAT', emoji: '🐱' }, { word: 'DOG', emoji: '🐶' }, { word: 'SUN', emoji: '☀️' },
  { word: 'BEE', emoji: '🐝' }, { word: 'EGG', emoji: '🥚' }, { word: 'CAR', emoji: '🚗' },
  { word: 'KEY', emoji: '🔑' }, { word: 'HAT', emoji: '🎩' }, { word: 'BUS', emoji: '🚌' },
  { word: 'PIG', emoji: '🐷' }, { word: 'COW', emoji: '🐄' }, { word: 'BED', emoji: '🛏️' },
  { word: 'BOX', emoji: '📦' }, { word: 'MAP', emoji: '🗺️' }, { word: 'PEN', emoji: '🖊️' },
  { word: 'BOOK', emoji: '📖' }, { word: 'TREE', emoji: '🌳' }, { word: 'CAKE', emoji: '🎂' },
  { word: 'BALL', emoji: '⚽' }, { word: 'SOCK', emoji: '🧦' }, { word: 'BOAT', emoji: '⛵' },
  { word: 'MOON', emoji: '🌙' }, { word: 'STAR', emoji: '⭐' }, { word: 'GIFT', emoji: '🎁' },
  { word: 'DRUM', emoji: '🥁' }, { word: 'KITE', emoji: '🪁' }, { word: 'RING', emoji: '💍' },
  { word: 'SHOE', emoji: '👟' }, { word: 'BIRD', emoji: '🐦' }, { word: 'FROG', emoji: '🐸' },
  { word: 'APPLE', emoji: '🍎' }, { word: 'HOUSE', emoji: '🏠' }, { word: 'TRAIN', emoji: '🚂' },
  { word: 'PIZZA', emoji: '🍕' }, { word: 'CROWN', emoji: '👑' }, { word: 'LEMON', emoji: '🍋' },
  { word: 'CLOCK', emoji: '🕐' }, { word: 'GLOVE', emoji: '🧤' }, { word: 'JUICE', emoji: '🧃' },
  { word: 'PLANT', emoji: '🌱' }, { word: 'ROBOT', emoji: '🤖' }, { word: 'CHAIR', emoji: '🪑' },
  { word: 'GRAPES', emoji: '🍇' }, { word: 'FLOWER', emoji: '🌸' }, { word: 'GUITAR', emoji: '🎸' },
  { word: 'ROCKET', emoji: '🚀' }, { word: 'BANANA', emoji: '🍌' }, { word: 'CARROT', emoji: '🥕' },
  { word: 'PENCIL', emoji: '✏️' }, { word: 'BALLOON', emoji: '🎈' }, { word: 'UMBRELLA', emoji: '☂️' },
]

// Theme banks — letter questions use the current world first (Sea → SHARK…).
const THEME_WORDS = {
  animals: [
    { word: 'CAT', emoji: '🐱' }, { word: 'DOG', emoji: '🐶' }, { word: 'COW', emoji: '🐄' },
    { word: 'PIG', emoji: '🐷' }, { word: 'BEE', emoji: '🐝' }, { word: 'FOX', emoji: '🦊' },
    { word: 'OWL', emoji: '🦉' }, { word: 'HEN', emoji: '🐔' }, { word: 'BAT', emoji: '🦇' },
    { word: 'ANT', emoji: '🐜' },
    { word: 'FROG', emoji: '🐸' }, { word: 'LION', emoji: '🦁' }, { word: 'BEAR', emoji: '🐻' },
    { word: 'DUCK', emoji: '🦆' }, { word: 'GOAT', emoji: '🐐' }, { word: 'WOLF', emoji: '🐺' },
    { word: 'DEER', emoji: '🦌' }, { word: 'SNAIL', emoji: '🐌' }, { word: 'MOUSE', emoji: '🐭' },
    { word: 'TIGER', emoji: '🐯' }, { word: 'HORSE', emoji: '🐴' }, { word: 'ZEBRA', emoji: '🦓' },
    { word: 'PANDA', emoji: '🐼' }, { word: 'SNAKE', emoji: '🐍' }, { word: 'KOALA', emoji: '🐨' },
    { word: 'SHEEP', emoji: '🐑' }, { word: 'CAMEL', emoji: '🐫' }, { word: 'EAGLE', emoji: '🦅' },
    { word: 'RHINO', emoji: '🦏' }, { word: 'HIPPO', emoji: '🦛' }, { word: 'OTTER', emoji: '🦦' },
    { word: 'MONKEY', emoji: '🐒' }, { word: 'RABBIT', emoji: '🐰' }, { word: 'PARROT', emoji: '🦜' },
    { word: 'TURKEY', emoji: '🦃' }, { word: 'GORILLA', emoji: '🦍' }, { word: 'GIRAFFE', emoji: '🦒' },
    { word: 'HAMSTER', emoji: '🐹' }, { word: 'PEACOCK', emoji: '🦚' }, { word: 'PENGUIN', emoji: '🐧' },
    { word: 'ELEPHANT', emoji: '🐘' }, { word: 'FLAMINGO', emoji: '🦩' }, { word: 'KANGAROO', emoji: '🦘' },
  ],
  dinosaurs: [
    { word: 'EGG', emoji: '🥚' }, { word: 'REX', emoji: '🦖' },
    { word: 'DINO', emoji: '🦕' }, { word: 'BONE', emoji: '🦴' }, { word: 'ROCK', emoji: '🪨' },
    { word: 'LEAF', emoji: '🍃' }, { word: 'PALM', emoji: '🌴' }, { word: 'FIRE', emoji: '🔥' },
    { word: 'CROC', emoji: '🐊' }, { word: 'TREE', emoji: '🌳' },
    { word: 'TOOTH', emoji: '🦷' }, { word: 'CLOUD', emoji: '☁️' },
    { word: 'LIZARD', emoji: '🦎' }, { word: 'TURTLE', emoji: '🐢' }, { word: 'METEOR', emoji: '☄️' },
    { word: 'VOLCANO', emoji: '🌋' }, { word: 'MOUNTAIN', emoji: '⛰️' },
  ],
  space: [
    { word: 'SUN', emoji: '☀️' }, { word: 'UFO', emoji: '🛸' },
    { word: 'STAR', emoji: '⭐' }, { word: 'MOON', emoji: '🌙' },
    { word: 'EARTH', emoji: '🌍' }, { word: 'COMET', emoji: '☄️' }, { word: 'ALIEN', emoji: '👽' },
    { word: 'ROCKET', emoji: '🚀' }, { word: 'PLANET', emoji: '🪐' }, { word: 'GALAXY', emoji: '🌌' },
    { word: 'TELESCOPE', emoji: '🔭' }, { word: 'SATELLITE', emoji: '🛰️' }, { word: 'ASTRONAUT', emoji: '🧑‍🚀' },
  ],
  robots: [
    { word: 'ARM', emoji: '🦾' }, { word: 'LEG', emoji: '🦿' }, { word: 'KEY', emoji: '🔑' },
    { word: 'GEAR', emoji: '⚙️' }, { word: 'BOLT', emoji: '🔩' }, { word: 'PLUG', emoji: '🔌' },
    { word: 'BULB', emoji: '💡' },
    { word: 'ROBOT', emoji: '🤖' }, { word: 'CLOCK', emoji: '⏰' }, { word: 'PHONE', emoji: '📱' },
    { word: 'MAGNET', emoji: '🧲' }, { word: 'HAMMER', emoji: '🔨' }, { word: 'LAPTOP', emoji: '💻' },
    { word: 'SCREEN', emoji: '🖥️' }, { word: 'CAMERA', emoji: '📷' },
    { word: 'BATTERY', emoji: '🔋' }, { word: 'TOOLBOX', emoji: '🧰' },
  ],
  sea: [
    { word: 'SEA', emoji: '🌊' },
    { word: 'FISH', emoji: '🐟' }, { word: 'CRAB', emoji: '🦀' }, { word: 'WAVE', emoji: '🌊' },
    { word: 'SHIP', emoji: '🚢' }, { word: 'BOAT', emoji: '⛵' }, { word: 'SEAL', emoji: '🦭' },
    { word: 'SHARK', emoji: '🦈' }, { word: 'WHALE', emoji: '🐳' }, { word: 'SHELL', emoji: '🐚' },
    { word: 'SQUID', emoji: '🦑' },
    { word: 'TURTLE', emoji: '🐢' }, { word: 'ANCHOR', emoji: '⚓' }, { word: 'ISLAND', emoji: '🏝️' },
    { word: 'OYSTER', emoji: '🦪' }, { word: 'LOBSTER', emoji: '🦞' }, { word: 'DOLPHIN', emoji: '🐬' },
    { word: 'OCTOPUS', emoji: '🐙' }, { word: 'PENGUIN', emoji: '🐧' }, { word: 'MERMAID', emoji: '🧜' },
  ],
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

// Every word the game knows — used so a wrong letter option never spells a
// different real word (e.g. "_AT" for a cat must not offer B → BAT).
const KNOWN_WORDS = new Set([
  ...WORDS.map(w => w.word),
  ...Object.values(THEME_WORDS).flat().map(w => w.word),
])

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
    const entry = pick(VOCAB)
    return {
      family: 'meaning', kind: 'meaning',
      word: entry.word, answer: entry.meaning,
      options: shuffle([entry.meaning, ...entry.wrong]),
      prompt: 'What does this word mean?',
    }
  }

  if (family === 'letter') {
    const themeWords = THEME_WORDS[theme?.id] ?? []
    // theme words of the right length first…
    let pool = themeWords.filter(w => w.word.length <= diff.maxLen)
    // …topped up with generic words so there's always plenty of variety.
    if (pool.length < 5) pool = [...pool, ...WORDS.filter(w => w.word.length <= diff.maxLen)]
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
function spokenQuestion(t) {
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
        <span className="qr-vtrack-name">{player.name}</span>
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
              <span className="qr-lane-name">{p.name}</span>
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
    setFeedback({ text: 'Answer to move ahead!', tone: 'try' })
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
    setFeedback({ text: 'Answer to move ahead!', tone: 'try' })
  }, [players, nextQuestion])

  // Resolve one answer (correct?) for the active player, then pass the turn.
  const resolveAnswer = useCallback((correct, chosen) => {
    setPicked(chosen)
    setLocked(true)

    if (correct) {
      playCorrect()
      setFeedback({ text: pick(CHEERS), tone: 'good' })
    } else {
      playWrong()
      setFeedback({ text: pick(TRY_AGAIN), tone: 'try' })
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
        text: `${i === t.options.length - 1 ? 'or ' : ''}${o}${i === t.options.length - 1 ? '?' : ','}`,
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
    setFeedback({ text: '🤖 Computer is thinking…', tone: 'try' })
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
            <button className="btn btn-secondary back-btn" onClick={onBack}>← Back</button>
            <h2 className="qr-setup-title">🏁 Quiz Race</h2>
            <div />
          </div>
          <p className="qr-setup-tagline">Answer number &amp; letter questions to race to the finish!</p>

          {/* Difficulty */}
          <h3 className="qr-setup-h">Choose difficulty</h3>
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
                <span className="qr-diff-label">{d.label}</span>
                <span className="qr-diff-desc">{d.desc}</span>
              </motion.button>
            ))}
          </div>

          {/* Mode */}
          <h3 className="qr-setup-h">Who is playing?</h3>
          <div className="qr-mode-btns">
            <motion.button
              className={`qr-mode-btn ${mode === 'cpu' ? 'selected' : ''}`}
              onClick={() => setMode('cpu')}
              whileHover={{ scale: 1.05, transition: { duration: 0.13 } }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="qr-mode-racers">
                <RacerAvatar racer={theme.raceRacers[0]} />
                <span className="qr-vs">vs</span>
                <img src="/other-icons/vs-pc.svg" alt="" style={{ width: '1em', height: '1em', objectFit: 'contain', display: 'block' }} />
              </span>
              <span className="qr-mode-label">1 vs Computer</span>
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
              <span className="qr-mode-label">Friends (hot-seat)</span>
            </motion.button>
          </div>

          {canSpeak && (
            <button
              className={`qr-read-toggle${readAloud ? ' on' : ''}`}
              onClick={() => {
                const v = !readAloud
                setReadAloud(v)
                try { localStorage.setItem('qr-read', v ? '1' : '0') } catch { /* ignore */ }
                if (v) speakSteps([{ text: 'I will read the questions to you.' }])
              }}
              role="switch"
              aria-checked={readAloud}
            >
              <span className="qr-read-icon">{readAloud ? '🔊' : '🔇'}</span>
              <span className="qr-read-text">
                <b>Read the questions to me</b>
                <small>{readAloud ? 'On — every question is read aloud' : 'Off — tap 🔊 on a question to hear it'}</small>
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
            Start Race! 🏁
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
    let title = '🏁 Race Finished!'
    if (mode === 'cpu') title = youWon ? '🎉 You Won the Race!' : '🤖 Computer Wins!'

    return (
      <div className="quizrace-screen screen">
        <div className="gameover">
          <Confetti />
          <div className="gameover-emoji">{winner ? <RacerAvatar racer={winner} /> : '🏆'}</div>
          <h2>{title}</h2>
          {winner && <p>{winner.name} crossed the finish line first!</p>}

          <div className="qr-results">
            {finishOrder.map((pIdx, place) => (
              <div key={players[pIdx].id} className={`qr-result-row place-${place + 1}`}>
                <span className="qr-result-medal">{MEDALS[place] ?? `${place + 1}.`}</span>
                <span className="qr-result-emoji"><RacerAvatar racer={players[pIdx]} /></span>
                <span className="qr-result-name">{players[pIdx].name}</span>
              </div>
            ))}
          </div>

          <div className="gameover-btns">
            <button className="btn btn-primary" onClick={startGame}>Play Again</button>
            <button className="btn btn-secondary" onClick={() => setPhase('setup')}>Change Setup</button>
            <button className="btn btn-secondary" onClick={onBack}>Menu</button>
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
          <div className="qr-q-tag">{task.family === 'letter' ? '🔤 Letter' : task.family === 'meaning' ? '📖 Word' : '🔢 Number'}</div>
          <div className={`quest-prompt${readingIdx === -1 ? ' reading' : ''}`}>{task.prompt}</div>
          {canSpeak && (
            <button className="qr-listen-btn" onClick={() => readTask(task)} disabled={cpuTurn} title="Read it to me">
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
