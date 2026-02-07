/** 技能类型 */
export type SkillType = 'farming' | 'foraging' | 'fishing' | 'mining'

/** 技能专精（等级5选择） */
export type SkillPerk5 =
  | 'harvester'
  | 'rancher' // 农耕
  | 'lumberjack'
  | 'herbalist' // 采集
  | 'fisher'
  | 'trapper' // 钓鱼
  | 'miner'
  | 'fighter' // 挖矿

/** 技能专精（等级10选择，基于等级5） */
export type SkillPerk10 =
  | 'intensive'
  | 'artisan' // 农耕: harvester分支
  | 'botanist'
  | 'alchemist' // 采集: herbalist分支
  | 'angler'
  | 'aquaculture' // 钓鱼: fisher分支
  | 'prospector'
  | 'warrior' // 挖矿: miner/fighter分支

/** 技能状态 */
export interface SkillState {
  type: SkillType
  exp: number
  level: number
  perk5: SkillPerk5 | null
  perk10: SkillPerk10 | null
}

/** 钓鱼中鱼的状态 */
export type FishBehavior = 'calm' | 'struggle' | 'dash'

/** 钓鱼玩家操作 */
export type FishingAction = 'reel' | 'slack' | 'wait'

/** 钓鱼回合结果 */
export interface FishingRoundResult {
  behavior: FishBehavior
  action: FishingAction
  success: boolean
  message: string
}

/** 鱼定义 */
export interface FishDef {
  id: string
  name: string
  season: ('spring' | 'summer' | 'autumn' | 'winter')[]
  weather: ('sunny' | 'rainy' | 'stormy' | 'snowy' | 'windy' | 'any')[]
  difficulty: 'easy' | 'normal' | 'hard' | 'legendary'
  sellPrice: number
  requiredReel: number // 需要成功拉线次数
  rounds: number // 总回合数
  description: string
  /** 钓鱼地点（默认creek） */
  location?: 'creek' | 'mine' | 'pond'
}

/** 矿洞层定义 */
export interface MineFloorDef {
  floor: number
  zone: 'shallow' | 'deep' | 'lava'
  ores: string[] // 可获得的矿石ID
  monsters: MonsterDef[]
  isSafePoint: boolean // 是否为安全点（每10层）
}

/** 怪物定义 */
export interface MonsterDef {
  id: string
  name: string
  hp: number
  attack: number // 造成的HP伤害
  defense: number
  expReward: number // 击杀给予的挖矿经验
  drops: { itemId: string; chance: number }[]
  description: string
}

/** 战斗状态 */
export interface CombatState {
  monster: MonsterDef
  monsterHp: number
  round: number
  log: string[]
}

/** 战斗操作 */
export type CombatAction = 'attack' | 'defend' | 'flee'

/** 食谱定义 */
export interface RecipeDef {
  id: string
  name: string
  ingredients: { itemId: string; quantity: number }[]
  effect: {
    staminaRestore: number
    healthRestore?: number
    buff?: {
      type: 'fishing' | 'mining' | 'giftBonus' | 'speed' | 'defense' | 'luck' | 'farming'
      value: number // 百分比或倍率
      description: string
    }
  }
  unlockSource: string // 解锁来源描述
  description: string
  /** 需要的技能等级才能烹饪 */
  requiredSkill?: { type: SkillType; level: number }
}
