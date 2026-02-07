import type { FarmhouseLevel } from '@/types'

/** 农舍升级定义 */
export interface FarmhouseUpgradeDef {
  level: FarmhouseLevel
  name: string
  description: string
  cost: number
  materialCost: { itemId: string; quantity: number }[]
  benefit: string
}

export const FARMHOUSE_UPGRADES: FarmhouseUpgradeDef[] = [
  {
    level: 1,
    name: '砖房',
    description: '升级厨房，烹饪体力恢复+20%。',
    cost: 10000,
    materialCost: [{ itemId: 'wood', quantity: 200 }],
    benefit: 'kitchen_bonus'
  },
  {
    level: 2,
    name: '宅院',
    description: '宽敞的院落，每晚额外恢复10%体力。',
    cost: 50000,
    materialCost: [
      { itemId: 'wood', quantity: 100 },
      { itemId: 'iron_ore', quantity: 50 }
    ],
    benefit: 'stamina_bonus'
  },
  {
    level: 3,
    name: '酒窖',
    description: '地下酒窖，可陈酿美酒提升品质。',
    cost: 100000,
    materialCost: [
      { itemId: 'wood', quantity: 100 },
      { itemId: 'gold_ore', quantity: 30 }
    ],
    benefit: 'cellar'
  }
]

/** 山洞解锁条件 — 累计收入达到此值 */
export const CAVE_UNLOCK_EARNINGS = 25000

/** 蘑菇洞每天产出概率 */
export const CAVE_MUSHROOM_DAILY_CHANCE = 0.6

/** 蝙蝠洞每天产出概率 */
export const CAVE_FRUIT_BAT_DAILY_CHANCE = 0.5

/** 温室解锁价格 */
export const GREENHOUSE_UNLOCK_COST = 35000

/** 温室材料需求 */
export const GREENHOUSE_MATERIAL_COST = [
  { itemId: 'wood', quantity: 200 },
  { itemId: 'iron_ore', quantity: 30 },
  { itemId: 'gold_ore', quantity: 10 }
]

/** 温室地块数 */
export const GREENHOUSE_PLOT_COUNT = 12

/** 酒窖陈酿天数——提升一档品质所需天数 */
export const CELLAR_AGING_DAYS = 14

/** 酒窖最大容量 */
export const CELLAR_MAX_SLOTS = 6

export const getFarmhouseUpgrade = (level: number): FarmhouseUpgradeDef | undefined => {
  return FARMHOUSE_UPGRADES.find(u => u.level === level)
}
