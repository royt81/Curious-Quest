import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react'
import { ALL_PICTURES } from '../../data/pictures'
import { playTap, playMatch, playWrong, playWin } from '../../sound/sfx'
import { LAYOUTS, newBoard, isFree, findPair, reshuffle } from './mahjongLogic'
import './Mahjong.css'
import { useT } from '../../i18n'

// Each world is a "suit" (like bamboo / circles / characters in real Mahjong):
// its own tile colour (see Mahjong.css) and this little mark in the corner.
const SUIT_MARK = { animals: '🐾', dinosaurs: '🦴', space: '⭐', robots: '⚙️', sea: '🐚' }

const TILE_RATIO = 1.22    // tile height / width
const LAYER_SHIFT = 0.09   // each layer is drawn this much (× tile width) up and left

function starsFor(helps) {
  if (helps === 0) return 3
  if (helps <= 2) return 2
  return 1
}

export default function MahjongGame({ onBack }) {
  const t = useT()
  const [level, setLevel] = useState('easy')
  const [board, setBoard] = useState(() => newBoard('easy', ALL_PICTURES))
  const [selected, setSelected] = useState(null)
  const [hint, setHint] = useState(null)
  const [wrong, setWrong] = useState(null)
  const [history, setHistory] = useState([])
  const [helps, setHelps] = useState(0)
  const [tileW, setTileW] = useState(48)
  const areaRef = useRef(null)

  const { tiles, pictures } = board
  const positions = LAYOUTS[level].positions

  const start = useCallback((lv) => {
    setLevel(lv)
    setBoard(newBoard(lv, ALL_PICTURES))
    setSelected(null); setHint(null); setWrong(null); setHistory([]); setHelps(0)
  }, [])

  // Board size in half-tile units
  const bounds = useMemo(() => {
    const xs = positions.map(p => p.x), ys = positions.map(p => p.y), zs = positions.map(p => p.z)
    return {
      minX: Math.min(...xs), minY: Math.min(...ys),
      cols: (Math.max(...xs) - Math.min(...xs) + 2) / 2,
      rows: (Math.max(...ys) - Math.min(...ys) + 2) / 2,
      layers: Math.max(...zs),
    }
  }, [positions])

  // Make the tiles as big as the free space allows
  useLayoutEffect(() => {
    const el = areaRef.current
    if (!el) return undefined
    const fit = () => {
      const w = el.clientWidth - 16, h = el.clientHeight - 16
      const byW = w / (bounds.cols + bounds.layers * LAYER_SHIFT + 0.1)
      const byH = h / (bounds.rows * TILE_RATIO + bounds.layers * LAYER_SHIFT + 0.1)
      setTileW(Math.max(24, Math.min(byW, byH, 120)))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [bounds])

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
    setBoard(b => ({ ...b, tiles: reshuffle(b.tiles) }))
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
            <div className={`turn-banner${stuck ? ' mj-stuck' : ''}`}>
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
