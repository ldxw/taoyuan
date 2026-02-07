import type { Season } from './game'

/** 任务类型 */
export type QuestType = 'delivery' | 'fishing' | 'mining' | 'gathering'

/** 任务目标模板 */
export interface QuestTargetDef {
  itemId: string
  name: string
  minQty: number
  maxQty: number
  /** 该目标在哪些季节可用 (空数组=全季节) */
  seasons: Season[]
  /** 物品单价(用于计算奖励) */
  unitPrice: number
}

/** 任务模板(按类型) */
export interface QuestTemplateDef {
  type: QuestType
  targets: QuestTargetDef[]
  npcPool: string[]
  rewardMultiplier: number
  friendshipReward: number
}

/** 任务实例(运行时) */
export interface QuestInstance {
  id: string
  type: QuestType
  npcId: string
  npcName: string
  description: string
  targetItemId: string
  targetItemName: string
  targetQuantity: number
  collectedQuantity: number
  moneyReward: number
  friendshipReward: number
  daysRemaining: number
  accepted: boolean
}
