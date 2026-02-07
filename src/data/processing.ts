import type { ProcessingMachineDef, ProcessingRecipeDef, SprinklerDef, FertilizerDef, BaitDef, TackleDef, BombDef } from '@/types'

/** 加工机器定义 */
export const PROCESSING_MACHINES: ProcessingMachineDef[] = [
  {
    id: 'wine_workshop',
    name: '酒坊',
    description: '将水果/作物酿成美酒，售价翻三倍。',
    craftCost: [
      { itemId: 'wood', quantity: 30 },
      { itemId: 'copper_ore', quantity: 5 },
      { itemId: 'iron_ore', quantity: 3 }
    ],
    craftMoney: 300
  },
  {
    id: 'sauce_jar',
    name: '酱缸',
    description: '将作物腌制成酱菜蜜饯，稳定增值。',
    craftCost: [
      { itemId: 'wood', quantity: 20 },
      { itemId: 'copper_ore', quantity: 8 },
      { itemId: 'quartz', quantity: 1 }
    ],
    craftMoney: 200
  },
  {
    id: 'bee_house',
    name: '蜂箱',
    description: '每4天自动产出蜂蜜。',
    craftCost: [
      { itemId: 'wood', quantity: 40 },
      { itemId: 'iron_ore', quantity: 2 },
      { itemId: 'bamboo', quantity: 10 }
    ],
    craftMoney: 250
  },
  {
    id: 'oil_press',
    name: '油坊',
    description: '将芝麻或种子榨成食用油。',
    craftCost: [
      { itemId: 'wood', quantity: 15 },
      { itemId: 'iron_ore', quantity: 5 },
      { itemId: 'gold_ore', quantity: 1 }
    ],
    craftMoney: 350
  }
]

/** 加工配方 */
export const PROCESSING_RECIPES: ProcessingRecipeDef[] = [
  // 酒坊
  {
    id: 'wine_watermelon',
    machineType: 'wine_workshop',
    name: '西瓜酒',
    inputItemId: 'watermelon',
    inputQuantity: 1,
    outputItemId: 'watermelon_wine',
    outputQuantity: 1,
    processingDays: 3,
    description: '甘甜的西瓜酿成的佳酿。'
  },
  {
    id: 'wine_osmanthus',
    machineType: 'wine_workshop',
    name: '桂花酿',
    inputItemId: 'osmanthus',
    inputQuantity: 1,
    outputItemId: 'osmanthus_wine',
    outputQuantity: 1,
    processingDays: 3,
    description: '馥郁芬芳的桂花酒。'
  },
  {
    id: 'vinegar_rice',
    machineType: 'wine_workshop',
    name: '米醋',
    inputItemId: 'rice',
    inputQuantity: 2,
    outputItemId: 'rice_vinegar',
    outputQuantity: 1,
    processingDays: 3,
    description: '家酿老陈醋。'
  },
  // 酱缸
  {
    id: 'pickle_cabbage',
    machineType: 'sauce_jar',
    name: '腌白菜',
    inputItemId: 'cabbage',
    inputQuantity: 2,
    outputItemId: 'pickled_cabbage',
    outputQuantity: 1,
    processingDays: 2,
    description: '开胃的腌白菜。'
  },
  {
    id: 'pickle_radish',
    machineType: 'sauce_jar',
    name: '萝卜干',
    inputItemId: 'radish',
    inputQuantity: 2,
    outputItemId: 'dried_radish',
    outputQuantity: 1,
    processingDays: 2,
    description: '香脆的萝卜干。'
  },
  {
    id: 'preserve_pumpkin',
    machineType: 'sauce_jar',
    name: '南瓜酱',
    inputItemId: 'pumpkin',
    inputQuantity: 1,
    outputItemId: 'pumpkin_preserve',
    outputQuantity: 1,
    processingDays: 2,
    description: '浓郁的南瓜酱。'
  },
  // 蜂箱
  {
    id: 'honey',
    machineType: 'bee_house',
    name: '蜂蜜',
    inputItemId: null,
    inputQuantity: 0,
    outputItemId: 'honey',
    outputQuantity: 1,
    processingDays: 4,
    description: '金黄甘甜的蜂蜜。'
  },
  // 油坊
  {
    id: 'sesame_oil',
    machineType: 'oil_press',
    name: '芝麻油',
    inputItemId: 'sesame',
    inputQuantity: 3,
    outputItemId: 'sesame_oil',
    outputQuantity: 1,
    processingDays: 1,
    description: '醇香的小磨麻油。'
  },
  {
    id: 'tea_oil',
    machineType: 'oil_press',
    name: '茶油',
    inputItemId: 'tea',
    inputQuantity: 2,
    outputItemId: 'tea_oil',
    outputQuantity: 1,
    processingDays: 1,
    description: '珍贵的山茶油。'
  },
  // 新增：酒坊配方
  {
    id: 'wine_peach',
    machineType: 'wine_workshop',
    name: '桃花酒',
    inputItemId: 'peach',
    inputQuantity: 1,
    outputItemId: 'peach_wine',
    outputQuantity: 1,
    processingDays: 3,
    description: '清甜的桃花酒。'
  },
  {
    id: 'wine_jujube',
    machineType: 'wine_workshop',
    name: '红枣酒',
    inputItemId: 'jujube',
    inputQuantity: 1,
    outputItemId: 'jujube_wine',
    outputQuantity: 1,
    processingDays: 3,
    description: '醇厚滋补的红枣酒。'
  },
  {
    id: 'wine_corn',
    machineType: 'wine_workshop',
    name: '玉米酒',
    inputItemId: 'corn',
    inputQuantity: 2,
    outputItemId: 'corn_wine',
    outputQuantity: 1,
    processingDays: 3,
    description: '淡雅清香的玉米酒。'
  },
  // 新增：酱缸配方
  {
    id: 'pickle_chili',
    machineType: 'sauce_jar',
    name: '泡椒',
    inputItemId: 'chili',
    inputQuantity: 2,
    outputItemId: 'pickled_chili',
    outputQuantity: 1,
    processingDays: 2,
    description: '酸辣开胃的泡椒。'
  },
  {
    id: 'pickle_ginger',
    machineType: 'sauce_jar',
    name: '腌姜',
    inputItemId: 'ginger',
    inputQuantity: 2,
    outputItemId: 'pickled_ginger',
    outputQuantity: 1,
    processingDays: 2,
    description: '酸甜脆嫩的腌姜。'
  }
]

/** 洒水器定义 */
export const SPRINKLERS: SprinklerDef[] = [
  {
    id: 'bamboo_sprinkler',
    name: '竹筒洒水器',
    description: '自动灌溉上下左右4块地。',
    range: 4,
    craftCost: [
      { itemId: 'bamboo', quantity: 10 },
      { itemId: 'copper_ore', quantity: 3 }
    ],
    craftMoney: 100
  },
  {
    id: 'copper_sprinkler',
    name: '铜管洒水器',
    description: '自动灌溉周围8块地。',
    range: 8,
    craftCost: [
      { itemId: 'iron_ore', quantity: 5 },
      { itemId: 'copper_ore', quantity: 5 },
      { itemId: 'gold_ore', quantity: 2 }
    ],
    craftMoney: 300
  }
]

/** 肥料定义 */
export const FERTILIZERS: FertilizerDef[] = [
  {
    id: 'basic_fertilizer',
    name: '基础肥料',
    description: '提升作物品质概率+20%。',
    qualityBonus: 0.2,
    craftCost: [
      { itemId: 'wood', quantity: 5 },
      { itemId: 'herb', quantity: 2 }
    ],
    craftMoney: 0,
    shopPrice: 25
  },
  {
    id: 'quality_fertilizer',
    name: '优质肥料',
    description: '提升作物品质概率+40%。',
    qualityBonus: 0.4,
    craftCost: [
      { itemId: 'herb', quantity: 3 },
      { itemId: 'quartz', quantity: 1 }
    ],
    craftMoney: 0,
    shopPrice: 75
  },
  {
    id: 'speed_gro',
    name: '生长激素',
    description: '加速作物生长25%。',
    growthSpeedup: 0.25,
    craftCost: [
      { itemId: 'pine_cone', quantity: 3 },
      { itemId: 'herb', quantity: 1 }
    ],
    craftMoney: 0,
    shopPrice: 50
  },
  {
    id: 'deluxe_speed_gro',
    name: '高级激素',
    description: '加速作物生长33%。',
    growthSpeedup: 0.33,
    craftCost: [
      { itemId: 'quartz', quantity: 1 },
      { itemId: 'firewood', quantity: 3 }
    ],
    craftMoney: 0,
    shopPrice: 100
  },
  {
    id: 'retaining_soil',
    name: '保湿土',
    description: '50%概率隔夜保持浇水状态。',
    retainChance: 0.5,
    craftCost: [
      { itemId: 'wood', quantity: 3 },
      { itemId: 'firewood', quantity: 2 }
    ],
    craftMoney: 0,
    shopPrice: 30
  },
  {
    id: 'quality_retaining_soil',
    name: '优质保湿土',
    description: '100%隔夜保持浇水状态。',
    retainChance: 1.0,
    craftCost: [
      { itemId: 'quartz', quantity: 1 },
      { itemId: 'wood', quantity: 5 }
    ],
    craftMoney: 0,
    shopPrice: 80
  }
]

/** 鱼饵定义 */
export const BAITS: BaitDef[] = [
  {
    id: 'standard_bait',
    name: '普通鱼饵',
    description: '使鱼更安静，降低猛冲概率。',
    behaviorModifier: { calm: 0.1, struggle: 0, dash: -0.1 },
    craftCost: [{ itemId: 'herb', quantity: 2 }],
    craftMoney: 0,
    shopPrice: 5
  },
  {
    id: 'wild_bait',
    name: '野生鱼饵',
    description: '25%概率获得双倍鱼获。',
    doubleCatchChance: 0.25,
    craftCost: [
      { itemId: 'herb', quantity: 3 },
      { itemId: 'wild_berry', quantity: 1 },
      { itemId: 'firewood', quantity: 2 }
    ],
    craftMoney: 0,
    shopPrice: null
  },
  {
    id: 'magic_bait',
    name: '魔法鱼饵',
    description: '无视季节限制，可钓到所有鱼。',
    ignoresSeason: true,
    craftCost: [
      { itemId: 'ginseng', quantity: 1 },
      { itemId: 'gold_ore', quantity: 1 }
    ],
    craftMoney: 0,
    shopPrice: null
  }
]

/** 浮漂定义 */
export const TACKLES: TackleDef[] = [
  {
    id: 'spinner',
    name: '旋转浮漂',
    description: '减少50%钓鱼体力消耗。',
    maxDurability: 20,
    requiredRodTier: 'iron',
    staminaReduction: 0.5,
    craftCost: [
      { itemId: 'iron_ore', quantity: 3 },
      { itemId: 'bamboo', quantity: 2 }
    ],
    craftMoney: 0,
    shopPrice: 250
  },
  {
    id: 'trap_bobber',
    name: '陷阱浮漂',
    description: '断线时获得1次额外机会。',
    maxDurability: 20,
    requiredRodTier: 'iron',
    extraBreakChance: 1,
    craftCost: [
      { itemId: 'copper_ore', quantity: 5 },
      { itemId: 'wood', quantity: 5 }
    ],
    craftMoney: 0,
    shopPrice: 200
  },
  {
    id: 'cork_bobber',
    name: '软木浮漂',
    description: '挣扎时成功率+25%。',
    maxDurability: 20,
    requiredRodTier: 'iron',
    struggleBonus: 0.25,
    craftCost: [
      { itemId: 'wood', quantity: 10 },
      { itemId: 'iron_ore', quantity: 2 }
    ],
    craftMoney: 0,
    shopPrice: 250
  },
  {
    id: 'quality_bobber',
    name: '品质浮漂',
    description: '钓到的鱼品质+1档。',
    maxDurability: 20,
    requiredRodTier: 'iron',
    qualityBoost: 1,
    craftCost: [
      { itemId: 'gold_ore', quantity: 2 },
      { itemId: 'copper_ore', quantity: 3 }
    ],
    craftMoney: 0,
    shopPrice: 500
  }
]

export const getMachineById = (id: string): ProcessingMachineDef | undefined => {
  return PROCESSING_MACHINES.find(m => m.id === id)
}

export const getProcessingRecipeById = (id: string): ProcessingRecipeDef | undefined => {
  return PROCESSING_RECIPES.find(r => r.id === id)
}

export const getRecipesForMachine = (machineType: string): ProcessingRecipeDef[] => {
  return PROCESSING_RECIPES.filter(r => r.machineType === machineType)
}

export const getSprinklerById = (id: string): SprinklerDef | undefined => {
  return SPRINKLERS.find(s => s.id === id)
}

export const getFertilizerById = (id: string): FertilizerDef | undefined => {
  return FERTILIZERS.find(f => f.id === id)
}

export const getBaitById = (id: string): BaitDef | undefined => {
  return BAITS.find(b => b.id === id)
}

export const getTackleById = (id: string): TackleDef | undefined => {
  return TACKLES.find(t => t.id === id)
}

/** 采脂器制造定义 */
export const TAPPER = {
  id: 'tapper',
  name: '采脂器',
  description: '安装到成熟野树上，定期产出树脂。',
  craftCost: [
    { itemId: 'copper_ore', quantity: 5 },
    { itemId: 'wood', quantity: 10 }
  ],
  craftMoney: 200
}

/** 炸弹定义 */
export const BOMBS: BombDef[] = [
  {
    id: 'cherry_bomb',
    name: '爆竹',
    description: '小范围爆破，一次获取3份矿石。',
    oreMultiplier: 3,
    clearsMonster: false,
    craftCost: [
      { itemId: 'copper_ore', quantity: 3 },
      { itemId: 'firewood', quantity: 5 }
    ],
    craftMoney: 0,
    shopPrice: 50
  },
  {
    id: 'bomb',
    name: '火药包',
    description: '大范围爆破，获取5份矿石并清除怪物。',
    oreMultiplier: 5,
    clearsMonster: true,
    craftCost: [
      { itemId: 'iron_ore', quantity: 3 },
      { itemId: 'firewood', quantity: 8 },
      { itemId: 'quartz', quantity: 1 }
    ],
    craftMoney: 0,
    shopPrice: 150
  }
]

export const getBombById = (id: string): BombDef | undefined => {
  return BOMBS.find(b => b.id === id)
}
