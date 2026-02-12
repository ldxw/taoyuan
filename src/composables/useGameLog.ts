import Qmsg from 'qmsg'

export type FloatColor = 'danger' | 'success' | 'accent' | 'water'

// 配置 Qmsg 全局样式
Qmsg.config({
  position: 'bottom',
  showIcon: false,
  maxNums: 5,
  timeout: 2500,
  useShadowRoot: false
})

// 天赋检查回调 — 由 useDialogs 注册以避免循环导入
let _perkChecker: (() => void) | null = null

/** 注册天赋检查回调（useDialogs 初始化时调用） */
export const _registerPerkChecker = (fn: () => void) => {
  _perkChecker = fn
}

/** 添加日志消息（显示为 toast 通知） */
export const addLog = (msg: string) => {
  Qmsg.info(msg)
  _perkChecker?.()
}

/** 显示浮动文本反馈（显示为 toast 通知） */
export const showFloat = (text: string, color: FloatColor = 'accent') => {
  switch (color) {
    case 'danger':
      Qmsg.error(text, { timeout: 1500 })
      break
    case 'success':
      Qmsg.success(text, { timeout: 1500 })
      break
    case 'accent':
      Qmsg.warning(text, { timeout: 1500 })
      break
    case 'water':
      Qmsg.info(text, { timeout: 1500 })
      break
  }
}

/** 重置日志（新游戏） */
export const resetLogs = () => {
  Qmsg.closeAll()
}

export const useGameLog = () => {
  return {
    addLog,
    showFloat,
    resetLogs
  }
}
