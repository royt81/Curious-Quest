import { useReducer, useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { playTap, playMatch, playWin, playMove } from '../../sound/sfx'
import { useT } from '../../i18n'
import {
  LEVELS, fallDelay, emptyBoard, makeBag, spawn, collides,
  tryMove, tryRotate, dropPosition, lockPiece, fullRows, removeRows,
} from './blocksLogic'
import './Blocks.css'

// Soft, world-matching colours for the pieces (one per shape)
const PALETTES = {
  animals:   ['#9ccc65', '#ffd54f', '#ffab91', '#80cbc4', '#ce93d8', '#bcaaa4', '#90caf9'],
  dinosaurs: ['#ffb74d', '#aed581', '#e6c07b', '#ff8a65', '#c5e1a5', '#bcaaa4', '#ffe082'],
  space:     ['#9fa8da', '#b39ddb', '#81d4fa', '#f48fb1', '#ffe082', '#80deea', '#ce93d8'],
  robots:    ['#90a4ae', '#80deea', '#a5d6a7', '#ffcc80', '#b0bec5', '#9fa8da', '#ef9a9a'],
  sea:       ['#80deea', '#4dd0e1', '#a5d6a7', '#ffab91', '#b2ebf2', '#9fa8da', '#ffe0b2'],
}

const BEST_KEY = 'cq-blocks-best'
const loadBest = () => { try { return JSON.parse(localStorage.getItem(BEST_KEY)) || {} } catch { return {} } }
const saveBest = (b) => { try { localStorage.setItem(BEST_KEY, JSON.stringify(b)) } catch { /* ignore */ } }

// ── State ────────────────────────────────────────────────────────────────────
function newGame(level, best = loadBest()) {
  const { cols, rows, shapes } = LEVELS[level]
  const bag = makeBag(shapes.length)
  const first = bag.shift()
  if (!bag.length) bag.push(...makeBag(shapes.length))
  return {
    level, cols, rows,
    board: emptyBoard(cols, rows),
    piece: spawn(level, first, cols),
    next: bag.shift(),
    bag: bag.length ? bag : makeBag(shapes.length),
    rowsCleared: 0,
    phase: 'play',          // play | paused | clearing | full
    clearing: [],
    sound: null, soundId: 0,
    best,                   // best rows per level (saved on the device)
  }
}

function withSound(s, sound) { return { ...s, sound, soundId: s.soundId + 1 } }

function spawnNext(s, board) {
  const piece = spawn(s.level, s.next, s.cols)
  let bag = s.bag
  if (!bag.length) bag = makeBag(LEVELS[s.level].shapes.length)
  const [next, ...rest] = bag
  if (collides(board, piece)) {
    const best = s.rowsCleared > (s.best[s.level] ?? 0) ? { ...s.best, [s.level]: s.rowsCleared } : s.best
    return withSound({ ...s, board, piece: null, phase: 'full', best }, 'full')
  }
  return { ...s, board, piece, next, bag: rest }
}

function lock(s, piece) {
  const board = lockPiece(s.board, piece)
  const full = fullRows(board)
  if (full.length) return withSound({ ...s, board, piece: null, phase: 'clearing', clearing: full }, 'clear')
  return withSound(spawnNext(s, board), 'lock')
}

function reducer(s, a) {
  if (a.type === 'start') return newGame(a.level, s.best)
  if (a.type === 'pause') {
    if (s.phase === 'play') return { ...s, phase: 'paused' }
    if (a.onlyIfPlaying) return s
    if (s.phase === 'paused') return { ...s, phase: 'play' }
    return s
  }
  if (a.type === 'clearDone') {
    if (s.phase !== 'clearing') return s
    const board = removeRows(s.board, s.clearing)
    return spawnNext({ ...s, rowsCleared: s.rowsCleared + s.clearing.length, clearing: [], phase: 'play' }, board)
  }
  if (s.phase !== 'play' || !s.piece) return s
  switch (a.type) {
    case 'move': {
      const p = tryMove(s.board, s.piece, a.dx, 0)
      return p ? withSound({ ...s, piece: p }, 'move') : s
    }
    case 'rotate': {
      const p = tryRotate(s.board, s.piece)
      return p === s.piece ? s : withSound({ ...s, piece: p }, 'move')
    }
    case 'down':
    case 'tick': {
      const p = tryMove(s.board, s.piece, 0, 1)
      return p ? { ...s, piece: p } : lock(s, s.piece)
    }
    case 'drop':
      return lock(s, dropPosition(s.board, s.piece))
    default:
      return s
  }
}

// A button that repeats while held (for moving left/right/down)
function HoldButton({ onPress, repeat = true, className = '', children, label }) {
  const timer = useRef(null)
  const stop = () => { clearTimeout(timer.current); clearInterval(timer.current); timer.current = null }
  const start = (e) => {
    e.preventDefault()
    onPress()
    if (!repeat) return
    timer.current = setTimeout(() => { timer.current = setInterval(onPress, 110) }, 280)
  }
  useEffect(() => stop, [])
  return (
    <button type="button" className={`blk-btn ${className}`} aria-label={label} title={label}
      onPointerDown={start} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
      onContextMenu={e => e.preventDefault()}>
      {children}
    </button>
  )
}

function MiniPiece({ shape, color }) {
  return (
    <div className="blk-mini" style={{ gridTemplateColumns: `repeat(${shape[0].length}, 1fr)` }}>
      {shape.flatMap((row, r) => row.map((v, c) => (
        <span key={`${r}-${c}`} className={v ? 'blk-cell filled' : 'blk-cell'} style={v ? { '--c': color } : undefined} />
      )))}
    </div>
  )
}

export default function BlocksGame({ onBack }) {
  const t = useT()
  const { themeId } = useTheme()
  const palette = PALETTES[themeId] ?? PALETTES.animals
  const [s, dispatch] = useReducer(reducer, 'easy', (lv) => newGame(lv))
  const [cell, setCell] = useState(28)
  const areaRef = useRef(null)
  const touch = useRef(null)

  // gravity — slow, and only while playing
  useEffect(() => {
    if (s.phase !== 'play') return undefined
    const id = setInterval(() => dispatch({ type: 'tick' }), fallDelay(s.level, s.rowsCleared))
    return () => clearInterval(id)
  }, [s.phase, s.level, s.rowsCleared])

  // full rows fade away gently, then disappear
  useEffect(() => {
    if (s.phase !== 'clearing') return undefined
    const id = setTimeout(() => dispatch({ type: 'clearDone' }), 520)
    return () => clearTimeout(id)
  }, [s.phase])

  // soft sounds
  useEffect(() => {
    if (!s.soundId) return
    if (s.sound === 'clear') playMatch()
    else if (s.sound === 'lock') playTap()
    else if (s.sound === 'full') playWin()
    else if (s.sound === 'move') playMove()
  }, [s.soundId, s.sound])

  // remember the best result per level on the device
  useEffect(() => { if (s.phase === 'full') saveBest(s.best) }, [s.phase, s.best])

  // keyboard
  useEffect(() => {
    const onKey = (e) => {
      const map = { ArrowLeft: ['move', -1], ArrowRight: ['move', 1], ArrowUp: ['rotate'], ArrowDown: ['down'], ' ': ['drop'], p: ['pause'], P: ['pause'] }
      const m = map[e.key]
      if (!m) return
      e.preventDefault()
      dispatch(m[0] === 'move' ? { type: 'move', dx: m[1] } : { type: m[0] })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // pause when the app goes to the background
  useEffect(() => {
    const onVis = () => { if (document.hidden) dispatch({ type: 'pause', onlyIfPlaying: true }) }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // biggest cells that fit
  useLayoutEffect(() => {
    const el = areaRef.current
    if (!el) return undefined
    const fit = () => {
      // leave room for the board's padding + border (14px) and the 2px gaps between cells
      const w = el.clientWidth - 14 - 2 * (s.cols - 1)
      const h = el.clientHeight - 14 - 2 * (s.rows - 1)
      setCell(Math.max(12, Math.floor(Math.min(w / s.cols, h / s.rows, 46))))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [s.cols, s.rows])

  // swipe and tap on the board: tap = turn, slide = move, swipe down = drop
  const onPointerDown = (e) => {
    touch.current = { x: e.clientX, y: e.clientY, movedX: 0, moved: false }
  }
  const onPointerMove = (e) => {
    const tc = touch.current
    if (!tc) return
    const dx = e.clientX - tc.x - tc.movedX * cell
    if (Math.abs(dx) >= cell) {
      const step = dx > 0 ? 1 : -1
      dispatch({ type: 'move', dx: step })
      tc.movedX += step
      tc.moved = true
    }
  }
  const onPointerUp = (e) => {
    const tc = touch.current
    touch.current = null
    if (!tc) return
    const dy = e.clientY - tc.y
    if (dy > cell * 2.5 && !tc.moved) dispatch({ type: 'drop' })
    else if (!tc.moved && Math.abs(dy) < 12 && Math.abs(e.clientX - tc.x) < 12) dispatch({ type: 'rotate' })
  }

  const restart = useCallback((level) => dispatch({ type: 'start', level }), [])

  // what each cell shows: locked block, falling piece, or its landing shadow
  const view = s.board.map(row => row.map(v => (v === null ? null : { kind: v })))
  if (s.piece) {
    const ghost = dropPosition(s.board, s.piece)
    ghost.shape.forEach((row, r) => row.forEach((v, c) => {
      const y = ghost.y + r, x = ghost.x + c
      if (v && y >= 0 && !view[y][x]) view[y][x] = { kind: s.piece.kind, ghost: true }
    }))
    s.piece.shape.forEach((row, r) => row.forEach((v, c) => {
      const y = s.piece.y + r, x = s.piece.x + c
      if (v && y >= 0) view[y][x] = { kind: s.piece.kind }
    }))
  }

  const nextShape = LEVELS[s.level].shapes[s.next]
  const colorOf = (k) => palette[k % palette.length]
  const bestHere = s.best[s.level] ?? 0

  return (
    <div className="blocks-screen screen">
      <div className="game-header">
        <button className="btn btn-secondary back-btn" onClick={onBack}>← {t('Back')}</button>
        <h2>🧱 {t('Calm Blocks')}</h2>
        <div className="memory-size-toggle" role="group" aria-label={t('Level')}>
          {Object.entries(LEVELS).map(([id, l]) => (
            <button key={id} type="button"
              className={`memory-size-btn ${s.level === id ? 'is-active' : ''}`}
              onClick={() => restart(id)} aria-pressed={s.level === id}>
              {l.icon} {t(l.label)}
            </button>
          ))}
        </div>
      </div>

      <div className="blk-main">
        <div className="blk-area" ref={areaRef}>
          <div className={`blk-board${s.phase === 'paused' ? ' is-paused' : ''}`}
            style={{ gridTemplateColumns: `repeat(${s.cols}, ${cell}px)`, gridTemplateRows: `repeat(${s.rows}, ${cell}px)` }}
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
            onPointerCancel={() => { touch.current = null }}>
            {view.flatMap((row, y) => row.map((v, x) => (
              <span key={`${y}-${x}`}
                className={[
                  'blk-cell',
                  v && (v.ghost ? 'ghost' : 'filled'),
                  s.clearing.includes(y) && 'clearing',
                ].filter(Boolean).join(' ')}
                style={v ? { '--c': colorOf(v.kind) } : undefined} />
            )))}

            {s.phase === 'paused' && (
              <div className="blk-overlay">
                <div className="blk-overlay-emoji">☕</div>
                <p>{t('Taking a little break')}</p>
                <button className="btn btn-primary" onClick={() => dispatch({ type: 'pause' })}>▶ {t('Play')}</button>
              </div>
            )}
            {s.phase === 'full' && (
              <div className="blk-overlay">
                <div className="blk-overlay-emoji">🏰</div>
                <h3>{t('Your tower is full!')}</h3>
                <p>{s.rowsCleared === 1 ? t('You built 1 row.') : t('You built {n} rows.', { n: s.rowsCleared })}</p>
                {s.rowsCleared > 0 && s.rowsCleared >= bestHere && <p className="blk-best-new">⭐ {t('Your best ever!')}</p>}
                <div className="gameover-btns">
                  <button className="btn btn-primary" onClick={() => restart(s.level)}>{t('Play Again')}</button>
                  <button className="btn btn-secondary" onClick={onBack}>{t('Menu')}</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="blk-side">
          <div className="blk-panel">
            <span className="blk-panel-label">{t('Next')}</span>
            <MiniPiece shape={nextShape} color={colorOf(s.next)} />
          </div>
          <div className="blk-panel blk-stats">
            <span>🧱 {t('{n} rows', { n: s.rowsCleared })}</span>
            <span className="blk-best">⭐ {t('Best: {n}', { n: bestHere })}</span>
          </div>
          <div className="blk-controls">
            <HoldButton label={t('Turn')} repeat={false} className="blk-rotate" onPress={() => dispatch({ type: 'rotate' })}>🔄</HoldButton>
            <HoldButton label={t('Left')} onPress={() => dispatch({ type: 'move', dx: -1 })}>⬅️</HoldButton>
            <HoldButton label={t('Down')} onPress={() => dispatch({ type: 'down' })}>⬇️</HoldButton>
            <HoldButton label={t('Right')} onPress={() => dispatch({ type: 'move', dx: 1 })}>➡️</HoldButton>
            <HoldButton label={t('Drop')} repeat={false} className="blk-drop" onPress={() => dispatch({ type: 'drop' })}>⤓ <span className="blk-drop-label">{t('Drop')}</span></HoldButton>
            <button type="button" className="blk-btn blk-pause" onClick={() => dispatch({ type: 'pause' })}
              disabled={s.phase !== 'play' && s.phase !== 'paused'}>
              {s.phase === 'paused' ? '▶' : '⏸'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
