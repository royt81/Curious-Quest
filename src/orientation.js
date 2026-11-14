// ─── Screen direction (Settings → Screen) ─────────────────────────────────────
// 'auto' = follow the phone; 'portrait' / 'landscape' = stay that way.
// Works in the installed app (Play Store / home screen). In a normal browser tab
// the browser only allows it in full screen, so we switch to full screen first.
// Desktop computers and iPhones can't do it — then the setting just has no effect.
import { getSettings } from './settings'

export const canRotate = typeof window !== 'undefined'
  && !!window.screen?.orientation?.lock
  && window.matchMedia?.('(pointer: coarse)').matches

export async function applyOrientation(mode = getSettings().orientation) {
  const o = window.screen?.orientation
  if (!o?.lock) return false
  if (!mode || mode === 'auto') {
    try { o.unlock() } catch { /* ignore */ }
    return true
  }
  try {
    await o.lock(mode)
    return true
  } catch {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
      }
      await o.lock(mode)
      return true
    } catch {
      return false
    }
  }
}

// On start: use the saved direction. If the browser wants a tap first
// (full screen needs one), try again on the first tap.
export function initOrientation() {
  if (!canRotate) return
  const retryOnTap = () => {
    window.addEventListener('pointerdown', () => { applyOrientation() }, { once: true })
  }
  applyOrientation().then(ok => { if (!ok) retryOnTap() })
}
