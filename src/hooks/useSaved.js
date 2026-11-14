import { useEffect, useState } from 'react'

// ─── Saved game progress ──────────────────────────────────────────────────────
// Works like useState, but the value is also kept on the device (localStorage),
// so a game continues exactly where it was after closing the app or switching
// away. Each game has one save slot; each piece of state is one field in it:
//
//   const [board, setBoard] = useSaved('chess', 'board', makeInitialBoard)
//
// Only things that describe the game go in here (board, turn, cards …), not
// momentary things like "piece selected" or "animation running".
// Bump SAVE_VERSION when a game's saved data changes shape — old saves are then
// ignored instead of breaking the game.

const SAVE_VERSION = 1
const keyOf = (game) => `cq-save-v${SAVE_VERSION}-${game}`
const slots = {}      // game → object with the saved fields (shared by all its hooks)
const timers = {}

function slot(game) {
  if (!slots[game]) {
    try { slots[game] = JSON.parse(localStorage.getItem(keyOf(game))) || {} } catch { slots[game] = {} }
  }
  return slots[game]
}

// Writes are bundled (one write per game every 300 ms at most)
function persist(game) {
  clearTimeout(timers[game])
  timers[game] = setTimeout(() => {
    try { localStorage.setItem(keyOf(game), JSON.stringify(slots[game])) } catch { /* storage full or blocked: just don't save */ }
  }, 300)
}

/** The saved value of one field, or undefined (for setting up other state from it). */
export function readSaved(game, field) {
  return slot(game)[field]
}

/** Saves one field outside of React state (e.g. a drawing's picture). */
export function writeSaved(game, field, value) {
  slot(game)[field] = value
  persist(game)
}

export function clearSaved(game) {
  slots[game] = {}
  try { localStorage.removeItem(keyOf(game)) } catch { /* ignore */ }
}

export default function useSaved(game, field, initial) {
  const [value, setValue] = useState(() => {
    const s = slot(game)
    if (field in s) return s[field]
    return typeof initial === 'function' ? initial() : initial
  })
  useEffect(() => {
    slot(game)[field] = value === undefined ? null : value
    persist(game)
  }, [game, field, value])
  return [value, setValue]
}

// make sure nothing is lost when the app is closed right after a move
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    for (const game of Object.keys(timers)) {
      clearTimeout(timers[game])
      try { localStorage.setItem(keyOf(game), JSON.stringify(slots[game])) } catch { /* ignore */ }
    }
  })
}
