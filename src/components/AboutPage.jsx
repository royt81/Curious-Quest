import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LEGAL } from '../data/legal'
import './HowToPlay.css'
import './AboutPage.css'

// About, privacy and legal notice (Impressum) in one window.
export default function AboutPage({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (typeof document === 'undefined') return null
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="htp-overlay" onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="htp-panel about-panel" onClick={e => e.stopPropagation()}
            role="dialog" aria-label="About, privacy and legal notice"
            initial={{ y: 30, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}>

            <h3>🦊 About Curious Quest</h3>
            <p>
              Curious Quest is a free collection of games for curious kids, made by a dad for his child.
              There are <b>no ads, no purchases and no accounts</b>, and the game does not collect any personal data.
            </p>

            <h4>🔒 Privacy / Datenschutz</h4>
            <ul className="about-list">
              <li><b>Nothing leaves your device.</b> Your settings, chosen world and high scores are saved only in
                this browser (local storage). You can delete them at any time by clearing this site's data in your browser.</li>
              <li><b>No cookies, no tracking, no analytics, no advertising.</b> The game makes no requests to other companies:
                fonts, pictures and sounds are all delivered with the game itself.</li>
              <li><b>Reading voice:</b> spoken texts use the voice built into your device. Nothing is recorded.</li>
              <li><b>Hosting:</b> the website is delivered by {LEGAL.hosting}. Like every web server, it briefly processes
                technical data such as your IP address to deliver the pages and protect them from attacks
                (legitimate interest, Art. 6(1)(f) GDPR). We do not see or store this data.</li>
              <li>You have the right to information, correction, deletion and to complain to a data protection
                supervisory authority. Questions: {LEGAL.email}</li>
            </ul>
            <p><a href="/privacy.html" target="_blank" rel="noreferrer">Full privacy policy (web page)</a></p>

            <h4>🎨 Credits</h4>
            <ul className="about-list">
              <li>Characters and Memory pictures: created for Curious Quest with AI image tools (Canva, FLUX.2).</li>
              <li>Some icons and colouring outlines: <a href="https://www.flaticon.com" target="_blank" rel="noreferrer">Flaticon</a> (licensed).</li>
              <li>Sound effects: ZzFX by Frank Force (MIT licence). Fonts: Nunito, Fredoka, Gloria Hallelujah (SIL Open Font Licence).</li>
            </ul>

            <h4>📄 Legal notice / Impressum</h4>
            <p className="about-address">
              Angaben gemäß § 5 DDG und § 18 MStV:<br />
              {LEGAL.name}<br />
              {LEGAL.street}<br />
              {LEGAL.city}<br />
              {LEGAL.country}<br />
              E-Mail: {LEGAL.email}
            </p>

            <button className="btn btn-primary htp-ok" onClick={onClose}>Back to the games</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
