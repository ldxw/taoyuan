import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { QuestInstance, Season } from '@/types'
import { generateQuest } from '@/data/quests'
import { useInventoryStore } from './useInventoryStore'
import { usePlayerStore } from './usePlayerStore'
import { useNpcStore } from './useNpcStore'
import { useAchievementStore } from './useAchievementStore'

export const useQuestStore = defineStore('quest', () => {
  const inventoryStore = useInventoryStore()
  const playerStore = usePlayerStore()
  const npcStore = useNpcStore()
  const achievementStore = useAchievementStore()

  /** 告示栏上的可接取任务 */
  const boardQuests = ref<QuestInstance[]>([])

  /** 已接取的进行中任务 */
  const activeQuests = ref<QuestInstance[]>([])

  /** 累计完成任务数 */
  const completedQuestCount = ref<number>(0)

  /** 最大同时接取任务数 */
  const MAX_ACTIVE_QUESTS = 3

  /** 每日生成新任务到告示栏 */
  const generateDailyQuests = (season: Season, day: number) => {
    boardQuests.value = [] // 清空旧的告示栏
    const count = 1 + Math.floor(Math.random() * 2) // 1-2个
    for (let i = 0; i < count; i++) {
      const quest = generateQuest(season, day)
      if (quest) {
        boardQuests.value.push(quest)
      }
    }
  }

  /** 接取任务 */
  const acceptQuest = (questId: string): { success: boolean; message: string } => {
    if (activeQuests.value.length >= MAX_ACTIVE_QUESTS) {
      return { success: false, message: `最多同时接取${MAX_ACTIVE_QUESTS}个任务。` }
    }
    const idx = boardQuests.value.findIndex(q => q.id === questId)
    if (idx === -1) return { success: false, message: '任务不存在。' }

    const quest = boardQuests.value[idx]!
    quest.accepted = true

    // 非送货类委托：检查背包中已有的物品数量
    if (quest.type !== 'delivery') {
      quest.collectedQuantity = Math.min(inventoryStore.getItemCount(quest.targetItemId), quest.targetQuantity)
    }

    activeQuests.value.push(quest)
    boardQuests.value.splice(idx, 1)
    return { success: true, message: `接取了任务：${quest.description}` }
  }

  /** 提交完成的任务 */
  const submitQuest = (questId: string): { success: boolean; message: string } => {
    const idx = activeQuests.value.findIndex(q => q.id === questId)
    if (idx === -1) return { success: false, message: '任务不存在。' }

    const quest = activeQuests.value[idx]!

    // 送货类委托：提交时从背包扣除物品
    if (quest.type === 'delivery') {
      if (!inventoryStore.hasItem(quest.targetItemId, quest.targetQuantity)) {
        return { success: false, message: `背包中${quest.targetItemName}不足。` }
      }
      inventoryStore.removeItem(quest.targetItemId, quest.targetQuantity)
    } else {
      // 钓鱼/挖矿/采集类：检查收集进度
      if (quest.collectedQuantity < quest.targetQuantity) {
        return { success: false, message: `${quest.targetItemName}收集进度不足（${quest.collectedQuantity}/${quest.targetQuantity}）。` }
      }
    }

    // 发放奖励
    playerStore.earnMoney(quest.moneyReward)
    achievementStore.recordMoneyEarned(quest.moneyReward)
    npcStore.adjustFriendship(quest.npcId, quest.friendshipReward)

    // 记录完成
    completedQuestCount.value++

    // 从活跃列表移除
    activeQuests.value.splice(idx, 1)

    return {
      success: true,
      message: `完成了${quest.npcName}的委托！获得${quest.moneyReward}文，${quest.npcName}好感+${quest.friendshipReward}。`
    }
  }

  /** 当玩家获得某物品时，更新进行中任务的进度（钓鱼/挖矿/采集类） */
  const onItemObtained = (itemId: string, quantity: number = 1) => {
    for (const quest of activeQuests.value) {
      if (quest.type === 'delivery') continue // 送货类不自动追踪
      if (quest.targetItemId === itemId && quest.collectedQuantity < quest.targetQuantity) {
        quest.collectedQuantity = Math.min(quest.collectedQuantity + quantity, quest.targetQuantity)
      }
    }
  }

  /** 每日更新：天数递减，过期移除 */
  const dailyUpdate = () => {
    // 活跃委托剩余天数递减
    const expired: QuestInstance[] = []
    activeQuests.value = activeQuests.value.filter(q => {
      q.daysRemaining--
      if (q.daysRemaining <= 0) {
        expired.push(q)
        return false
      }
      return true
    })
    return expired
  }

  /** 检查是否有任务关注某物品 */
  const hasActiveQuestFor = (itemId: string): boolean => {
    return activeQuests.value.some(q => q.targetItemId === itemId)
  }

  const serialize = () => {
    return {
      boardQuests: boardQuests.value,
      activeQuests: activeQuests.value,
      completedQuestCount: completedQuestCount.value
    }
  }

  const deserialize = (data: ReturnType<typeof serialize>) => {
    boardQuests.value = data.boardQuests ?? []
    activeQuests.value = data.activeQuests ?? []
    completedQuestCount.value = data.completedQuestCount ?? 0
  }

  return {
    boardQuests,
    activeQuests,
    completedQuestCount,
    MAX_ACTIVE_QUESTS,
    generateDailyQuests,
    acceptQuest,
    submitQuest,
    onItemObtained,
    dailyUpdate,
    hasActiveQuestFor,
    serialize,
    deserialize
  }
})
