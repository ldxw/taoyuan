import type { AchievementDef, CommunityBundleDef } from '@/types'

/** 成就列表 */
export const ACHIEVEMENTS: AchievementDef[] = [
  // 收集
  {
    id: 'collector_10',
    name: '初出茅庐',
    description: '发现10种不同物品。',
    condition: { type: 'itemCount', count: 10 },
    reward: { money: 200 }
  },
  {
    id: 'collector_30',
    name: '博物学家',
    description: '发现30种不同物品。',
    condition: { type: 'itemCount', count: 30 },
    reward: { money: 500 }
  },
  {
    id: 'collector_60',
    name: '万物通鉴',
    description: '发现60种不同物品。',
    condition: { type: 'itemCount', count: 60 },
    reward: { money: 1500 }
  },
  // 农耕
  {
    id: 'farmer_50',
    name: '辛勤农夫',
    description: '累计收获50次作物。',
    condition: { type: 'cropHarvest', count: 50 },
    reward: { money: 300 }
  },
  {
    id: 'farmer_200',
    name: '丰收之王',
    description: '累计收获200次作物。',
    condition: { type: 'cropHarvest', count: 200 },
    reward: { money: 1000, items: [{ itemId: 'compost', quantity: 10 }] }
  },
  // 钓鱼
  {
    id: 'fisher_20',
    name: '垂钓新手',
    description: '累计钓到20条鱼。',
    condition: { type: 'fishCaught', count: 20 },
    reward: { money: 200 }
  },
  {
    id: 'fisher_100',
    name: '渔翁',
    description: '累计钓到100条鱼。',
    condition: { type: 'fishCaught', count: 100 },
    reward: { money: 800 }
  },
  // 挖矿
  {
    id: 'miner_15',
    name: '矿洞探索者',
    description: '到达矿洞第15层。',
    condition: { type: 'mineFloor', floor: 15 },
    reward: { money: 300 }
  },
  {
    id: 'miner_30',
    name: '深渊矿工',
    description: '到达矿洞第30层。',
    condition: { type: 'mineFloor', floor: 30 },
    reward: { money: 1000, items: [{ itemId: 'gold_ore', quantity: 10 }] }
  },
  // 金钱
  {
    id: 'rich_5000',
    name: '小康之家',
    description: '累计获得5000文。',
    condition: { type: 'moneyEarned', amount: 5000 },
    reward: { money: 500 }
  },
  {
    id: 'rich_20000',
    name: '桃源首富',
    description: '累计获得20000文。',
    condition: { type: 'moneyEarned', amount: 20000 },
    reward: { money: 2000 }
  },
  // 烹饪
  {
    id: 'chef_10',
    name: '厨艺初成',
    description: '累计烹饪10道菜。',
    condition: { type: 'recipesCooked', count: 10 },
    reward: { money: 300 }
  },
  {
    id: 'chef_50',
    name: '美食大师',
    description: '累计烹饪50道菜。',
    condition: { type: 'recipesCooked', count: 50 },
    reward: { money: 1000 }
  },
  // 技能
  {
    id: 'skill_master',
    name: '技艺精通',
    description: '任意技能达到10级。',
    condition: { type: 'skillLevel', skillType: 'farming', level: 10 },
    reward: { money: 2000 }
  },
  // 社交
  {
    id: 'social_friend',
    name: '好人缘',
    description: '与所有村民成为"相识"。',
    condition: { type: 'npcFriendship', level: 'acquaintance' },
    reward: { money: 500 }
  },
  // 任务
  {
    id: 'quest_10',
    name: '乡里热心人',
    description: '累计完成10个委托任务。',
    condition: { type: 'questsCompleted', count: 10 },
    reward: { money: 500 }
  },
  {
    id: 'quest_40',
    name: '有求必应',
    description: '累计完成40个委托任务。',
    condition: { type: 'questsCompleted', count: 40 },
    reward: { money: 2500 }
  },
  // 好感
  {
    id: 'friend_best',
    name: '知己',
    description: '与1位村民成为挚友。',
    condition: { type: 'npcBestFriend', count: 1 },
    reward: { money: 200 }
  },
  {
    id: 'friend_all_friendly',
    name: '桃源之友',
    description: '与所有村民成为朋友。',
    condition: { type: 'npcAllFriendly' },
    reward: { money: 1000, items: [{ itemId: 'jade_ring', quantity: 1 }] }
  },
  // 婚姻 & 子女
  {
    id: 'married',
    name: '百年好合',
    description: '与心仪之人结为夫妇。',
    condition: { type: 'married' },
    reward: { money: 500 }
  },
  {
    id: 'parent',
    name: '天伦之乐',
    description: '迎来第一个孩子。',
    condition: { type: 'hasChild' },
    reward: { money: 300 }
  }
]

/** 社区任务板 */
export const COMMUNITY_BUNDLES: CommunityBundleDef[] = [
  {
    id: 'spring_bundle',
    name: '春耕之礼',
    description: '春季物产合集。',
    requiredItems: [
      { itemId: 'cabbage', quantity: 5 },
      { itemId: 'radish', quantity: 5 },
      { itemId: 'bamboo_shoot', quantity: 3 },
      { itemId: 'tea', quantity: 2 }
    ],
    reward: { money: 500, items: [{ itemId: 'seed_peach', quantity: 3 }], description: '500文 + 桃种子×3' }
  },
  {
    id: 'summer_bundle',
    name: '盛夏之礼',
    description: '夏季物产合集。',
    requiredItems: [
      { itemId: 'watermelon', quantity: 3 },
      { itemId: 'rice', quantity: 5 },
      { itemId: 'lotus_root', quantity: 2 },
      { itemId: 'chili', quantity: 3 }
    ],
    reward: { money: 800, items: [{ itemId: 'seed_lotus_seed', quantity: 2 }], description: '800文 + 莲子种子×2' }
  },
  {
    id: 'autumn_bundle',
    name: '金秋之礼',
    description: '秋季物产合集。',
    requiredItems: [
      { itemId: 'pumpkin', quantity: 3 },
      { itemId: 'osmanthus', quantity: 2 },
      { itemId: 'jujube', quantity: 3 },
      { itemId: 'persimmon', quantity: 2 }
    ],
    reward: { money: 800, items: [{ itemId: 'seed_snow_lotus', quantity: 1 }], description: '800文 + 雪莲种子×1' }
  },
  {
    id: 'winter_bundle',
    name: '严冬之礼',
    description: '冬季物产合集。',
    requiredItems: [
      { itemId: 'winter_bamboo_shoot', quantity: 5 },
      { itemId: 'winter_wheat', quantity: 3 },
      { itemId: 'garlic', quantity: 3 },
      { itemId: 'ginger', quantity: 2 }
    ],
    reward: { money: 1000, description: '1000文' }
  },
  {
    id: 'artisan_bundle',
    name: '匠心之礼',
    description: '各种加工品合集。',
    requiredItems: [
      { itemId: 'watermelon_wine', quantity: 1 },
      { itemId: 'pickled_cabbage', quantity: 1 },
      { itemId: 'honey', quantity: 2 },
      { itemId: 'sesame_oil', quantity: 1 },
      { itemId: 'peach_wine', quantity: 1 }
    ],
    reward: { money: 2000, description: '2000文' }
  },
  {
    id: 'friendship_bundle',
    name: '乡情之礼',
    description: '与所有村民建立友善关系。',
    requiredItems: [
      { itemId: 'wintersweet', quantity: 2 },
      { itemId: 'chrysanthemum', quantity: 2 },
      { itemId: 'osmanthus', quantity: 2 }
    ],
    reward: { money: 1500, description: '1500文' }
  }
]

export const getAchievementById = (id: string): AchievementDef | undefined => {
  return ACHIEVEMENTS.find(a => a.id === id)
}

export const getBundleById = (id: string): CommunityBundleDef | undefined => {
  return COMMUNITY_BUNDLES.find(b => b.id === id)
}
