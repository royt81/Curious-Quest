import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import { THEME_LIST } from '../../data/themes'
import ThemeIcon from '../../components/ThemeIcon'
import { loadColoringPage } from './coloringPages'
import { playTap, playMatch, playMove } from '../../sound/sfx'
import './Drawing.css'
import { useT } from '../../i18n'

// ─── Draw & Paint ─────────────────────────────────────────────────────────────
// Free drawing on a blank page, or colouring pages made from the world
// characters. Layers inside the "stage" (bottom → top):
//   background colour · colouring-page areas (SVG) · brush canvas · outline (SVG)

const W = 1200, H = 900                     // internal canvas resolution (4:3)
const PAGE_BOX = { x: 175, y: 45, size: 850 } // where a colouring page sits
const MAX_UNDO = 15

const COLORS = [
  '#ff3b30', '#ff9500', '#ffd60a', '#a3e635', '#34c759', '#14b8a6',
  '#5ac8fa', '#007aff', '#5e5ce6', '#bf5af2', '#ff6fb5', '#f5c6a5',
  '#a0522d', '#8e8e93', '#1d1d1f', '#ffffff',
]
const SIZES = [{ id: 's', px: 8 }, { id: 'm', px: 20 }, { id: 'l', px: 44 }]
const EMOJI_STICKERS = ['⭐', '❤️', '🌸', '🌈', '☀️', '🦋', '🎈', '🍎', '🌙', '⚽']

const TOOLS = [
  { id: 'brush',   icon: '🖌️', label: 'Brush' },
  { id: 'fill',    icon: '🪣', label: 'Fill' },
  { id: 'eraser',  icon: '🧽', label: 'Eraser' },
  { id: 'sticker', icon: '⭐', label: 'Stickers' },
]

// ── helpers ──────────────────────────────────────────────────────────────────
function hexToRgba(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255]
}

// Scan-line flood fill on the brush canvas (used on blank pages and on top of
// brush strokes). Fills everything connected that has the same colour.
function floodFill(ctx, sx, sy, rgba) {
  const img = ctx.getImageData(0, 0, W, H)
  const d = img.data
  const i0 = (sy * W + sx) * 4
  const t = [d[i0], d[i0 + 1], d[i0 + 2], d[i0 + 3]]
  if (t[0] === rgba[0] && t[1] === rgba[1] && t[2] === rgba[2] && t[3] === rgba[3]) return false
  const TOL = 48
  const match = (i) => {
    // fully transparent pixels all count as "the same" whatever their rgb
    if (t[3] === 0) return d[i + 3] < 40
    return Math.abs(d[i] - t[0]) + Math.abs(d[i + 1] - t[1]) + Math.abs(d[i + 2] - t[2]) + Math.abs(d[i + 3] - t[3]) < TOL * 2
  }
  const seen = new Uint8Array(W * H)
  const stack = [[sx, sy]]
  while (stack.length) {
    let [x, y] = stack.pop()
    let p = y * W + x
    while (x >= 0 && !seen[p] && match(p * 4)) { x--; p-- }
    x++; p++
    let up = false, down = false
    while (x < W && !seen[p] && match(p * 4)) {
      seen[p] = 1
      const i = p * 4
      d[i] = rgba[0]; d[i + 1] = rgba[1]; d[i + 2] = rgba[2]; d[i + 3] = rgba[3]
      if (y > 0) {
        const q = p - W
        if (!seen[q] && match(q * 4)) { if (!up) { stack.push([x, y - 1]); up = true } } else up = false
      }
      if (y < H - 1) {
        const q = p + W
        if (!seen[q] && match(q * 4)) { if (!down) { stack.push([x, y + 1]); down = true } } else down = false
      }
      x++; p++
    }
  }
  ctx.putImageData(img, 0, 0)
  return true
}

function svgToImage(svgText) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText)
  })
}

// ── page picker ──────────────────────────────────────────────────────────────
function PagePicker({ onPick, themeId }) {
  const tt = useT()
  // Which world's pictures are shown on the right — starts on the current world.
  const [worldId, setWorldId] = useState(themeId)
  const world = THEME_LIST.find(t => t.id === worldId) ?? THEME_LIST[0]

  return (
    <div className="draw-picker">
      {/* left: blank page */}
      <motion.button className="draw-blank-card" onClick={() => onPick(null)}
        whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }}>
        <span className="draw-blank-icon">✏️</span>
        <span className="draw-card-title">{tt('Blank page')}</span>
        <span className="draw-card-sub">{tt('Draw anything you like!')}</span>
      </motion.button>

      {/* right: pictures to colour, one world at a time */}
      <div className="draw-colour-side">
        <h3 className="draw-picker-heading">🖍️ {tt('Colour a picture')}</h3>
        <div className="draw-world-tabs" role="tablist">
          {THEME_LIST.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={t.id === worldId}
              className={`draw-world-tab${t.id === worldId ? ' active' : ''}`}
              onClick={() => { setWorldId(t.id); playTap() }}
              title={tt(t.label)}
            >
              <ThemeIcon themeId={t.id} size={26} />
              <span>{tt(t.label)}</span>
            </button>
          ))}
        </div>
        <div className="draw-picker-grid" key={world.id}>
          {(world.coloringPages ?? world.raceRacers.filter(r => r.image.endsWith('.svg'))).map((r, i) => (
            <motion.button key={r.id} className="draw-page-card" onClick={() => onPick({ url: r.image, name: r.name })}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1, transition: { delay: i * 0.04 } }}
              whileHover={{ y: -4 }} whileTap={{ scale: 0.95 }}>
              <img src={r.image} alt="" draggable="false" />
              <span>{tt(r.name)}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── main component ───────────────────────────────────────────────────────────
export default function DrawingGame({ onBack }) {
  const tt = useT()
  const { theme, themeId } = useTheme()
  const [phase, setPhase] = useState('pick')       // 'pick' | 'draw'
  const [page, setPage] = useState(null)           // null = blank page
  const [pageSvg, setPageSvg] = useState(null)     // { areas, outline, regions }
  const [tool, setTool] = useState('brush')
  const [color, setColor] = useState('#ff3b30')
  const [size, setSize] = useState('m')
  const [sticker, setSticker] = useState('⭐')
  const [bg, setBg] = useState('#ffffff')
  const [fills, setFills] = useState([])           // colour per colouring-page area
  const [canUndo, setCanUndo] = useState(false)
  const [saved, setSaved] = useState(false)

  const canvasRef = useRef(null)
  const areasRef = useRef(null)
  const drawing = useRef(null)                      // { x, y } while a stroke is going
  const history = useRef([])
  const live = useRef({ fills, bg })
  useEffect(() => { live.current = { fills, bg } }, [fills, bg])

  const themeStickers = useMemo(() => (theme?.raceRacers ?? []).map(r => r.image), [theme])
  const stickerImgs = useRef({})
  useEffect(() => {
    themeStickers.forEach(src => {
      if (!stickerImgs.current[src]) { const i = new Image(); i.src = src; stickerImgs.current[src] = i }
    })
  }, [themeStickers])

  // ── open a page ──
  const openPage = async (p) => {
    playTap()
    setPage(p)
    setBg('#ffffff')
    history.current = []
    setCanUndo(false)
    if (p) {
      const svg = await loadColoringPage(p.url)
      setPageSvg(svg)
      setFills(Array(svg.regions).fill('#ffffff'))
      setTool('fill')
    } else {
      setPageSvg(null)
      setFills([])
      setTool('brush')
    }
    setPhase('draw')
  }

  // Paint colouring-page areas after EVERY render: React may re-insert the
  // page's SVG markup (wiping inline colours), so always re-apply them.
  useLayoutEffect(() => {
    const root = areasRef.current
    if (!root) return
    root.querySelectorAll('[data-r]').forEach(el => {
      const c = fills[+el.dataset.r] ?? '#ffffff'
      if (el.style.fill !== c) el.style.fill = c
    })
  })

  // ── undo ──
  const snapshot = () => {
    const ctx = canvasRef.current.getContext('2d')
    history.current.push({ img: ctx.getImageData(0, 0, W, H), fills: [...live.current.fills], bg: live.current.bg })
    if (history.current.length > MAX_UNDO) history.current.shift()
    setCanUndo(true)
    setSaved(false)
  }
  const undo = () => {
    const last = history.current.pop()
    if (!last) return
    playTap()
    canvasRef.current.getContext('2d').putImageData(last.img, 0, 0)
    setFills(last.fills)
    setBg(last.bg)
    setCanUndo(history.current.length > 0)
  }
  const clearAll = () => {
    snapshot()
    playTap()
    canvasRef.current.getContext('2d').clearRect(0, 0, W, H)
    setFills(f => f.map(() => '#ffffff'))
    setBg('#ffffff')
  }

  // ── pointer handling ──
  const toCanvas = (e) => {
    const r = canvasRef.current.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(W - 1, Math.round((e.clientX - r.left) * W / r.width))),
      y: Math.max(0, Math.min(H - 1, Math.round((e.clientY - r.top) * H / r.height))),
    }
  }

  const strokeTo = useCallback((from, to) => {
    const ctx = canvasRef.current.getContext('2d')
    ctx.save()
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
    ctx.strokeStyle = color
    ctx.lineWidth = (SIZES.find(s => s.id === size)?.px ?? 20) * (tool === 'eraser' ? 1.6 : 1)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x + 0.01, to.y)
    ctx.stroke()
    ctx.restore()
  }, [tool, color, size])

  const placeSticker = (p) => {
    const ctx = canvasRef.current.getContext('2d')
    const s = (SIZES.find(z => z.id === size)?.px ?? 20) * 4.5
    if (sticker.startsWith('/')) {
      const img = stickerImgs.current[sticker]
      if (img?.complete) ctx.drawImage(img, p.x - s / 2, p.y - s / 2, s, s)
    } else {
      ctx.font = `${s}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(sticker, p.x, p.y)
    }
    playMove()
  }

  const fillAt = (e, p) => {
    // 1) brush strokes under the finger → fill the stroke area on the canvas
    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true })
    const alpha = ctx.getImageData(p.x, p.y, 1, 1).data[3]
    if (alpha > 40 || !pageSvg) {
      if (floodFill(ctx, p.x, p.y, hexToRgba(color))) playMatch()
      return
    }
    // 2) a colouring-page area under the finger
    const hit = document.elementsFromPoint(e.clientX, e.clientY).find(el => el.dataset?.r !== undefined && areasRef.current?.contains(el))
    if (hit) {
      const idx = +hit.dataset.r
      setFills(f => f.map((c, i) => (i === idx ? color : c)))
      playMatch()
      return
    }
    // 3) otherwise the page background
    setBg(color)
    playMatch()
  }

  const onPointerDown = (e) => {
    e.preventDefault()
    const p = toCanvas(e)
    snapshot()
    if (tool === 'fill') { fillAt(e, p); return }
    if (tool === 'sticker') { placeSticker(p); return }
    canvasRef.current.setPointerCapture?.(e.pointerId)
    drawing.current = p
    strokeTo(p, p)
  }
  const onPointerMove = (e) => {
    if (!drawing.current) return
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent]
    for (const ev of events) {
      const p = toCanvas(ev)
      strokeTo(drawing.current, p)
      drawing.current = p
    }
  }
  const endStroke = () => { drawing.current = null }

  // ── save as PNG ──
  const save = async () => {
    const out = document.createElement('canvas')
    out.width = W; out.height = H
    const ctx = out.getContext('2d')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)
    if (pageSvg && areasRef.current) {
      const areasImg = await svgToImage(areasRef.current.innerHTML)
      ctx.drawImage(areasImg, PAGE_BOX.x, PAGE_BOX.y, PAGE_BOX.size, PAGE_BOX.size)
    }
    ctx.drawImage(canvasRef.current, 0, 0)
    if (pageSvg) {
      const outlineImg = await svgToImage(pageSvg.outline)
      ctx.drawImage(outlineImg, PAGE_BOX.x, PAGE_BOX.y, PAGE_BOX.size, PAGE_BOX.size)
    }
    const a = document.createElement('a')
    a.download = `${page ? page.name.toLowerCase().replace(/\s+/g, '-') : 'my-drawing'}.png`
    a.href = out.toDataURL('image/png')
    a.click()
    setSaved(true)
    playMatch()
  }

  const pickTool = (id) => { setTool(id); playTap() }
  const pickColor = (c) => { setColor(c); if (tool === 'eraser' || tool === 'sticker') setTool(page ? 'fill' : 'brush'); playTap() }

  const pageBoxStyle = {
    left: `${(PAGE_BOX.x / W) * 100}%`, top: `${(PAGE_BOX.y / H) * 100}%`,
    width: `${(PAGE_BOX.size / W) * 100}%`, height: `${(PAGE_BOX.size / H) * 100}%`,
  }

  return (
    <div className="draw-screen screen">
      <div className="game-header">
        <button className="btn btn-secondary back-btn"
          onClick={phase === 'draw' ? () => { setPhase('pick'); playTap() } : onBack}>
          {phase === 'draw' ? '← ' + tt('Pages') : '← ' + tt('Back')}
        </button>
        <h2><span style={{ display: 'inline-flex', verticalAlign: '-0.2em' }}><ThemeIcon themeId={themeId} size={28} /></span> {tt('Draw & Paint')}</h2>
        {phase === 'draw' && (
          <button className="btn btn-primary draw-save-btn" onClick={save}>{saved ? '✅ ' + tt('Saved!') : '💾 ' + tt('Save picture')}</button>
        )}
      </div>

      {phase === 'pick' && <PagePicker onPick={openPage} themeId={themeId} />}

      {phase === 'draw' && (
        <div className="draw-work">
          {/* tools */}
          <div className="draw-tools">
            {TOOLS.map(t => (
              <button key={t.id} className={`draw-tool${tool === t.id ? ' active' : ''}`} onClick={() => pickTool(t.id)} title={tt(t.label)}>
                <span className="draw-tool-icon">{t.icon}</span><span className="draw-tool-label">{tt(t.label)}</span>
              </button>
            ))}
            <div className="draw-tools-sep" />
            <button className="draw-tool" onClick={undo} disabled={!canUndo} title={tt('Undo')}>
              <span className="draw-tool-icon">↩️</span><span className="draw-tool-label">{tt('Undo')}</span>
            </button>
            <button className="draw-tool" onClick={clearAll} title={tt('Start again')}>
              <span className="draw-tool-icon">🗑️</span><span className="draw-tool-label">{tt('Clear')}</span>
            </button>
          </div>

          {/* stage */}
          <div className="draw-stage-wrap">
            <div className="draw-stage" style={{ background: bg }}>
              {pageSvg && (
                <div className="draw-layer draw-areas" style={pageBoxStyle} ref={areasRef}
                  dangerouslySetInnerHTML={{ __html: pageSvg.areas }} />
              )}
              <canvas
                ref={canvasRef}
                width={W}
                height={H}
                className={`draw-canvas tool-${tool}`}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endStroke}
                onPointerCancel={endStroke}
                onPointerLeave={endStroke}
              />
              {pageSvg && (
                <div className="draw-layer draw-outline" style={pageBoxStyle}
                  dangerouslySetInnerHTML={{ __html: pageSvg.outline }} />
              )}
            </div>
          </div>

          {/* colours + size / stickers */}
          <div className="draw-options">
            {tool === 'sticker' ? (
              <div className="draw-stickers">
                {[...themeStickers, ...EMOJI_STICKERS].map(s => (
                  <button key={s} className={`draw-sticker${sticker === s ? ' active' : ''}`} onClick={() => { setSticker(s); playTap() }}>
                    {s.startsWith('/') ? <img src={s} alt="" /> : s}
                  </button>
                ))}
              </div>
            ) : (
              <div className="draw-palette">
                {COLORS.map(c => (
                  <button key={c} className={`draw-swatch${color === c ? ' active' : ''}`} style={{ background: c }}
                    onClick={() => pickColor(c)} aria-label={`colour ${c}`} />
                ))}
              </div>
            )}
            {tool !== 'fill' && (
              <div className="draw-sizes">
                {SIZES.map(s => (
                  <button key={s.id} className={`draw-size${size === s.id ? ' active' : ''}`} onClick={() => { setSize(s.id); playTap() }}
                    aria-label={`size ${s.id}`}>
                    <span style={{ width: 6 + s.px * 0.45, height: 6 + s.px * 0.45, background: tool === 'eraser' ? '#ccc' : color }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
