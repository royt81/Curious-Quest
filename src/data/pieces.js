// ─── Themed game pieces for Checkers & Backgammon ─────────────────────────────
// Each world gets two clearly different characters (taken from the Race racers).
// `human` = the player's pieces, `comp` = the computer / Player 2.
// To change a pairing, change the racer index (0–3) or the emoji below.
import { THEMES } from './themes'

const PAIRS = {
  animals:   { human: 0, comp: 3, humanEmoji: '🦊', compEmoji: '🦍' },  // Fennec vs Gorilla
  dinosaurs: { human: 0, comp: 3, humanEmoji: '🦖', compEmoji: '🦕' },  // T-Rex vs Triceratops
  space:     { human: 0, comp: 2, humanEmoji: '🧑‍🚀', compEmoji: '👽' },  // Astronaut vs Alien
  robots:    { human: 2, comp: 1, humanEmoji: '🤖', compEmoji: '🦾' },  // Pixel vs Rusty
  sea:       { human: 0, comp: 3, humanEmoji: '🐙', compEmoji: '🐡' },  // Octopus vs Anglerfish
}

export function themePieces(theme) {
  const t = theme ?? THEMES.animals
  const pair = PAIRS[t.id] ?? PAIRS.animals
  const racers = t.raceRacers ?? THEMES.animals.raceRacers
  const h = racers[pair.human], c = racers[pair.comp]
  return {
    color: t.accent,
    human: { image: h.image, name: h.name, emoji: pair.humanEmoji },
    comp:  { image: c.image, name: c.name, emoji: pair.compEmoji },
  }
}
