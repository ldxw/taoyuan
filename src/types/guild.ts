/** 怪物讨伐目标定义 */
export interface MonsterGoalDef {
  monsterId: string
  monsterName: string
  zone: string
  killTarget: number
  reward: {
    money?: number
    items?: { itemId: string; quantity: number }[]
  }
  description: string
}

/** 公会商店物品定义 */
export interface GuildShopItemDef {
  itemId: string
  name: string
  price: number
  description: string
  /** 解锁条件：需完成指定数量的讨伐目标 */
  unlockGoalCount?: number
}
