/** 物品分类 */
export type ItemCategory =
  | 'seed'
  | 'crop'
  | 'fish'
  | 'ore'
  | 'gem'
  | 'gift'
  | 'food'
  | 'material'
  | 'misc'
  | 'processed'
  | 'machine'
  | 'sprinkler'
  | 'fertilizer'
  | 'animal_product'
  | 'sapling'
  | 'fruit'
  | 'bait'
  | 'tackle'
  | 'bomb'

/** 物品品质 */
export type Quality = 'normal' | 'fine' | 'excellent' | 'supreme'

/** 物品基础定义（配置数据用） */
export interface ItemDef {
  id: string
  name: string
  category: ItemCategory
  description: string
  sellPrice: number
  /** 是否可以食用 */
  edible: boolean
  /** 食用恢复体力 */
  staminaRestore?: number
  /** 食用恢复生命值 */
  healthRestore?: number
}

/** 背包中的物品实例 */
export interface InventoryItem {
  itemId: string
  quantity: number
  quality: Quality
}

/** 工具等级 */
export type ToolTier = 'basic' | 'iron' | 'steel'

/** 工具类型 */
export type ToolType = 'wateringCan' | 'hoe' | 'pickaxe' | 'fishingRod'

/** 工具实例 */
export interface Tool {
  type: ToolType
  tier: ToolTier
}
