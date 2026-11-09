import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import { THEME_LIST } from '../data/themes'
import ThemeIcon from './ThemeIcon'
import { useT } from '../i18n'
import './ThemePicker.css'

export default function ThemePicker({ open, onClose }) {
  const { themeId, setThemeId } = useTheme()
  const t = useT()

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
            <div className="tp-title">🎨 {t('Choose Your Theme')}</div>
            <div className="tp-grid">
              {THEME_LIST.map(w => (
                <button
                  key={w.id}
                  className={`tp-opt${themeId === w.id ? ' active' : ''}`}
                  onClick={() => { setThemeId(w.id); onClose() }}
                >
                  <ThemeIcon themeId={w.id} size={36} />
                  <span className="tp-name">{t(w.label)}</span>
                  {themeId === w.id && <span className="tp-check">✓</span>}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
