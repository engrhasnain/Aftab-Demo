import { createContext, useContext } from 'react'
import { sectionTheme, themeForKey } from '../utils/sectionTheme'

/**
 * Makes the current section's colour available to anything drawn inside the
 * page, so a card heading can be tinted without every screen having to pass the
 * colour down by hand.
 */
const SectionThemeContext = createContext(null)

export function SectionThemeProvider({ pathname, children }) {
  return (
    <SectionThemeContext.Provider value={sectionTheme(pathname)}>{children}</SectionThemeContext.Provider>
  )
}

/** Falls back to the neutral theme when used outside a page, so nothing breaks. */
export function useSectionThemeCtx() {
  return useContext(SectionThemeContext) || themeForKey('dashboard')
}
