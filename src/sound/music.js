// ─── Background music ─────────────────────────────────────────────────────────
// Gentle, generative music made live with the Web Audio API — no files, no
// licences, and it never repeats in an obvious loop. Everything uses a
// pentatonic scale (no clashing notes), a slow tempo, soft envelopes and lots
// of rests, so it can play for a long time without getting annoying.
//
// Each world has its own flavour (instrument, tempo, key). If you ever add real
// recordings as /public/music/<world>.mp3 (e.g. /music/space.mp3), those are
// looped instead of the generated music for that world.

const PRESETS = {
  //           key (Hz)  bpm  melody wave   octave  rest  delay  pad          feel
  animals:   { root: 261.63, bpm: 84, wave: 'sine',     oct: 2, rest: 0.45, echo: 0.25, pad: 'triangle', pluck: 0.9 },  // kalimba-like
  dinosaurs: { root: 220.00, bpm: 76, wave: 'triangle', oct: 1, rest: 0.50, echo: 0.20, pad: 'sine',     pluck: 0.6 },  // wooden marimba
  space:     { root: 196.00, bpm: 60, wave: 'sine',     oct: 2, rest: 0.55, echo: 0.45, pad: 'sine',     pluck: 2.2 },  // slow bells
  robots:    { root: 246.94, bpm: 92, wave: 'square',   oct: 1, rest: 0.45, echo: 0.22, pad: 'triangle', pluck: 0.35 }, // soft chiptune
  sea:       { root: 233.08, bpm: 70, wave: 'sine',     oct: 2, rest: 0.35, echo: 0.40, pad: 'sine',     pluck: 1.4 },  // watery arpeggios
}
const PENTA = [0, 2, 4, 7, 9]                 // major pentatonic steps (semitones)
// Gentle progressions as scale-degree roots in semitones: I–vi–IV–V and friends
const PROGRESSIONS = [[0, 9, 5, 7], [0, 5, 9, 7], [0, 7, 9, 5], [5, 0, 7, 0]]

let ctx = null, master = null, duckGain = null, echoIn = null
let timer = null, nextTime = 0, step = 0
let preset = PRESETS.animals, themeId = 'animals'
let progression = PROGRESSIONS[0]
let melodyPos = 2
let enabled = false, volume = 0.5, ducked = false
let fileAudio = null, fileFailed = new Set()

try {
  enabled = localStorage.getItem('music-on') !== '0'      // on by default
  const v = parseFloat(localStorage.getItem('music-volume'))
  if (!Number.isNaN(v)) volume = v
} catch { /* ignore */ }

const LEVEL = 0.16                                          // overall loudness at 100%
const semis = (base, n) => base * Math.pow(2, n / 12)
const noteInScale = (i) => {                               // i can be any integer
  const oct = Math.floor(i / 5), deg = ((i % 5) + 5) % 5
  return PENTA[deg] + 12 * oct
}

function ensureContext() {
  if (ctx) return true
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return false
  ctx = new AC()
  master = ctx.createGain()
  duckGain = ctx.createGain()
  master.gain.value = 0
  master.connect(duckGain).connect(ctx.destination)
  // a soft echo for space and warmth
  echoIn = ctx.createGain()
  const delay = ctx.createDelay(1.5)
  const fb = ctx.createGain()
  const tone = ctx.createBiquadFilter()
  tone.type = 'lowpass'; tone.frequency.value = 1800
  delay.delayTime.value = 0.42
  fb.gain.value = 0.35
  echoIn.connect(delay).connect(tone).connect(fb).connect(delay)
  tone.connect(master)
  return true
}

function note(freq, start, dur, { wave = 'sine', gain = 0.3, attack = 0.02, echo = 0 } = {}) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  const f = ctx.createBiquadFilter()
  o.type = wave
  o.frequency.value = freq
  f.type = 'lowpass'
  f.frequency.value = wave === 'square' ? 1400 : 2600       // round off harsh edges
  g.gain.setValueAtTime(0, start)
  g.gain.linearRampToValueAtTime(gain, start + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  o.connect(f).connect(g).connect(master)
  if (echo > 0) { const e = ctx.createGain(); e.gain.value = echo; g.connect(e).connect(echoIn) }
  o.start(start)
  o.stop(start + dur + 0.05)
}

// Schedule one eighth-note step of music.
function scheduleStep(t) {
  const p = preset
  const eighth = 60 / p.bpm / 2
  const bar = Math.floor(step / 8), beat = step % 8
  if (step % 128 === 0) progression = PROGRESSIONS[Math.floor(Math.random() * PROGRESSIONS.length)]
  const chordRoot = progression[Math.floor(bar / 2) % progression.length]

  // bass + pad at the start of every 2 bars
  if (beat === 0 && bar % 2 === 0) {
    const base = semis(p.root, chordRoot) / 2
    const len = eighth * 16
    note(base, t, len * 0.9, { wave: 'sine', gain: 0.22, attack: 0.3 })
    ;[0, 4, 7].forEach((iv, k) => {
      const third = chordRoot + iv
      note(semis(p.root, third), t + k * 0.04, len, { wave: p.pad, gain: 0.05, attack: 1.2 })
    })
  }

  // melody: a gentle random walk on the pentatonic scale, with rests
  const strong = beat % 2 === 0
  if (Math.random() > p.rest + (strong ? -0.15 : 0.2)) {
    melodyPos += [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)]
    if (melodyPos < 0) melodyPos = 1
    if (melodyPos > 9) melodyPos = 8
    const f = semis(p.root, noteInScale(melodyPos) + 12 * (p.oct - 1))
    note(f, t, p.pluck, { wave: p.wave, gain: p.wave === 'square' ? 0.05 : 0.11, attack: 0.012, echo: p.echo })
  }
  step++
}

function tick() {
  const eighth = 60 / preset.bpm / 2
  while (nextTime < ctx.currentTime + 0.4) {
    scheduleStep(nextTime)
    nextTime += eighth
  }
}

function targetLevel() { return LEVEL * volume * (ducked ? 0.35 : 1) }

// ── optional recorded track for this world ──
function tryFile() {
  if (fileFailed.has(themeId)) return false
  if (fileAudio?.dataset.theme === themeId) { fileAudio.play().catch(() => {}); return true }
  fileAudio?.pause()
  const a = new Audio(`/music/${themeId}.mp3`)
  a.dataset.theme = themeId
  a.loop = true
  a.volume = Math.min(1, volume * 0.5 * (ducked ? 0.35 : 1))
  a.addEventListener('error', () => {
    fileFailed.add(themeId)
    if (fileAudio === a) { fileAudio = null; if (enabled) startSynth() }
  })
  fileAudio = a
  a.play().catch(() => {})
  return true
}

function startSynth() {
  if (!ensureContext()) return
  ctx.resume?.()
  if (!timer) {
    nextTime = ctx.currentTime + 0.1
    timer = setInterval(tick, 120)
  }
  master.gain.cancelScheduledValues(ctx.currentTime)
  master.gain.setTargetAtTime(targetLevel(), ctx.currentTime, 0.8)   // slow fade-in
}

function stopSynth() {
  if (!ctx) return
  master.gain.cancelScheduledValues(ctx.currentTime)
  master.gain.setTargetAtTime(0, ctx.currentTime, 0.3)
  const t = timer
  timer = null
  if (t) setTimeout(() => clearInterval(t), 1200)   // let the fade-out finish
}

function start() {
  if (!enabled || document.hidden) return
  if (tryFile() && fileAudio) { stopSynth(); return }
  startSynth()
}
function stop() {
  fileAudio?.pause()
  stopSynth()
}

// ── public API ────────────────────────────────────────────────────────────────
export function isMusicOn() { return enabled }
export function getMusicVolume() { return volume }

export function setMusicOn(on) {
  enabled = on
  try { localStorage.setItem('music-on', on ? '1' : '0') } catch { /* ignore */ }
  if (on) start(); else stop()
}

export function setMusicVolume(v) {
  volume = Math.max(0, Math.min(1, v))
  try { localStorage.setItem('music-volume', String(volume)) } catch { /* ignore */ }
  if (ctx && timer) master.gain.setTargetAtTime(targetLevel(), ctx.currentTime, 0.1)
  if (fileAudio) fileAudio.volume = Math.min(1, volume * 0.5 * (ducked ? 0.35 : 1))
}

export function setMusicTheme(id) {
  if (id === themeId) return
  themeId = id
  preset = PRESETS[id] ?? PRESETS.animals
  if (enabled && (timer || fileAudio)) start()
}

// Quieter while the voice reads something out.
export function duckMusic(on) {
  ducked = on
  if (ctx && timer) master.gain.setTargetAtTime(targetLevel(), ctx.currentTime, on ? 0.15 : 0.6)
  if (fileAudio) fileAudio.volume = Math.min(1, volume * 0.5 * (on ? 0.35 : 1))
}

// Browsers only allow sound after the first tap/click, so start then.
if (typeof window !== 'undefined') {
  const kick = () => {
    window.removeEventListener('pointerdown', kick)
    window.removeEventListener('keydown', kick)
    start()
  }
  window.addEventListener('pointerdown', kick)
  window.addEventListener('keydown', kick)
  // pause when the tab/app is in the background (saves battery)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop()
    else if (enabled && (ctx || fileAudio)) start()
  })
}
