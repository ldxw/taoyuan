import { computed } from 'vue'
import { defineStore } from 'pinia'
import { useGameStore } from './useGameStore'
import { usePlayerStore } from './usePlayerStore'
import { useInventoryStore } from './useInventoryStore'
import { useSkillStore } from './useSkillStore'
import { getCropsBySeason } from '@/data'
import { getItemById } from '@/data'
import { BAITS, TACKLES, FERTILIZERS } from '@/data/processing'
import type { Quality } from '@/types'

export const useShopStore = defineStore('shop', () => {
  const gameStore = useGameStore()
  const playerStore = usePlayerStore()
  const inventoryStore = useInventoryStore()
  const skillStore = useSkillStore()

  /** 当前季节可购买的种子 */
  const availableSeeds = computed(() => {
    return getCropsBySeason(gameStore.season).map(crop => ({
      seedId: crop.seedId,
      cropName: crop.name,
      price: crop.seedPrice,
      growthDays: crop.growthDays,
      sellPrice: crop.sellPrice
    }))
  })

  /** 购买种子 */
  const buySeed = (seedId: string, quantity: number = 1): boolean => {
    const seed = availableSeeds.value.find(s => s.seedId === seedId)
    if (!seed) return false
    const totalCost = seed.price * quantity
    if (!playerStore.spendMoney(totalCost)) return false
    if (!inventoryStore.addItem(seedId, quantity)) {
      // 回退金币
      playerStore.earnMoney(totalCost)
      return false
    }
    return true
  }

  /** 出售物品，返回实际售价（0表示失败） */
  const sellItem = (itemId: string, quantity: number = 1, quality: Quality = 'normal'): number => {
    const itemDef = getItemById(itemId)
    if (!itemDef) return 0
    if (!inventoryStore.removeItem(itemId, quantity, quality)) return 0

    const qualityMultiplier: Record<Quality, number> = {
      normal: 1.0,
      fine: 1.25,
      excellent: 1.5,
      supreme: 2.0
    }

    let bonus = 1.0
    // 工匠专精：加工品售价+25%
    if (itemDef.category === 'processed' && skillStore.getSkill('farming').perk10 === 'artisan') bonus *= 1.25
    // 丰收者专精：作物售价+10%
    if (itemDef.category === 'crop' && skillStore.getSkill('farming').perk5 === 'harvester') bonus *= 1.1
    // 牧场主专精：动物产品售价+20%
    if (itemDef.category === 'animal_product' && skillStore.getSkill('farming').perk5 === 'rancher') bonus *= 1.2
    // 渔夫专精：鱼售价+25%
    if (itemDef.category === 'fish' && skillStore.getSkill('fishing').perk5 === 'fisher') bonus *= 1.25
    // 水产专精：鱼售价+50%
    if (itemDef.category === 'fish' && skillStore.getSkill('fishing').perk10 === 'aquaculture') bonus *= 1.5
    // 河畔农场加成：鱼售价+10%
    if (itemDef.category === 'fish' && gameStore.farmMapType === 'riverland') bonus *= 1.1

    const totalPrice = Math.floor(itemDef.sellPrice * quantity * qualityMultiplier[quality] * bonus)
    playerStore.earnMoney(totalPrice)
    return totalPrice
  }

  /** 可购买的鱼饵（shopPrice != null） */
  const shopBaits = computed(() =>
    BAITS.filter(b => b.shopPrice !== null).map(b => ({
      id: b.id,
      name: b.name,
      description: b.description,
      price: b.shopPrice!
    }))
  )

  /** 可购买的浮漂（shopPrice != null） */
  const shopTackles = computed(() =>
    TACKLES.filter(t => t.shopPrice !== null).map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      price: t.shopPrice!
    }))
  )

  /** 可购买的肥料（shopPrice != null） */
  const shopFertilizers = computed(() =>
    FERTILIZERS.filter(f => f.shopPrice !== null).map(f => ({
      id: f.id,
      name: f.name,
      description: f.description,
      price: f.shopPrice!
    }))
  )

  /** 购买通用物品（鱼饵/浮漂/肥料） */
  const buyItem = (itemId: string, price: number, quantity: number = 1): boolean => {
    const totalCost = price * quantity
    if (!playerStore.spendMoney(totalCost)) return false
    if (!inventoryStore.addItem(itemId, quantity)) {
      playerStore.earnMoney(totalCost)
      return false
    }
    return true
  }

  return {
    availableSeeds,
    shopBaits,
    shopTackles,
    shopFertilizers,
    buySeed,
    buyItem,
    sellItem
  }
})
