// Animal data for Foursomes (Quartett)
// Each family has 4 cards with 4 stats each
export const QUARTETT_FAMILIES = [
  {
    id: 'big_cats',
    name: 'Big Cats',
    emoji: '🐆',
    color: '#FF8C00',
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
    id: 'ocean',
    name: 'Ocean Animals',
    emoji: '🐋',
    color: '#1E90FF',
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
    id: 'birds',
    name: 'Birds',
    emoji: '🦅',
    color: '#9370DB',
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
    id: 'jungle',
    name: 'Jungle Animals',
    emoji: '🐒',
    color: '#228B22',
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
    id: 'farm',
    name: 'Farm Animals',
    emoji: '🐄',
    color: '#D2691E',
    cards: [
      { id: 'horse', name: 'Horse', emoji: '🐴', speed: 88, strength: 80, size: 85, friendly: 70 },
      { id: 'cow',   name: 'Cow',   emoji: '🐄', speed: 35, strength: 65, size: 80, friendly: 85 },
      { id: 'pig',   name: 'Pig',   emoji: '🐷', speed: 28, strength: 45, size: 55, friendly: 90 },
      { id: 'sheep', name: 'Sheep', emoji: '🐑', speed: 25, strength: 30, size: 50, friendly: 95 },
    ],
    stats: ['speed', 'strength', 'size', 'friendly'],
    statLabels: { speed: '🏃 Speed', strength: '💪 Strength', size: '📏 Size', friendly: '😊 Friendly' },
  },
];

// Animals for the Race game
export const RACE_ANIMALS = [
  { id: 'rabbit', name: 'Rabbit', emoji: '🐰', color: '#FFB6C1' },
  { id: 'turtle', name: 'Turtle', emoji: '🐢', color: '#90EE90' },
  { id: 'fox',    name: 'Fox',    emoji: '🦊', color: '#FFA500' },
  { id: 'frog',   name: 'Frog',   emoji: '🐸', color: '#7CFC00' },
];

// UNO color set
// i18n: list
export const UNO_COLORS = ['red', 'blue', 'green', 'yellow'];
export const UNO_COLOR_EMOJIS = { red: '🔴', blue: '🔵', green: '🟢', yellow: '🟡' };
export const UNO_COLOR_HEX = { red: '#E53935', blue: '#1E88E5', green: '#43A047', yellow: '#FDD835' };
