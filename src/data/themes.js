// All theme data for every game
// Each theme provides: quartettFamilies, raceRacers, label, emoji

// ─── ANIMALS ────────────────────────────────────────────────────────────────
const animalsTheme = {
  id: 'animals',
  label: 'Animals',
  world: 'Animal Kingdom',
  emoji: '🐝',
  accent: '#ffc83d',
  raceRacers: [
    { id: 'fox',    name: 'Fox',     emoji: '🦊', color: '#FF8A1F', image: '/themes/Animals/head-fox.png' },
    { id: 'buffalo', name: 'Water Buffalo', emoji: '🐃', color: '#4FA3E0', image: '/themes/Animals/head-buffalo.png' },
    { id: 'sloth',  name: 'Sloth',   emoji: '🦥', color: '#90EE90', image: '/themes/Animals/head-sloth.png' },
    { id: 'gorilla',name: 'Gorilla', emoji: '🦍', color: '#B07CE8', image: '/themes/Animals/head-gorilla.png' },
  ],
  // Colouring pages in Draw & Paint (must be line-art SVGs)
  coloringPages: [
    { id: 'pg1', name: 'Fennec Fox', image: '/themes/Animals/p1-fennec.svg' },
    { id: 'pg2', name: 'Water Buffalo', image: '/themes/Animals/p2-water-buffalo.svg' },
    { id: 'pg3', name: 'Sloth', image: '/themes/Animals/p3-sloth.svg' },
    { id: 'pg4', name: 'Gorilla', image: '/themes/Animals/p4-gorilla.svg' },
  ],
  quartettFamilies: [
    {
      id: 'big_cats', name: 'Big Cats', emoji: '🐆', color: '#FF8C00',
      cards: [
        { id: 'lion',    name: 'Lion',    emoji: '🦁', speed: 80, strength: 90, size: 85, roar: 95 },
        { id: 'tiger',   name: 'Tiger',   emoji: '🐯', speed: 85, strength: 88, size: 88, roar: 90 },
        { id: 'cheetah', name: 'Cheetah', emoji: '🐆', speed: 99, strength: 70, size: 60, roar: 60 },
        { id: 'leopard', name: 'Leopard', emoji: '🐾', speed: 88, strength: 75, size: 70, roar: 72 },
      ],
      stats: ['speed', 'strength', 'size', 'roar'],
      statLabels: { speed: '🏃 Speed', strength: '💪 Strength', size: '📏 Size', roar: '📣 Roar' },
    },
    {
      id: 'ocean', name: 'Ocean Animals', emoji: '🐋', color: '#1E90FF',
      cards: [
        { id: 'whale',   name: 'Whale',   emoji: '🐋', speed: 40, strength: 99, size: 99, swim: 90 },
        { id: 'dolphin', name: 'Dolphin', emoji: '🐬', speed: 70, strength: 55, size: 50, swim: 98 },
        { id: 'shark',   name: 'Shark',   emoji: '🦈', speed: 75, strength: 85, size: 80, swim: 92 },
        { id: 'octopus', name: 'Octopus', emoji: '🐙', speed: 35, strength: 60, size: 45, swim: 80 },
      ],
      stats: ['speed', 'strength', 'size', 'swim'],
      statLabels: { speed: '🏃 Speed', strength: '💪 Strength', size: '📏 Size', swim: '🏊 Swim' },
    },
    {
      id: 'birds', name: 'Birds', emoji: '🦅', color: '#9370DB',
      cards: [
        { id: 'eagle',    name: 'Eagle',    emoji: '🦅', speed: 90, strength: 75, size: 65, fly: 95 },
        { id: 'owl',      name: 'Owl',      emoji: '🦉', speed: 60, strength: 50, size: 45, fly: 80 },
        { id: 'parrot',   name: 'Parrot',   emoji: '🦜', speed: 55, strength: 30, size: 30, fly: 75 },
        { id: 'flamingo', name: 'Flamingo', emoji: '🦩', speed: 50, strength: 35, size: 60, fly: 65 },
      ],
      stats: ['speed', 'strength', 'size', 'fly'],
      statLabels: { speed: '🏃 Speed', strength: '💪 Strength', size: '📏 Size', fly: '✈️ Fly' },
    },
    {
      id: 'jungle', name: 'Jungle', emoji: '🐒', color: '#228B22',
      cards: [
        { id: 'gorilla',  name: 'Gorilla',  emoji: '🦍', speed: 55, strength: 97, size: 88, climb: 75 },
        { id: 'monkey',   name: 'Monkey',   emoji: '🐒', speed: 65, strength: 45, size: 35, climb: 95 },
        { id: 'elephant', name: 'Elephant', emoji: '🐘', speed: 45, strength: 99, size: 99, climb: 10 },
        { id: 'giraffe',  name: 'Giraffe',  emoji: '🦒', speed: 60, strength: 70, size: 98, climb: 20 },
      ],
      stats: ['speed', 'strength', 'size', 'climb'],
      statLabels: { speed: '🏃 Speed', strength: '💪 Strength', size: '📏 Size', climb: '🧗 Climb' },
    },
    {
      id: 'farm', name: 'Farm', emoji: '🐄', color: '#D2691E',
      cards: [
        { id: 'horse', name: 'Horse', emoji: '🐴', speed: 88, strength: 80, size: 85, friendly: 70 },
        { id: 'cow',   name: 'Cow',   emoji: '🐄', speed: 35, strength: 65, size: 80, friendly: 85 },
        { id: 'pig',   name: 'Pig',   emoji: '🐷', speed: 28, strength: 45, size: 55, friendly: 90 },
        { id: 'sheep', name: 'Sheep', emoji: '🐑', speed: 25, strength: 30, size: 50, friendly: 95 },
      ],
      stats: ['speed', 'strength', 'size', 'friendly'],
      statLabels: { speed: '🏃 Speed', strength: '💪 Strength', size: '📏 Size', friendly: '😊 Friendly' },
    },
  ],
}

// ─── DINOSAURS ───────────────────────────────────────────────────────────────
const dinosaursTheme = {
  id: 'dinosaurs',
  label: 'Dinosaurs',
  world: 'World of Dinosaurs',
  emoji: '🦕',
  accent: '#f4a73a',
  raceRacers: [
    { id: 'fox',       name: 'Fox',           emoji: '🦊', color: '#FF8A1F', image: '/themes/Dino/head-fox.png' },
    { id: 'spino',     name: 'Spinosaurus',   emoji: '🦕', color: '#2ECC71', image: '/themes/Dino/head-spino.png' },
    { id: 'para',      name: 'Parasaurolophus', emoji: '🦴', color: '#9B59B6', image: '/themes/Dino/head-para.png' },
    { id: 'tricera',   name: 'Triceratops',   emoji: '🦏', color: '#3498DB', image: '/themes/Dino/head-trice.png' },
  ],
  // Colouring pages in Draw & Paint (must be line-art SVGs)
  coloringPages: [
    { id: 'pg1', name: 'T-Rex', image: '/themes/Dino/p1-tyrannosaurus.svg' },
    { id: 'pg2', name: 'Spinosaurus', image: '/themes/Dino/p2-spinosaurus (1).svg' },
    { id: 'pg3', name: 'Parasaurolophus', image: '/themes/Dino/p3-arasaurolophus.svg' },
    { id: 'pg4', name: 'Triceratops', image: '/themes/Dino/p4-triceratops.svg' },
  ],
  quartettFamilies: [
    {
      id: 'hunters', name: 'Hunters', emoji: '🦖', color: '#C0392B',
      cards: [
        { id: 'trex',    name: 'T-Rex',       emoji: '🦖', speed: 88, bite: 99, size: 92, roar: 99 },
        { id: 'raptor',  name: 'Velociraptor', emoji: '🐍', speed: 95, bite: 80, size: 45, roar: 70 },
        { id: 'spino',   name: 'Spinosaurus',  emoji: '🦎', speed: 75, bite: 95, size: 98, roar: 90 },
        { id: 'allosaur',name: 'Allosaurus',   emoji: '🦕', speed: 82, bite: 88, size: 80, roar: 85 },
      ],
      stats: ['speed', 'bite', 'size', 'roar'],
      statLabels: { speed: '🏃 Speed', bite: '🦷 Bite', size: '📏 Size', roar: '📣 Roar' },
    },
    {
      id: 'armored', name: 'Armored', emoji: '🛡️', color: '#27AE60',
      cards: [
        { id: 'tricera',  name: 'Triceratops', emoji: '🦕', speed: 55, armor: 88, size: 85, horns: 92 },
        { id: 'ankylo',   name: 'Ankylosaurus', emoji: '🐢', speed: 40, armor: 99, size: 80, horns: 75 },
        { id: 'stegosaur',name: 'Stegosaurus',  emoji: '🦕', speed: 45, armor: 82, size: 78, horns: 80 },
        { id: 'pachyceph',name: 'Pachycephalosaurus', emoji: '🪨', speed: 65, armor: 70, size: 55, horns: 85 },
      ],
      stats: ['speed', 'armor', 'size', 'horns'],
      statLabels: { speed: '🏃 Speed', armor: '🛡️ Armor', size: '📏 Size', horns: '🔱 Horns' },
    },
    {
      id: 'flyers', name: 'Flyers', emoji: '🪶', color: '#8E44AD',
      cards: [
        { id: 'ptero',    name: 'Pterodactyl', emoji: '🦇', speed: 90, fly: 92, size: 60, sight: 88 },
        { id: 'quetz',    name: 'Quetzalcoatlus', emoji: '🦆', speed: 85, fly: 98, size: 80, sight: 82 },
        { id: 'dimorpho', name: 'Dimorphodon',  emoji: '🦇', speed: 80, fly: 85, size: 35, sight: 90 },
        { id: 'rhampho',  name: 'Rhamphorhynchus', emoji: '🐦', speed: 75, fly: 80, size: 30, sight: 85 },
      ],
      stats: ['speed', 'fly', 'size', 'sight'],
      statLabels: { speed: '🏃 Speed', fly: '✈️ Fly', size: '📏 Size', sight: '👁️ Sight' },
    },
    {
      id: 'giants', name: 'Giants', emoji: '🦕', color: '#16A085',
      cards: [
        { id: 'bronto',   name: 'Brontosaurus',  emoji: '🦕', speed: 35, size: 99, neck: 95, weight: 90 },
        { id: 'diplodoc', name: 'Diplodocus',     emoji: '🦎', speed: 38, size: 98, neck: 99, weight: 88 },
        { id: 'argento',  name: 'Argentinosaurus',emoji: '🐉', speed: 25, size: 99, neck: 80, weight: 99 },
        { id: 'apato',    name: 'Apatosaurus',    emoji: '🦕', speed: 40, size: 92, neck: 88, weight: 85 },
      ],
      stats: ['speed', 'size', 'neck', 'weight'],
      statLabels: { speed: '🏃 Speed', size: '📏 Size', neck: '🦒 Neck', weight: '⚖️ Weight' },
    },
    {
      id: 'water', name: 'Sea Dinos', emoji: '🌊', color: '#2980B9',
      cards: [
        { id: 'mosasaur', name: 'Mosasaurus',  emoji: '🦈', speed: 80, bite: 95, size: 90, swim: 88 },
        { id: 'plesio',   name: 'Plesiosaur',  emoji: '🐉', speed: 65, bite: 78, size: 85, swim: 92 },
        { id: 'ichthyo',  name: 'Ichthyosaur', emoji: '🐬', speed: 88, bite: 72, size: 55, swim: 98 },
        { id: 'elasmosaur',name: 'Elasmosaurus',emoji: '🦕', speed: 60, bite: 70, size: 88, swim: 85 },
      ],
      stats: ['speed', 'bite', 'size', 'swim'],
      statLabels: { speed: '🏃 Speed', bite: '🦷 Bite', size: '📏 Size', swim: '🏊 Swim' },
    },
  ],
}

// ─── SPACE ───────────────────────────────────────────────────────────────────
const spaceTheme = {
  id: 'space',
  label: 'Space',
  world: 'Beyond the Stars',
  emoji: '🚀',
  accent: '#6fb7ff',
  raceRacers: [
    { id: 'fox',       name: 'Fox',          emoji: '🦊', color: '#FF8A1F', image: '/themes/Space/head-fox.png' },
    { id: 'rover',     name: 'Rover',        emoji: '🤖', color: '#4ECDC4', image: '/themes/Space/head-rover.png' },
    { id: 'alien',     name: 'Alien',        emoji: '👽', color: '#2ECC71', image: '/themes/Space/head-alien.png' },
    { id: 'shuttle',   name: 'Space Shuttle',emoji: '🚀', color: '#B07CE8', image: '/themes/Space/head-shuttle.png' },
  ],
  // Colouring pages in Draw & Paint (must be line-art SVGs)
  coloringPages: [
    { id: 'pg1', name: 'Astronaut', image: '/themes/Space/p1-astronaut.svg' },
    { id: 'pg2', name: 'Rover', image: '/themes/Space/p2-rover.svg' },
    { id: 'pg3', name: 'Alien', image: '/themes/Space/p3-alien (2).svg' },
    { id: 'pg4', name: 'Space Shuttle', image: '/themes/Space/p4-space-shuttle.svg' },
  ],
  quartettFamilies: [
    {
      id: 'planets', name: 'Planets', emoji: '🪐', color: '#5B2C6F',
      cards: [
        { id: 'jupiter', name: 'Jupiter', emoji: '🟠', size: 99, moons: 95, distance: 52, gravity: 88 },
        { id: 'saturn',  name: 'Saturn',  emoji: '🪐', size: 92, moons: 99, distance: 62, gravity: 82 },
        { id: 'earth',   name: 'Earth',   emoji: '🌍', size: 60, moons: 20, distance: 30, gravity: 70 },
        { id: 'mars',    name: 'Mars',    emoji: '🔴', size: 45, moons: 15, distance: 40, gravity: 38 },
      ],
      stats: ['size', 'moons', 'distance', 'gravity'],
      statLabels: { size: '📏 Size', moons: '🌙 Moons', distance: '📡 Distance', gravity: '⬇️ Gravity' },
    },
    {
      id: 'rockets', name: 'Rockets', emoji: '🚀', color: '#E74C3C',
      cards: [
        { id: 'saturn5',  name: 'Saturn V',    emoji: '🚀', speed: 85, power: 99, size: 95, payload: 99 },
        { id: 'falcon9',  name: 'Falcon 9',    emoji: '🛸', speed: 90, power: 88, size: 72, payload: 80 },
        { id: 'starship', name: 'Starship',    emoji: '🌟', speed: 92, power: 95, size: 98, payload: 95 },
        { id: 'ariane5',  name: 'Ariane 5',   emoji: '🔵', speed: 82, power: 85, size: 80, payload: 88 },
      ],
      stats: ['speed', 'power', 'size', 'payload'],
      statLabels: { speed: '⚡ Speed', power: '🔥 Power', size: '📏 Size', payload: '📦 Payload' },
    },
    {
      id: 'stars', name: 'Stars', emoji: '⭐', color: '#F39C12',
      cards: [
        { id: 'sun',       name: 'Our Sun',    emoji: '☀️', temp: 75, size: 70, age: 55, brightness: 72 },
        { id: 'sirius',    name: 'Sirius',     emoji: '⭐', temp: 85, size: 82, age: 40, brightness: 90 },
        { id: 'betelgeuse',name: 'Betelgeuse', emoji: '🔴', temp: 45, size: 99, age: 88, brightness: 95 },
        { id: 'polaris',   name: 'Polaris',    emoji: '🌟', temp: 70, size: 78, age: 65, brightness: 85 },
      ],
      stats: ['temp', 'size', 'age', 'brightness'],
      statLabels: { temp: '🌡️ Temp', size: '📏 Size', age: '⏳ Age', brightness: '💡 Brightness' },
    },
    {
      id: 'aliens', name: 'Aliens', emoji: '👾', color: '#1ABC9C',
      cards: [
        { id: 'greys',    name: 'Greys',      emoji: '👽', intel: 99, tech: 95, stealth: 88, speed: 80 },
        { id: 'robots',   name: 'Cyborgs',    emoji: '🤖', intel: 85, tech: 99, stealth: 60, speed: 90 },
        { id: 'blobs',    name: 'Blob Aliens',emoji: '👾', intel: 55, tech: 65, stealth: 95, speed: 35 },
        { id: 'reptilians',name: 'Reptilians',emoji: '🦎', intel: 80, tech: 78, stealth: 72, speed: 75 },
      ],
      stats: ['intel', 'tech', 'stealth', 'speed'],
      statLabels: { intel: '🧠 Intel', tech: '⚙️ Tech', stealth: '🫥 Stealth', speed: '🏃 Speed' },
    },
    {
      id: 'astronauts', name: 'Astronauts', emoji: '👨‍🚀', color: '#2471A3',
      cards: [
        { id: 'armstrong', name: 'Armstrong', emoji: '👨‍🚀', brave: 99, skill: 95, missions: 80, fame: 99 },
        { id: 'gagarin',   name: 'Gagarin',   emoji: '🧑‍🚀', brave: 98, skill: 90, missions: 65, fame: 98 },
        { id: 'aldrin',    name: 'Aldrin',    emoji: '👩‍🚀', brave: 96, skill: 93, missions: 75, fame: 90 },
        { id: 'tereshkova',name: 'Tereshkova',emoji: '👩‍🚀', brave: 97, skill: 88, missions: 60, fame: 88 },
      ],
      stats: ['brave', 'skill', 'missions', 'fame'],
      statLabels: { brave: '💪 Brave', skill: '🎓 Skill', missions: '🚀 Missions', fame: '⭐ Fame' },
    },
  ],
}

// ─── ROBOTS ──────────────────────────────────────────────────────────────────
const robotsTheme = {
  id: 'robots',
  label: 'Robots',
  world: 'World of Robots',
  emoji: '🤖',
  accent: '#2fe0ff',
  raceRacers: [
    { id: 'fox',    name: 'Fox',    emoji: '🦊', color: '#FF8A1F', image: '/themes/Robots/head-fox.png' },
    { id: 'rusty',  name: 'Rusty',  emoji: '🦾', color: '#3498DB', image: '/themes/Robots/head-rusty.png' },
    { id: 'pixel',  name: 'Pixel',  emoji: '⚙️', color: '#2ECC71', image: '/themes/Robots/head-pixel.png' },
    { id: 'dot',    name: 'Dot',    emoji: '🔩', color: '#E84393', image: '/themes/Robots/head-dot.png' },
  ],
  // Colouring pages in Draw & Paint (must be line-art SVGs)
  coloringPages: [
    { id: 'pg1', name: 'Rocket', image: '/themes/Robots/p1-Rocket.svg' },
    { id: 'pg2', name: 'Rusty', image: '/themes/Robots/p2-rusty.svg' },
    { id: 'pg3', name: 'Pixel', image: '/themes/Robots/p3-Pixel.svg' },
    { id: 'pg4', name: 'Dot', image: '/themes/Robots/p4-Dot.svg' },
  ],
  quartettFamilies: [
    {
      id: 'battle', name: 'Battle Bots', emoji: '⚔️', color: '#C0392B',
      cards: [
        { id: 'crusher',  name: 'Crusher',   emoji: '🦾', power: 99, armor: 88, speed: 55, weapons: 95 },
        { id: 'blaster',  name: 'Blaster',   emoji: '🔫', power: 88, armor: 65, speed: 75, weapons: 99 },
        { id: 'shielder', name: 'Shielder',  emoji: '🛡️', power: 70, armor: 99, speed: 45, weapons: 60 },
        { id: 'speeder',  name: 'Speeder',   emoji: '⚡', power: 75, armor: 55, speed: 99, weapons: 72 },
      ],
      stats: ['power', 'armor', 'speed', 'weapons'],
      statLabels: { power: '💥 Power', armor: '🛡️ Armor', speed: '⚡ Speed', weapons: '🔫 Weapons' },
    },
    {
      id: 'helper', name: 'Helper Bots', emoji: '🤝', color: '#2980B9',
      cards: [
        { id: 'cleanbot',  name: 'Cleanbot',  emoji: '🧹', intel: 70, friendly: 99, tasks: 95, battery: 80 },
        { id: 'cookbot',   name: 'Cookbot',   emoji: '👨‍🍳', intel: 85, friendly: 90, tasks: 98, battery: 75 },
        { id: 'teachbot',  name: 'Teachbot',  emoji: '📚', intel: 99, friendly: 88, tasks: 90, battery: 85 },
        { id: 'doctorbot', name: 'Doctorbot', emoji: '⚕️', intel: 98, friendly: 92, tasks: 96, battery: 88 },
      ],
      stats: ['intel', 'friendly', 'tasks', 'battery'],
      statLabels: { intel: '🧠 Intel', friendly: '😊 Friendly', tasks: '✅ Tasks', battery: '🔋 Battery' },
    },
    {
      id: 'builders', name: 'Builder Bots', emoji: '🔨', color: '#D35400',
      cards: [
        { id: 'weldbot',   name: 'Weldbot',   emoji: '🔧', strength: 95, precision: 88, speed: 65, size: 80 },
        { id: 'drillbot',  name: 'Drillbot',  emoji: '🔩', strength: 88, precision: 80, speed: 70, size: 75 },
        { id: 'liftbot',   name: 'Liftbot',   emoji: '🏗️', strength: 99, precision: 65, speed: 45, size: 95 },
        { id: 'printbot',  name: '3D Printbot',emoji: '🖨️', strength: 55, precision: 99, speed: 55, size: 60 },
      ],
      stats: ['strength', 'precision', 'speed', 'size'],
      statLabels: { strength: '💪 Strength', precision: '🎯 Precision', speed: '⚡ Speed', size: '📏 Size' },
    },
    {
      id: 'explorer', name: 'Explorer Bots', emoji: '🔭', color: '#1ABC9C',
      cards: [
        { id: 'rover',     name: 'Mars Rover', emoji: '🚗', range: 90, sensors: 95, durability: 98, speed: 35 },
        { id: 'deepbot',   name: 'Deep Sea Bot',emoji: '🤿', range: 85, sensors: 90, durability: 95, speed: 40 },
        { id: 'flybot',    name: 'Fly Bot',    emoji: '✈️', range: 95, sensors: 85, durability: 75, speed: 90 },
        { id: 'cavebot',   name: 'Cave Bot',   emoji: '⛏️', range: 70, sensors: 88, durability: 99, speed: 45 },
      ],
      stats: ['range', 'sensors', 'durability', 'speed'],
      statLabels: { range: '📡 Range', sensors: '👁️ Sensors', durability: '🛡️ Durability', speed: '⚡ Speed' },
    },
    {
      id: 'famous', name: 'Famous Robots', emoji: '🌟', color: '#8E44AD',
      cards: [
        { id: 'r2d2',   name: 'R2-D2',    emoji: '🤖', cool: 99, tools: 98, speed: 70, fame: 99 },
        { id: 'wall_e', name: 'WALL-E',   emoji: '📦', cool: 95, tools: 85, speed: 45, fame: 96 },
        { id: 'optimus',name: 'Optimus',  emoji: '🚛', cool: 98, tools: 90, speed: 80, fame: 98 },
        { id: 'bender', name: 'Bender',   emoji: '🍺', cool: 90, tools: 75, speed: 72, fame: 88 },
      ],
      stats: ['cool', 'tools', 'speed', 'fame'],
      statLabels: { cool: '😎 Cool', tools: '🔧 Tools', speed: '⚡ Speed', fame: '⭐ Fame' },
    },
  ],
}

// ─── SEA ─────────────────────────────────────────────────────────────────────
const seaTheme = {
  id: 'sea',
  label: 'Sea',
  world: 'Underwater Kingdom',
  emoji: '🌊',
  accent: '#ff8a6b',
  raceRacers: [
    { id: 'fox',      name: 'Fox',      emoji: '🦊', color: '#FF8A1F', image: '/themes/Underwater/head-fox.png' },
    { id: 'stingray', name: 'Stingray', emoji: '🦈', color: '#1ABC9C', image: '/themes/Underwater/head-stingray.png' },
    { id: 'marlin',   name: 'Marlin',   emoji: '🐠', color: '#2E6FD8', image: '/themes/Underwater/head-marlin.png' },
    { id: 'anglerfish',name:'Anglerfish',emoji: '🪼', color: '#8E44AD', image: '/themes/Underwater/head-anglerfish.png' },
  ],
  // Colouring pages in Draw & Paint (must be line-art SVGs)
  coloringPages: [
    { id: 'pg1', name: 'Octopus', image: '/themes/Underwater/p1-octopus.svg' },
    { id: 'pg2', name: 'Stingray', image: '/themes/Underwater/p2-stingray.svg' },
    { id: 'pg3', name: 'Marlin', image: '/themes/Underwater/p3-marlin.svg' },
    { id: 'pg4', name: 'Anglerfish', image: '/themes/Underwater/p4-anglerfish.svg' },
  ],
  quartettFamilies: [
    {
      id: 'mammals', name: 'Sea Mammals', emoji: '🐬', color: '#2471A3',
      cards: [
        { id: 'whale',    name: 'Blue Whale',  emoji: '🐋', size: 99, speed: 40, intel: 85, sound: 99 },
        { id: 'dolphin',  name: 'Dolphin',     emoji: '🐬', size: 50, speed: 98, intel: 99, sound: 92 },
        { id: 'seal',     name: 'Seal',        emoji: '🦭', size: 55, speed: 75, intel: 80, sound: 70 },
        { id: 'narwhal',  name: 'Narwhal',     emoji: '🦄', size: 70, speed: 65, intel: 78, sound: 75 },
      ],
      stats: ['size', 'speed', 'intel', 'sound'],
      statLabels: { size: '📏 Size', speed: '🏊 Speed', intel: '🧠 Intel', sound: '🔊 Sound' },
    },
    {
      id: 'fish', name: 'Tropical Fish', emoji: '🐠', color: '#E67E22',
      cards: [
        { id: 'clownfish', name: 'Clownfish',  emoji: '🐠', color_val: 99, speed: 55, size: 15, camouflage: 40 },
        { id: 'angelfish', name: 'Angelfish',  emoji: '🐟', color_val: 95, speed: 60, size: 20, camouflage: 50 },
        { id: 'pufferfish',name: 'Pufferfish', emoji: '🐡', color_val: 80, speed: 35, size: 30, camouflage: 75 },
        { id: 'lionfish',  name: 'Lionfish',   emoji: '🦁', color_val: 98, speed: 50, size: 35, camouflage: 90 },
      ],
      stats: ['color_val', 'speed', 'size', 'camouflage'],
      statLabels: { color_val: '🌈 Colors', speed: '🏊 Speed', size: '📏 Size', camouflage: '🫥 Camouflage' },
    },
    {
      id: 'deep', name: 'Deep Sea', emoji: '🌑', color: '#1A252F',
      cards: [
        { id: 'anglerfish', name: 'Anglerfish', emoji: '😈', depth: 99, scary: 99, size: 40, glow: 95 },
        { id: 'giant_squid',name: 'Giant Squid',emoji: '🦑', depth: 90, scary: 92, size: 95, glow: 60 },
        { id: 'viperfish',  name: 'Viperfish',  emoji: '🐍', depth: 95, scary: 95, size: 35, glow: 80 },
        { id: 'barreleye',  name: 'Barreleye',  emoji: '👀', depth: 88, scary: 70, size: 25, glow: 85 },
      ],
      stats: ['depth', 'scary', 'size', 'glow'],
      statLabels: { depth: '⬇️ Depth', scary: '😱 Scary', size: '📏 Size', glow: '💡 Glow' },
    },
    {
      id: 'crabs', name: 'Crabs & Shells', emoji: '🦀', color: '#CB4335',
      cards: [
        { id: 'crab',     name: 'Crab',      emoji: '🦀', armor: 88, claws: 95, speed: 55, size: 50 },
        { id: 'lobster',  name: 'Lobster',   emoji: '🦞', armor: 85, claws: 99, speed: 45, size: 65 },
        { id: 'octopus',  name: 'Octopus',   emoji: '🐙', armor: 30, claws: 70, speed: 80, size: 70 },
        { id: 'turtle_s', name: 'Sea Turtle',emoji: '🐢', armor: 99, claws: 40, speed: 40, size: 85 },
      ],
      stats: ['armor', 'claws', 'speed', 'size'],
      statLabels: { armor: '🛡️ Armor', claws: '🦀 Claws', speed: '🏊 Speed', size: '📏 Size' },
    },
    {
      id: 'pirates', name: 'Pirates', emoji: '🏴‍☠️', color: '#784212',
      cards: [
        { id: 'blackbeard',name: 'Blackbeard', emoji: '🏴‍☠️', bravery: 99, loot: 95, crew: 88, fame: 98 },
        { id: 'sparrow',   name: 'Jack Sparrow',emoji: '🍾', bravery: 90, loot: 88, crew: 70, fame: 99 },
        { id: 'bonny',     name: 'Anne Bonny', emoji: '⚔️', bravery: 96, loot: 80, crew: 82, fame: 90 },
        { id: 'calico',    name: 'Calico Jack',emoji: '🦜', bravery: 88, loot: 85, crew: 75, fame: 85 },
      ],
      stats: ['bravery', 'loot', 'crew', 'fame'],
      statLabels: { bravery: '💪 Bravery', loot: '💰 Loot', crew: '👥 Crew', fame: '⭐ Fame' },
    },
  ],
}

export const DEFAULT_THEME = 'animals'

export const THEMES = {
  animals:   animalsTheme,
  dinosaurs: dinosaursTheme,
  space:     spaceTheme,
  robots:    robotsTheme,
  sea:       seaTheme,
}

export const THEME_LIST = Object.values(THEMES)
