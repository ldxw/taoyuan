import type { MonsterGoalDef, GuildShopItemDef } from '@/types'

/** 怪物讨伐目标 */
export const MONSTER_GOALS: MonsterGoalDef[] = [
  // ===== 浅层 =====
  { monsterId: 'mud_worm', monsterName: '泥虫', zone: 'shallow', killTarget: 25, reward: { money: 200 }, description: '清除浅层的泥虫。' },
  {
    monsterId: 'stone_crab',
    monsterName: '石蟹',
    zone: 'shallow',
    killTarget: 25,
    reward: { money: 300 },
    description: '消灭浅层的石蟹。'
  },
  // ===== 冰霜 =====
  { monsterId: 'ice_bat', monsterName: '冰蝠', zone: 'frost', killTarget: 25, reward: { money: 500 }, description: '击落冰霜层的冰蝠。' },
  { monsterId: 'ghost', monsterName: '幽灵', zone: 'frost', killTarget: 25, reward: { money: 500 }, description: '驱散冰霜层的幽灵。' },
  // ===== 熔岩 =====
  { monsterId: 'fire_bat', monsterName: '火蝠', zone: 'lava', killTarget: 50, reward: { money: 800 }, description: '击退熔岩层的火蝠。' },
  {
    monsterId: 'shadow_warrior',
    monsterName: '暗影武士',
    zone: 'lava',
    killTarget: 50,
    reward: { money: 1000 },
    description: '击败熔岩层的暗影武士。'
  },
  // ===== 水晶 =====
  {
    monsterId: 'crystal_golem',
    monsterName: '水晶魔像',
    zone: 'crystal',
    killTarget: 50,
    reward: { money: 1500 },
    description: '粉碎水晶层的魔像。'
  },
  {
    monsterId: 'prism_spider',
    monsterName: '棱镜蛛',
    zone: 'crystal',
    killTarget: 50,
    reward: { money: 1500 },
    description: '消灭水晶层的棱镜蛛。'
  },
  // ===== 暗影 =====
  {
    monsterId: 'shadow_lurker',
    monsterName: '暗影潜伏者',
    zone: 'shadow',
    killTarget: 75,
    reward: { money: 2000 },
    description: '猎杀暗影层的潜伏者。'
  },
  {
    monsterId: 'void_wraith',
    monsterName: '虚空幽魂',
    zone: 'shadow',
    killTarget: 75,
    reward: { money: 2500 },
    description: '净化暗影层的虚空幽魂。'
  },
  // ===== 深渊 =====
  {
    monsterId: 'abyss_serpent',
    monsterName: '深渊巨蟒',
    zone: 'abyss',
    killTarget: 100,
    reward: { money: 3000 },
    description: '讨伐深渊层的巨蟒。'
  },
  {
    monsterId: 'bone_dragon',
    monsterName: '骨龙',
    zone: 'abyss',
    killTarget: 100,
    reward: { money: 4000 },
    description: '击败深渊层的骨龙。'
  },
  // ===== BOSS =====
  {
    monsterId: 'mud_golem',
    monsterName: '泥岩巨兽',
    zone: 'boss',
    killTarget: 3,
    reward: { money: 500, items: [{ itemId: 'copper_bar', quantity: 10 }] },
    description: '三次击败泥岩巨兽。'
  },
  {
    monsterId: 'frost_queen',
    monsterName: '冰霜女王',
    zone: 'boss',
    killTarget: 3,
    reward: { money: 800, items: [{ itemId: 'iron_bar', quantity: 10 }] },
    description: '三次击败冰霜女王。'
  },
  {
    monsterId: 'lava_lord',
    monsterName: '熔岩君主',
    zone: 'boss',
    killTarget: 3,
    reward: { money: 1500, items: [{ itemId: 'gold_bar', quantity: 10 }] },
    description: '三次击败熔岩君主。'
  },
  {
    monsterId: 'crystal_king',
    monsterName: '水晶之王',
    zone: 'boss',
    killTarget: 3,
    reward: { money: 2500, items: [{ itemId: 'moonstone', quantity: 3 }] },
    description: '三次击败水晶之王。'
  },
  {
    monsterId: 'shadow_sovereign',
    monsterName: '暗影君主',
    zone: 'boss',
    killTarget: 3,
    reward: { money: 4000, items: [{ itemId: 'obsidian', quantity: 3 }] },
    description: '三次击败暗影君主。'
  },
  {
    monsterId: 'abyss_dragon',
    monsterName: '深渊龙王',
    zone: 'boss',
    killTarget: 3,
    reward: { money: 6000, items: [{ itemId: 'dragon_jade', quantity: 2 }] },
    description: '三次击败深渊龙王。'
  },
  // ===== 骷髅矿穴 =====
  {
    monsterId: 'iridium_golem',
    monsterName: '铱金魔像',
    zone: 'skull',
    killTarget: 50,
    reward: { money: 3000 },
    description: '在骷髅矿穴中讨伐铱金魔像。'
  },
  {
    monsterId: 'skull_serpent',
    monsterName: '骷髅飞蛇',
    zone: 'skull',
    killTarget: 50,
    reward: { money: 3000 },
    description: '在骷髅矿穴中消灭骷髅飞蛇。'
  },
  {
    monsterId: 'ancient_mummy',
    monsterName: '远古木乃伊',
    zone: 'skull',
    killTarget: 50,
    reward: { money: 5000 },
    description: '在骷髅矿穴中击败远古木乃伊。'
  }
]

/** 公会商店物品 (与镖局互补，不重复) */
export const GUILD_SHOP_ITEMS: GuildShopItemDef[] = [
  // --- 基础战斗补给 ---
  { itemId: 'combat_tonic', name: '战斗补剂', price: 200, description: '恢复30点HP。' },
  { itemId: 'fortify_brew', name: '强化药水', price: 500, description: '恢复60点HP。' },
  { itemId: 'ironhide_potion', name: '铁壁药剂', price: 800, description: '恢复全部HP。' },
  // --- 里程碑解锁 ---
  { itemId: 'slayer_charm', name: '猎魔符', price: 1500, description: '怪物掉落率+20%（当次探索）。', unlockGoalCount: 5 },
  { itemId: 'warriors_feast', name: '勇者盛宴', price: 1000, description: '恢复50体力和50HP。', unlockGoalCount: 10 },
  { itemId: 'monster_lure', name: '怪物诱饵', price: 2000, description: '本层怪物数量翻倍。', unlockGoalCount: 15 },
  { itemId: 'guild_badge', name: '公会徽章', price: 5000, description: '攻击力永久+3。', unlockGoalCount: 21 }
]

/** 根据怪物ID查找讨伐目标 */
export const getMonsterGoal = (monsterId: string): MonsterGoalDef | undefined => MONSTER_GOALS.find(g => g.monsterId === monsterId)
