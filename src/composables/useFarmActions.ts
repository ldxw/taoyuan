import { ref } from 'vue'
import {
  useGameStore,
  usePlayerStore,
  useFarmStore,
  useInventoryStore,
  useShopStore,
  useSkillStore,
  useCookingStore,
  useAchievementStore
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
    const farmingBuff = cookingStore.activeBuff?.type === 'farming' ? cookingStore.activeBuff.value / 100 : 0
    const cost = Math.max(
      1,
      Math.floor(3 * inventoryStore.getToolStaminaMultiplier('hoe') * (1 - skillStore.getStaminaReduction('farming')) * (1 - farmingBuff))
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
    const cost = Math.max(
      1,
      Math.floor(
        3 * inventoryStore.getToolStaminaMultiplier('hoe') * (1 - skillStore.getStaminaReduction('farming')) * (1 - cropFarmingBuff)
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
    if (plot.watered) {
      addLog('这块地今天已经浇过水了。')
      return
    }
    const crop = getCropById(plot.cropId!)
    const baseCost = crop?.deepWatering ? 2 : 1
    const farmingBuff = cookingStore.activeBuff?.type === 'farming' ? cookingStore.activeBuff.value / 100 : 0
    const cost = Math.max(
      1,
      Math.floor(
        baseCost *
          inventoryStore.getToolStaminaMultiplier('wateringCan') *
          (1 - skillStore.getStaminaReduction('farming')) *
          (1 - farmingBuff)
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
    if (!playerStore.consumeStamina(1)) {
      addLog('体力不足，无法收获。')
      return
    }
    // 在收获清除前读取肥料信息
    const plotFertilizer = plot.fertilizer
    const cropId = farmStore.harvestPlot(plotId)
    if (cropId) {
      const cropDef = getCropById(cropId)
      const fertDef = plotFertilizer ? getFertilizerById(plotFertilizer) : null
      const quality = skillStore.rollCropQualityWithBonus(fertDef?.qualityBonus ?? 0)
      // 精耕细作天赋：20% 概率双倍收获
      const intensiveDouble = skillStore.getSkill('farming').perk10 === 'intensive' && Math.random() < 0.2
      const harvestQty = intensiveDouble ? 2 : 1
      inventoryStore.addItem(cropId, harvestQty, quality)
      achievementStore.discoverItem(cropId)
      achievementStore.recordCropHarvest()
      const { leveledUp, newLevel } = skillStore.addExp('farming', 10)
      const qualityLabel = quality !== 'normal' ? `(${QUALITY_NAMES[quality]})` : ''
      sfxHarvest()
      const qtyLabel = intensiveDouble ? '×2' : ''
      showFloat(`+${cropDef?.name ?? cropId}${qtyLabel}${qualityLabel}`, 'success')
      let msg = `收获了${cropDef?.name ?? cropId}${qtyLabel}${qualityLabel}！(-1体力)`
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
  const seed = shopStore.availableSeeds.find(s => s.seedId === seedId)
  if (!seed) return
  if (shopStore.buySeed(seedId)) {
    sfxBuy()
    showFloat(`-${seed.price}文`, 'danger')
    addLog(`购买了${seed.cropName}种子。(-${seed.price}文)`)
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

export const useFarmActions = () => {
  return {
    selectedSeed,
    handlePlotClick,
    handleBuySeed,
    handleSellItem,
    handleSellItemAll,
    handleSellAll,
    QUALITY_NAMES
  }
}
