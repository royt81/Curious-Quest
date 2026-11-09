// ─── Translations ─────────────────────────────────────────────────────────────
// The English text itself is the key: t('Back') → 'Zurück' in German.
// Anything without a translation simply stays English, so nothing ever breaks.
// Placeholders: t('{n} pairs left', { n: 5 }).
// Run `npm run i18n:check` to list English texts that still need a German line.
import { useCallback } from 'react'
import { getSettings, setSetting, useSettings, subscribeSettings } from '../settings'
import de from './de'

export const LANGUAGES = [
  { id: 'en', label: 'English', flag: '🇬🇧', speech: 'en-GB' },
  { id: 'de', label: 'Deutsch', flag: '🇩🇪', speech: 'de-DE' },
]
const DICTS = { de }

function fill(text, vars) {
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : text
}

export function getLang() { return getSettings().lang === 'de' ? 'de' : 'en' }
export function setLang(lang) { setSetting('lang', lang) }

// For plain JavaScript (game logic, the voice, data files)
export function tr(en, vars) {
  const dict = DICTS[getLang()]
  return fill((dict && dict[en]) || en, vars)
}

// Picks the right one of { en, de } (for longer texts and lists)
export function pickLang(byLang) { return byLang[getLang()] ?? byLang.en }

// For React components: re-renders when the language changes
export function useLang() {
  const lang = useSettings().lang === 'de' ? 'de' : 'en'
  return lang
}
export function useT() {
  const lang = useLang()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback((en, vars) => tr(en, vars), [lang])
}

// keep <html lang> right for screen readers and the browser's own translation offer
if (typeof document !== 'undefined') {
  const apply = () => { document.documentElement.lang = getLang() }
  apply()
  subscribeSettings(apply)
}
