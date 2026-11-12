import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import ThemeIcon from './ThemeIcon'
import ThemePicker from './ThemePicker'
import AboutPage from './AboutPage'
import { useT } from '../i18n'
import './Menu.css'

// Game list for the main menu. Each game shows ONE clear icon (matching the
// sidebar), a title and a short description — no more cluttered emoji collages.
const GAMES = [
  {
    id: 'adventure',
    name: 'Adventure!',
    emoji: '🗺️',
    desc: 'Roll the dice and race to the trophy — answer questions to zoom ahead!',
    color: 'var(--game-color-4, #10b981)',
  },
  {
    id: 'quiz',
    name: 'Quiz Race',
    emoji: '🧮',
    desc: 'Answer number and letter questions to race to the finish!',
    color: 'var(--game-color-1, #f59e0b)',
  },
  {
    id: 'race',
    name: 'Race',
    emoji: '🏁',
    image: '/other-icons/race.svg',
    desc: 'Draw cards and race to the finish line!',
    color: 'var(--game-color-3, #ec4899)',
  },
  {
    id: 'draw',
    name: 'Draw & Paint',
    emoji: '🎨',
    desc: 'Draw your own pictures or colour in your favourite characters!',
    color: 'var(--game-color-3, #ec4899)',
  },
  {
    id: 'memory',
    name: 'Memory',
    emoji: '🧠',
    desc: 'Flip cards and find matching pairs — train your memory!',
    color: 'var(--game-color-1, #f59e0b)',
  },
  {
    id: 'mahjong',
    name: 'Mahjong',
    emoji: '🀄',
    desc: 'Find two free tiles with the same picture and clear the whole pile!',
    color: 'var(--game-color-4, #10b981)',
  },
  {
    id: 'blocks',
    name: 'Calm Blocks',
    emoji: '🧱',
    desc: 'Turn and stack the falling blocks to fill whole rows — nice and slow.',
    color: 'var(--game-color-2, #6366f1)',
  },
  {
    id: 'uno',
    name: 'Colour Clash',
    emoji: '🎴',
    desc: 'Match colors and numbers — first to empty your hand wins!',
    color: 'var(--game-color-2, #6366f1)',
  },
  {
    id: 'checkers',
    name: 'Checkers',
    emoji: '🔴',
    desc: 'Jump and capture — crown your kings and clear the board!',
    color: 'var(--game-color-3, #ec4899)',
  },
  {
    id: 'chess',
    name: 'Chess',
    emoji: '♟️',
    desc: 'Move your pieces, capture the king — checkmate to win!',
    color: 'var(--game-color-2, #6366f1)',
  },
  {
    id: 'domino',
    name: 'Domino',
    emoji: '🁫',
    image: '/domino/2-3.svg',
    desc: 'Match the ends and empty your hand to win!',
    color: 'var(--game-color-2, #6366f1)',
  },
  {
    id: 'backgammon',
    name: 'Backgammon',
    emoji: '🎲',
    desc: 'Roll the dice, race your checkers home, and bear off to win!',
    color: 'var(--game-color-4, #10b981)',
  },
  {
    id: 'dotsboxes',
    name: 'Dots & Boxes',
    emoji: '⬛',
    desc: 'Draw lines, close boxes, and claim the most — perfect for travelling!',
    color: 'var(--game-color-2, #6366f1)',
  },
  {
    id: 'life',
    name: 'Game of Life',
    emoji: '🔬',
    desc: 'Tap cells to make patterns, press play, and watch them grow and change!',
    color: 'var(--game-color-4, #10b981)',
  },
  {
    id: 'snakes',
    name: 'Snakes & Ladders',
    emoji: '🐍',
    image: '/other-icons/snake.svg',
    desc: 'Climb the ladders, dodge the snakes, and race to square 100!',
    color: 'var(--game-color-3, #ec4899)',
  },
]

const containerVariants = {
  animate: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
}

const cardVariants = {
  initial: { opacity: 0, y: 40, scale: 0.93 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.42, ease: [0.25, 0.1, 0.25, 1] } },
}

export default function Menu({ onSelect }) {
  const { theme, themeId } = useTheme()
  const [showPicker, setShowPicker] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const t = useT()
  const worldName = t(theme.world)

  return (
    <div className="menu-screen screen">
      <ThemePicker open={showPicker} onClose={() => setShowPicker(false)} />
      <motion.div
        className="menu-title"
        initial={{ opacity: 0, y: -22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <img className="menu-brand-logo" src="/logo.webp" alt="Curious Quest" />
        <button
          className="menu-theme-btn"
          onClick={() => setShowPicker(p => !p)}
          title={t('Change theme')}
        >
          {/* Same wordmark style for every world: icon + name in the logo's colours */}
          <span className="menu-title-emoji"><ThemeIcon themeId={themeId} size={56} /></span>
          <span className="menu-world" aria-label={worldName}>
            {worldName.split(' ').map((w, i, all) => (
              <span key={i} className={i === all.length - 1 ? 'mw-last' : 'mw-first'}>{w}{i < all.length - 1 ? ' ' : ''}</span>
            ))}
          </span>
        </button>
        <p className="menu-subtitle">{t('Choose a game to play')}</p>
      </motion.div>

      <motion.div
        className="game-grid"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        {GAMES.map(g => (
          <motion.button
            key={g.id}
            className="game-card glass-panel"
            variants={cardVariants}
            whileHover={{ y: -8, scale: 1.03, transition: { duration: 0.2, ease: 'easeOut' } }}
            whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
            onClick={() => onSelect?.(g.id)}
          >
            <div className="game-card-icon" style={{ '--card-color': g.color }}>
              <span className="game-card-icon-glow" />
              {g.image
                ? <img className="game-card-icon-img" src={g.image} alt="" />
                : <span className="game-card-icon-emoji">{g.emoji}</span>}
            </div>
            <div className="game-card-body">
              <span className="game-card-title">{t(g.name)}</span>
              <span className="game-card-desc">{t(g.desc)}</span>
            </div>
          </motion.button>
        ))}
      </motion.div>

      <footer className="menu-footer">
        <button className="about-link" onClick={() => setShowAbout(true)}>
          {t('About · Privacy · Impressum')}
        </button>
      </footer>
      <AboutPage open={showAbout} onClose={() => setShowAbout(false)} />
    </div>
  )
}
