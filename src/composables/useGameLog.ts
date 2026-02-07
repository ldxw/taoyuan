import { ref, readonly } from 'vue'

export type FloatColor = 'danger' | 'success' | 'accent' | 'water'

export interface FloatMessage {
  id: number
  text: string
  colorClass: string
  x: number
  y: number
}

// 模块级单例状态
const logs = ref<string[]>(['欢迎来到桃源乡！新的一天开始了。'])
const floatMessages = ref<FloatMessage[]>([])
let nextFloatId = 0

/** 添加日志消息 */
export const addLog = (msg: string) => {
  logs.value.unshift(msg)
  if (logs.value.length > 50) logs.value.pop()
  // 循环依赖说明：useDialogs 导入 addLog，我们导入 checkAllPerks。
  // 两者仅在函数内部使用，ESM 中安全。
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  _perkChecker?.()
}

/** 显示浮动文本反馈 */
export const showFloat = (text: string, color: FloatColor = 'accent') => {
  const id = nextFloatId++
  floatMessages.value.push({
    id,
    text,
    colorClass: `text-${color}`,
    x: 160 + Math.random() * 200,
    y: 50 + Math.random() * 30
  })
  setTimeout(() => {
    floatMessages.value = floatMessages.value.filter(m => m.id !== id)
  }, 1500)
}

/** 重置日志（新游戏） */
export const resetLogs = () => {
  logs.value = ['欢迎来到桃源乡！新的一天开始了。']
}

// 天赋检查回调 — 由 useDialogs 注册以避免循环导入
let _perkChecker: (() => void) | null = null

/** 注册天赋检查回调（useDialogs 初始化时调用） */
export const _registerPerkChecker = (fn: () => void) => {
  _perkChecker = fn
}

export const useGameLog = () => {
  return {
    logs: readonly(logs),
    floatMessages: readonly(floatMessages),
    addLog,
    showFloat,
    resetLogs
  }
}
