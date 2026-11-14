import { useState, useEffect, useMemo, useCallback } from 'react'
import useElementSize from '../../hooks/useElementSize'
import { ALL_PICTURES } from '../../data/pictures'
import { playTap, playMatch, playWrong, playWin } from '../../sound/sfx'
import { LAYOUTS, newBoard, isFree, findPair, reshuffle } from './mahjongLogic'
import './Mahjong.css'
import { useT } from '../../i18n'
import useSaved from '../../hooks/useSaved'

// Each world is a "suit" (like bamboo / circles / characters in real Mahjong):
// its own tile colour (see Mahjong.css) and this little mark in the corner.
const SUIT_MARK = { animals: '🐾', dinosaurs: '🦴', space: '⭐', robots: '⚙️', sea: '🐚' }

// Is the screen taller than wide? (used for the very first board, before measuring)
const uprightNow = () => typeof window !== 'undefined' && window.innerHeight > window.innerWidth * 1.15

const TILE_RATIO = 1.22    // tile height / width
const LAYER_SHIFT = 0.09   // each layer is drawn this much (× tile width) up and left

function starsFor(helps) {
  if (helps === 0) return 3
  if (helps <= 2) return 2
  return 1
}

export default function MahjongGame({ onBack }) {
  const t = useT()
  const [level, setLevel] = useSaved('mahjong', 'level', 'easy')
  const [board, setBoard] = useSaved('mahjong', 'board', () => newBoard('easy', ALL_PICTURES, -1, uprightNow()))
  const [selected, setSelected] = useState(null)
  const [hint, setHint] = useState(null)
  const [wrong, setWrong] = useState(null)
  const [history, setHistory] = useSaved('mahjong', 'history', [])
  const [helps, setHelps] = useSaved('mahjong', 'helps', 0)

  // Make the tiles as big as the free space allows (measured again whenever the
  // board element is replaced — e.g. after the "Board cleared!" screen)
  const [areaRef, area] = useElementSize()
  const { tiles, pictures } = board

  // Turned the phone before the first move? Deal the board again the other way round.
  const areaUpright = area.width > 0 && area.height > area.width * 1.15
  useEffect(() => {
    if (!area.width || areaUpright === board.upright) return
    if (tiles.some(t => t.removed)) return            // never reshuffle a game in progress
    // reacting to the measured screen shape (an outside value), so setState here is intended
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBoard(b => newBoard(level, ALL_PICTURES, b.shape - 1, areaUpright))
  }, [areaUpright]) // eslint-disable-line react-hooks/exhaustive-deps

  const start = useCallback((lv) => {
    setLevel(lv)
    setBoard(b => newBoard(lv, ALL_PICTURES, b.shape, uprightNow()))   // a different pile shape each round
    setSelected(null); setHint(null); setWrong(null); setHistory([]); setHelps(0)
  }, [])

  // Board size in half-tile units
  const bounds = useMemo(() => {
    const xs = tiles.map(p => p.x), ys = tiles.map(p => p.y), zs = tiles.map(p => p.z)
    return {
      minX: Math.min(...xs), minY: Math.min(...ys),
      cols: (Math.max(...xs) - Math.min(...xs) + 2) / 2,
      rows: (Math.max(...ys) - Math.min(...ys) + 2) / 2,
      layers: Math.max(...zs),
    }
  }, [tiles.length, board.shape])   // eslint-disable-line react-hooks/exhaustive-deps

  const tileW = useMemo(() => {
    if (!area.width) return 48
    const w = area.width - 12, h = area.height - 12
    const byW = w / (bounds.cols + bounds.layers * LAYER_SHIFT + 0.1)
    const byH = h / (bounds.rows * TILE_RATIO + bounds.layers * LAYER_SHIFT + 0.1)
    return Math.max(24, Math.min(byW, byH, 170))
  }, [area, bounds])

  const freeIds = useMemo(
    () => new Set(tiles.filter(t => !t.removed && isFree(t, tiles)).map(t => t.id)),
    [tiles],
  )
  const left = tiles.filter(t => !t.removed).length
  const won = left === 0
  const stuck = !won && !findPair(tiles)

  useEffect(() => { if (won) playWin() }, [won])

  const tapTile = (t) => {
    if (t.removed) return
    if (!freeIds.has(t.id)) { playWrong(); setWrong(t.id); setTimeout(() => setWrong(null), 400); return }
    setHint(null)
    if (selected === null) { playTap(); setSelected(t.id); return }
    if (selected === t.id) { setSelected(null); return }
    const other = tiles[selected]
    if (other.pic === t.pic) {
      playMatch()
      setHistory(h => [...h, [other.id, t.id]])
      setBoard(b => ({ ...b, tiles: b.tiles.map(x => (x.id === t.id || x.id === other.id ? { ...x, removed: true } : x)) }))
      setSelected(null)
    } else {
      playTap()
      setSelected(t.id)
    }
  }

  const showHint = () => {
    const p = findPair(tiles)
    if (!p) return
    setHint(p); setSelected(null); setHelps(n => n + 1)
  }

  const doShuffle = () => {
    setBoard(b => {
      const next = reshuffle(b.tiles)
      // Very rarely the last tiles lie exactly on top of each other — no shuffle
      // can free them. Then the stuck tiles are simply cleared, so nobody is stuck forever.
      if (!findPair(next)) return { ...b, tiles: next.map(t => ({ ...t, removed: true })) }
      return { ...b, tiles: next }
    })
    setSelected(null); setHint(null)
    // shuffling when stuck is free — except on Hard, where getting stuck is part of the game
    if (!stuck || LAYOUTS[level].random) setHelps(n => n + 1)
  }

  const undo = () => {
    const last = history[history.length - 1]
    if (!last) return
    setHistory(h => h.slice(0, -1))
    setBoard(b => ({ ...b, tiles: b.tiles.map(x => (last.includes(x.id) ? { ...x, removed: false } : x)) }))
    setSelected(null); setHint(null)
  }

  const shift = tileW * LAYER_SHIFT
  const tileH = tileW * TILE_RATIO
  const boardW = bounds.cols * tileW + bounds.layers * shift
  const boardH = bounds.rows * tileH + bounds.layers * shift
  // draw lower layers first; within a layer, left-to-right / top-to-bottom
  const drawOrder = useMemo(
    () => [...tiles].sort((a, b) => a.z - b.z || a.x - b.x || a.y - b.y),
    [tiles],
  )
  const stars = starsFor(helps)

  return (
    <div className="mahjong-screen screen">
      <div className="game-header">
        <button className="btn btn-secondary back-btn" onClick={onBack}>← {t('Back')}</button>
        <h2>🀄 {t('Mahjong')}</h2>
        <div className="scores">
          <span className="score p1">🧩 {t('{n} pairs left', { n: left / 2 })}</span>
        </div>
        <div className="memory-size-toggle" role="group" aria-label={t('Level')}>
          {Object.entries(LAYOUTS).map(([id, l]) => (
            <button key={id} type="button"
              className={`memory-size-btn ${level === id ? 'is-active' : ''}`}
              onClick={() => start(id)} aria-pressed={level === id} title={t(l.label)}>
              {l.icon} {t(l.label)}
            </button>
          ))}
        </div>
      </div>

      {won ? (
        <div className="gameover">
          <div className="gameover-emoji">🏆</div>
          <h2>{t('Board cleared!')}</h2>
          <p>{helps === 0 ? t('All by yourself — amazing!') : helps === 1 ? t('You used 1 help.') : t('You used {n} helps.', { n: helps })}</p>
          <div className="memory-stars" aria-label={t('{n} out of 3 stars', { n: stars })}>
            {[0, 1, 2].map(i => <span key={i} className={`memory-star ${i < stars ? 'on' : 'off'}`}>{i < stars ? '⭐' : '☆'}</span>)}
          </div>
          <div className="gameover-btns">
            <button className="btn btn-primary" onClick={() => start(level)}>{t('Play Again')}</button>
            <button className="btn btn-secondary" onClick={onBack}>{t('Menu')}</button>
          </div>
        </div>
      ) : (
        <>
          <div className="mj-area" ref={areaRef}>
            <div className="mj-board" style={{ width: boardW, height: boardH, '--tw': `${tileW}px` }}>
              {drawOrder.map(tile => {
                const pic = pictures[tile.pic]
                const free = freeIds.has(tile.id)
                const cls = [
                  'mj-tile',
                  tile.removed && 'gone',
                  free ? 'free' : 'blocked',
                  selected === tile.id && 'selected',
                  hint?.includes(tile.id) && 'hint',
                  wrong === tile.id && 'wrong',
                ].filter(Boolean).join(' ')
                return (
                  <button key={tile.id} type="button" className={cls}
                    disabled={tile.removed}
                    onClick={() => tapTile(tile)}
                    aria-label={free ? t('free tile') : t('blocked tile')}
                    style={{
                      left: ((tile.x - bounds.minX) / 2) * tileW + (bounds.layers - tile.z) * shift,
                      top: ((tile.y - bounds.minY) / 2) * tileH + (bounds.layers - tile.z) * shift,
                      width: tileW, height: tileH,
                      zIndex: 1 + tile.z * 1000 + (tile.x - bounds.minX) * 20 + (tile.y - bounds.minY),
                    }}
                    data-suit={pic.world}>
                    <span className="mj-suit" aria-hidden="true">{SUIT_MARK[pic.world]}</span>
                    <img src={pic.image} alt="" draggable="false" />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mj-bar">
            <button className="btn btn-secondary" onClick={undo} disabled={!history.length}>↩️ {t('Undo')}</button>
            <div className={`turn-banner mj-banner${stuck ? ' mj-stuck' : ''}`}>
              {stuck ? t('No more pairs — tap Shuffle!')
                : selected !== null ? t('Now find the same picture!')
                : t('Tap two free tiles with the same picture')}
            </div>
            <button className="btn btn-secondary" onClick={showHint} disabled={stuck}>💡 {t('Hint')}</button>
            <button className={`btn ${stuck ? 'btn-primary mj-pulse' : 'btn-secondary'}`} onClick={doShuffle}>🔀 {t('Shuffle')}</button>
          </div>
        </>
      )}
    </div>
  )
}
