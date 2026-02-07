import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { AchievementDef } from '@/types'
import { ACHIEVEMENTS, COMMUNITY_BUNDLES } from '@/data/achievements'
import { usePlayerStore } from './usePlayerStore'
import { useInventoryStore } from './useInventoryStore'
import { useSkillStore } from './useSkillStore'
import { useNpcStore } from './useNpcStore'
import { useQuestStore } from './useQuestStore'

export const useAchievementStore = defineStore('achievement', () => {
  const playerStore = usePlayerStore()
  const inventoryStore = useInventoryStore()
  const skillStore = useSkillStore()
  const npcStore = useNpcStore()

  /** 已发现的物品ID集合 */
  const discoveredItems = ref<string[]>([])

  /** 已完成的成就ID集合 */
  const completedAchievements = ref<string[]>([])

  /** 社区任务已提交物品 */
  const bundleSubmissions = ref<Record<string, Record<string, number>>>({})

  /** 已完成的社区任务 */
  const completedBundles = ref<string[]>([])

  /** 统计计数器 */
  const stats = ref({
    totalCropsHarvested: 0,
    totalFishCaught: 0,
    totalMoneyEarned: 0,
    highestMineFloor: 0,
    totalRecipesCooked: 0
  })

  const discoveredCount = computed(() => discoveredItems.value.length)

  // === 物品发现 ===

  const discoverItem = (itemId: string) => {
    if (!discoveredItems.value.includes(itemId)) {
      discoveredItems.value.push(itemId)
    }
  }

  const isDiscovered = (itemId: string): boolean => {
    return discoveredItems.value.includes(itemId)
  }

  // === 统计记录 ===

  const recordCropHarvest = () => {
    stats.value.totalCropsHarvested++
  }

  const recordFishCaught = () => {
    stats.value.totalFishCaught++
  }

  const recordMoneyEarned = (amount: number) => {
    stats.value.totalMoneyEarned += amount
  }

  const recordMineFloor = (floor: number) => {
    if (floor > stats.value.highestMineFloor) {
      stats.value.highestMineFloor = floor
    }
  }

  const recordRecipeCooked = () => {
    stats.value.totalRecipesCooked++
  }

  // === 成就检查 ===

  const checkAchievements = (): AchievementDef[] => {
    const newlyCompleted: AchievementDef[] = []

    for (const achievement of ACHIEVEMENTS) {
      if (completedAchievements.value.includes(achievement.id)) continue

      let met = false
      const c = achievement.condition

      switch (c.type) {
        case 'itemCount':
          met = discoveredItems.value.length >= c.count
          break
        case 'cropHarvest':
          met = stats.value.totalCropsHarvested >= c.count
          break
        case 'fishCaught':
          met = stats.value.totalFishCaught >= c.count
          break
        case 'moneyEarned':
          met = stats.value.totalMoneyEarned >= c.amount
          break
        case 'mineFloor':
          met = stats.value.highestMineFloor >= c.floor
          break
        case 'recipesCooked':
          met = stats.value.totalRecipesCooked >= c.count
          break
        case 'skillLevel':
          // 任意技能达到指定等级
          met = skillStore.skills.some(s => s.level >= c.level)
          break
        case 'npcFriendship':
          met = npcStore.npcStates.every(n => npcStore.getFriendshipLevel(n.npcId) !== 'stranger')
          break
        case 'questsCompleted': {
          const questStore = useQuestStore()
          met = questStore.completedQuestCount >= c.count
          break
        }
        case 'npcBestFriend': {
          const bestFriendCount = npcStore.npcStates.filter(n => npcStore.getFriendshipLevel(n.npcId) === 'bestFriend').length
          met = bestFriendCount >= c.count
          break
        }
        case 'npcAllFriendly':
          met = npcStore.npcStates.every(n => {
            const level = npcStore.getFriendshipLevel(n.npcId)
            return level === 'friendly' || level === 'bestFriend'
          })
          break
        case 'married':
          met = npcStore.getSpouse() !== null
          break
        case 'hasChild':
          met = npcStore.children.length > 0
          break
      }

      if (met) {
        completedAchievements.value.push(achievement.id)
        // 发放奖励
        if (achievement.reward.money) {
          playerStore.earnMoney(achievement.reward.money)
        }
        if (achievement.reward.items) {
          for (const item of achievement.reward.items) {
            inventoryStore.addItem(item.itemId, item.quantity)
          }
        }
        newlyCompleted.push(achievement)
      }
    }

    return newlyCompleted
  }

  // === 社区任务 ===

  const submitToBundle = (bundleId: string, itemId: string, quantity: number): boolean => {
    if (completedBundles.value.includes(bundleId)) return false
    const bundle = COMMUNITY_BUNDLES.find(b => b.id === bundleId)
    if (!bundle) return false

    const req = bundle.requiredItems.find(r => r.itemId === itemId)
    if (!req) return false

    if (!inventoryStore.removeItem(itemId, quantity)) return false

    if (!bundleSubmissions.value[bundleId]) {
      bundleSubmissions.value[bundleId] = {}
    }
    const sub = bundleSubmissions.value[bundleId]!
    sub[itemId] = (sub[itemId] ?? 0) + quantity

    // 检查是否完成
    const allMet = bundle.requiredItems.every(r => (sub[r.itemId] ?? 0) >= r.quantity)

    if (allMet) {
      completedBundles.value.push(bundleId)
      // 发放奖励
      if (bundle.reward.money) {
        playerStore.earnMoney(bundle.reward.money)
      }
      if (bundle.reward.items) {
        for (const item of bundle.reward.items) {
          inventoryStore.addItem(item.itemId, item.quantity)
        }
      }
    }

    return true
  }

  const getBundleProgress = (bundleId: string): Record<string, number> => {
    return bundleSubmissions.value[bundleId] ?? {}
  }

  const isBundleComplete = (bundleId: string): boolean => {
    return completedBundles.value.includes(bundleId)
  }

  // === 序列化 ===

  const serialize = () => {
    return {
      discoveredItems: discoveredItems.value,
      completedAchievements: completedAchievements.value,
      bundleSubmissions: bundleSubmissions.value,
      completedBundles: completedBundles.value,
      stats: stats.value
    }
  }

  const deserialize = (data: ReturnType<typeof serialize>) => {
    discoveredItems.value = data.discoveredItems ?? []
    completedAchievements.value = data.completedAchievements ?? []
    bundleSubmissions.value = data.bundleSubmissions ?? {}
    completedBundles.value = data.completedBundles ?? []
    stats.value = data.stats ?? {
      totalCropsHarvested: 0,
      totalFishCaught: 0,
      totalMoneyEarned: 0,
      highestMineFloor: 0,
      totalRecipesCooked: 0
    }
  }

  return {
    discoveredItems,
    completedAchievements,
    bundleSubmissions,
    completedBundles,
    stats,
    discoveredCount,
    discoverItem,
    isDiscovered,
    recordCropHarvest,
    recordFishCaught,
    recordMoneyEarned,
    recordMineFloor,
    recordRecipeCooked,
    checkAchievements,
    submitToBundle,
    getBundleProgress,
    isBundleComplete,
    serialize,
    deserialize
  }
})
