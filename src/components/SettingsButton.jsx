import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import AboutPage from './AboutPage'
import { motion, AnimatePresence } from 'framer-motion'
import { isMuted, setMuted, getVolume, setVolume, playTest } from '../sound/sfx'
import { useSettings, setSetting } from '../settings'
import { isMusicOn, setMusicOn, getMusicVolume, setMusicVolume } from '../sound/music'
import { canSpeak, getEnglishVoices, onVoicesChanged, getVoicePrefs, setVoicePrefs, testVoice } from '../sound/speech'
import { useTheme } from '../context/ThemeContext'
import { THEME_LIST } from '../data/themes'
import ThemeIcon from './ThemeIcon'
import './SettingsButton.css'

// Full screen works on desktop, Android and iPad — not on iPhone Safari,
// so the switch only appears where the browser supports it.
const canFullscreen = typeof document !== 'undefined' && !!document.fullscreenEnabled

function Switch({ on, onClick, label, hint }) {
  return (
    <button className={`sound-toggle ${on ? 'on' : 'off'}`} onClick={onClick} role="switch" aria-checked={on}>
      <span className="sound-toggle-label">
        {label}
        {hint && <small>{hint}</small>}
      </span>
      <span className="sound-switch"><span className="sound-knob" /></span>
    </button>
  )
}

export default function SettingsButton() {
  const [open, setOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [soundOn, setSoundOn] = useState(!isMuted())
  const [vol, setVol] = useState(getVolume())
  const [isFull, setIsFull] = useState(false)
  const [musicOn, setMusicOnState] = useState(isMusicOn())
  const [musicVol, setMusicVol] = useState(getMusicVolume())
  const [voicePrefs, setVoicePrefsState] = useState(getVoicePrefs)
  const [voices, setVoices] = useState(getEnglishVoices)
  useEffect(() => onVoicesChanged(() => { setVoices(getEnglishVoices()); setVoicePrefsState(getVoicePrefs()) }), [])
  const updateVoice = (patch) => { setVoicePrefs(patch); setVoicePrefsState(getVoicePrefs()) }
  const settings = useSettings()
  const { themeId, setThemeId } = useTheme()

  useEffect(() => {
    const onFs = () => setIsFull(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const toggleSound = () => {
    const next = !soundOn
    setSoundOn(next)
    setMuted(!next)
    if (next) playTest()
  }

  const changeVolume = (v) => {
    setVol(v)
    setVolume(v)
  }

  const toggleFullscreen = () => {
    try {
      if (document.fullscreenElement) document.exitFullscreen()
      else document.documentElement.requestFullscreen()
    } catch { /* ignore */ }
  }

  const panel = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="settings-overlay"
          onClick={() => setOpen(false)}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div
            className="settings-panel"
            onClick={e => e.stopPropagation()}
            initial={{ y: 24, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          >
            <h3>⚙️ Settings</h3>

            <section className="settings-section">
              <h4>🔊 Sound</h4>
              <Switch on={soundOn} onClick={toggleSound} label={soundOn ? 'Sound effects on' : 'Sound effects off'} />
              <label className={`settings-volume${soundOn ? '' : ' disabled'}`}>
                <span>🔈</span>
                <input
                  type="range" min="0" max="1" step="0.05" value={vol}
                  disabled={!soundOn}
                  onChange={e => changeVolume(parseFloat(e.target.value))}
                  onPointerUp={() => playTest()}
                  onKeyUp={() => playTest()}
                  aria-label="Volume"
                />
                <span>🔊</span>
              </label>
            </section>

            <section className="settings-section">
              <h4>🎵 Music</h4>
              <Switch
                on={musicOn}
                onClick={() => { const v = !musicOn; setMusicOnState(v); setMusicOn(v) }}
                label={musicOn ? 'Background music on' : 'Background music off'}
                hint="Calm music that changes with each world"
              />
              <label className={`settings-volume${musicOn ? '' : ' disabled'}`}>
                <span>🔈</span>
                <input
                  type="range" min="0" max="1" step="0.05" value={musicVol}
                  disabled={!musicOn}
                  onChange={e => { const v = parseFloat(e.target.value); setMusicVol(v); setMusicVolume(v) }}
                  aria-label="Music volume"
                />
                <span>🔊</span>
              </label>
            </section>

            {canSpeak && (
              <section className="settings-section">
                <h4>🗣️ Reading voice</h4>
                <Switch
                  on={voicePrefs.on}
                  onClick={() => updateVoice({ on: !voicePrefs.on })}
                  label={voicePrefs.on ? 'Read-aloud on' : 'Read-aloud off'}
                  hint="Reads questions in Adventure & Quiz Race"
                />
                <div className={`settings-voice${voicePrefs.on ? '' : ' disabled'}`}>
                  {voices.length > 1 && (
                    <label className="settings-voice-row">
                      <span>Voice</span>
                      <select
                        value={voicePrefs.voiceName || voicePrefs.current}
                        onChange={e => { updateVoice({ voiceName: e.target.value }); setTimeout(testVoice, 50) }}
                      >
                        {voices.map(v => (
                          <option key={v.name} value={v.name}>
                            {v.name.replace(/^(Microsoft|Google)\s+/, '').replace(/\s*-\s*English.*$/, '')} ({v.lang.replace('_', '-')})
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label className="settings-voice-row">
                    <span>Volume</span>
                    <span className="settings-voice-end">🔈</span>
                    <input type="range" min="0" max="1" step="0.05" value={voicePrefs.level ?? 0.4}
                      onChange={e => updateVoice({ level: parseFloat(e.target.value) })}
                      onPointerUp={testVoice} onKeyUp={testVoice} aria-label="Voice volume" />
                    <span className="settings-voice-end">🔊</span>
                  </label>
                  <label className="settings-voice-row">
                    <span>Speed</span>
                    <span className="settings-voice-end">🐢</span>
                    <input type="range" min="0.6" max="1.3" step="0.05" value={voicePrefs.rate}
                      onChange={e => updateVoice({ rate: parseFloat(e.target.value) })}
                      onPointerUp={testVoice} onKeyUp={testVoice} aria-label="Voice speed" />
                    <span className="settings-voice-end">🐇</span>
                  </label>
                  <label className="settings-voice-row">
                    <span>Pitch</span>
                    <span className="settings-voice-end">🐻</span>
                    <input type="range" min="0.6" max="1.6" step="0.05" value={voicePrefs.pitch}
                      onChange={e => updateVoice({ pitch: parseFloat(e.target.value) })}
                      onPointerUp={testVoice} onKeyUp={testVoice} aria-label="Voice pitch" />
                    <span className="settings-voice-end">🐭</span>
                  </label>
                  <div className="settings-voice-btns">
                    <button className="settings-mini-btn" onClick={testVoice}>▶️ Hear it</button>
                    <button className="settings-mini-btn" onClick={() => updateVoice({ rate: 0.9, pitch: 1.1, level: 0.4, voiceName: '' })}>↺ Reset</button>
                  </div>
                </div>
              </section>
            )}

            <section className="settings-section">
              <h4>🌍 World</h4>
              <div className="settings-themes">
                {THEME_LIST.map(t => (
                  <button
                    key={t.id}
                    className={`settings-theme${themeId === t.id ? ' active' : ''}`}
                    onClick={() => setThemeId(t.id)}
                  >
                    <ThemeIcon themeId={t.id} size={30} />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="settings-section">
              <h4>🎨 Colours</h4>
              <div className="settings-colour-presets">
                {[
                  { v: 1,   icon: '🌈', label: 'Full' },
                  { v: 0.4, icon: '🌙', label: 'Calm' },
                  { v: 0,   icon: '⚫', label: 'Black & white' },
                ].map(p => (
                  <button
                    key={p.label}
                    className={`settings-colour-preset${Math.abs(settings.colour - p.v) < 0.03 ? ' active' : ''}`}
                    onClick={() => setSetting('colour', p.v)}
                  >
                    <span>{p.icon}</span>{p.label}
                  </button>
                ))}
              </div>
              <label className="settings-volume">
                <span>⚫</span>
                <input
                  type="range" min="0" max="1" step="0.05" value={settings.colour}
                  onChange={e => setSetting('colour', parseFloat(e.target.value))}
                  aria-label="Colour strength"
                />
                <span>🌈</span>
              </label>
            </section>

            <section className="settings-section">
              <h4>🖥️ Screen</h4>
              {canFullscreen && (
                <Switch on={isFull} onClick={toggleFullscreen} label="Full screen" hint="Great on a tablet" />
              )}
              <Switch
                on={settings.screensaver}
                onClick={() => setSetting('screensaver', !settings.screensaver)}
                label="Screensaver"
                hint="Shows the animated world after 15 s on the menu"
              />
            </section>

            <button className="about-link" onClick={() => { setOpen(false); setAboutOpen(true) }}>
              ℹ️ About · Privacy · Impressum
            </button>

            <button className="close-btn" onClick={() => setOpen(false)}>Done</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      <button className="settings-btn" onClick={() => setOpen(o => !o)} title="Settings">
        <span className="settings-btn-icon">⚙️</span>
        <span>Settings</span>
      </button>
      {typeof document !== 'undefined' && createPortal(panel, document.body)}
      <AboutPage open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  )
}
