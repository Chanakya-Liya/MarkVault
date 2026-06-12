import { useState, useCallback } from 'react'

export const BUILT_IN_THEMES = [
  {
    id: 'light', name: 'Light', dark: false, builtin: true,
    vars: { '--bg': '#f7f8fc', '--surface': '#ffffff', '--surface2': '#f0f2f7', '--border': '#e2e6ed', '--text': '#1a1d27', '--text-muted': '#6b7280', '--accent': '#3b82f6', '--accent-hover': '#2563eb' },
  },
  {
    id: 'dark', name: 'Dark', dark: true, builtin: true,
    vars: { '--bg': '#0f1117', '--surface': '#1a1d27', '--surface2': '#222636', '--border': '#2d3148', '--text': '#e2e8f0', '--text-muted': '#8892a4', '--accent': '#60a5fa', '--accent-hover': '#93c5fd' },
  },
  {
    id: 'sepia', name: 'Sepia', dark: false, builtin: true,
    vars: { '--bg': '#f5f0e8', '--surface': '#faf7f0', '--surface2': '#ede8dc', '--border': '#d4c9b0', '--text': '#3c2f1e', '--text-muted': '#8a7060', '--accent': '#b87333', '--accent-hover': '#9a6128' },
  },
  {
    id: 'forest', name: 'Forest', dark: true, builtin: true,
    vars: { '--bg': '#0d1a0f', '--surface': '#132016', '--surface2': '#1a2a1d', '--border': '#2a3d2d', '--text': '#c8e6c9', '--text-muted': '#7aad7e', '--accent': '#4caf50', '--accent-hover': '#66bb6a' },
  },
  {
    id: 'rose', name: 'Rosé', dark: false, builtin: true,
    vars: { '--bg': '#fdf4f7', '--surface': '#ffffff', '--surface2': '#fce7f3', '--border': '#f9a8d4', '--text': '#500724', '--text-muted': '#9d174d', '--accent': '#ec4899', '--accent-hover': '#db2777' },
  },
  {
    id: 'ocean', name: 'Ocean', dark: true, builtin: true,
    vars: { '--bg': '#0c1821', '--surface': '#142233', '--surface2': '#1a2d42', '--border': '#1e3a52', '--text': '#cce8f4', '--text-muted': '#7fb5d4', '--accent': '#38bdf8', '--accent-hover': '#0ea5e9' },
  },
  {
    id: 'slate', name: 'Slate', dark: true, builtin: true,
    vars: { '--bg': '#1e2028', '--surface': '#272932', '--surface2': '#31343f', '--border': '#3d414f', '--text': '#d4d8e2', '--text-muted': '#8893a5', '--accent': '#818cf8', '--accent-hover': '#6366f1' },
  },
]

let _transitionTimer = null

export function applyThemeVars(theme) {
  const root = document.documentElement
  clearTimeout(_transitionTimer)
  root.classList.add('theme-transition')
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v))
  _transitionTimer = setTimeout(() => root.classList.remove('theme-transition'), 280)
  root.style.setProperty('--shadow',
    theme.dark ? '0 1px 3px rgba(0,0,0,0.3),0 1px 2px rgba(0,0,0,0.2)'
               : '0 1px 3px rgba(0,0,0,0.08),0 1px 2px rgba(0,0,0,0.06)')
  root.style.setProperty('--shadow-md',
    theme.dark ? '0 4px 6px rgba(0,0,0,0.25),0 2px 4px rgba(0,0,0,0.2)'
               : '0 4px 6px rgba(0,0,0,0.07),0 2px 4px rgba(0,0,0,0.06)')
  const link = document.getElementById('hljs-theme')
  if (link) {
    link.href = theme.dark
      ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'
      : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css'
  }
}

function loadCustom() {
  try { return JSON.parse(localStorage.getItem('mv_custom_themes') || '[]') }
  catch { return [] }
}

export function useTheme() {
  const [themeId, setThemeId] = useState(() => {
    const saved = localStorage.getItem('mv_theme') || 'light'
    const all = [...BUILT_IN_THEMES, ...loadCustom()]
    applyThemeVars(all.find(t => t.id === saved) || BUILT_IN_THEMES[0])
    return saved
  })
  const [customThemes, setCustomThemes] = useState(loadCustom)

  const allThemes = [...BUILT_IN_THEMES, ...customThemes]

  const setTheme = useCallback((id) => {
    const all = [...BUILT_IN_THEMES, ...loadCustom()]
    const theme = all.find(t => t.id === id) || BUILT_IN_THEMES[0]
    applyThemeVars(theme)
    setThemeId(id)
    localStorage.setItem('mv_theme', id)
  }, [])

  const addCustomTheme = useCallback((theme) => {
    setCustomThemes(prev => {
      const next = [...prev, theme]
      localStorage.setItem('mv_custom_themes', JSON.stringify(next))
      return next
    })
    applyThemeVars(theme)
    setThemeId(theme.id)
    localStorage.setItem('mv_theme', theme.id)
  }, [])

  const deleteCustomTheme = useCallback((id) => {
    setCustomThemes(prev => {
      const next = prev.filter(t => t.id !== id)
      localStorage.setItem('mv_custom_themes', JSON.stringify(next))
      return next
    })
    setThemeId(cur => {
      if (cur === id) {
        applyThemeVars(BUILT_IN_THEMES[0])
        localStorage.setItem('mv_theme', 'light')
        return 'light'
      }
      return cur
    })
  }, [])

  return { themeId, allThemes, setTheme, addCustomTheme, deleteCustomTheme }
}
