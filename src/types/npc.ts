import type { Season } from './game'

/** 好感度等级 */
export type FriendshipLevel = 'stranger' | 'acquaintance' | 'friendly' | 'bestFriend'

/** NPC 定义 */
export interface NpcDef {
  id: string
  name: string
  role: string
  personality: string
  lovedItems: string[]
  likedItems: string[]
  hatedItems: string[]
  dialogues: Record<FriendshipLevel, string[]>
  /** 是否可以结婚 */
  marriageable?: boolean
  /** 关联的心事件ID列表 */
  heartEventIds?: string[]
  /** 生日 (季节+日期) */
  birthday?: { season: Season; day: number }
}

/** NPC 状态（运行时） */
export interface NpcState {
  npcId: string
  friendship: number
  talkedToday: boolean
  giftedToday: boolean
  /** 是否已结婚 */
  married: boolean
  /** 已触发的心事件ID */
  triggeredHeartEvents: string[]
}

/** 心事件场景 */
export interface HeartEventScene {
  text: string
  /** 该场景提供的选择（无则自动跳到下一场景） */
  choices?: {
    text: string
    friendshipChange: number
    response: string
  }[]
}

/** 心事件定义 */
export interface HeartEventDef {
  id: string
  npcId: string
  /** 触发所需的最低好感度 */
  requiredFriendship: number
  title: string
  scenes: HeartEventScene[]
}

/** 子女成长阶段 */
export type ChildStage = 'baby' | 'toddler' | 'child' | 'teen'

/** 子女状态 */
export interface ChildState {
  id: number
  name: string
  daysOld: number
  stage: ChildStage
  friendship: number
  interactedToday: boolean
}
