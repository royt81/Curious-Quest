import { createContext, useContext, useState, useEffect } from 'react'
import { THEMES, DEFAULT_THEME } from '../data/themes'
import { setMusicTheme } from '../sound/music'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  // Remember the chosen world between visits.
  const [themeId, setThemeIdState] = useState(() => {
    try {
      const saved = localStorage.getItem('cq-theme')
      if (saved && THEMES[saved]) return saved
    } catch { /* ignore */ }
    return DEFAULT_THEME
  })
  const setThemeId = (id) => {
    setThemeIdState(id)
    try { localStorage.setItem('cq-theme', id) } catch { /* ignore */ }
  }
  const theme = THEMES[themeId]

  // background music follows the chosen world
  useEffect(() => { setMusicTheme(themeId) }, [themeId])

  // Keep data-theme on <html> in sync → CSS vars switch automatically
  useEffect(() => {
    document.documentElement.dataset.theme = themeId
  }, [themeId])

  return (
    <ThemeContext.Provider value={{ theme, themeId, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
