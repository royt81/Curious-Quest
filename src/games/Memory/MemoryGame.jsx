import { useState, useEffect, useCallback, useRef } from 'react'
import { useTheme } from '../../context/ThemeContext'
import ThemeIcon from '../../components/ThemeIcon'
import './Memory.css'
import { playCard, playMatch, playWin } from '../../sound/sfx'

// ── Board sizes ───────────────────────────────────────────────────────────────
const BOARD_SIZES = {
  16: { cols: 4, pairs: 8  },
  24: { cols: 6, pairs: 12 },
}
const DEFAULT_SIZE = 16

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── 12 fully-opaque SVG symbols, each with its own accent colour ──────────────
const SYMBOLS = [
  {
    id: 'star',
    color: '#f5c518',
    bg: '#1a1200',
    svg: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
  },
  {
    id: 'heart',
    color: '#e8365d',
    bg: '#1a0009',
    svg: <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />,
  },
  {
    id: 'diamond',
    color: '#38d4f5',
    bg: '#001a22',
    svg: <path d="M12 2L2 9l10 13L22 9z" />,
  },
  {
    id: 'moon',
    color: '#c49ef5',
    bg: '#0e0019',
    svg: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  },
  {
    id: 'bolt',
    color: '#f5e318',
    bg: '#1a1700',
    svg: <path d="M13 2L3 14h9l-1 8 10-12h-9z" />,
  },
  {
    id: 'sun',
    color: '#f5882a',
    bg: '#1a0800',
    svg: (
      <g>
        <circle cx="12" cy="12" r="5" />
        {[0,45,90,135,180,225,270,315].map((deg, i) => {
          const r = Math.PI * deg / 180
          return <line key={i} x1={12 + 8*Math.cos(r)} y1={12 + 8*Math.sin(r)}
                        x2={12 + 11*Math.cos(r)} y2={12 + 11*Math.sin(r)}
                        strokeWidth="2" strokeLinecap="round" />
        })}
      </g>
    ),
  },
  {
    id: 'flower',
    color: '#f576c8',
    bg: '#1a0013',
    svg: (
      <g>
        <circle cx="12" cy="12" r="3" />
        {[0,60,120,180,240,300].map((deg, i) => {
          const r = Math.PI * deg / 180
          return <ellipse key={i} cx={12 + 4.5*Math.cos(r)} cy={12 + 4.5*Math.sin(r)} rx="2.8" ry="1.8"
                          transform={`rotate(${deg} ${12 + 4.5*Math.cos(r)} ${12 + 4.5*Math.sin(r)})`} />
        })}
      </g>
    ),
  },
  {
    id: 'crown',
    color: '#f5ac18',
    bg: '#1a0e00',
    svg: <path d="M3 18h18v2H3zm0-2l3-8 3.5 5L12 6l2.5 7L18 8l3 8z" />,
  },
  {
    id: 'leaf',
    color: '#3fd97a',
    bg: '#001a0d',
    svg: <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1.02-2.39C8.5 21 10.24 22 12 22c6 0 10-4.5 10-10S12 2 12 2s.83 6-5 6z" />,
  },
  {
    id: 'drop',
    color: '#4292f5',
    bg: '#000f1a',
    svg: <path d="M12 2C6 10 4 14 4 17a8 8 0 0 0 16 0c0-3-2-7-8-15z" />,
  },
  {
    id: 'bell',
    color: '#f5d418',
    bg: '#1a1500',
    svg: <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />,
  },
  {
    id: 'music',
    color: '#a95ef5',
    bg: '#0d0019',
    svg: <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3z" />,
  },
]

// ── Theme-specific image symbols ───────────────────────────────────────────────
// For each theme, 12 painted pictures (.png) in its public/themes/<Folder> directory
// are the card images.
// Helper to build a symbol entry for a given theme folder/file with shared colours.
function img(folder, file, color, bg) {
  return { id: `${folder}-${file}`.replace(/[^a-zA-Z0-9]/g, ''), color, bg, image: `/themes/${folder}/${/\.\w+$/.test(file) ? file : file + '.svg'}` }
}

const ROBOT_IMAGE_SYMBOLS = [
  'head-rusty.png', 'head-pixel.png', 'head-dot.png', 'mem-robodog.png',
  'mem-arm.png', 'mem-drone.png', 'mem-chip.png', 'mem-gear.png',
  'mem-battery.png', 'mem-windup.png', 'mem-magnet.png', 'mem-vacuum.png',
].map(f => img('Robots', f, '#8ae0ff', '#0a1c2e'))

const DINO_IMAGE_SYMBOLS = [
  'head-spino.png', 'head-para.png', 'head-trice.png', 'trex.png',
  'stego.png', 'ptero.png', 'egg.png', 'ankylo.png',
  'brachio.png', 'mem-raptor.png', 'mem-ammonite.png', 'mem-volcano.png',
].map(f => img('Dino', f, '#ffcf80', '#2e1c00'))

const ANIMALS_IMAGE_SYMBOLS = [
  'head-buffalo.png', 'head-sloth.png', 'head-gorilla.png', 'mem-raccoon.png',
  'mem-koala.png', 'mem-owl.png', 'mem-giraffe.png', 'mem-tiger.png',
  'mem-parrot.png', 'mem-kangaroo.png', 'mem-bee.png', 'mem-walrus.png',
].map(f => img('Animals', f, '#ffd966', '#2e2200'))

const SPACE_IMAGE_SYMBOLS = [
  'head-rover.png', 'head-alien.png', 'head-shuttle.png', 'mem-astronaut.png',
  'mem-rocket.png', 'mem-ufo.png', 'mem-saturn.png', 'mem-moon.png',
  'mem-earth.png', 'mem-satellite.png', 'mem-station.png', 'mem-comet.png',
].map(f => img('Space', f, '#9fd1ff', '#001830'))

const SEA_IMAGE_SYMBOLS = [
  'head-stingray.png', 'head-marlin.png', 'head-anglerfish.png', 'mem-octopus.png',
  'mem-crab.png', 'mem-dolphin.png', 'mem-turtle.png', 'mem-seahorse.png',
  'mem-puffer.png', 'mem-shark.png', 'mem-clownfish.png', 'mem-submarine.png',
].map(f => img('Underwater', f, '#ffb39e', '#2e0f06'))

// Map theme id -> image symbol pool
const THEME_IMAGE_SYMBOLS = {
  animals:   ANIMALS_IMAGE_SYMBOLS,
  dinosaurs: DINO_IMAGE_SYMBOLS,
  space:     SPACE_IMAGE_SYMBOLS,
  robots:    ROBOT_IMAGE_SYMBOLS,
  sea:       SEA_IMAGE_SYMBOLS,
}

// Render one crisp SVG symbol (or an image-based symbol)
function SymbolIcon({ symbol, size = '58%' }) {
  if (symbol.image) {
    return (
      <img
        src={symbol.image}
        alt={symbol.id}
        style={{ width: size, height: size, objectFit: 'contain', display: 'block', flexShrink: 0 }}
      />
    )
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width={size} height={size}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0, overflow: 'visible' }}
      fill={symbol.color}
      stroke={symbol.color}
      strokeWidth="0"
    >
      {symbol.svg}
    </svg>
  )
}

// Build deck using a pool of symbols (theme-aware extras may be mixed in)
function buildDeck(size, pool) {
  const cfg = BOARD_SIZES[size] || BOARD_SIZES[DEFAULT_SIZE]
  // New painted pictures (.png) always come first; the older icons only fill up the rest
  const isNew = s => /\.png$/.test(s.image ?? '')
  const chosen = shuffle([...shuffle(pool.filter(isNew)), ...shuffle(pool.filter(s => !isNew(s)))].slice(0, cfg.pairs))
  const cards = []
  chosen.forEach((sym, i) => {
    // snapshot the full symbol on the card so the tiles stay fixed even if the
    // theme is switched mid-game (only the background follows the theme).
    cards.push({ id: `c-${i}-a`, symbolId: sym.id, symbol: sym })
    cards.push({ id: `c-${i}-b`, symbolId: sym.id, symbol: sym })
  })
  return shuffle(cards)
}

function starsFor(moves, pairs) {
  if (moves <= pairs + 2) return 3
  if (moves <= pairs + 7) return 2
  return 1
}

export default function MemoryGame({ onBack }) {
  const { themeId } = useTheme()
  const [size, setSize]       = useState(DEFAULT_SIZE)
  const [boardThemeId, setBoardThemeId] = useState(themeId) // frozen at game start
  const [cards, setCards]     = useState([])
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState([])
  const [moves, setMoves]     = useState(0)
  const [locked, setLocked]   = useState(false)

  const cfg = BOARD_SIZES[size] || BOARD_SIZES[DEFAULT_SIZE]

  // Prefer the theme's own image set; only top up with the generic icon set
  // if the theme doesn't have enough images to fill the board on its own.
  const themeImages = THEME_IMAGE_SYMBOLS[themeId] || []
  const symbolPool = themeImages.length >= cfg.pairs ? themeImages : [...themeImages, ...SYMBOLS]
  const symbolMap = Object.fromEntries(symbolPool.map(s => [s.id, s]))

  // Keep the latest theme pool in a ref so starting a NEW game always uses the
  // current theme, while initGame itself stays unkeyed on themeId (so changing
  // theme mid-game never reshuffles/resets the board in progress).
  const latestRef = useRef({ symbolPool, themeId })
  latestRef.current = { symbolPool, themeId }

  const initGame = useCallback(() => {
    setCards(buildDeck(size, latestRef.current.symbolPool))
    setBoardThemeId(latestRef.current.themeId)
    setFlipped([])
    setMatched([])
    setMoves(0)
    setLocked(false)
    // Intentionally NOT keyed on themeId — switching theme mid-game should only
    // change the background, never reshuffle/reset the board.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size])

  useEffect(() => { initGame() }, [initGame])

  const totalPairs = cfg.pairs
  const pairsFound = matched.length / 2
  const won = cards.length > 0 && matched.length === cards.length

  const handleFlip = (idx) => {
    if (locked) return
    if (flipped.includes(idx) || matched.includes(idx)) return
    if (flipped.length === 2) return

    const next = [...flipped, idx]
    playCard()
    setFlipped(next)

    if (next.length === 2) {
      setMoves(m => m + 1)
      setLocked(true)
      const [a, b] = next
      if (cards[a].symbolId === cards[b].symbolId) {
        setTimeout(() => {
          if (matched.length + 2 === cards.length) playWin(); else playMatch()
          setMatched(prev => [...prev, a, b])
          setFlipped([])
          setLocked(false)
        }, 600)
      } else {
        setTimeout(() => {
          setFlipped([])
          setLocked(false)
        }, 950)
      }
    }
  }

  const stars = starsFor(moves, totalPairs)

  return (
    <div className="memory-screen screen">
      <div className="game-header">
        <button className="btn btn-secondary back-btn" onClick={onBack}>← Back</button>
        <h2><span style={{ display: 'inline-flex', verticalAlign: '-0.2em' }}><ThemeIcon themeId={themeId} size={28} /></span> Memory</h2>
        <div className="scores">
          <span className="score p1">🔄 {moves} moves</span>
          <span className="score p2">✅ {pairsFound}/{totalPairs} pairs</span>
        </div>
        <div className="memory-size-toggle" role="group" aria-label="Board size">
          {[16, 24].map(s => (
            <button
              key={s}
              type="button"
              className={`memory-size-btn ${size === s ? 'is-active' : ''}`}
              onClick={() => setSize(s)}
              aria-pressed={size === s}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {won ? (
        <div className="gameover">
          <div className="gameover-emoji">🏆</div>
          <h2>You did it!</h2>
          <p>You found all {totalPairs} pairs in {moves} moves!</p>
          <div className="memory-stars" aria-label={`${stars} out of 3 stars`}>
            {[0, 1, 2].map(i => (
              <span key={i} className={`memory-star ${i < stars ? 'on' : 'off'}`}>
                {i < stars ? '⭐' : '☆'}
              </span>
            ))}
          </div>
          <div className="gameover-btns">
            <button className="btn btn-primary" onClick={initGame}>Play Again</button>
            <button className="btn btn-secondary" onClick={onBack}>Menu</button>
          </div>
        </div>
      ) : (
        <div className="memory-play">
          <div
            className={`memory-grid memory-grid-${size}`}
            style={{ gridTemplateColumns: `repeat(${cfg.cols}, 1fr)` }}
          >
            {cards.map((card, idx) => {
              const isUp      = flipped.includes(idx) || matched.includes(idx)
              const isMatched = matched.includes(idx)
              const sym       = card.symbol || symbolMap[card.symbolId]
              return (
                <button
                  key={card.id}
                  type="button"
                  className={`memory-card ${isUp ? 'is-up' : ''} ${isMatched ? 'is-matched' : ''}`}
                  onClick={() => handleFlip(idx)}
                  disabled={isUp || locked}
                  aria-label={isUp ? sym.id : 'face-down card'}
                  style={isUp ? { '--sym-bg': sym.bg, '--sym-color': sym.color } : undefined}
                >
                  <span className="memory-card-face">
                    {isUp
                      ? <SymbolIcon symbol={sym} />
                      : <span className="memory-back-icon"><ThemeIcon themeId={boardThemeId} size="100%" /></span>}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="turn-banner">
            {flipped.length === 1 ? 'Find the matching card!' : 'Tap two cards to find a pair!'}
          </div>
        </div>
      )}
    </div>
  )
}
