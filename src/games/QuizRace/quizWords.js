// ─── Word lists for Quiz Race (English + German) ──────────────────────────────
// Letter questions ("Which letter is missing?") and, on Hard, word-meaning
// questions. German needs its own real German words — they are not translations
// of the English list, because the spelling is what the child is practising.

// ── Vocabulary bank for HARD 'what does this word mean?' questions ────────────
// meaning is the correct answer; `wrong` holds three plausible distractors.
const EN_VOCAB = [
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
const EN_WORDS = [
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
const EN_THEME_WORDS = {
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

// ── German ───────────────────────────────────────────────────────────────────
// Same rules: concrete nouns a child can name from the picture alone, one word
// per picture, no ß (it has no simple capital letter). Umlauts are fine.
const DE_VOCAB = [
  { word: 'RIESIG',       meaning: 'Sehr groß',                  wrong: ['Sehr klein', 'Sehr schnell', 'Sehr laut'] },
  { word: 'WINZIG',       meaning: 'Sehr klein',                 wrong: ['Sehr groß', 'Sehr alt', 'Sehr nass'] },
  { word: 'URALT',        meaning: 'Sehr alt',                   wrong: ['Ganz neu', 'Sehr schnell', 'Sehr groß'] },
  { word: 'BLITZSCHNELL', meaning: 'Sehr schnell',               wrong: ['Sehr langsam', 'Sehr alt', 'Sehr weich'] },
  { word: 'EISKALT',      meaning: 'Sehr kalt',                  wrong: ['Sehr heiß', 'Sehr hell', 'Sehr schwer'] },
  { word: 'GLÜHEND',      meaning: 'Sehr heiß',                  wrong: ['Sehr kalt', 'Sehr nass', 'Sehr dunkel'] },
  { word: 'MUTIG',        meaning: 'Hat keine Angst',            wrong: ['Hat große Angst', 'Ist sehr müde', 'Hat Hunger'] },
  { word: 'ÄNGSTLICH',    meaning: 'Hat schnell Angst',          wrong: ['Ist sehr mutig', 'Ist sehr ruhig', 'Ist sehr froh'] },
  { word: 'LECKER',       meaning: 'Schmeckt sehr gut',          wrong: ['Riecht schlecht', 'Sieht hässlich aus', 'Fühlt sich kalt an'] },
  { word: 'ERSCHÖPFT',    meaning: 'Sehr müde',                  wrong: ['Hellwach', 'Sehr froh', 'Sehr wütend'] },
  { word: 'WÜTEND',       meaning: 'Sehr böse',                  wrong: ['Sehr ruhig', 'Sehr froh', 'Sehr müde'] },
  { word: 'FRÖHLICH',     meaning: 'Gut gelaunt',                wrong: ['Traurig', 'Müde', 'Wütend'] },
  { word: 'SCHÜCHTERN',   meaning: 'Still und scheu',            wrong: ['Laut', 'Mutig', 'Stark'] },
  { word: 'ZERBRECHLICH', meaning: 'Geht leicht kaputt',         wrong: ['Sehr stark', 'Sehr schwer', 'Sehr schnell'] },
  { word: 'DURCHSICHTIG', meaning: 'Man kann hindurchsehen',     wrong: ['Sehr bunt', 'Sehr laut', 'Sehr schwer'] },
  { word: 'UNSICHTBAR',   meaning: 'Man kann es nicht sehen',    wrong: ['Sehr laut', 'Sehr groß', 'Sehr schwer'] },
  { word: 'GROSSZÜGIG',   meaning: 'Teilt und schenkt gern',     wrong: ['Gierig', 'Faul', 'Mürrisch'] },
  { word: 'NEUGIERIG',    meaning: 'Will Neues wissen',          wrong: ['Gelangweilt', 'Schläfrig', 'Traurig'] },
  { word: 'SELTSAM',      meaning: 'Komisch, merkwürdig',        wrong: ['Ganz normal', 'Langweilig', 'Lecker'] },
  { word: 'GEWALTIG',     meaning: 'Sehr groß und stark',        wrong: ['Sehr klein', 'Sehr leise', 'Sehr schnell'] },
  { word: 'LAUTLOS',      meaning: 'Ohne ein Geräusch',          wrong: ['Sehr laut', 'Sehr hell', 'Sehr schnell'] },
  { word: 'MÜDE',         meaning: 'Möchte schlafen',            wrong: ['Aufgeregt', 'Hungrig', 'Mutig'] },
  { word: 'KLUG',         meaning: 'Weiß viel, ist schlau',      wrong: ['Sehr langsam', 'Sehr traurig', 'Sehr laut'] },
  { word: 'SIEG',         meaning: 'Gewinnen',                   wrong: ['Verlieren', 'Unentschieden', 'Pause'] },
  { word: 'REISE',        meaning: 'Eine Fahrt an einen anderen Ort', wrong: ['Ein kurzer Mittagsschlaf', 'Ein Essen', 'Ein Lied'] },
  { word: 'JÄHRLICH',     meaning: 'Einmal im Jahr',             wrong: ['Jeden Tag', 'Nie', 'Zweimal am Tag'] },
]

const DE_WORDS = [
  { word: 'EI', emoji: '🥚' }, { word: 'KUH', emoji: '🐄' }, { word: 'HUT', emoji: '🎩' },
  { word: 'BUS', emoji: '🚌' }, { word: 'ZUG', emoji: '🚂' }, { word: 'EIS', emoji: '🍦' },
  { word: 'OHR', emoji: '👂' }, { word: 'TEE', emoji: '🍵' }, { word: 'UHR', emoji: '⌚' },
  { word: 'AXT', emoji: '🪓' }, { word: 'BETT', emoji: '🛏️' }, { word: 'HUND', emoji: '🐶' },
  { word: 'MAUS', emoji: '🐭' }, { word: 'BAUM', emoji: '🌳' }, { word: 'BOOT', emoji: '⛵' },
  { word: 'BALL', emoji: '⚽' }, { word: 'BUCH', emoji: '📖' }, { word: 'MOND', emoji: '🌙' },
  { word: 'AUTO', emoji: '🚗' }, { word: 'HAUS', emoji: '🏠' }, { word: 'ROSE', emoji: '🌹' },
  { word: 'NASE', emoji: '👃' }, { word: 'HAND', emoji: '✋' }, { word: 'SAFT', emoji: '🧃' },
  { word: 'APFEL', emoji: '🍎' }, { word: 'BIRNE', emoji: '🍐' }, { word: 'STERN', emoji: '⭐' },
  { word: 'PIZZA', emoji: '🍕' }, { word: 'KRONE', emoji: '👑' }, { word: 'BLUME', emoji: '🌸' },
  { word: 'SOCKE', emoji: '🧦' }, { word: 'SCHUH', emoji: '👟' }, { word: 'VOGEL', emoji: '🐦' },
  { word: 'KATZE', emoji: '🐱' }, { word: 'STUHL', emoji: '🪑' }, { word: 'PAKET', emoji: '📦' },
  { word: 'MÖHRE', emoji: '🥕' }, { word: 'KUCHEN', emoji: '🎂' }, { word: 'BANANE', emoji: '🍌' },
  { word: 'RAKETE', emoji: '🚀' }, { word: 'BALLON', emoji: '🎈' }, { word: 'FROSCH', emoji: '🐸' },
  { word: 'SCHIRM', emoji: '☂️' }, { word: 'ZITRONE', emoji: '🍋' }, { word: 'GITARRE', emoji: '🎸' },
  { word: 'TRAUBEN', emoji: '🍇' }, { word: 'DRACHEN', emoji: '🪁' }, { word: 'TROMMEL', emoji: '🥁' },
  { word: 'SCHWEIN', emoji: '🐷' }, { word: 'ROBOTER', emoji: '🤖' }, { word: 'GESCHENK', emoji: '🎁' },
]

const DE_THEME_WORDS = {
  animals: [
    { word: 'KUH', emoji: '🐄' }, { word: 'BÄR', emoji: '🐻' }, { word: 'HUND', emoji: '🐶' },
    { word: 'MAUS', emoji: '🐭' }, { word: 'AFFE', emoji: '🐒' }, { word: 'ENTE', emoji: '🦆' },
    { word: 'IGEL', emoji: '🦔' }, { word: 'HASE', emoji: '🐰' }, { word: 'LÖWE', emoji: '🦁' },
    { word: 'WOLF', emoji: '🐺' }, { word: 'EULE', emoji: '🦉' }, { word: 'HUHN', emoji: '🐔' },
    { word: 'ZIEGE', emoji: '🐐' }, { word: 'KATZE', emoji: '🐱' }, { word: 'TIGER', emoji: '🐯' },
    { word: 'PFERD', emoji: '🐴' }, { word: 'ZEBRA', emoji: '🦓' }, { word: 'PANDA', emoji: '🐼' },
    { word: 'KOALA', emoji: '🐨' }, { word: 'SCHAF', emoji: '🐑' }, { word: 'KAMEL', emoji: '🐫' },
    { word: 'ADLER', emoji: '🦅' }, { word: 'OTTER', emoji: '🦦' }, { word: 'BIENE', emoji: '🐝' },
    { word: 'FUCHS', emoji: '🦊' }, { word: 'AMEISE', emoji: '🐜' }, { word: 'FROSCH', emoji: '🐸' },
    { word: 'HIRSCH', emoji: '🦌' }, { word: 'NASHORN', emoji: '🦏' }, { word: 'PAPAGEI', emoji: '🦜' },
    { word: 'GORILLA', emoji: '🦍' }, { word: 'GIRAFFE', emoji: '🦒' }, { word: 'HAMSTER', emoji: '🐹' },
    { word: 'PINGUIN', emoji: '🐧' }, { word: 'ELEFANT', emoji: '🐘' }, { word: 'KÄNGURU', emoji: '🦘' },
    { word: 'FLAMINGO', emoji: '🦩' }, { word: 'SCHNECKE', emoji: '🐌' }, { word: 'SCHLANGE', emoji: '🐍' },
  ],
  dinosaurs: [
    { word: 'EI', emoji: '🥚' }, { word: 'DINO', emoji: '🦕' }, { word: 'BAUM', emoji: '🌳' },
    { word: 'ZAHN', emoji: '🦷' }, { word: 'BERG', emoji: '⛰️' }, { word: 'STEIN', emoji: '🪨' },
    { word: 'BLATT', emoji: '🍃' }, { word: 'PALME', emoji: '🌴' }, { word: 'FEUER', emoji: '🔥' },
    { word: 'WOLKE', emoji: '☁️' }, { word: 'ECHSE', emoji: '🦎' }, { word: 'VULKAN', emoji: '🌋' },
    { word: 'METEOR', emoji: '☄️' }, { word: 'KNOCHEN', emoji: '🦴' }, { word: 'SAURIER', emoji: '🦖' },
    { word: 'KROKODIL', emoji: '🐊' }, { word: 'SCHILDKRÖTE', emoji: '🐢' },
  ],
  space: [
    { word: 'UFO', emoji: '🛸' }, { word: 'MOND', emoji: '🌙' }, { word: 'ERDE', emoji: '🌍' },
    { word: 'STERN', emoji: '⭐' }, { word: 'SONNE', emoji: '☀️' }, { word: 'KOMET', emoji: '☄️' },
    { word: 'ALIEN', emoji: '👽' }, { word: 'RAKETE', emoji: '🚀' }, { word: 'PLANET', emoji: '🪐' },
    { word: 'GALAXIE', emoji: '🌌' }, { word: 'TELESKOP', emoji: '🔭' }, { word: 'SATELLIT', emoji: '🛰️' },
    { word: 'ASTRONAUT', emoji: '🧑‍🚀' },
  ],
  robots: [
    { word: 'ARM', emoji: '🦾' }, { word: 'UHR', emoji: '⌚' }, { word: 'BEIN', emoji: '🦿' },
    { word: 'LAMPE', emoji: '💡' }, { word: 'HANDY', emoji: '📱' }, { word: 'WECKER', emoji: '⏰' },
    { word: 'MAGNET', emoji: '🧲' }, { word: 'HAMMER', emoji: '🔨' }, { word: 'LAPTOP', emoji: '💻' },
    { word: 'KAMERA', emoji: '📷' }, { word: 'ZAHNRAD', emoji: '⚙️' }, { word: 'STECKER', emoji: '🔌' },
    { word: 'ROBOTER', emoji: '🤖' }, { word: 'BATTERIE', emoji: '🔋' }, { word: 'SCHRAUBE', emoji: '🔩' },
    { word: 'SCHLÜSSEL', emoji: '🔑' },
  ],
  sea: [
    { word: 'HAI', emoji: '🦈' }, { word: 'WAL', emoji: '🐳' }, { word: 'MEER', emoji: '🌊' },
    { word: 'BOOT', emoji: '⛵' }, { word: 'FISCH', emoji: '🐟' }, { word: 'WELLE', emoji: '🌊' },
    { word: 'ROBBE', emoji: '🦭' }, { word: 'KRAKE', emoji: '🐙' }, { word: 'ANKER', emoji: '⚓' },
    { word: 'INSEL', emoji: '🏝️' }, { word: 'KRABBE', emoji: '🦀' }, { word: 'SCHIFF', emoji: '🚢' },
    { word: 'HUMMER', emoji: '🦞' }, { word: 'DELFIN', emoji: '🐬' }, { word: 'AUSTER', emoji: '🦪' },
    { word: 'MUSCHEL', emoji: '🐚' }, { word: 'PINGUIN', emoji: '🐧' }, { word: 'SCHILDKRÖTE', emoji: '🐢' },
  ],
}

function makeBank(VOCAB, WORDS, THEME_WORDS, ALPHABET) {
  return {
    VOCAB, WORDS, THEME_WORDS, ALPHABET,
    // Every word the game knows — so a wrong letter option never spells a
    // different real word (e.g. "_AT" for a cat must not offer B → BAT).
    KNOWN_WORDS: new Set([...WORDS.map(w => w.word), ...Object.values(THEME_WORDS).flat().map(w => w.word)]),
  }
}

const EN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const DE_ALPHABET = [...EN_ALPHABET, 'Ä', 'Ö', 'Ü']

export const WORD_BANKS = {
  en: makeBank(EN_VOCAB, EN_WORDS, EN_THEME_WORDS, EN_ALPHABET),
  de: makeBank(DE_VOCAB, DE_WORDS, DE_THEME_WORDS, DE_ALPHABET),
}
