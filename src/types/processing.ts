/** 加工机器类型 */
export type MachineType = 'wine_workshop' | 'sauce_jar' | 'bee_house' | 'oil_press'

/** 加工机器定义 */
export interface ProcessingMachineDef {
  id: MachineType
  name: string
  description: string
  craftCost: { itemId: string; quantity: number }[]
  craftMoney: number
}

/** 加工配方定义 */
export interface ProcessingRecipeDef {
  id: string
  machineType: MachineType
  name: string
  /** 输入物品ID（null = 无需输入，如蜂箱） */
  inputItemId: string | null
  inputQuantity: number
  outputItemId: string
  outputQuantity: number
  /** 加工天数 */
  processingDays: number
  description: string
}

/** 运行时加工槽位 */
export interface ProcessingSlot {
  machineType: MachineType
  recipeId: string | null
  inputItemId: string | null
  daysProcessed: number
  totalDays: number
  ready: boolean
}

/** 洒水器类型 */
export type SprinklerType = 'bamboo_sprinkler' | 'copper_sprinkler'

/** 洒水器定义 */
export interface SprinklerDef {
  id: SprinklerType
  name: string
  description: string
  range: 4 | 8
  craftCost: { itemId: string; quantity: number }[]
  craftMoney: number
}

/** 肥料类型 */
export type FertilizerType =
  | 'basic_fertilizer'
  | 'quality_fertilizer'
  | 'speed_gro'
  | 'deluxe_speed_gro'
  | 'retaining_soil'
  | 'quality_retaining_soil'

/** 肥料定义 */
export interface FertilizerDef {
  id: FertilizerType
  name: string
  description: string
  /** 品质提升概率加成 (0.2 = +20%) */
  qualityBonus?: number
  /** 生长速度加成百分比 (0.25 = +25%) */
  growthSpeedup?: number
  /** 隔夜保水概率 (0.5 = 50%) */
  retainChance?: number
  craftCost: { itemId: string; quantity: number }[]
  craftMoney: number
  shopPrice: number | null
}

/** 鱼饵类型 */
export type BaitType = 'standard_bait' | 'wild_bait' | 'magic_bait'

/** 鱼饵定义 */
export interface BaitDef {
  id: BaitType
  name: string
  description: string
  /** 行为概率修正 (calm/struggle/dash 增减) */
  behaviorModifier?: { calm: number; struggle: number; dash: number }
  /** 双倍鱼获概率 */
  doubleCatchChance?: number
  /** 是否无视季节限制 */
  ignoresSeason?: boolean
  craftCost: { itemId: string; quantity: number }[]
  craftMoney: number
  shopPrice: number | null
}

/** 浮漂类型 */
export type TackleType = 'spinner' | 'trap_bobber' | 'cork_bobber' | 'quality_bobber'

/** 浮漂定义 */
export interface TackleDef {
  id: TackleType
  name: string
  description: string
  maxDurability: number
  requiredRodTier: 'iron' | 'steel'
  /** 体力消耗减免 (0.5 = -50%) */
  staminaReduction?: number
  /** 断线时额外机会次数 */
  extraBreakChance?: number
  /** 挣扎成功率加成 */
  struggleBonus?: number
  /** 鱼品质提升档数 */
  qualityBoost?: number
  craftCost: { itemId: string; quantity: number }[]
  craftMoney: number
  shopPrice: number | null
}

/** 炸弹定义 */
export interface BombDef {
  id: string
  name: string
  description: string
  oreMultiplier: number
  clearsMonster: boolean
  craftCost: { itemId: string; quantity: number }[]
  craftMoney: number
  shopPrice: number | null
}

/** 野树类型 */
export type WildTreeType = 'pine' | 'camphor' | 'mulberry'

/** 野树定义 */
export interface WildTreeDef {
  type: WildTreeType
  name: string
  seedItemId: string
  growthDays: number
  tapProduct: string
  tapCycleDays: number
  tapProductName: string
}

/** 已种植的野树(运行时状态) */
export interface PlantedWildTree {
  id: number
  type: WildTreeType
  growthDays: number
  mature: boolean
  hasTapper: boolean
  tapDaysElapsed: number
  tapReady: boolean
}

/** 钱袋物品定义 */
export interface WalletItemDef {
  id: string
  name: string
  description: string
  effect: { type: string; value: number }
  unlockCondition: string
}
