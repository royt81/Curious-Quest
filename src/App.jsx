import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from './context/ThemeContext'
import { useSettings } from './settings'
import Sidebar from './components/Sidebar'
import BackgroundAnimation from './components/BackgroundAnimation'
import Menu from './components/Menu'
import FoursomesGame from './games/Foursomes/FoursomesGame'
import UnoGame from './games/Uno/UnoGame'
import RaceGame from './games/Race/RaceGame'
import AdventureGame from './games/Adventure/AdventureGame'
import QuizRaceGame from './games/QuizRace/QuizRaceGame'
import CheckersGame from './games/Checkers/CheckersGame'
import ChessGame from './games/Chess/ChessGame'
import DominoGame from './games/Domino/DominoGame'
import BackgammonGame from './games/Backgammon/BackgammonGame'
import MemoryGame from './games/Memory/MemoryGame'
import MahjongGame from './games/Mahjong/MahjongGame'
import BlocksGame from './games/Blocks/BlocksGame'
import DotsBoxesGame from './games/DotsBoxes/DotsBoxesGame'
import SnakesLaddersGame from './games/SnakesLadders/SnakesLaddersGame'
import GameOfLifeGame from './games/GameOfLife/GameOfLifeGame'
import DrawingGame from './games/Drawing/DrawingGame'
import HowToPlay from './components/HowToPlay'
import { HOW_TO_PLAY } from './data/howToPlay'
import './App.css'

const screenVariants = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.25, 0.1, 0.25, 1] } },
  exit:    { opacity: 0, y: -16, transition: { duration: 0.22, ease: 'easeIn' } },
}

const IDLE_MS = 15000 // 15s of no activity → screensaver

// Every game can be opened directly with a link, e.g. …pages.dev/#memory
const GAME_IDS = ['adventure', 'quiz', 'race', 'uno', 'foursomes', 'checkers', 'chess', 'domino',
  'backgammon', 'memory', 'mahjong', 'blocks', 'dotsboxes', 'snakes', 'life', 'draw']
const screenFromHash = () => {
  const id = typeof window !== 'undefined' ? window.location.hash.slice(1) : ''
  return GAME_IDS.includes(id) ? id : 'menu'
}
// These boards only work in landscape: on a phone held upright the whole app is shown sideways
const LANDSCAPE_ONLY = ['adventure', 'quiz']

function App() {
  const [screen, setScreen] = useState(screenFromHash)

  // Keep the address bar in step with the open game (shareable links, browser Back button)
  useEffect(() => {
    const want = screen === 'menu' ? '' : '#' + screen
    if (window.location.hash !== want) {
      history.pushState(null, '', want || window.location.pathname + window.location.search)
    }
    document.body.dataset.landscapeOnly = LANDSCAPE_ONLY.includes(screen) ? 'true' : 'false'
  }, [screen])
  // Scale for games with fixed-size pieces: 1 at laptop size (1366×768), up to 1.6 on big monitors
  useEffect(() => {
    const setZoom = () => {
      const z = Math.min((window.innerWidth - 220) / 1146, window.innerHeight / 768)
      document.documentElement.style.setProperty('--game-zoom', Math.max(1, Math.min(1.6, z)).toFixed(3))
    }
    setZoom()
    window.addEventListener('resize', setZoom)
    return () => window.removeEventListener('resize', setZoom)
  }, [])
  useEffect(() => {
    const onPop = () => setScreen(screenFromHash())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  // Small screens (phones / portrait tablets): start with the menu folded away.
  const isNarrow = () => typeof window !== 'undefined' && window.innerWidth < 900
  const [collapsed, setCollapsed] = useState(isNarrow)
  const [screensaver, setScreensaver] = useState(false)
  const { themeId } = useTheme()
  const timerRef = useRef(null)

  // "How to play": opens by itself the first time each game is visited.
  const [helpOpen, setHelpOpen] = useState(false)
  const goGame = (game) => {
    setScreen(game)
    if (isNarrow()) setCollapsed(true)
    let seen = []
    try { seen = JSON.parse(localStorage.getItem('cq-rules-seen') || '[]') } catch { /* ignore */ }
    if (HOW_TO_PLAY[game] && game !== 'life' && !seen.includes(game)) {
      setTimeout(() => setHelpOpen(true), 500)                 // after the screen slides in
      try { localStorage.setItem('cq-rules-seen', JSON.stringify([...seen, game])) } catch { /* ignore */ }
    }
  }
  const back = () => { setScreen('menu'); setHelpOpen(false) }

  // Screensaver only when: sidebar collapsed, on the menu, and idle.
  const { screensaver: screensaverOn, colour } = useSettings()

  // Colour setting (Settings → Colours): fade the whole game towards black &
  // white, e.g. for calm play before bedtime. No filter at all at full colour.
  // The change fades smoothly (about 1 s) instead of jumping.
  const lastColour = useRef(null)
  useEffect(() => {
    const root = document.documentElement
    const FADE_MS = 1000
    const isChange = lastColour.current !== null && lastColour.current !== colour
    lastColour.current = colour
    if (!isChange) {                              // first load: apply straight away, no fade
      root.style.filter = colour < 0.999 ? `saturate(${colour.toFixed(2)})` : ''
      return undefined
    }
    // A filter can only fade from another filter value, so start from saturate(1)
    if (!root.style.filter) {
      root.style.filter = 'saturate(1)'
      void root.offsetWidth                       // let the browser register the start value
    }
    root.style.transition = `filter ${FADE_MS}ms ease`
    root.style.filter = `saturate(${colour.toFixed(2)})`
    if (colour < 0.999) return undefined
    // Back at full colour: remove the filter entirely once the fade has finished
    const t = setTimeout(() => { root.style.filter = ''; root.style.transition = '' }, FADE_MS + 50)
    return () => clearTimeout(t)
  }, [colour])
  const idleEligible = screensaverOn && collapsed && screen === 'menu'

  useEffect(() => {
    if (!idleEligible) return undefined

    const arm = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setScreensaver(true), IDLE_MS)
    }
    const reset = () => {
      setScreensaver(false) // event-handler callback, not effect body
      arm()
    }
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel', 'scroll']
    events.forEach(e => window.addEventListener(e, reset, { passive: true }))
    arm() // start the countdown without touching state synchronously
    return () => {
      events.forEach(e => window.removeEventListener(e, reset))
      if (timerRef.current) clearTimeout(timerRef.current)
      setScreensaver(false) // reset stale state when leaving idle-eligible mode
    }
  }, [idleEligible])

  // Only show the screensaver while still eligible (guards stale state).
  const showScreensaver = screensaver && idleEligible

  return (
    <div className={`app-layout ${showScreensaver ? 'screensaver-active' : ''}`} data-theme={themeId}>
      <BackgroundAnimation />
      <Sidebar
        activeGame={screen !== 'menu' ? screen : null}
        onSelect={goGame}
        onHome={back}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed(c => !c)}
        onHelp={HOW_TO_PLAY[screen] ? () => setHelpOpen(true) : null}
      />
      <HowToPlay gameId={screen} open={helpOpen && !!HOW_TO_PLAY[screen]} onClose={() => setHelpOpen(false)} />
      <main className="app-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}
          >
            {screen === 'adventure'  && <AdventureGame  onBack={back} />}
            {screen === 'quiz'       && <QuizRaceGame   onBack={back} />}
            {screen === 'race'       && <RaceGame       mode="ai" onBack={back} />}
            {screen === 'uno'        && <UnoGame        mode="ai" onBack={back} />}
            {screen === 'foursomes'  && <FoursomesGame  mode="ai" onBack={back} />}
            {screen === 'checkers'   && <CheckersGame   onBack={back} />}
            {screen === 'chess'      && <ChessGame      onBack={back} />}
            {screen === 'domino'     && <DominoGame     onBack={back} />}
            {screen === 'backgammon' && <BackgammonGame onBack={back} />}
            {screen === 'memory'     && <MemoryGame     onBack={back} />}
            {screen === 'mahjong'    && <MahjongGame    onBack={back} />}
            {screen === 'blocks'     && <BlocksGame     onBack={back} />}
            {screen === 'dotsboxes'  && <DotsBoxesGame  onBack={back} />}
            {screen === 'snakes'     && <SnakesLaddersGame onBack={back} />}
            {screen === 'life'       && <GameOfLifeGame  onBack={back} />}
            {screen === 'draw'       && <DrawingGame     onBack={back} />}
            {screen === 'menu'       && <Menu onSelect={goGame} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App
