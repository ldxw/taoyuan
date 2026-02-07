import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { InventoryItem, Quality, Tool, ToolType, ToolTier } from '@/types'

const INITIAL_CAPACITY = 20
const MAX_CAPACITY = 36
const MAX_STACK = 99

export const useInventoryStore = defineStore('inventory', () => {
  const items = ref<InventoryItem[]>([])
  const capacity = ref(INITIAL_CAPACITY)
  const tools = ref<Tool[]>([
    { type: 'wateringCan', tier: 'basic' },
    { type: 'hoe', tier: 'basic' },
    { type: 'pickaxe', tier: 'basic' },
    { type: 'fishingRod', tier: 'basic' }
  ])

  const isFull = computed(() => items.value.length >= capacity.value)

  /** 添加物品到背包 */
  const addItem = (itemId: string, quantity: number = 1, quality: Quality = 'normal'): boolean => {
    let remaining = quantity

    // 先填充已有的同类栈
    for (const slot of items.value) {
      if (remaining <= 0) break
      if (slot.itemId === itemId && slot.quality === quality && slot.quantity < MAX_STACK) {
        const canAdd = Math.min(remaining, MAX_STACK - slot.quantity)
        slot.quantity += canAdd
        remaining -= canAdd
      }
    }

    // 剩余部分创建新栈
    while (remaining > 0 && !isFull.value) {
      const batch = Math.min(remaining, MAX_STACK)
      items.value.push({ itemId, quantity: batch, quality })
      remaining -= batch
    }

    return remaining <= 0
  }

  /** 移除物品（支持跨栈删除） */
  const removeItem = (itemId: string, quantity: number = 1, quality: Quality = 'normal'): boolean => {
    // 先检查总数是否足够
    const total = items.value.filter(i => i.itemId === itemId && i.quality === quality).reduce((sum, i) => sum + i.quantity, 0)
    if (total < quantity) return false

    let remaining = quantity
    for (let i = items.value.length - 1; i >= 0 && remaining > 0; i--) {
      const slot = items.value[i]!
      if (slot.itemId !== itemId || slot.quality !== quality) continue
      const take = Math.min(remaining, slot.quantity)
      slot.quantity -= take
      remaining -= take
      if (slot.quantity <= 0) {
        items.value.splice(i, 1)
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

  /** 检查是否拥有足够数量 */
  const hasItem = (itemId: string, quantity: number = 1): boolean => {
    return getItemCount(itemId) >= quantity
  }

  /** 扩容背包 */
  const expandCapacity = (): boolean => {
    if (capacity.value >= MAX_CAPACITY) return false
    capacity.value += 4
    return true
  }

  /** 获取工具 */
  const getTool = (type: ToolType): Tool | undefined => {
    return tools.value.find(t => t.type === type)
  }

  /** 获取工具等级对应的体力消耗倍率 */
  const getToolStaminaMultiplier = (type: ToolType): number => {
    const tool = getTool(type)
    if (!tool) return 1
    const multipliers: Record<ToolTier, number> = { basic: 1.0, iron: 0.8, steel: 0.6 }
    return multipliers[tool.tier]
  }

  /** 升级工具 */
  const upgradeTool = (type: ToolType): boolean => {
    const tool = getTool(type)
    if (!tool) return false
    const tiers: ToolTier[] = ['basic', 'iron', 'steel']
    const currentIndex = tiers.indexOf(tool.tier)
    if (currentIndex >= tiers.length - 1) return false
    tool.tier = tiers[currentIndex + 1]!
    return true
  }

  const serialize = () => {
    return { items: items.value, capacity: capacity.value, tools: tools.value }
  }

  const deserialize = (data: ReturnType<typeof serialize>) => {
    items.value = data.items ?? []
    capacity.value = data.capacity ?? INITIAL_CAPACITY
    tools.value = data.tools ?? [
      { type: 'wateringCan', tier: 'basic' },
      { type: 'hoe', tier: 'basic' },
      { type: 'pickaxe', tier: 'basic' },
      { type: 'fishingRod', tier: 'basic' }
    ]
  }

  return {
    items,
    capacity,
    tools,
    isFull,
    addItem,
    removeItem,
    getItemCount,
    hasItem,
    expandCapacity,
    getTool,
    getToolStaminaMultiplier,
    upgradeTool,
    serialize,
    deserialize
  }
})
