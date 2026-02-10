import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useAudio } from '@/composables/useAudio'
import { getThemeByKey, type ThemeKey } from '@/data/themes'

const DEFAULT_FONT_SIZE = 16
const DEFAULT_THEME: ThemeKey = 'dark'

export const useSettingsStore = defineStore('settings', () => {
  const fontSize = ref(DEFAULT_FONT_SIZE)
  const theme = ref<ThemeKey>(DEFAULT_THEME)

  const applyFontSize = () => {
    document.documentElement.style.fontSize = fontSize.value + 'px'
  }

  const applyTheme = () => {
    const t = getThemeByKey(theme.value)
    document.documentElement.style.setProperty('--color-bg', t.bg)
    document.documentElement.style.setProperty('--color-panel', t.panel)
    document.documentElement.style.setProperty('--color-text', t.text)
  }

  const changeFontSize = (delta: number) => {
    fontSize.value = Math.min(24, Math.max(12, fontSize.value + delta))
    applyFontSize()
  }

  const changeTheme = (key: ThemeKey) => {
    theme.value = key
    applyTheme()
  }

  const serialize = () => {
    const { sfxEnabled, bgmEnabled } = useAudio()
    return {
      fontSize: fontSize.value,
      sfxEnabled: sfxEnabled.value,
      bgmEnabled: bgmEnabled.value,
      theme: theme.value
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deserialize = (data: any) => {
    fontSize.value = data?.fontSize ?? DEFAULT_FONT_SIZE
    applyFontSize()
    theme.value = data?.theme ?? DEFAULT_THEME
    applyTheme()
    const { sfxEnabled, bgmEnabled } = useAudio()
    sfxEnabled.value = data?.sfxEnabled ?? true
    bgmEnabled.value = data?.bgmEnabled ?? true
  }

  return { fontSize, theme, changeFontSize, changeTheme, applyFontSize, applyTheme, serialize, deserialize }
})
