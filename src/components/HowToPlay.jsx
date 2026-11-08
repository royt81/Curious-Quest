import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HOW_TO_PLAY, spokenRules } from '../data/howToPlay'
import { speakSteps, stopSpeaking, canSpeak } from '../sound/speech'
import './HowToPlay.css'

// The "How to play" window for any game (see data/howToPlay.js for the texts).
export default function HowToPlay({ gameId, open, onClose }) {
  const info = HOW_TO_PLAY[gameId]

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); stopSpeaking() }
  }, [open, onClose])

  if (typeof document === 'undefined') return null
  return createPortal(
    <AnimatePresence>
      {open && info && (
        <motion.div className="htp-overlay" onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="htp-panel" onClick={e => e.stopPropagation()} role="dialog" aria-label={`How to play ${info.title}`}
            initial={{ y: 30, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}>
            <div className="htp-head">
              <h3>❓ How to play {info.title}</h3>
              {canSpeak && (
                <button className="htp-listen" title="Read it to me"
                  onClick={() => speakSteps([{ text: spokenRules(info) }], null, { force: true })}>
                  🔊
                </button>
              )}
            </div>
            <p className="htp-goal">🎯 {info.goal}</p>
            <ol className="htp-steps">
              {info.steps.map(([icon, text], i) => (
                <li key={i}><span className="htp-icon">{icon}</span><span>{text}</span></li>
              ))}
            </ol>
            {info.tip && <p className="htp-tip">💡 {info.tip}</p>}
            <button className="btn btn-primary htp-ok" onClick={onClose}>Let's play!</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

// Sidebar button (same look as the Settings button, also when collapsed).
export function HowToPlayButton({ onClick }) {
  return (
    <button className="settings-btn htp-btn" onClick={onClick} title="How to play">
      <span className="settings-btn-icon">❓</span>
      <span>How to play</span>
    </button>
  )
}
