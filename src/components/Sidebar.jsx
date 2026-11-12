import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import { THEME_LIST } from '../data/themes'
import ThemeIcon from './ThemeIcon'
import SettingsButton from './SettingsButton'
import { HowToPlayButton } from './HowToPlay'
import { useSettings, setSetting } from '../settings'
import { useT } from '../i18n'
import './Sidebar.css'

const SECTIONS = [
  {
    id: null,
    games: [
      { id: 'adventure',  name: 'Adventure!',       emoji: '🗺️' },
      { id: 'quiz',       name: 'Quiz Race',         emoji: '🧮' },
      { id: 'memory',     name: 'Memory',            emoji: '🧠' },
      { id: 'mahjong',    name: 'Mahjong',           emoji: '🀄' },
      { id: 'blocks',     name: 'Calm Blocks',       emoji: '🧱' },
      { id: 'dotsboxes',  name: 'Dots & Boxes',      emoji: '⬛' },
      { id: 'draw',       name: 'Draw & Paint',      emoji: '🎨' },
    ],
  },
  {
    id: 'classic',
    label: 'Game Box',
    icon: '/other-icons/game-chest.svg',
    collapsible: true,
    games: [
      { id: 'checkers',   name: 'Checkers',         emoji: '🔴' },
      { id: 'chess',      name: 'Chess',            emoji: '♟️' },
      { id: 'domino',     name: 'Domino',           emoji: '🁫', image: '/domino/2-3.svg' },
      { id: 'backgammon', name: 'Backgammon',       emoji: '🎲' },
      { id: 'snakes',     name: 'Snakes & Ladders', emoji: '🐍', image: '/other-icons/snake.svg' },
      { id: 'uno',        name: 'Colour Clash',      emoji: '🎴' },
      { id: 'race',       name: 'Race',             emoji: '🏁', image: '/other-icons/race.svg' },
      { id: 'life',       name: 'Game of Life',     emoji: '🔬' },
    ],
  },
]

const ALL_GAMES = SECTIONS.flatMap(s => s.games)

// Quick colour switch (same setting as Settings → Colours)
const COLOUR_PRESETS = [
  { v: 1,   icon: '🌈', label: 'Full colour' },
  { v: 0.4, icon: '🌙', label: 'Calm colours' },
  { v: 0,   icon: '◐', label: 'Black & white' },
]
const Icon = ({ p }) => p.v === 0
  ? <span style={{ fontSize: '1.45em', lineHeight: 1, display: 'inline-block', transform: 'translateY(-1px)' }}>{p.icon}</span>
  : p.icon
const nearest = (c) => COLOUR_PRESETS.reduce((a, p) => Math.abs(p.v - c) < Math.abs(a.v - c) ? p : a)

function ColourQuick({ compact }) {
  const { colour } = useSettings()
  const t = useT()
  const current = nearest(colour)
  if (compact) {
    const next = COLOUR_PRESETS[(COLOUR_PRESETS.indexOf(current) + 1) % COLOUR_PRESETS.length]
    return (
      <button className="sb-colour-cycle" onClick={() => setSetting('colour', next.v)}
        title={t('Colours: {now} (tap for {next})', { now: t(current.label), next: t(next.label) })}>
        <Icon p={current} />
      </button>
    )
  }
  return (
    <div className="sb-colour-row" role="group" aria-label={t('Colours')}>
      {COLOUR_PRESETS.map(p => (
        <button key={p.v}
          className={`sb-colour-btn${Math.abs(colour - p.v) < 0.03 ? ' active' : ''}`}
          onClick={() => setSetting('colour', p.v)} title={t(p.label)} aria-label={t(p.label)}>
          <Icon p={p} />
        </button>
      ))}
    </div>
  )
}

export default function Sidebar({ activeGame, onSelect, onHome, collapsed, onToggleCollapsed, onHelp }) {
  const [openSections, setOpenSections] = useState({})
  const [showPicker, setShowPicker] = useState(false)
  const { themeId, setThemeId } = useTheme()
  const t = useT()

  const toggleSection = (id) =>
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <motion.aside
      className={`sidebar ${collapsed ? 'collapsed' : ''}`}
      animate={{ width: collapsed ? 56 : 200 }}
      transition={{ type: 'spring', stiffness: 340, damping: 30 }}
    >
      <button
        className="sidebar-toggle"
        onClick={onToggleCollapsed}
        title={collapsed ? t('Expand') : t('Collapse')}
      >
        <motion.svg
          viewBox="0 0 24 24" width="16" height="16"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          style={{ display: 'block' }}
        >
          <polyline points="9 6 15 12 9 18" />
        </motion.svg>
      </button>

      <AnimatePresence mode="wait">
        {!collapsed ? (
          <motion.div
            key="expanded"
            className="sidebar-inner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.1, duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            {/* Logo row */}
            <div className="sidebar-logo">
              <button
                className="sidebar-theme-icon-btn"
                onClick={() => setShowPicker(p => !p)}
                title={t('Change theme')}
              >
                <motion.span
                  className="sidebar-logo-emoji"
                  animate={{ rotate: showPicker ? 20 : 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <ThemeIcon themeId={themeId} size={30} />
                </motion.span>
              </button>
              <button className="sidebar-home-btn" onClick={onHome} title={t('Back to menu')}>
                <span className="sidebar-logo-text">Curious Quest</span>
              </button>
            </div>

            {/* Inline theme picker */}
            <AnimatePresence initial={false}>
              {showPicker && (
                <motion.div
                  className="sb-theme-panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="sb-theme-label">{t('Theme')}</div>
                  {THEME_LIST.map(w => (
                    <button
                      key={w.id}
                      className={`sb-theme-item${themeId === w.id ? ' active' : ''}`}
                      onClick={() => { setThemeId(w.id); setShowPicker(false) }}
                    >
                      <ThemeIcon themeId={w.id} size={20} />
                      <span className="sb-theme-name">{t(w.label)}</span>
                      {themeId === w.id && <span className="sb-theme-check">✓</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Game nav — flex: 1 pushes settings to the bottom */}
            <nav className="sidebar-nav">
              {SECTIONS.map(section => {
                const isCollapsible = section.collapsible
                const isOpen = !isCollapsible || openSections[section.id]
                return (
                  <div key={section.id ?? 'main'} className="sidebar-section">
                    {isCollapsible ? (
                      <button
                        className={`sidebar-group-toggle ${isOpen ? 'open' : ''}`}
                        onClick={() => toggleSection(section.id)}
                      >
                        <span className="sidebar-item-emoji">
                          {section.icon
                            ? <img src={section.icon} alt="" style={{ width: '1.2em', height: '1.2em', objectFit: 'contain', display: 'block' }} />
                            : null}
                        </span>
                        <span className="sidebar-group-name">{t(section.label)}</span>
                        <motion.svg
                          className="sidebar-group-chevron"
                          viewBox="0 0 24 24" width="14" height="14"
                          fill="none" stroke="currentColor" strokeWidth="2.5"
                          strokeLinecap="round" strokeLinejoin="round"
                          animate={{ rotate: isOpen ? 90 : 0 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        >
                          <polyline points="9 6 15 12 9 18" />
                        </motion.svg>
                      </button>
                    ) : (
                      section.label && (
                        <div className="sidebar-section-label">{t(section.label)}</div>
                      )
                    )}

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="games"
                          initial={isCollapsible ? { height: 0, opacity: 0 } : false}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          {section.games.map(g => (
                            <motion.button
                              key={g.id}
                              className={`sidebar-item ${isCollapsible ? 'sidebar-item-nested' : ''} ${activeGame === g.id ? 'active' : ''}`}
                              onClick={() => onSelect?.(g.id)}
                              whileHover={{ x: 4 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              <span className="sidebar-item-emoji">
                                {g.image
                                  ? <img src={g.image} alt="" style={{ width: '1.2em', height: '1.2em', objectFit: 'contain', display: 'block' }} />
                                  : g.emoji}
                              </span>
                              <span className="sidebar-item-name">{t(g.name)}</span>
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </nav>

            {/* Settings pinned to the bottom */}
            <div className="sidebar-settings">
              {onHelp && <HowToPlayButton onClick={onHelp} />}
              <SettingsButton />
              <ColourQuick />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            className="sidebar-icons"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.1, duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            {ALL_GAMES.map(g => (
              <motion.button
                key={g.id}
                className={`sidebar-icon-btn ${activeGame === g.id ? 'active' : ''}`}
                onClick={() => onSelect?.(g.id)}
                title={t(g.name)}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.95 }}
              >
                {g.image
                  ? <img src={g.image} alt="" style={{ width: '1.3rem', height: '1.3rem', objectFit: 'contain', display: 'block' }} />
                  : g.emoji}
              </motion.button>
            ))}
            <div className="sidebar-icon-settings">
              {onHelp && <HowToPlayButton onClick={onHelp} />}
              <SettingsButton />
              <ColourQuick compact />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  )
}
