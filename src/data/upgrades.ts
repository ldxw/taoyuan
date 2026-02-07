import type { ToolType, ToolTier } from '@/types'

/** 工具升级所需材料和费用 */
export interface ToolUpgradeCost {
  fromTier: ToolTier
  toTier: ToolTier
  money: number
  materials: { itemId: string; quantity: number }[]
}

/** 各工具的升级费用 */
export const TOOL_UPGRADE_COSTS: Record<ToolType, ToolUpgradeCost[]> = {
  wateringCan: [
    { fromTier: 'basic', toTier: 'iron', money: 200, materials: [{ itemId: 'iron_ore', quantity: 5 }] },
    { fromTier: 'iron', toTier: 'steel', money: 500, materials: [{ itemId: 'gold_ore', quantity: 5 }] }
  ],
  hoe: [
    { fromTier: 'basic', toTier: 'iron', money: 200, materials: [{ itemId: 'iron_ore', quantity: 5 }] },
    { fromTier: 'iron', toTier: 'steel', money: 500, materials: [{ itemId: 'gold_ore', quantity: 5 }] }
  ],
  pickaxe: [
    { fromTier: 'basic', toTier: 'iron', money: 300, materials: [{ itemId: 'iron_ore', quantity: 8 }] },
    { fromTier: 'iron', toTier: 'steel', money: 800, materials: [{ itemId: 'gold_ore', quantity: 8 }] }
  ],
  fishingRod: [
    {
      fromTier: 'basic',
      toTier: 'iron',
      money: 250,
      materials: [
        { itemId: 'iron_ore', quantity: 3 },
        { itemId: 'wood', quantity: 5 }
      ]
    },
    {
      fromTier: 'iron',
      toTier: 'steel',
      money: 600,
      materials: [
        { itemId: 'gold_ore', quantity: 3 },
        { itemId: 'bamboo', quantity: 5 }
      ]
    }
  ]
}

/** 获取某工具当前可用的升级信息 */
export const getUpgradeCost = (type: ToolType, currentTier: ToolTier): ToolUpgradeCost | undefined => {
  return TOOL_UPGRADE_COSTS[type].find(c => c.fromTier === currentTier)
}

/** 工具中文名 */
export const TOOL_NAMES: Record<ToolType, string> = {
  wateringCan: '水壶',
  hoe: '锄头',
  pickaxe: '镐',
  fishingRod: '鱼竿'
}

/** 工具等级中文名 */
export const TIER_NAMES: Record<ToolTier, string> = {
  basic: '初始',
  iron: '铁制',
  steel: '精钢'
}
