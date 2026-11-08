// ─── Colouring pages built from the world character SVGs ──────────────────────
// Every character picture (themes/*.svg) is drawn in a "lineal colour" style:
// dark shapes are the outline, every lighter shape is one coloured area.
// We turn that into a colouring page at runtime:
//   • light shapes → white, tappable areas (data-r="index")
//   • dark shapes  → the black outline drawn on top of everything
// so a tap fills exactly one area — crisp edges, no leaking through gaps.

const SHAPES = 'path, circle, ellipse, rect, polygon, polyline, line'
const DARK_LIMIT = 0.22          // luminance below this = outline ink
const cache = new Map()

function luminance(css) {
  const m = css.match(/rgba?\(([^)]+)\)/)
  if (!m) return null
  const [r, g, b, a = 1] = m[1].split(',').map(v => parseFloat(v))
  if (a === 0) return null
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

export async function loadColoringPage(url) {
  if (cache.has(url)) return cache.get(url)
  const res = await fetch(encodeURI(url))
  const text = await res.text()

  // Parse and attach (invisibly) so the browser resolves inherited fills,
  // style="fill:…", fill="…" and <g fill> all the same way.
  const holder = document.createElement('div')
  holder.style.cssText = 'position:absolute;left:-9999px;top:0;width:10px;height:10px;overflow:hidden;visibility:hidden'
  holder.innerHTML = text.replace(/<\?xml[^>]*>/, '')
  document.body.appendChild(holder)
  const svg = holder.querySelector('svg')

  let regions = 0
  svg.querySelectorAll(SHAPES).forEach(el => {
    const cs = getComputedStyle(el)
    const lum = luminance(cs.fill)
    if (lum === null) {                     // no fill: a stroke-only line → outline
      el.setAttribute('data-ink', '1')
      el.style.stroke = '#1d1d1f'
      return
    }
    if (lum < DARK_LIMIT) {
      el.setAttribute('data-ink', '1')
      el.style.fill = '#1d1d1f'
    } else {
      el.setAttribute('data-r', String(regions++))
      el.style.fill = '#ffffff'
    }
  })
  // drop fixed pt sizes so it scales with its box
  svg.removeAttribute('width'); svg.removeAttribute('height')
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
  svg.style.cssText = ''

  // Copy 1 – all shapes (areas get painted here)
  const areas = svg.cloneNode(true)
  // Copy 2 – only the outline, laid over the brush strokes
  const outline = svg.cloneNode(true)
  outline.querySelectorAll('[data-r]').forEach(el => { el.style.fill = 'none'; el.removeAttribute('data-r') })

  holder.remove()
  const page = { areas: areas.outerHTML, outline: outline.outerHTML, regions }
  cache.set(url, page)
  return page
}
