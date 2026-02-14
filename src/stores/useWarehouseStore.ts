import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { InventoryItem, Quality } from '@/types'
import { getItemById } from '@/data/items'

const INITIAL_CAPACITY = 30
const MAX_CAPACITY = 60
const MAX_STACK = 99
const EXPAND_STEP = 10
const UNLOCK_COST = 50000

export const useWarehouseStore = defineStore('warehouse', () => {
  const unlocked = ref(false)
  const items = ref<InventoryItem[]>([])
  const capacity = ref(INITIAL_CAPACITY)

  const isFull = computed(() => items.value.length >= capacity.value)

  /** 添加物品到仓库 */
  const addItem = (itemId: string, quantity: number = 1, quality: Quality = 'normal'): boolean => {
    let remaining = quantity

    for (const slot of items.value) {
      if (remaining <= 0) break
      if (slot.itemId === itemId && slot.quality === quality && slot.quantity < MAX_STACK) {
        const canAdd = Math.min(remaining, MAX_STACK - slot.quantity)
        slot.quantity += canAdd
        remaining -= canAdd
      }
    }

    while (remaining > 0 && !isFull.value) {
      const batch = Math.min(remaining, MAX_STACK)
      items.value.push({ itemId, quantity: batch, quality })
      remaining -= batch
    }

    return remaining <= 0
  }

  /** 移除物品，quality 不传时优先消耗低品质 */
  const removeItem = (itemId: string, quantity: number = 1, quality?: Quality): boolean => {
    const matchQuality = (i: { itemId: string; quality: Quality }) =>
      i.itemId === itemId && (quality === undefined || i.quality === quality)
    const total = items.value.filter(matchQuality).reduce((sum, i) => sum + i.quantity, 0)
    if (total < quantity) return false

    const qualityOrder: Quality[] = ['normal', 'fine', 'excellent', 'supreme']
    let remaining = quantity
    for (const q of quality !== undefined ? [quality] : qualityOrder) {
      for (let i = items.value.length - 1; i >= 0 && remaining > 0; i--) {
        const slot = items.value[i]!
        if (slot.itemId !== itemId || slot.quality !== q) continue
        const take = Math.min(remaining, slot.quantity)
        slot.quantity -= take
        remaining -= take
        if (slot.quantity <= 0) {
          items.value.splice(i, 1)
        }
      }
    }
    return true
  }

  /** 查询物品数量 */
  const getItemCount = (itemId: string, quality?: Quality): number => {
    return items.value
      .filter(i => i.itemId === itemId && (quality === undefined || i.quality === quality))
      .reduce((sum, i) => sum + i.quantity, 0)
  }

  /** 扩容仓库 */
  const expandCapacity = (): boolean => {
    if (capacity.value >= MAX_CAPACITY) return false
    capacity.value += EXPAND_STEP
    return true
  }

  const serialize = () => {
    return {
      unlocked: unlocked.value,
      items: items.value,
      capacity: capacity.value
    }
  }

  const deserialize = (data: ReturnType<typeof serialize>) => {
    unlocked.value = data.unlocked ?? false
    items.value = (data.items ?? []).filter(i => getItemById(i.itemId))
    capacity.value = data.capacity ?? INITIAL_CAPACITY
    // 兼容旧存档：如果有物品但未标记解锁，自动解锁
    if (!unlocked.value && items.value.length > 0) unlocked.value = true
  }

  return {
    unlocked,
    items,
    capacity,
    isFull,
    INITIAL_CAPACITY,
    MAX_CAPACITY,
    EXPAND_STEP,
    UNLOCK_COST,
    addItem,
    removeItem,
    getItemCount,
    expandCapacity,
    serialize,
    deserialize
  }
})
