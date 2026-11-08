import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import { THEME_LIST } from '../data/themes'
import ThemeIcon from './ThemeIcon'
import './ThemePicker.css'

export default function ThemePicker({ open, onClose }) {
  const { themeId, setThemeId } = useTheme()

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="tp-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            className="tp-panel"
            initial={{ opacity: 0, scale: 0.88, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 18 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          >
            <div className="tp-title">🎨 Choose Your Theme</div>
            <div className="tp-grid">
              {THEME_LIST.map(t => (
                <button
                  key={t.id}
                  className={`tp-opt${themeId === t.id ? ' active' : ''}`}
                  onClick={() => { setThemeId(t.id); onClose() }}
                >
                  <ThemeIcon themeId={t.id} size={36} />
                  <span className="tp-name">{t.label}</span>
                  {themeId === t.id && <span className="tp-check">✓</span>}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
