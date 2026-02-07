import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { MachineType, ProcessingSlot } from '@/types'
import {
  PROCESSING_MACHINES,
  SPRINKLERS,
  FERTILIZERS,
  BAITS,
  TACKLES,
  TAPPER,
  BOMBS,
  getRecipesForMachine,
  getProcessingRecipeById
} from '@/data/processing'
import { useInventoryStore } from './useInventoryStore'
import { usePlayerStore } from './usePlayerStore'

/** 最大放置机器数 */
const MAX_MACHINES = 6

export const useProcessingStore = defineStore('processing', () => {
  const inventoryStore = useInventoryStore()
  const playerStore = usePlayerStore()

  /** 已放置的加工机器（运行中的槽位） */
  const machines = ref<ProcessingSlot[]>([])

  /** 当前放置数量 */
  const machineCount = computed(() => machines.value.length)

  // === 制造(Craft) ===

  /** 检查是否有足够材料制造某样东西 */
  const canCraft = (craftCost: { itemId: string; quantity: number }[], craftMoney: number): boolean => {
    if (playerStore.money < craftMoney) return false
    return craftCost.every(c => inventoryStore.hasItem(c.itemId, c.quantity))
  }

  /** 消耗材料 */
  const consumeCraftMaterials = (craftCost: { itemId: string; quantity: number }[], craftMoney: number): boolean => {
    if (!canCraft(craftCost, craftMoney)) return false
    if (!playerStore.spendMoney(craftMoney)) return false
    for (const c of craftCost) {
      if (!inventoryStore.removeItem(c.itemId, c.quantity)) {
        // 回退（简化处理：理论上不会到这里因为canCraft已检查）
        playerStore.earnMoney(craftMoney)
        return false
      }
    }
    return true
  }

  /** 制造并放置一台加工机器 */
  const craftMachine = (machineType: MachineType): boolean => {
    if (machines.value.length >= MAX_MACHINES) return false
    const def = PROCESSING_MACHINES.find(m => m.id === machineType)
    if (!def) return false
    if (!consumeCraftMaterials(def.craftCost, def.craftMoney)) return false
    machines.value.push({
      machineType,
      recipeId: null,
      inputItemId: null,
      daysProcessed: 0,
      totalDays: 0,
      ready: false
    })
    return true
  }

  /** 制造洒水器（返回物品ID放入背包） */
  const craftSprinkler = (sprinklerId: string): boolean => {
    const def = SPRINKLERS.find(s => s.id === sprinklerId)
    if (!def) return false
    if (!consumeCraftMaterials(def.craftCost, def.craftMoney)) return false
    inventoryStore.addItem(def.id)
    return true
  }

  /** 制造肥料 */
  const craftFertilizer = (fertilizerId: string): boolean => {
    const def = FERTILIZERS.find(f => f.id === fertilizerId)
    if (!def) return false
    if (!consumeCraftMaterials(def.craftCost, def.craftMoney)) return false
    inventoryStore.addItem(def.id)
    return true
  }

  /** 制造鱼饵 */
  const craftBait = (baitId: string): boolean => {
    const def = BAITS.find(b => b.id === baitId)
    if (!def) return false
    if (!consumeCraftMaterials(def.craftCost, def.craftMoney)) return false
    inventoryStore.addItem(def.id)
    return true
  }

  /** 制造浮漂 */
  const craftTackle = (tackleId: string): boolean => {
    const def = TACKLES.find(t => t.id === tackleId)
    if (!def) return false
    if (!consumeCraftMaterials(def.craftCost, def.craftMoney)) return false
    inventoryStore.addItem(def.id)
    return true
  }

  /** 制造采脂器 */
  const craftTapper = (): boolean => {
    if (!consumeCraftMaterials(TAPPER.craftCost, TAPPER.craftMoney)) return false
    inventoryStore.addItem(TAPPER.id)
    return true
  }

  /** 制造炸弹 */
  const craftBomb = (bombId: string): boolean => {
    const def = BOMBS.find(b => b.id === bombId)
    if (!def) return false
    if (!consumeCraftMaterials(def.craftCost, def.craftMoney)) return false
    inventoryStore.addItem(def.id)
    return true
  }

  // === 加工操作 ===

  /** 向已放置的机器投入原料开始加工 */
  const startProcessing = (slotIndex: number, recipeId: string): boolean => {
    const slot = machines.value[slotIndex]
    if (!slot || slot.recipeId !== null) return false // 正在加工中
    const recipe = getProcessingRecipeById(recipeId)
    if (!recipe || recipe.machineType !== slot.machineType) return false

    // 消耗输入材料（蜂箱无需输入）
    if (recipe.inputItemId !== null) {
      if (!inventoryStore.removeItem(recipe.inputItemId, recipe.inputQuantity)) return false
    }

    slot.recipeId = recipeId
    slot.inputItemId = recipe.inputItemId
    slot.daysProcessed = 0
    slot.totalDays = recipe.processingDays
    slot.ready = false
    return true
  }

  /** 收取加工产物 */
  const collectProduct = (slotIndex: number): string | null => {
    const slot = machines.value[slotIndex]
    if (!slot || !slot.ready || !slot.recipeId) return null

    const recipe = getProcessingRecipeById(slot.recipeId)
    if (!recipe) return null

    inventoryStore.addItem(recipe.outputItemId, recipe.outputQuantity)

    // 重置槽位
    slot.recipeId = null
    slot.inputItemId = null
    slot.daysProcessed = 0
    slot.totalDays = 0
    slot.ready = false

    return recipe.outputItemId
  }

  /** 拆除机器（返还到背包） */
  const removeMachine = (slotIndex: number): boolean => {
    const slot = machines.value[slotIndex]
    if (!slot) return false
    // 如果正在加工，退回原料
    if (slot.recipeId && !slot.ready && slot.inputItemId) {
      const recipe = getProcessingRecipeById(slot.recipeId)
      if (recipe && recipe.inputItemId) {
        inventoryStore.addItem(recipe.inputItemId, recipe.inputQuantity)
      }
    }
    machines.value.splice(slotIndex, 1)
    return true
  }

  /** 获取某台机器可用的加工配方列表 */
  const getAvailableRecipes = (machineType: MachineType) => {
    return getRecipesForMachine(machineType)
  }

  // === 每日更新 ===

  const dailyUpdate = () => {
    for (const slot of machines.value) {
      if (!slot.recipeId || slot.ready) continue
      slot.daysProcessed++
      if (slot.daysProcessed >= slot.totalDays) {
        slot.ready = true
      }
    }
  }

  // === 序列化 ===

  const serialize = () => {
    return { machines: machines.value }
  }

  const deserialize = (data: ReturnType<typeof serialize>) => {
    machines.value = data.machines ?? []
  }

  return {
    machines,
    machineCount,
    MAX_MACHINES,
    canCraft,
    craftMachine,
    craftSprinkler,
    craftFertilizer,
    craftBait,
    craftTackle,
    craftTapper,
    craftBomb,
    startProcessing,
    collectProduct,
    removeMachine,
    getAvailableRecipes,
    dailyUpdate,
    serialize,
    deserialize
  }
})
