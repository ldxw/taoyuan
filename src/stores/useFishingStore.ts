import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { FishDef, FishBehavior, FishingAction, FishingRoundResult, BaitType, TackleType, BaitDef, TackleDef, Quality } from '@/types'
import { getAvailableFish, getBaitById, getTackleById } from '@/data'
import { FISH } from '@/data/fish'
import { useGameStore } from './useGameStore'
import { usePlayerStore } from './usePlayerStore'
import { useInventoryStore } from './useInventoryStore'
import { useSkillStore } from './useSkillStore'
import { useAchievementStore } from './useAchievementStore'
import { useCookingStore } from './useCookingStore'
import { useWalletStore } from './useWalletStore'

const STAMINA_COST = 4

export const useFishingStore = defineStore('fishing', () => {
  const gameStore = useGameStore()
  const playerStore = usePlayerStore()
  const inventoryStore = useInventoryStore()
  const skillStore = useSkillStore()

  /** 当前可钓的鱼 */
  const availableFish = computed(() => getAvailableFish(gameStore.season, gameStore.weather))

  /** 当前钓鱼会话状态 */
  const currentFish = ref<FishDef | null>(null)
  const currentRound = ref(0)
  const reelCount = ref(0)
  const isActive = ref(false)
  const roundLog = ref<FishingRoundResult[]>([])

  /** 鱼饵/浮漂装备 */
  const equippedBait = ref<BaitType | null>(null)
  const equippedTackle = ref<TackleType | null>(null)
  const tackleDurability = ref(0)

  /** 当次钓鱼会话的鱼饵/浮漂 */
  const activeBaitDef = ref<BaitDef | null>(null)
  const activeTackleDef = ref<TackleDef | null>(null)
  const trapBobberUsed = ref(false)

  /** 装备鱼饵 */
  const equipBait = (type: BaitType): { success: boolean; message: string } => {
    const def = getBaitById(type)
    if (!def) return { success: false, message: '无效的鱼饵。' }
    if (!inventoryStore.removeItem(type, 1)) return { success: false, message: '背包中没有该鱼饵。' }
    if (equippedBait.value) unequipBait()
    equippedBait.value = type
    return { success: true, message: `装备了${def.name}。` }
  }

  /** 卸下鱼饵 */
  const unequipBait = (): string => {
    if (!equippedBait.value) return '没有装备鱼饵。'
    const def = getBaitById(equippedBait.value)
    inventoryStore.addItem(equippedBait.value, 1)
    equippedBait.value = null
    return `卸下了${def?.name ?? '鱼饵'}。`
  }

  /** 装备浮漂 */
  const equipTackle = (type: TackleType): { success: boolean; message: string } => {
    const def = getTackleById(type)
    if (!def) return { success: false, message: '无效的浮漂。' }
    const rodTier = inventoryStore.getTool('fishingRod')?.tier ?? 'basic'
    if (rodTier === 'basic') return { success: false, message: '需要铁制或更好的鱼竿才能装备浮漂。' }
    if (!inventoryStore.removeItem(type, 1)) return { success: false, message: '背包中没有该浮漂。' }
    if (equippedTackle.value) unequipTackle()
    equippedTackle.value = type
    tackleDurability.value = def.maxDurability
    return { success: true, message: `装备了${def.name}。(耐久: ${def.maxDurability})` }
  }

  /** 卸下浮漂 */
  const unequipTackle = (): string => {
    if (!equippedTackle.value) return '没有装备浮漂。'
    const def = getTackleById(equippedTackle.value)
    if (tackleDurability.value > 0) {
      inventoryStore.addItem(equippedTackle.value, 1)
    }
    equippedTackle.value = null
    tackleDurability.value = 0
    return `卸下了${def?.name ?? '浮漂'}。`
  }

  /** 开始钓鱼 */
  const startFishing = (): { success: boolean; message: string } => {
    const rodMultiplier = inventoryStore.getToolStaminaMultiplier('fishingRod')
    // 旋转亮片减免体力
    const tackleDef = equippedTackle.value ? getTackleById(equippedTackle.value) : null
    const tackleStaminaReduction = tackleDef?.staminaReduction ?? 0
    const staminaCost = Math.max(
      1,
      Math.floor(STAMINA_COST * rodMultiplier * (1 - skillStore.getStaminaReduction('fishing')) * (1 - tackleStaminaReduction))
    )
    if (!playerStore.consumeStamina(staminaCost)) {
      return { success: false, message: '体力不足，无法钓鱼。' }
    }

    // 确定鱼池：magic_bait 忽略季节
    const baitDef = equippedBait.value ? getBaitById(equippedBait.value) : null
    const fishPool = baitDef?.ignoresSeason
      ? FISH.filter(f => f.weather.includes('any') || f.weather.includes(gameStore.weather as any))
      : availableFish.value

    if (fishPool.length === 0) {
      playerStore.restoreStamina(staminaCost)
      return { success: false, message: '当前季节和天气没有可钓的鱼。' }
    }

    // 消耗鱼饵
    activeBaitDef.value = baitDef ?? null
    if (equippedBait.value) equippedBait.value = null

    // 浮漂耐久-1
    activeTackleDef.value = tackleDef ?? null
    if (equippedTackle.value && tackleDef) {
      tackleDurability.value--
      if (tackleDurability.value <= 0) {
        equippedTackle.value = null
      }
    }
    trapBobberUsed.value = false

    // 随机选一条鱼
    const fish = pickRandomFish(fishPool)
    currentFish.value = fish
    currentRound.value = 0
    reelCount.value = 0
    isActive.value = true
    roundLog.value = []

    let msg = `抛竿入水……感觉有${fish.name}在附近！(-${staminaCost}体力)`
    if (activeBaitDef.value) msg += ` [${activeBaitDef.value.name}]`
    if (activeTackleDef.value) msg += ` [${activeTackleDef.value.name}]`
    return { success: true, message: msg }
  }

  /** 根据难度、钓鱼等级和鱼竿等级加权随机选鱼 */
  const pickRandomFish = (pool?: FishDef[]): FishDef => {
    const fishPool = pool ?? availableFish.value
    const cookingStore = useCookingStore()
    const fishingBuff = cookingStore.activeBuff?.type === 'fishing' ? cookingStore.activeBuff.value : 0
    const luckBuff = cookingStore.activeBuff?.type === 'luck' ? cookingStore.activeBuff.value / 100 : 0
    const effectiveLevel = skillStore.fishingLevel + fishingBuff
    const rodTier = inventoryStore.getTool('fishingRod')?.tier ?? 'basic'
    const hasAngler = skillStore.getSkill('fishing').perk10 === 'angler'
    const weights: number[] = fishPool.map(f => {
      if (f.difficulty === 'legendary') {
        const minLevel = hasAngler ? 6 : 8
        if (rodTier === 'basic' || effectiveLevel < minLevel) return 0
        return (hasAngler ? 1.5 : 0.5) * (1 + luckBuff)
      }
      if (f.difficulty === 'hard') {
        if (rodTier === 'basic' && effectiveLevel < 4) return 0
        return (rodTier === 'basic' ? 0.5 : 1) * (1 + luckBuff)
      }
      if (f.difficulty === 'easy') return 3
      if (f.difficulty === 'normal') return 2
      return 0.5
    })
    const total = weights.reduce((a, b) => a + b, 0)
    let roll = Math.random() * total
    for (let i = 0; i < fishPool.length; i++) {
      roll -= weights[i]!
      if (roll <= 0) return fishPool[i]!
    }
    return fishPool[0]!
  }

  /** 生成鱼的行为（应用鱼饵修正） */
  const rollBehavior = (): FishBehavior => {
    let calmChance = 0.4
    let struggleChance = 0.35
    // 猛冲概率 = 0.25

    // 钱袋: 钓翁令牌 calm+10%
    const walletStore = useWalletStore()
    calmChance += walletStore.getFishingCalmBonus()

    if (activeBaitDef.value?.behaviorModifier) {
      const mod = activeBaitDef.value.behaviorModifier
      calmChance += mod.calm
      struggleChance += mod.struggle
      // 猛冲概率自动补齐
    }

    const roll = Math.random()
    if (roll < calmChance) return 'calm'
    if (roll < calmChance + struggleChance) return 'struggle'
    return 'dash'
  }

  /** 执行一个回合 */
  const doRound = (action: FishingAction): FishingRoundResult | null => {
    if (!isActive.value || !currentFish.value) return null

    const behavior = rollBehavior()
    currentRound.value++
    let success = false
    let message = ''

    const behaviorText: Record<FishBehavior, string> = {
      calm: '鱼正安静地游着',
      struggle: '鱼在挣扎！',
      dash: '鱼猛地一冲！！'
    }

    if (action === 'reel') {
      if (behavior === 'calm') {
        success = true
        reelCount.value++
        message = `${behaviorText[behavior]}——你成功拉近了！(${reelCount.value}/${currentFish.value.requiredReel})`
      } else if (behavior === 'struggle') {
        const skillBonus = skillStore.fishingLevel * 0.05
        const trapperBonus = skillStore.getSkill('fishing').perk5 === 'trapper' ? 0.15 : 0
        // 软木浮标加成
        const corkBonus = activeTackleDef.value?.struggleBonus ?? 0
        // 钓鱼增益加成
        const cookingStore = useCookingStore()
        const fishingBuff = cookingStore.activeBuff?.type === 'fishing' ? cookingStore.activeBuff.value * 0.05 : 0
        success = Math.random() < 0.5 + skillBonus + trapperBonus + corkBonus + fishingBuff
        if (success) {
          reelCount.value++
          message = `${behaviorText[behavior]}——用力拉住了！(${reelCount.value}/${currentFish.value.requiredReel})`
        } else {
          message = `${behaviorText[behavior]}——拉线失败，鱼挣脱了一些。`
        }
      } else {
        // 猛冲 + 拉线 = 危险
        const breakChance = 0.4 - skillStore.fishingLevel * 0.03
        if (Math.random() < breakChance) {
          // 陷阱浮标保护
          if (activeTackleDef.value?.extraBreakChance && !trapBobberUsed.value) {
            trapBobberUsed.value = true
            message = `${behaviorText[behavior]}——差点断线！陷阱浮漂救了一命！`
          } else {
            message = `${behaviorText[behavior]}——鱼线断了！`
            endFishing()
            return { behavior, action, success: false, message }
          }
        } else {
          message = `${behaviorText[behavior]}——勉强撑住了，但没拉动。`
        }
      }
    } else if (action === 'slack') {
      if (behavior === 'dash') {
        success = true
        message = `${behaviorText[behavior]}——明智地放线，保住了鱼竿。`
      } else if (behavior === 'calm') {
        message = `${behaviorText[behavior]}——浪费了好机会。`
      } else {
        message = `${behaviorText[behavior]}——放线缓冲了冲击。`
      }
    } else {
      // 等待
      message = `${behaviorText[behavior]}——你静静等待着。`
    }

    const result: FishingRoundResult = { behavior, action, success, message }
    roundLog.value.push(result)

    // 检查是否钓到
    if (reelCount.value >= currentFish.value.requiredReel) {
      let quality: Quality = skillStore.rollCropQuality()
      // 品质浮标：品质+1档
      if (activeTackleDef.value?.qualityBoost) {
        const qualityOrder: Quality[] = ['normal', 'fine', 'excellent', 'supreme']
        const idx = qualityOrder.indexOf(quality)
        const newIdx = Math.min(idx + activeTackleDef.value.qualityBoost, qualityOrder.length - 1)
        quality = qualityOrder[newIdx]!
      }
      // 野生鱼饵：25% 概率双倍
      const catchQty = activeBaitDef.value?.doubleCatchChance && Math.random() < activeBaitDef.value.doubleCatchChance ? 2 : 1
      inventoryStore.addItem(currentFish.value.id, catchQty, quality)
      const achievementStore = useAchievementStore()
      achievementStore.discoverItem(currentFish.value.id)
      achievementStore.recordFishCaught()
      const expGain = currentFish.value.sellPrice
      const riverlandBonus = gameStore.farmMapType === 'riverland' ? 1.25 : 1.0
      skillStore.addExp('fishing', Math.floor(expGain * riverlandBonus))
      result.message +=
        catchQty > 1 ? ` 成功钓上了${catchQty}条${currentFish.value.name}！` : ` 成功钓上了${currentFish.value.name}！`
      endFishing()
    }

    // 检查是否回合用完
    if (currentFish.value && currentRound.value >= currentFish.value.rounds && reelCount.value < currentFish.value.requiredReel) {
      result.message += ' 鱼跑掉了……'
      endFishing()
    }

    return result
  }

  const endFishing = () => {
    isActive.value = false
    currentFish.value = null
    activeBaitDef.value = null
    activeTackleDef.value = null
  }

  const serialize = () => {
    return {
      equippedBait: equippedBait.value,
      equippedTackle: equippedTackle.value,
      tackleDurability: tackleDurability.value
    }
  }

  const deserialize = (data: ReturnType<typeof serialize>) => {
    equippedBait.value = data.equippedBait ?? null
    equippedTackle.value = data.equippedTackle ?? null
    tackleDurability.value = data.tackleDurability ?? 0
  }

  return {
    availableFish,
    currentFish,
    currentRound,
    reelCount,
    isActive,
    roundLog,
    equippedBait,
    equippedTackle,
    tackleDurability,
    equipBait,
    unequipBait,
    equipTackle,
    unequipTackle,
    startFishing,
    doRound,
    endFishing,
    serialize,
    deserialize
  }
})
