import type { SkillType } from './skill'

/** 成就条件类型 */
export type AchievementCondition =
  | { type: 'itemCount'; count: number }
  | { type: 'cropHarvest'; count: number }
  | { type: 'fishCaught'; count: number }
  | { type: 'moneyEarned'; amount: number }
  | { type: 'mineFloor'; floor: number }
  | { type: 'recipesCooked'; count: number }
  | { type: 'npcFriendship'; level: string }
  | { type: 'skillLevel'; skillType: SkillType; level: number }
  | { type: 'questsCompleted'; count: number }
  | { type: 'npcBestFriend'; count: number }
  | { type: 'npcAllFriendly' }
  | { type: 'married' }
  | { type: 'hasChild' }

/** 成就定义 */
export interface AchievementDef {
  id: string
  name: string
  description: string
  condition: AchievementCondition
  reward: {
    money?: number
    items?: { itemId: string; quantity: number }[]
  }
}

/** 社区任务定义 */
export interface CommunityBundleDef {
  id: string
  name: string
  description: string
  requiredItems: { itemId: string; quantity: number }[]
  reward: {
    money?: number
    items?: { itemId: string; quantity: number }[]
    description: string
  }
}
