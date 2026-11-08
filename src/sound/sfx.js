// ─── Sound effects ────────────────────────────────────────────────────────────
// Each sound prefers a REAL recorded file from /public/sounds/ if one is present,
// and otherwise falls back to a synthesized ZzFX version (see zzfx.js). So you
// can drop files in one at a time and they replace the synth automatically —
// no code changes, and never any silence if a file is missing.
//
// To use recordings, add files to public/sounds/ with these names:
//   tap.mp3, dice.mp3, climb.mp3, slide.mp3, win.mp3
// (Change the FILES map below to use different names or formats like .ogg/.wav.)
//
// Public API (games don't change):
//   playTap() · playDiceRoll(sec) · playDiceClack() · playDiceSettle()
//   playClimb() · playSlide() · playWin()
//   isMuted() · setMuted(v) · toggleMuted()

import { zzfx, ZZFX } from './zzfx'

ZZFX.volume = 0.35          // synth level at 100% volume (scaled by the Settings slider)
const SAMPLE_VOLUME = 0.6   // volume for recorded files

// Logical sound name → file in /public/sounds. Add a file to switch that sound
// from synth to recording. `dice` is a single roll recording (plays once).
// Logical sound name → file(s) in /public/sounds. A value can be an ARRAY of
// variants; one is chosen at random each play (a simple "mixer" for variety).
const FILES = {
  tap:   ['/sounds/chipsCollide1.ogg', '/sounds/chipsCollide2.ogg', '/sounds/chipsCollide3.ogg'],
  dice:  '/sounds/dice.ogg',
  climb: '/sounds/climb.ogg',
  slide: '/sounds/slide.ogg',
  win:   '/sounds/win.ogg',
  card:  ['/sounds/cardPlace1.ogg', '/sounds/cardPlace2.ogg', '/sounds/cardPlace3.ogg'],
  draw:  ['/sounds/cardSlide1.ogg', '/sounds/cardSlide2.ogg'],
}

// ── recorded-file loading (graceful: missing files just stay on synth) ──────────
const samples = {} // name -> { urls:[], ready:[bool…], anyReady:bool }

function loadSample(name) {
  if (samples[name]) return samples[name]
  const raw = FILES[name]
  const urls = Array.isArray(raw) ? raw : (raw ? [raw] : [])
  const entry = { urls, ready: urls.map(() => false), anyReady: false }
  samples[name] = entry
  if (typeof Audio === 'undefined') return entry
  urls.forEach((url, i) => {
    try {
      const el = new Audio()
      el.preload = 'auto'
      el.addEventListener('canplaythrough', () => { entry.ready[i] = true; entry.anyReady = true }, { once: true })
      el.src = url
    } catch { /* ignore */ }
  })
  return entry
}

// "Recorded" once at least one variant has actually loaded, so missing files
// silently degrade to synth instead of going quiet.
function hasSample(name) {
  return (samples[name] || loadSample(name)).anyReady
}

// Play a random loaded variant (the mixer). `vol` overrides the default level.
function playSample(name, vol = SAMPLE_VOLUME) {
  const e = samples[name] || loadSample(name)
  if (!e.anyReady) return false
  const readyUrls = e.urls.filter((_, i) => e.ready[i])
  if (!readyUrls.length) return false
  const url = readyUrls[Math.floor(Math.random() * readyUrls.length)]
  try {
    const node = new Audio(url) // fresh element each play → overlaps cleanly
    node.volume = Math.max(0, Math.min(1, vol * volume))
    const p = node.play()
    if (p && p.catch) p.catch(() => {})
    return true
  } catch { return false }
}

// Preload all known files so they're ready by the first roll/move.
try { Object.keys(FILES).forEach(loadSample) } catch { /* ignore */ }

// ── mute ────────────────────────────────────────────────────────────────────
let muted = false
try { muted = localStorage.getItem('sfx-muted') === '1' } catch { /* ignore */ }

export function isMuted() { return muted }
export function setMuted(v) {
  muted = !!v
  try { localStorage.setItem('sfx-muted', muted ? '1' : '0') } catch { /* ignore */ }
}
export function toggleMuted() { setMuted(!muted); return muted }

// ── master volume (0…1), remembered between visits ───────────────────────────
let volume = 0.8
try { const v = parseFloat(localStorage.getItem('sfx-volume')); if (!Number.isNaN(v)) volume = v } catch { /* ignore */ }
ZZFX.volume = 0.35 * volume
export function getVolume() { return volume }
export function setVolume(v) {
  volume = Math.max(0, Math.min(1, v))
  ZZFX.volume = 0.35 * volume
  try { localStorage.setItem('sfx-volume', String(volume)) } catch { /* ignore */ }
}

// Browsers start audio suspended until a user gesture; sounds follow clicks/rolls.
function wake() {
  try {
    const ac = ZZFX.audioContext
    if (ac && ac.state === 'suspended') ac.resume().catch(() => {})
  } catch { /* ignore */ }
}

// Small helper: a short run of notes (for the synth climb/win fallbacks).
function playNotes(notes, gap, params) {
  wake()
  notes.forEach((freq, i) => {
    setTimeout(() => { try { zzfx(...params(freq)) } catch { /* ignore */ } }, i * gap)
  })
}

// ── sounds (recorded file preferred, synth fallback) ───────────────────────────

// A soft "tok" as a piece hops one square.
export function playTap() {
  if (muted) return
  // mixer: one of the three chip-collide variants at random, a touch quieter
  // since it repeats once per square.
  if (playSample('tap', 0.45)) return
  wake()
  try { zzfx(0.6, 0.05, 360, 0, 0.01, 0.08, 1, 2, -8, 0, 0, 0, 0, 0.2) } catch { /* ignore */ }
}

// Dice: if a recording exists it plays once here (and the per-flip synth clacks
// below stay silent). Otherwise this is a no-op and the synth clacks handle it.
export function playDiceRoll() {
  if (muted) return
  playSample('dice')
}

// One synth clack per on-screen dice-face flip — suppressed when a dice
// recording is in use (the recording already covers the whole roll).
export function playDiceClack() {
  if (muted || hasSample('dice')) return
  wake()
  const r = Math.random()
  const vol = 0.22 + r * 0.12
  const click = 700 + Math.random() * 500
  const tock = 150 + Math.random() * 150
  try {
    zzfx(vol * 0.6, 0.35, click, 0, 0.003, 0.03 + r * 0.02, 4, 2, 0, 0, 0, 0, 0, 0.6, 0, 0, 0, 0.2, 0, 0, 2200)
    zzfx(vol, 0.25, tock, 0, 0.004, 0.05 + r * 0.03, 1, 1.4, -2 - r * 3, 0, 0, 0, 0, 0.25, 0, 0, 0, 0.3, 0, 0, 1600)
  } catch { /* ignore */ }
}

// The synth landing hit — also suppressed when a dice recording is in use.
export function playDiceSettle() {
  if (muted || hasSample('dice')) return
  wake()
  const r = Math.random()
  try {
    zzfx(0.26, 0.25, 800 + r * 300, 0, 0.004, 0.05, 4, 2, 0, 0, 0, 0, 0, 0.55, 0, 0, 0, 0.25, 0, 0, 1800)
    zzfx(0.5, 0.12, 130 + r * 30, 0, 0.014, 0.16, 1, 1.1, -2, 0, 0, 0, 0, 0.3, 0, 0, 0.02, 0.5, 0, 0, 1200)
  } catch { /* ignore */ }
}

// Climbing a ladder / taking a shortcut — rising three-note run.
export function playClimb() {
  if (muted) return
  if (playSample('climb')) return
  playNotes([440, 587, 784], 70, f => [0.5, 0.05, f, 0, 0.04, 0.09, 1, 1.5])
}

// Sliding down a snake — descending "whoop".
export function playSlide() {
  if (muted) return
  if (playSample('slide')) return
  wake()
  try { zzfx(0.5, 0.05, 520, 0.02, 0.28, 0.12, 0, 0, -6, -3, 0, 0, 0, 0, 0, 0, 0, 1, 0.1) } catch { /* ignore */ }
}

// Winning — happy ascending major arpeggio.
export function playWin() {
  if (muted) return
  if (playSample('win')) return
  playNotes([523, 659, 784, 1047], 120, f => [0.6, 0.05, f, 0, 0.09, 0.16, 1, 1.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0.06])
}

// ── Board & card game sounds (added Nov 2026) ─────────────────────────────────

// A piece / tile / checker put down.
export function playMove() {
  if (muted) return
  if (playSample('tap', 0.55)) return
  wake()
  try { zzfx(0.7, 0.05, 300, 0, 0.01, 0.07, 1, 2, -6, 0, 0, 0, 0, 0.2) } catch { /* ignore */ }
}

// Capturing / hitting an opponent's piece — a heavier double knock.
export function playCapture() {
  if (muted) return
  wake()
  try {
    zzfx(0.8, 0.05, 220, 0, 0.01, 0.09, 1, 2.2, -10, 0, 0, 0, 0, 0.3)
    setTimeout(() => { try { zzfx(0.6, 0.05, 520, 0, 0.01, 0.06, 1, 1.5, 0, 0, 0, 0, 0, 0.1) } catch { /* ignore */ } }, 70)
  } catch { /* ignore */ }
}

// A card played / flipped over.
export function playCard() {
  if (muted) return
  if (playSample('card', 0.7)) return
  wake()
  try { zzfx(0.4, 0.3, 1200, 0, 0.01, 0.04, 4, 1, 0, 0, 0, 0, 0, 0.5) } catch { /* ignore */ }
}

// Drawing a card from the pile.
export function playDraw() {
  if (muted) return
  if (playSample('draw', 0.7)) return
  playCard()
}

// Found a pair / closed a box — a bright two-note chime.
export function playMatch() {
  if (muted) return
  playNotes([784, 1175], 90, f => [0.45, 0.05, f, 0, 0.05, 0.18, 1, 1.5])
}

// A right answer.
export function playCorrect() {
  if (muted) return
  playNotes([659, 880], 80, f => [0.5, 0.05, f, 0, 0.05, 0.15, 1, 1.5])
}

// A wrong answer — soft and friendly, not a harsh buzzer.
export function playWrong() {
  if (muted) return
  playNotes([330, 262], 120, f => [0.35, 0.05, f, 0, 0.06, 0.16, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.8])
}

// Short test sound for the Settings volume slider.
export function playTest() {
  const was = muted
  muted = false
  playCorrect()
  muted = was
}
