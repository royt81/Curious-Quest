// ─── Picture questions for children who can't read yet ────────────────────────
// Every question is answered by tapping a picture, and every question has a
// `say` line that is read aloud. Options are objects:
//   { emoji }            – one big picture
//   { emoji, count }     – a group of pictures ("which has more?")
//   { dots }             – a dice face (counting)
//   { color }            – a coloured blob
// `label` is what the voice says when revealing the right answer.

const rand = (n) => Math.floor(Math.random() * n)
const pick = (a) => a[rand(a.length)]
function shuffle(a) {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) { const j = rand(i + 1); [b[i], b[j]] = [b[j], b[i]] }
  return b
}
function plural(name, n) {
  if (n === 1 || /fish$/.test(name)) return name
  if (name === 'leaf') return 'leaves'
  if (/(s|sh|ch|x)$/i.test(name)) return `${name}es`
  return `${name}s`
}
// Things there is only one of — odd to count ("how many Earths?")
const ONLY_ONE = new Set(['Earth', 'sun', 'moon', 'volcano'])
const countable = (items) => items.filter(([, n]) => !ONLY_ONE.has(n))

// Things from each world (emoji + the word the voice uses)
const WORLD_ITEMS = {
  animals: [
    ['🐘', 'elephant'], ['🦒', 'giraffe'], ['🦁', 'lion'], ['🐒', 'monkey'], ['🐢', 'turtle'],
    ['🐸', 'frog'], ['🐧', 'penguin'], ['🦓', 'zebra'], ['🐻', 'bear'], ['🐰', 'rabbit'],
  ],
  dinosaurs: [
    ['🦖', 'T-Rex'], ['🦕', 'long-neck dinosaur'], ['🥚', 'egg'], ['🌋', 'volcano'], ['🦴', 'bone'],
    ['🌴', 'palm tree'], ['🐊', 'crocodile'], ['🦎', 'lizard'], ['🐢', 'turtle'], ['🍃', 'leaf'],
  ],
  space: [
    ['🚀', 'rocket'], ['🌙', 'moon'], ['⭐', 'star'], ['☀️', 'sun'], ['🪐', 'planet'],
    ['👽', 'alien'], ['🛸', 'flying saucer'], ['🌍', 'Earth'], ['☄️', 'comet'], ['🛰️', 'satellite'],
  ],
  robots: [
    ['🤖', 'robot'], ['⚙️', 'gear'], ['🔋', 'battery'], ['💡', 'light bulb'], ['🔧', 'spanner'],
    ['🧲', 'magnet'], ['💻', 'computer'], ['🔩', 'bolt'], ['📡', 'antenna'], ['🕹️', 'joystick'],
  ],
  sea: [
    ['🐙', 'octopus'], ['🐠', 'fish'], ['🦀', 'crab'], ['🐳', 'whale'], ['🐬', 'dolphin'],
    ['🦈', 'shark'], ['🐢', 'turtle'], ['🐚', 'shell'], ['🦑', 'squid'], ['🦞', 'lobster'],
  ],
}

const COLORS = [
  ['#ff3b30', 'red'], ['#007aff', 'blue'], ['#ffd60a', 'yellow'], ['#34c759', 'green'],
  ['#ff9500', 'orange'], ['#bf5af2', 'purple'], ['#ff6fb5', 'pink'],
]
const SHAPES = [['🔴', 'circle'], ['🟦', 'square'], ['🔺', 'triangle'], ['⭐', 'star'], ['❤️', 'heart']]

const CATEGORIES = [
  { say: 'Which one can fly?',
    yes: [['🦅', 'eagle'], ['🦋', 'butterfly'], ['🐝', 'bee'], ['🐦', 'bird'], ['✈️', 'aeroplane'], ['🚁', 'helicopter']],
    no:  [['🐘', 'elephant'], ['🐢', 'turtle'], ['🐟', 'fish'], ['🐄', 'cow'], ['🚗', 'car'], ['🐌', 'snail']] },
  { say: 'Which one lives in the sea?',
    yes: [['🐙', 'octopus'], ['🐠', 'fish'], ['🦈', 'shark'], ['🐳', 'whale'], ['🦀', 'crab'], ['🐬', 'dolphin']],
    no:  [['🐄', 'cow'], ['🦁', 'lion'], ['🐔', 'chicken'], ['🐒', 'monkey'], ['🐘', 'elephant'], ['🐰', 'rabbit']] },
  { say: 'Which one can you eat?',
    yes: [['🍎', 'apple'], ['🍌', 'banana'], ['🍕', 'pizza'], ['🥕', 'carrot'], ['🍓', 'strawberry'], ['🧀', 'cheese']],
    no:  [['🧸', 'teddy bear'], ['⚽', 'ball'], ['🚗', 'car'], ['👟', 'shoe'], ['📚', 'book'], ['✏️', 'pencil']] },
  { say: 'Which one is hot?',
    yes: [['☀️', 'sun'], ['🔥', 'fire'], ['🌋', 'volcano'], ['☕', 'hot drink']],
    no:  [['❄️', 'snowflake'], ['⛄', 'snowman'], ['🧊', 'ice'], ['🐧', 'penguin'], ['🍦', 'ice cream']] },
  { say: 'Which one is a dinosaur?',
    yes: [['🦖', 'T-Rex'], ['🦕', 'long-neck dinosaur']],
    no:  [['🐘', 'elephant'], ['🐶', 'dog'], ['🐄', 'cow'], ['🐱', 'cat'], ['🐴', 'horse'], ['🐷', 'pig']] },
  { say: 'Which one has wheels?',
    yes: [['🚗', 'car'], ['🚲', 'bike'], ['🚌', 'bus'], ['🚂', 'train'], ['🛴', 'scooter']],
    no:  [['🐎', 'horse'], ['⛵', 'boat'], ['🎈', 'balloon'], ['🦆', 'duck'], ['🌳', 'tree']] },
]

function build(say, options, correctIdx, prompt = null, label = null) {
  return {
    type: 'question', picture: true, say, prompt,
    options, correctIdx, label: label ?? options[correctIdx].label,
    stars: 2, answered: null,
  }
}

// Shuffle options and remember where the right one went.
function withAnswer(right, wrongs) {
  const opts = shuffle([right, ...wrongs])
  return { opts, idx: opts.indexOf(right) }
}

const GENERATORS = {
  count(items) {
    const [e, name] = pick(countable(items))
    const n = 1 + rand(5)                                 // 1–5 things
    const others = shuffle([1, 2, 3, 4, 5, 6].filter(x => x !== n)).slice(0, 3)
    const right = { dots: n, label: String(n) }
    const { opts, idx } = withAnswer(right, others.map(x => ({ dots: x, label: String(x) })))
    return build(`How many ${plural(name, 2)} can you see? Count them!`, opts, idx, e.repeat(n), `${n}`)
  },
  find(items) {
    const four = shuffle(items).slice(0, 4).map(([emoji, label]) => ({ emoji, label }))
    const idx = rand(4)
    return build(`Can you find the ${four[idx].label}?`, four, idx, null, `the ${four[idx].label}`)
  },
  different(items) {
    const [a, b] = shuffle(items)
    const right = { emoji: b[0], label: b[1] }
    const same = [0, 1, 2].map(() => ({ emoji: a[0], label: a[1] }))
    const { opts, idx } = withAnswer(right, same)
    return build('Which one is different?', opts, idx, null, `the ${right.label}`)
  },
  color() {
    const four = shuffle(COLORS).slice(0, 4).map(([color, label]) => ({ color, label }))
    const idx = rand(4)
    return build(`Which one is ${four[idx].label}?`, four, idx)
  },
  shape() {
    const four = shuffle(SHAPES).slice(0, 4).map(([emoji, label]) => ({ emoji, label }))
    const idx = rand(4)
    return build(`Can you find the ${four[idx].label}?`, four, idx, null, `the ${four[idx].label}`)
  },
  more(items) {
    const [e, name] = pick(countable(items))
    let a = 1 + rand(5), b = 1 + rand(5)
    while (b === a) b = 1 + rand(5)
    const opts = [{ emoji: e, count: a, label: 'this one' }, { emoji: e, count: b, label: 'this one' }]
    return build(`Which group has more ${plural(name, 2)}?`, opts, a > b ? 0 : 1, null, `the group with ${Math.max(a, b)}`)
  },
  category() {
    const c = pick(CATEGORIES)
    const [ye, yl] = pick(c.yes)
    const right = { emoji: ye, label: yl }
    const wrongs = shuffle(c.no).slice(0, 3).map(([emoji, label]) => ({ emoji, label }))
    const { opts, idx } = withAnswer(right, wrongs)
    return build(c.say, opts, idx, null, `the ${right.label}`)
  },
}

// Weighted so the world's own creatures appear most.
const MIX = ['count', 'count', 'find', 'find', 'find', 'different', 'more', 'color', 'shape', 'category', 'category']

// Returns a question, avoiding the last few kinds/answers so it stays fresh.
export function makePictureQuestion(themeId, recent = []) {
  const items = WORLD_ITEMS[themeId] ?? WORLD_ITEMS.animals
  for (let i = 0; i < 30; i++) {
    const kind = pick(MIX)
    const q = GENERATORS[kind](items)
    q.kind = kind
    const sig = `${kind}:${q.say}`
    if (recent.includes(sig) || recent[recent.length - 1]?.startsWith(kind + ':')) continue
    q.sig = sig
    return q
  }
  const q = GENERATORS.find(items)
  q.kind = 'find'; q.sig = `find:${q.say}`
  return q
}
