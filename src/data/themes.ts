export type ThemeKey = 'dark' | 'warm' | 'ink' | 'parchment'

export interface ThemeDef {
  key: ThemeKey
  name: string
  bg: string
  panel: string
  text: string
}

export const THEMES: ThemeDef[] = [
  { key: 'dark', name: '墨夜', bg: '#1a1a1a', panel: '#2b2d3c', text: '#e8e4d9' },
  { key: 'warm', name: '暖灯', bg: '#2a2318', panel: '#3d3528', text: '#efe6d0' },
  { key: 'ink', name: '水墨', bg: '#f0ece4', panel: '#e0dbd0', text: '#2c2c2c' },
  { key: 'parchment', name: '素笺', bg: '#e8dcc8', panel: '#d8ccb4', text: '#3a3028' }
]

export const getThemeByKey = (key: ThemeKey): ThemeDef => THEMES.find(t => t.key === key) ?? THEMES[0]!
