import { ref } from 'vue'
import type { HeartEventDef, SkillType, SkillPerk5, SkillPerk10 } from '@/types'
import type { SeasonEventDef } from '@/data/events'
import { useSkillStore, useNpcStore, usePlayerStore } from '@/stores'
import { addLog, showFloat, _registerPerkChecker } from './useGameLog'
import { useAudio } from './useAudio'

// 模块级单例状态
const currentEvent = ref<SeasonEventDef | null>(null)
const pendingHeartEvent = ref<HeartEventDef | null>(null)
const currentFestival = ref<'fishing_contest' | 'harvest_fair' | null>(null)
const pendingPerk = ref<{ skillType: SkillType; level: 5 | 10 } | null>(null)

/** 检查是否有技能达到天赋阈值但尚未选择天赋 */
export const checkAllPerks = () => {
  const skillStore = useSkillStore()
  for (const skill of skillStore.skills) {
    if (skill.level >= 5 && !skill.perk5) {
      pendingPerk.value = { skillType: skill.type, level: 5 }
      return
    }
    if (skill.level >= 10 && !skill.perk10) {
      pendingPerk.value = { skillType: skill.type, level: 10 }
      return
    }
  }
}

// 向 useGameLog 注册 checkAllPerks，使 addLog 可触发天赋检查
_registerPerkChecker(checkAllPerks)

/** 处理天赋选择对话框 */
export const handlePerkSelect = (perk: SkillPerk5 | SkillPerk10) => {
  if (!pendingPerk.value) return
  const skillStore = useSkillStore()
  const { skillType, level } = pendingPerk.value
  if (level === 5) {
    skillStore.setPerk5(skillType, perk as SkillPerk5)
  } else {
    skillStore.setPerk10(skillType, perk as SkillPerk10)
  }
  addLog('习得了新专精！')
  pendingPerk.value = null
}

/** 触发心事件（由 NpcView 调用） */
export const triggerHeartEvent = (event: HeartEventDef) => {
  const npcStore = useNpcStore()
  npcStore.markHeartEventTriggered(event.npcId, event.id)
  pendingHeartEvent.value = event
}

/** 关闭心事件对话框并应用友好度变化 */
export const closeHeartEvent = (changes: { npcId: string; amount: number }[]) => {
  const npcStore = useNpcStore()
  for (const change of changes) {
    npcStore.adjustFriendship(change.npcId, change.amount)
    if (change.amount > 0) {
      addLog(`好感度+${change.amount}`)
    } else if (change.amount < 0) {
      addLog(`好感度${change.amount}`)
    }
  }
  pendingHeartEvent.value = null
}

/** 显示季节事件对话框 */
export const showEvent = (event: SeasonEventDef) => {
  currentEvent.value = event
}

/** 关闭季节事件对话框 */
export const closeEvent = () => {
  currentEvent.value = null
  const { endFestivalBgm } = useAudio()
  endFestivalBgm()
}

/** 显示节日庆典界面 */
export const showFestival = (type: 'fishing_contest' | 'harvest_fair') => {
  currentFestival.value = type
}

/** 关闭节日庆典并发放奖品 */
export const closeFestival = (prize: number) => {
  if (prize > 0) {
    const playerStore = usePlayerStore()
    playerStore.earnMoney(prize)
    showFloat(`+${prize}文`, 'accent')
    addLog(`节日奖金：${prize}文！`)
  }
  currentFestival.value = null
  const { endFestivalBgm } = useAudio()
  endFestivalBgm()
}

export const useDialogs = () => {
  return {
    currentEvent,
    pendingHeartEvent,
    currentFestival,
    pendingPerk,
    checkAllPerks,
    handlePerkSelect,
    triggerHeartEvent,
    closeHeartEvent,
    showEvent,
    closeEvent,
    showFestival,
    closeFestival
  }
}
