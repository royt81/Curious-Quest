import { getLang } from '../../i18n'
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
const ONLY_ONE = new Set(['Earth', 'sun', 'moon', 'volcano', 'Erde', 'Sonne', 'Mond', 'Vulkan'])
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

// ── German: [emoji, name, article, plural] ───────────────────────────────────
const WORLD_ITEMS_DE = {
  animals: [
    ['🐘', 'Elefant', 'der', 'Elefanten'], ['🦒', 'Giraffe', 'die', 'Giraffen'], ['🦁', 'Löwe', 'der', 'Löwen'],
    ['🐒', 'Affe', 'der', 'Affen'], ['🐢', 'Schildkröte', 'die', 'Schildkröten'], ['🐸', 'Frosch', 'der', 'Frösche'],
    ['🐧', 'Pinguin', 'der', 'Pinguine'], ['🦓', 'Zebra', 'das', 'Zebras'], ['🐻', 'Bär', 'der', 'Bären'],
    ['🐰', 'Hase', 'der', 'Hasen'],
  ],
  dinosaurs: [
    ['🦖', 'T-Rex', 'der', 'T-Rex'], ['🦕', 'Langhals-Dino', 'der', 'Langhals-Dinos'], ['🥚', 'Ei', 'das', 'Eier'],
    ['🌋', 'Vulkan', 'der', 'Vulkane'], ['🦴', 'Knochen', 'der', 'Knochen'], ['🌴', 'Palme', 'die', 'Palmen'],
    ['🐊', 'Krokodil', 'das', 'Krokodile'], ['🦎', 'Eidechse', 'die', 'Eidechsen'], ['🐢', 'Schildkröte', 'die', 'Schildkröten'],
    ['🍃', 'Blatt', 'das', 'Blätter'],
  ],
  space: [
    ['🚀', 'Rakete', 'die', 'Raketen'], ['🌙', 'Mond', 'der', 'Monde'], ['⭐', 'Stern', 'der', 'Sterne'],
    ['☀️', 'Sonne', 'die', 'Sonnen'], ['🪐', 'Planet', 'der', 'Planeten'], ['👽', 'Alien', 'das', 'Aliens'],
    ['🛸', 'Ufo', 'das', 'Ufos'], ['🌍', 'Erde', 'die', 'Erden'], ['☄️', 'Komet', 'der', 'Kometen'],
    ['🛰️', 'Satellit', 'der', 'Satelliten'],
  ],
  robots: [
    ['🤖', 'Roboter', 'der', 'Roboter'], ['⚙️', 'Zahnrad', 'das', 'Zahnräder'], ['🔋', 'Batterie', 'die', 'Batterien'],
    ['💡', 'Glühbirne', 'die', 'Glühbirnen'], ['🔧', 'Schraubenschlüssel', 'der', 'Schraubenschlüssel'],
    ['🧲', 'Magnet', 'der', 'Magnete'], ['💻', 'Computer', 'der', 'Computer'], ['🔩', 'Schraube', 'die', 'Schrauben'],
    ['📡', 'Antenne', 'die', 'Antennen'], ['🕹️', 'Joystick', 'der', 'Joysticks'],
  ],
  sea: [
    ['🐙', 'Krake', 'der', 'Kraken'], ['🐠', 'Fisch', 'der', 'Fische'], ['🦀', 'Krabbe', 'die', 'Krabben'],
    ['🐳', 'Wal', 'der', 'Wale'], ['🐬', 'Delfin', 'der', 'Delfine'], ['🦈', 'Hai', 'der', 'Haie'],
    ['🐢', 'Schildkröte', 'die', 'Schildkröten'], ['🐚', 'Muschel', 'die', 'Muscheln'],
    ['🦑', 'Tintenfisch', 'der', 'Tintenfische'], ['🦞', 'Hummer', 'der', 'Hummer'],
  ],
}

const COLORS_DE = [
  ['#ff3b30', 'rot'], ['#007aff', 'blau'], ['#ffd60a', 'gelb'], ['#34c759', 'grün'],
  ['#ff9500', 'orange'], ['#bf5af2', 'lila'], ['#ff6fb5', 'rosa'],
]
const SHAPES_DE = [
  ['🔴', 'Kreis', 'der'], ['🟦', 'Quadrat', 'das'], ['🔺', 'Dreieck', 'das'], ['⭐', 'Stern', 'der'], ['❤️', 'Herz', 'das'],
]

const CATEGORIES_DE = [
  { say: 'Was kann fliegen?',
    yes: [['🦅', 'Adler', 'der'], ['🦋', 'Schmetterling', 'der'], ['🐝', 'Biene', 'die'], ['🐦', 'Vogel', 'der'], ['✈️', 'Flugzeug', 'das'], ['🚁', 'Hubschrauber', 'der']],
    no:  [['🐘', 'Elefant', 'der'], ['🐢', 'Schildkröte', 'die'], ['🐟', 'Fisch', 'der'], ['🐄', 'Kuh', 'die'], ['🚗', 'Auto', 'das'], ['🐌', 'Schnecke', 'die']] },
  { say: 'Wer lebt im Meer?',
    yes: [['🐙', 'Krake', 'der'], ['🐠', 'Fisch', 'der'], ['🦈', 'Hai', 'der'], ['🐳', 'Wal', 'der'], ['🦀', 'Krabbe', 'die'], ['🐬', 'Delfin', 'der']],
    no:  [['🐄', 'Kuh', 'die'], ['🦁', 'Löwe', 'der'], ['🐔', 'Huhn', 'das'], ['🐒', 'Affe', 'der'], ['🐘', 'Elefant', 'der'], ['🐰', 'Hase', 'der']] },
  { say: 'Was kann man essen?',
    yes: [['🍎', 'Apfel', 'der'], ['🍌', 'Banane', 'die'], ['🍕', 'Pizza', 'die'], ['🥕', 'Möhre', 'die'], ['🍓', 'Erdbeere', 'die'], ['🧀', 'Käse', 'der']],
    no:  [['🧸', 'Teddybär', 'der'], ['⚽', 'Ball', 'der'], ['🚗', 'Auto', 'das'], ['👟', 'Schuh', 'der'], ['📚', 'Buch', 'das'], ['✏️', 'Stift', 'der']] },
  { say: 'Was ist heiß?',
    yes: [['☀️', 'Sonne', 'die'], ['🔥', 'Feuer', 'das'], ['🌋', 'Vulkan', 'der'], ['☕', 'heiße Getränk', 'das']],
    no:  [['❄️', 'Schneeflocke', 'die'], ['⛄', 'Schneemann', 'der'], ['🧊', 'Eis', 'das'], ['🐧', 'Pinguin', 'der'], ['🍦', 'Eis', 'das']] },
  { say: 'Welches ist ein Dinosaurier?',
    yes: [['🦖', 'T-Rex', 'der'], ['🦕', 'Langhals-Dino', 'der']],
    no:  [['🐘', 'Elefant', 'der'], ['🐶', 'Hund', 'der'], ['🐄', 'Kuh', 'die'], ['🐱', 'Katze', 'die'], ['🐴', 'Pferd', 'das'], ['🐷', 'Schwein', 'das']] },
  { say: 'Was hat Räder?',
    yes: [['🚗', 'Auto', 'das'], ['🚲', 'Fahrrad', 'das'], ['🚌', 'Bus', 'der'], ['🚂', 'Zug', 'der'], ['🛴', 'Roller', 'der']],
    no:  [['🐎', 'Pferd', 'das'], ['⛵', 'Boot', 'das'], ['🎈', 'Luftballon', 'der'], ['🦆', 'Ente', 'die'], ['🌳', 'Baum', 'der']] },
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

// ── The sentences, per language ──────────────────────────────────────────────
// English items are [emoji, name]; German items are [emoji, name, article, plural]
// so the voice can say "der Elefant" / "Wie viele Elefanten …".
const TEXT = {
  en: {
    the: (it) => `the ${it[1]}`,
    count: (it) => `How many ${plural(it[1], 2)} can you see? Count them!`,
    find: (it) => `Can you find the ${it[1]}?`,
    different: 'Which one is different?',
    color: (c) => `Which one is ${c}?`,
    more: (it) => `Which group has more ${plural(it[1], 2)}?`,
    thisOne: 'this one',
    groupWith: (n) => `the group with ${n}`,
  },
  de: {
    the: (it) => `${it[2]} ${it[1]}`,
    count: (it) => `Wie viele ${it[3]} siehst du? Zähl sie!`,
    find: (it) => `Wo ist ${it[2]} ${it[1]}?`,
    different: 'Welches ist anders?',
    color: (c) => `Welches ist ${c}?`,
    more: (it) => `Welche Gruppe hat mehr ${it[3]}?`,
    thisOne: 'diese',
    groupWith: (n) => `die Gruppe mit ${n}`,
  },
}

function makeGenerators(L, data) {
  return {
    count(items) {
      const it = pick(countable(items))
      const n = 1 + rand(5)                                 // 1–5 things
      const others = shuffle([1, 2, 3, 4, 5, 6].filter(x => x !== n)).slice(0, 3)
      const right = { dots: n, label: String(n) }
      const { opts, idx } = withAnswer(right, others.map(x => ({ dots: x, label: String(x) })))
      return build(L.count(it), opts, idx, it[0].repeat(n), `${n}`)
    },
    find(items) {
      const four = shuffle(items).slice(0, 4)
      const idx = rand(4)
      const opts = four.map(it => ({ emoji: it[0], label: it[1] }))
      return build(L.find(four[idx]), opts, idx, null, L.the(four[idx]))
    },
    different(items) {
      const [a, b] = shuffle(items)
      const right = { emoji: b[0], label: b[1] }
      const same = [0, 1, 2].map(() => ({ emoji: a[0], label: a[1] }))
      const { opts, idx } = withAnswer(right, same)
      return build(L.different, opts, idx, null, L.the(b))
    },
    color() {
      const four = shuffle(data.COLORS).slice(0, 4).map(([color, label]) => ({ color, label }))
      const idx = rand(4)
      return build(L.color(four[idx].label), four, idx)
    },
    shape() {
      const four = shuffle(data.SHAPES).slice(0, 4)
      const idx = rand(4)
      const opts = four.map(it => ({ emoji: it[0], label: it[1] }))
      return build(L.find(four[idx]), opts, idx, null, L.the(four[idx]))
    },
    more(items) {
      const it = pick(countable(items))
      let a = 1 + rand(5), b = 1 + rand(5)
      while (b === a) b = 1 + rand(5)
      const opts = [{ emoji: it[0], count: a, label: L.thisOne }, { emoji: it[0], count: b, label: L.thisOne }]
      return build(L.more(it), opts, a > b ? 0 : 1, null, L.groupWith(Math.max(a, b)))
    },
    category() {
      const c = pick(data.CATEGORIES)
      const yes = pick(c.yes)
      const right = { emoji: yes[0], label: yes[1] }
      const wrongs = shuffle(c.no).slice(0, 3).map(it => ({ emoji: it[0], label: it[1] }))
      const { opts, idx } = withAnswer(right, wrongs)
      return build(c.say, opts, idx, null, L.the(yes))
    },
  }
}

// Weighted so the world's own creatures appear most.
const MIX = ['count', 'count', 'find', 'find', 'find', 'different', 'more', 'color', 'shape', 'category', 'category']

// Returns a question, avoiding the last few kinds/answers so it stays fresh.
const GENERATORS_BY_LANG = {
  en: makeGenerators(TEXT.en, { COLORS, SHAPES, CATEGORIES }),
  de: makeGenerators(TEXT.de, { COLORS: COLORS_DE, SHAPES: SHAPES_DE, CATEGORIES: CATEGORIES_DE }),
}

export function makePictureQuestion(themeId, recent = []) {
  const de = getLang() === 'de'
  const worlds = de ? WORLD_ITEMS_DE : WORLD_ITEMS
  const GENERATORS = de ? GENERATORS_BY_LANG.de : GENERATORS_BY_LANG.en
  const items = worlds[themeId] ?? worlds.animals
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
