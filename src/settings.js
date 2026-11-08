// ─── App-wide settings (remembered in this browser) ───────────────────────────
// Tiny store with a React hook. Sound settings live in sound/sfx.js; the chosen
// world/theme lives in context/ThemeContext.jsx.
import { useSyncExternalStore } from 'react'

const DEFAULTS = { screensaver: true, colour: 1 }   // colour: 1 = full colour … 0 = black & white
let state = { ...DEFAULTS }
try { state = { ...DEFAULTS, ...JSON.parse(localStorage.getItem('cq-settings') || '{}') } } catch { /* ignore */ }

const listeners = new Set()

export function getSettings() { return state }
export function setSetting(key, value) {
  state = { ...state, [key]: value }
  try { localStorage.setItem('cq-settings', JSON.stringify(state)) } catch { /* ignore */ }
  listeners.forEach(l => l())
}
export function useSettings() {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l) },
    () => state,
  )
}
