import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react'
import { ALL_PICTURES } from '../../data/pictures'
import { playTap, playMatch, playWrong, playWin } from '../../sound/sfx'
import { LAYOUTS, newBoard, isFree, findPair, reshuffle } from './mahjongLogic'
import './Mahjong.css'

const TILE_RATIO = 1.22    // tile height / width
const LAYER_SHIFT = 0.09   // each layer is drawn this much (× tile width) up and left

function starsFor(helps) {
  if (helps === 0) return 3
  if (helps <= 2) return 2
  return 1
}

export default function MahjongGame({ onBack }) {
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
        <button className="btn btn-secondary back-btn" onClick={onBack}>← Back</button>
        <h2>🀄 Mahjong</h2>
        <div className="scores">
          <span className="score p1">🧩 {left / 2} pairs left</span>
        </div>
        <div className="memory-size-toggle" role="group" aria-label="Level">
          {Object.entries(LAYOUTS).map(([id, l]) => (
            <button key={id} type="button"
              className={`memory-size-btn ${level === id ? 'is-active' : ''}`}
              onClick={() => start(id)} aria-pressed={level === id} title={l.label}>
              {l.icon} {l.label}
            </button>
          ))}
        </div>
      </div>

      {won ? (
        <div className="gameover">
          <div className="gameover-emoji">🏆</div>
          <h2>Board cleared!</h2>
          <p>{helps === 0 ? 'All by yourself — amazing!' : `You used ${helps} help${helps === 1 ? '' : 's'}.`}</p>
          <div className="memory-stars" aria-label={`${stars} out of 3 stars`}>
            {[0, 1, 2].map(i => <span key={i} className={`memory-star ${i < stars ? 'on' : 'off'}`}>{i < stars ? '⭐' : '☆'}</span>)}
          </div>
          <div className="gameover-btns">
            <button className="btn btn-primary" onClick={() => start(level)}>Play Again</button>
            <button className="btn btn-secondary" onClick={onBack}>Menu</button>
          </div>
        </div>
      ) : (
        <>
          <div className="mj-area" ref={areaRef}>
            <div className="mj-board" style={{ width: boardW, height: boardH, '--tw': `${tileW}px` }}>
              {drawOrder.map(t => {
                const pic = pictures[t.pic]
                const free = freeIds.has(t.id)
                const cls = [
                  'mj-tile',
                  t.removed && 'gone',
                  free ? 'free' : 'blocked',
                  selected === t.id && 'selected',
                  hint?.includes(t.id) && 'hint',
                  wrong === t.id && 'wrong',
                ].filter(Boolean).join(' ')
                return (
                  <button key={t.id} type="button" className={cls}
                    disabled={t.removed}
                    onClick={() => tapTile(t)}
                    aria-label={free ? 'free tile' : 'blocked tile'}
                    style={{
                      left: ((t.x - bounds.minX) / 2) * tileW + (bounds.layers - t.z) * shift,
                      top: ((t.y - bounds.minY) / 2) * tileH + (bounds.layers - t.z) * shift,
                      width: tileW, height: tileH,
                      zIndex: 1 + t.z * 1000 + (t.x - bounds.minX) * 20 + (t.y - bounds.minY),
                      '--world': pic.color,
                    }}>
                    <img src={pic.image} alt="" draggable="false" />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mj-bar">
            <button className="btn btn-secondary" onClick={undo} disabled={!history.length}>↩️ Undo</button>
            <div className={`turn-banner${stuck ? ' mj-stuck' : ''}`}>
              {stuck ? 'No more pairs — tap Shuffle!'
                : selected !== null ? 'Now find the same picture!'
                : 'Tap two free tiles with the same picture'}
            </div>
            <button className="btn btn-secondary" onClick={showHint} disabled={stuck}>💡 Hint</button>
            <button className={`btn ${stuck ? 'btn-primary mj-pulse' : 'btn-secondary'}`} onClick={doShuffle}>🔀 Shuffle</button>
          </div>
        </>
      )}
    </div>
  )
}
