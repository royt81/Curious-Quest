// ─── Read-aloud (text-to-speech) ──────────────────────────────────────────────
// Uses the browser's built-in voices (Web Speech API): works offline in
// Chrome, Edge, Safari (incl. iPhone/iPad) and Android. Does nothing where
// unsupported. Kept separate from sound effects: muting effects never silences
// the voice, because a child who can't read depends on it.
import { duckMusic } from './music'

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null
let voice = null
let runId = 0            // bumps on every new speak() so stale callbacks are ignored

// ── user settings (Settings → Voice), remembered in this browser ──
// level: 0…1 slider position. The browser voice is very loud even at low
// "volume" values, so the slider maps onto a quiet-to-moderate range.
let prefs = { on: true, voiceName: '', rate: 0.9, pitch: 1.1, level: 0.4 }
try { prefs = { ...prefs, ...JSON.parse(localStorage.getItem('voice-prefs') || '{}') } } catch { /* ignore */ }
const listeners = new Set()
function savePrefs() {
  try { localStorage.setItem('voice-prefs', JSON.stringify(prefs)) } catch { /* ignore */ }
  listeners.forEach(l => l())
}

// English voices this device offers (the list differs per device/browser).
export function getEnglishVoices() {
  if (!synth) return []
  return synth.getVoices()
    .filter(v => /^en[-_]/i.test(v.lang))
    .sort((a, b) => a.name.localeCompare(b.name))
}
export function onVoicesChanged(cb) { listeners.add(cb); return () => listeners.delete(cb) }

function pickVoice() {
  if (!synth) return
  const voices = synth.getVoices()
  if (!voices.length) return
  const chosen = prefs.voiceName && voices.find(v => v.name === prefs.voiceName)
  if (chosen) { voice = chosen; listeners.forEach(l => l()); return }
  const en = voices.filter(v => /^en[-_]/i.test(v.lang))
  // Prefer friendly, natural-sounding voices when the system has them.
  const preferred = ['Samantha', 'Google UK English Female', 'Google US English', 'Microsoft Aria', 'Microsoft Jenny', 'Karen', 'Moira', 'Serena']
  voice = preferred.map(n => en.find(v => v.name.includes(n))).find(Boolean)
    ?? en.find(v => v.localService) ?? en[0] ?? voices[0]
  listeners.forEach(l => l())
}
if (synth) {
  pickVoice()
  synth.addEventListener?.('voiceschanged', pickVoice)
}

export const canSpeak = !!synth

// slider 0 → 0.03 (whisper) · 0.4 → ~0.1 (default) · 1 → 0.45 (clearly loud)
export function levelToVolume(level) {
  const l = Math.max(0, Math.min(1, level ?? 0.4))
  return 0.03 + 0.42 * l * l
}

const clean = (t) => String(t).replace(/[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]|\u{FE0F}/gu, '')

function utter(text) {
  const u = new SpeechSynthesisUtterance(clean(text))
  if (voice) u.voice = voice
  u.lang = voice?.lang ?? 'en-GB'
  u.rate = prefs.rate
  u.pitch = prefs.pitch
  u.volume = levelToVolume(prefs.level)
  return u
}

// Speak a list of parts one after another. Each part may have an onStart
// callback (used to make the answer being read glow). onDone runs at the end
// — or when the reading is interrupted — so the glow can be cleared.
let queued = 0          // short announcements waiting their turn

// Speak a list of parts one after another. Each part may have an onStart
// callback (used to make the answer being read glow). onDone runs at the end
// — or when the reading is interrupted — so the glow can be cleared.
// queue: true  → wait for whatever is being said to finish (announcements like
//                "Well done!" then "T-Rex, it's your turn" — nothing gets cut off)
// queue: false → interrupt and start straight away (reading a question)
export function speakSteps(parts, onDone, { force = false, queue = false } = {}) {
  if (!synth || !parts?.length || (!prefs.on && !force)) { onDone?.(); return }
  try {
    if (!queue || queued > 2) { synth.cancel(); queued = 0 }   // never build a long backlog
    const id = ++runId
    duckMusic(true)
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      if (queue) queued = Math.max(0, queued - 1)
      if (id !== runId) return               // a newer reading has taken over
      duckMusic(false)
      onDone?.()
    }
    if (queue) queued++
    const words = parts.reduce((n, p) => n + String(p.text).split(/\s+/).length, 0)
    parts.forEach((part, i) => {
      const u = utter(part.text)
      u.onstart = () => {
        if (i === 0) setTimeout(finish, 2500 + words * 600)   // safety net, timed from when it really starts
        if (id === runId) part.onStart?.()
      }
      if (i === parts.length - 1) { u.onend = finish; u.onerror = finish }
      synth.speak(u)
    })
    // Last-resort safety net in case the browser never starts or ends it
    setTimeout(finish, 20000 + words * 600)
  } catch { onDone?.() }
}

// Interrupts whatever is playing (questions, things the child asked to hear).
export function speak(text) {
  speakSteps([{ text }])
}

// Waits for the current sentence to finish first (game announcements).
export function announce(text) {
  speakSteps([{ text }], null, { queue: true })
}

export function stopSpeaking() {
  runId++
  duckMusic(false)
  try { synth?.cancel() } catch { /* ignore */ }
}

// ── Settings API ──
export function getVoicePrefs() { return { ...prefs, current: voice?.name ?? '' } }
export function setVoicePrefs(patch) {
  prefs = { ...prefs, ...patch }
  if ('voiceName' in patch) pickVoice()
  savePrefs()
}
// Always plays (even when the voice is switched off) so a parent can try it.
export function testVoice() {
  speakSteps([{ text: 'Hello! I will read the questions to you.' }], null, { force: true })
}
