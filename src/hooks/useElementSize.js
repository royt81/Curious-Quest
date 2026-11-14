import { useCallback, useLayoutEffect, useState } from 'react'

// Measures an element and keeps measuring while it resizes.
// Returns [ref, { width, height }] — pass `ref` as the element's ref.
// It uses a callback ref on purpose: when the element is replaced (e.g. the
// board comes back after a "you won" screen), the new one is measured too.
// (A plain useRef missed that, which made Mahjong tiles shrink after a win.)
export default function useElementSize() {
  const [el, setEl] = useState(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const ref = useCallback(node => setEl(node), [])

  useLayoutEffect(() => {
    if (!el) return undefined
    const measure = () => setSize(s =>
      (s.width === el.clientWidth && s.height === el.clientHeight) ? s : { width: el.clientWidth, height: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [el])

  return [ref, size]
}
