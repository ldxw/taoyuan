import { ref } from 'vue'
import {
  useGameStore,
  usePlayerStore,
  useFarmStore,
  useInventoryStore,
  useShopStore,
  useSkillStore,
  useCookingStore,
  useAchievementStore,
  useWalletStore,
  useQuestStore
} from '@/stores'
import { getCropById, getItemById } from '@/data'
import { getFertilizerById } from '@/data/processing'
import { ACTION_TIME_COSTS } from '@/data/timeConstants'
import type { Quality } from '@/types'
import { addLog, showFloat } from './useGameLog'
import { handleEndDay } from './useEndDay'
import { sfxDig, sfxPlant, sfxWater, sfxHarvest, sfxLevelUp, sfxBuy, sfxCoin } from './useAudio'

export const QUALITY_NAMES: Record<Quality, string> = {
  normal: '普通',
  fine: '优良',
  excellent: '精品',
  supreme: '极品'
}

// 模块级单例状态
const selectedSeed = ref<string | null>(null)

/** 处理地块点击：翻耕/种植/浇水/收获 */
export const handlePlotClick = (plotId: number) => {
  const gameStore = useGameStore()
  const playerStore = usePlayerStore()
  const farmStore = useFarmStore()
  const inventoryStore = useInventoryStore()
  const skillStore = useSkillStore()
  const cookingStore = useCookingStore()
  const achievementStore = useAchievementStore()

  const plot = farmStore.plots[plotId]
  if (!plot) return

  if (gameStore.isPastBedtime) {
    addLog('已经凌晨2点了，你必须休息。')
    handleEndDay()
    return
  }

  if (plot.state === 'wasteland') {
    if (!inventoryStore.isToolAvailable('hoe')) {
      addLog('锄头正在升级中，无法开垦。')
      return
    }
    const farmingBuff = cookingStore.activeBuff?.type === 'farming' ? cookingStore.activeBuff.value / 100 : 0
    const ringFarmReduction = inventoryStore.getRingEffectValue('farming_stamina')
    const ringGlobalReduction = inventoryStore.getRingEffectValue('stamina_reduction')
    const cost = Math.max(
      1,
      Math.floor(3 * inventoryStore.getToolStaminaMultiplier('hoe') * (1 - skillStore.getStaminaReduction('farming')) * (1 - farmingBuff) * (1 - ringFarmReduction) * (1 - ringGlobalReduction))
    )
    if (!playerStore.consumeStamina(cost)) {
      addLog('体力不足，无法开垦。')
      return
    }
    farmStore.tillPlot(plotId)
    sfxDig()
    showFloat(`-${cost}体力`, 'danger')
    addLog(`你开垦了一块荒地。(-${cost}体力)`)
    const tr = gameStore.advanceTime(ACTION_TIME_COSTS.till)
    if (tr.message) addLog(tr.message)
    if (tr.passedOut) {
      handleEndDay()
      return
    }
  } else if (plot.state === 'tilled' && selectedSeed.value) {
    const cropDef = getCropById(selectedSeed.value)
    if (!cropDef) return
    if (!inventoryStore.hasItem(cropDef.seedId)) {
      addLog(`没有${cropDef.name}种子了。`)
      return
    }
    const cropFarmingBuff = cookingStore.activeBuff?.type === 'farming' ? cookingStore.activeBuff.value / 100 : 0
    const cropRingFarmReduction = inventoryStore.getRingEffectValue('farming_stamina')
    const cropRingGlobalReduction = inventoryStore.getRingEffectValue('stamina_reduction')
    const cost = Math.max(
      1,
      Math.floor(
        3 * inventoryStore.getToolStaminaMultiplier('hoe') * (1 - skillStore.getStaminaReduction('farming')) * (1 - cropFarmingBuff) * (1 - cropRingFarmReduction) * (1 - cropRingGlobalReduction)
      )
    )
    if (!playerStore.consumeStamina(cost)) {
      addLog('体力不足，无法播种。')
      return
    }
    inventoryStore.removeItem(cropDef.seedId)
    farmStore.plantCrop(plotId, cropDef.id)
    sfxPlant()
    showFloat(`-${cost}体力`, 'danger')
    addLog(`种下了${cropDef.name}。(-${cost}体力)`)
    const tr = gameStore.advanceTime(ACTION_TIME_COSTS.plant)
    if (tr.message) addLog(tr.message)
    if (tr.passedOut) {
      handleEndDay()
      return
    }
  } else if (plot.state === 'planted' || plot.state === 'growing') {
    if (!inventoryStore.isToolAvailable('wateringCan')) {
      addLog('水壶正在升级中，无法浇水。')
      return
    }
    if (plot.watered) {
      addLog('这块地今天已经浇过水了。')
      return
    }
    const crop = getCropById(plot.cropId!)
    const baseCost = crop?.deepWatering ? 3 : 2
    const farmingBuff = cookingStore.activeBuff?.type === 'farming' ? cookingStore.activeBuff.value / 100 : 0
    const waterRingFarmReduction = inventoryStore.getRingEffectValue('farming_stamina')
    const waterRingGlobalReduction = inventoryStore.getRingEffectValue('stamina_reduction')
    const cost = Math.max(
      1,
      Math.floor(
        baseCost *
          inventoryStore.getToolStaminaMultiplier('wateringCan') *
          (1 - skillStore.getStaminaReduction('farming')) *
          (1 - farmingBuff) *
          (1 - waterRingFarmReduction) *
          (1 - waterRingGlobalReduction)
      )
    )
    if (!playerStore.consumeStamina(cost)) {
      addLog('体力不足，无法浇水。')
      return
    }
    farmStore.waterPlot(plotId)
    skillStore.addExp('farming', 2)
    sfxWater()
    showFloat(`-${cost}体力`, 'water')
    addLog(`浇水完成。(-${cost}体力)`)
    const tr = gameStore.advanceTime(ACTION_TIME_COSTS.water)
    if (tr.message) addLog(tr.message)
    if (tr.passedOut) {
      handleEndDay()
      return
    }
  } else if (plot.state === 'harvestable') {
    if (!inventoryStore.isToolAvailable('scythe')) {
      addLog('镰刀正在升级中，无法收获。')
      return
    }
    // 镰刀收获不消耗体力
    // 在收获清除前读取肥料信息
    const plotFertilizer = plot.fertilizer
    const cropId = farmStore.harvestPlot(plotId)
    if (cropId) {
      const cropDef = getCropById(cropId)
      const fertDef = plotFertilizer ? getFertilizerById(plotFertilizer) : null
      const ringCropQualityBonus = inventoryStore.getRingEffectValue('crop_quality_bonus')
      const quality = skillStore.rollCropQualityWithBonus((fertDef?.qualityBonus ?? 0) + ringCropQualityBonus)
      // 精耕细作天赋：20% 概率双倍收获
      const intensiveDouble = skillStore.getSkill('farming').perk10 === 'intensive' && Math.random() < 0.2
      const harvestQty = intensiveDouble ? 2 : 1
      inventoryStore.addItem(cropId, harvestQty, quality)
      achievementStore.discoverItem(cropId)
      achievementStore.recordCropHarvest()
      useQuestStore().onItemObtained(cropId, harvestQty)
      const { leveledUp, newLevel } = skillStore.addExp('farming', 10)
      const qualityLabel = quality !== 'normal' ? `(${QUALITY_NAMES[quality]})` : ''
      sfxHarvest()
      const qtyLabel = intensiveDouble ? '×2' : ''
      showFloat(`+${cropDef?.name ?? cropId}${qtyLabel}${qualityLabel}`, 'success')
      let msg = `收获了${cropDef?.name ?? cropId}${qtyLabel}${qualityLabel}！`
      if (intensiveDouble) msg += ' 精耕细作，双倍丰收！'
      if (leveledUp) {
        msg += ` 农耕提升到${newLevel}级！`
        sfxLevelUp()
      }
      addLog(msg)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.harvest)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) {
        handleEndDay()
        return
      }
    }
  }
}

/** 从商店购买种子 */
export const handleBuySeed = (seedId: string) => {
  const shopStore = useShopStore()
  const walletStore = useWalletStore()
  const seed = shopStore.availableSeeds.find(s => s.seedId === seedId)
  if (!seed) return
  const discount = walletStore.getShopDiscount()
  const actualPrice = Math.floor(seed.price * (1 - discount))
  if (shopStore.buySeed(seedId)) {
    sfxBuy()
    showFloat(`-${actualPrice}文`, 'danger')
    addLog(`购买了${seed.cropName}种子。(-${actualPrice}文)`)
  } else {
    addLog('金币不足或背包已满。')
  }
}

/** 通过商店出售物品 */
export const handleSellItem = (itemId: string, quality: Quality) => {
  const shopStore = useShopStore()
  const achievementStore = useAchievementStore()
  const itemDef = getItemById(itemId)
  if (!itemDef) return
  const earned = shopStore.sellItem(itemId, 1, quality)
  if (earned > 0) {
    sfxCoin()
    achievementStore.recordMoneyEarned(earned)
    showFloat(`+${earned}文`, 'accent')
    addLog(`卖出了${itemDef.name}。(+${earned}文)`)
  }
}

/** 出售指定物品的全部数量 */
export const handleSellItemAll = (itemId: string, quantity: number, quality: Quality) => {
  const shopStore = useShopStore()
  const achievementStore = useAchievementStore()
  const itemDef = getItemById(itemId)
  if (!itemDef || quantity <= 0) return
  const earned = shopStore.sellItem(itemId, quantity, quality)
  if (earned > 0) {
    sfxCoin()
    achievementStore.recordMoneyEarned(earned)
    showFloat(`+${earned}文`, 'accent')
    addLog(`卖出了${itemDef.name}×${quantity}。(+${earned}文)`)
  }
}

/** 一键出售背包中所有可出售物品 */
export const handleSellAll = () => {
  const shopStore = useShopStore()
  const inventoryStore = useInventoryStore()
  const achievementStore = useAchievementStore()
  let totalEarned = 0
  let totalCount = 0
  // 快照当前可卖物品（避免遍历中修改数组）
  const sellable = inventoryStore.items
    .filter(inv => {
      const def = getItemById(inv.itemId)
      return def && def.category !== 'seed'
    })
    .map(inv => ({ itemId: inv.itemId, quantity: inv.quantity, quality: inv.quality }))
  for (const item of sellable) {
    const earned = shopStore.sellItem(item.itemId, item.quantity, item.quality)
    if (earned > 0) {
      totalEarned += earned
      totalCount += item.quantity
    }
  }
  if (totalEarned > 0) {
    sfxCoin()
    achievementStore.recordMoneyEarned(totalEarned)
    showFloat(`+${totalEarned}文`, 'accent')
    addLog(`一键出售了${totalCount}件物品。(+${totalEarned}文)`)
  }
}

/** 一键浇水（浇所有未浇水地块，体力不足时自动停止） */
export const handleBatchWater = () => {
  const gameStore = useGameStore()
  const playerStore = usePlayerStore()
  const farmStore = useFarmStore()
  const inventoryStore = useInventoryStore()
  const skillStore = useSkillStore()
  const cookingStore = useCookingStore()

  if (!inventoryStore.isToolAvailable('wateringCan')) {
    addLog('水壶正在升级中，无法浇水。')
    return
  }

  if (gameStore.isPastBedtime) {
    addLog('已经凌晨2点了，你必须休息。')
    handleEndDay()
    return
  }

  const targets = farmStore.plots.filter(p => (p.state === 'planted' || p.state === 'growing') && !p.watered)
  if (targets.length === 0) {
    addLog('没有需要浇水的地块。')
    return
  }

  let watered = 0
  const batchRingFarmReduction = inventoryStore.getRingEffectValue('farming_stamina')
  const batchRingGlobalReduction = inventoryStore.getRingEffectValue('stamina_reduction')
  for (const plot of targets) {
    const crop = getCropById(plot.cropId!)
    const baseCost = crop?.deepWatering ? 3 : 2
    const farmingBuff = cookingStore.activeBuff?.type === 'farming' ? cookingStore.activeBuff.value / 100 : 0
    const cost = Math.max(
      1,
      Math.floor(
        baseCost *
          inventoryStore.getToolStaminaMultiplier('wateringCan') *
          (1 - skillStore.getStaminaReduction('farming')) *
          (1 - farmingBuff) *
          (1 - batchRingFarmReduction) *
          (1 - batchRingGlobalReduction)
      )
    )
    if (!playerStore.consumeStamina(cost)) break
    farmStore.waterPlot(plot.id)
    skillStore.addExp('farming', 2)
    watered++
  }

  if (watered > 0) {
    sfxWater()
    addLog(`一键浇水了${watered}块地。`)
    const tr = gameStore.advanceTime(ACTION_TIME_COSTS.batchWater * inventoryStore.getToolStaminaMultiplier('wateringCan'))
    if (tr.message) addLog(tr.message)
    if (tr.passedOut) handleEndDay()
  } else {
    addLog('体力不足，无法浇水。')
  }
}

/** 一键开垦（开垦所有荒地，体力不足时自动停止） */
export const handleBatchTill = () => {
  const gameStore = useGameStore()
  const playerStore = usePlayerStore()
  const farmStore = useFarmStore()
  const inventoryStore = useInventoryStore()
  const skillStore = useSkillStore()
  const cookingStore = useCookingStore()

  if (!inventoryStore.isToolAvailable('hoe')) {
    addLog('锄头正在升级中，无法开垦。')
    return
  }

  if (gameStore.isPastBedtime) {
    addLog('已经凌晨2点了，你必须休息。')
    handleEndDay()
    return
  }

  const targets = farmStore.plots.filter(p => p.state === 'wasteland')
  if (targets.length === 0) {
    addLog('没有需要开垦的荒地。')
    return
  }

  let tilled = 0
  const tillRingFarmReduction = inventoryStore.getRingEffectValue('farming_stamina')
  const tillRingGlobalReduction = inventoryStore.getRingEffectValue('stamina_reduction')
  for (const plot of targets) {
    const farmingBuff = cookingStore.activeBuff?.type === 'farming' ? cookingStore.activeBuff.value / 100 : 0
    const cost = Math.max(
      1,
      Math.floor(3 * inventoryStore.getToolStaminaMultiplier('hoe') * (1 - skillStore.getStaminaReduction('farming')) * (1 - farmingBuff) * (1 - tillRingFarmReduction) * (1 - tillRingGlobalReduction))
    )
    if (!playerStore.consumeStamina(cost)) break
    farmStore.tillPlot(plot.id)
    tilled++
  }

  if (tilled > 0) {
    sfxDig()
    addLog(`一键开垦了${tilled}块荒地。`)
    const tr = gameStore.advanceTime(ACTION_TIME_COSTS.batchTill * inventoryStore.getToolStaminaMultiplier('hoe'))
    if (tr.message) addLog(tr.message)
    if (tr.passedOut) handleEndDay()
  } else {
    addLog('体力不足，无法开垦。')
  }
}

/** 一键收获（收获所有成熟作物，不消耗体力） */
export const handleBatchHarvest = () => {
  const gameStore = useGameStore()
  const farmStore = useFarmStore()
  const inventoryStore = useInventoryStore()
  const skillStore = useSkillStore()
  const achievementStore = useAchievementStore()

  if (!inventoryStore.isToolAvailable('scythe')) {
    addLog('镰刀正在升级中，无法收获。')
    return
  }

  if (gameStore.isPastBedtime) {
    addLog('已经凌晨2点了，你必须休息。')
    handleEndDay()
    return
  }

  const targets = farmStore.plots.filter(p => p.state === 'harvestable' && p.giantCropGroup === null)
  if (targets.length === 0) {
    addLog('没有可收获的作物。')
    return
  }

  let harvested = 0
  const harvestedCrops: string[] = []

  for (const plot of targets) {
    const plotFertilizer = plot.fertilizer
    const cropId = farmStore.harvestPlot(plot.id)
    if (cropId) {
      const cropDef = getCropById(cropId)
      const fertDef = plotFertilizer ? getFertilizerById(plotFertilizer) : null
      const batchRingCropQuality = inventoryStore.getRingEffectValue('crop_quality_bonus')
      const quality = skillStore.rollCropQualityWithBonus((fertDef?.qualityBonus ?? 0) + batchRingCropQuality)
      const intensiveDouble = skillStore.getSkill('farming').perk10 === 'intensive' && Math.random() < 0.2
      const harvestQty = intensiveDouble ? 2 : 1
      inventoryStore.addItem(cropId, harvestQty, quality)
      achievementStore.discoverItem(cropId)
      achievementStore.recordCropHarvest()
      useQuestStore().onItemObtained(cropId, harvestQty)
      skillStore.addExp('farming', 10)
      harvested++
      harvestedCrops.push(cropDef?.name ?? cropId)
    }
  }

  if (harvested > 0) {
    sfxHarvest()
    addLog(`一键收获了${harvested}株作物：${harvestedCrops.join('、')}。`)
    const tr = gameStore.advanceTime(ACTION_TIME_COSTS.batchHarvest * inventoryStore.getToolStaminaMultiplier('scythe'))
    if (tr.message) addLog(tr.message)
    if (tr.passedOut) handleEndDay()
  }
}

export const useFarmActions = () => {
  return {
    selectedSeed,
    handlePlotClick,
    handleBuySeed,
    handleSellItem,
    handleSellItemAll,
    handleSellAll,
    handleBatchWater,
    handleBatchTill,
    handleBatchHarvest,
    QUALITY_NAMES
  }
}
