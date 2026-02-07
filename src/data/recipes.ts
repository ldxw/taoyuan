import type { RecipeDef } from '@/types'

/** 所有食谱定义 */
export const RECIPES: RecipeDef[] = [
  {
    id: 'stir_fried_cabbage',
    name: '炒青菜',
    ingredients: [{ itemId: 'cabbage', quantity: 2 }],
    effect: { staminaRestore: 15, healthRestore: 5 },
    unlockSource: '初始自带',
    description: '简单朴素的家常菜。'
  },
  {
    id: 'radish_soup',
    name: '萝卜汤',
    ingredients: [
      { itemId: 'radish', quantity: 2 },
      { itemId: 'firewood', quantity: 1 }
    ],
    effect: { staminaRestore: 25, healthRestore: 10 },
    unlockSource: '陈伯好感「相识」',
    description: '热腾腾的萝卜汤，暖身又暖心。'
  },
  {
    id: 'braised_carp',
    name: '红烧鲤鱼',
    ingredients: [
      { itemId: 'carp', quantity: 1 },
      { itemId: 'sesame', quantity: 2 }
    ],
    effect: {
      staminaRestore: 30,
      healthRestore: 15,
      buff: { type: 'fishing', value: 1, description: '钓鱼技能+1（当天）' }
    },
    unlockSource: '秋月好感「相识」',
    description: '鲜香可口的红烧鲤鱼。'
  },
  {
    id: 'herbal_porridge',
    name: '药膳粥',
    ingredients: [
      { itemId: 'herb', quantity: 2 },
      { itemId: 'rice', quantity: 1 }
    ],
    effect: { staminaRestore: 40, healthRestore: 20 },
    unlockSource: '林老好感「相识」',
    description: '调理身体的药膳粥。'
  },
  {
    id: 'osmanthus_cake',
    name: '桂花糕',
    ingredients: [
      { itemId: 'osmanthus', quantity: 3 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: {
      staminaRestore: 20,
      healthRestore: 5,
      buff: { type: 'giftBonus', value: 2, description: '送礼好感×2（当天）' }
    },
    unlockSource: '柳娘好感「相识」',
    description: '精致的桂花糕，送礼极佳。'
  },
  {
    id: 'miner_lunch',
    name: '矿工便当',
    ingredients: [
      { itemId: 'potato', quantity: 2 },
      { itemId: 'sweet_potato', quantity: 1 }
    ],
    effect: {
      staminaRestore: 25,
      healthRestore: 25,
      buff: { type: 'mining', value: 20, description: '挖矿体力消耗-20%（当天）' }
    },
    unlockSource: '阿石好感「相识」',
    description: '实打实的矿工饭。'
  },
  {
    id: 'spicy_hotpot',
    name: '麻辣火锅',
    ingredients: [
      { itemId: 'chili', quantity: 2 },
      { itemId: 'cabbage', quantity: 1 },
      { itemId: 'firewood', quantity: 1 }
    ],
    effect: {
      staminaRestore: 50,
      healthRestore: 40,
      buff: { type: 'defense', value: 20, description: '受到伤害-20%（当天）' }
    },
    unlockSource: '烹饪等级4',
    requiredSkill: { type: 'farming', level: 4 },
    description: '火辣辣的麻辣火锅，驱寒暖身。'
  },
  {
    id: 'steamed_bass',
    name: '清蒸鲈鱼',
    ingredients: [
      { itemId: 'bass', quantity: 1 },
      { itemId: 'ginger', quantity: 1 }
    ],
    effect: {
      staminaRestore: 35,
      healthRestore: 15,
      buff: { type: 'fishing', value: 2, description: '钓鱼技能+2（当天）' }
    },
    unlockSource: '钓鱼等级3',
    requiredSkill: { type: 'fishing', level: 3 },
    description: '鲜嫩的清蒸鲈鱼。'
  },
  {
    id: 'honey_tea',
    name: '蜂蜜茶',
    ingredients: [
      { itemId: 'honey', quantity: 1 },
      { itemId: 'herb', quantity: 1 }
    ],
    effect: { staminaRestore: 30, healthRestore: 10 },
    unlockSource: '初始自带',
    description: '甜蜜温润的蜂蜜茶。'
  },
  {
    id: 'ginger_soup',
    name: '姜汤',
    ingredients: [
      { itemId: 'ginger', quantity: 2 },
      { itemId: 'firewood', quantity: 1 }
    ],
    effect: {
      staminaRestore: 20,
      healthRestore: 10,
      buff: { type: 'speed', value: 15, description: '行动速度+15%（当天）' }
    },
    unlockSource: '初始自带',
    description: '驱寒暖胃的姜汤。'
  },
  {
    id: 'jujube_cake',
    name: '红枣糕',
    ingredients: [
      { itemId: 'jujube', quantity: 3 },
      { itemId: 'rice', quantity: 1 }
    ],
    effect: { staminaRestore: 35, healthRestore: 15 },
    unlockSource: '烹饪等级2',
    requiredSkill: { type: 'farming', level: 2 },
    description: '香甜软糯的红枣糕。'
  },
  {
    id: 'peach_blossom_cake',
    name: '桃花饼',
    ingredients: [
      { itemId: 'peach', quantity: 2 },
      { itemId: 'rice', quantity: 1 }
    ],
    effect: {
      staminaRestore: 25,
      healthRestore: 10,
      buff: { type: 'giftBonus', value: 2, description: '送礼好感×2（当天）' }
    },
    unlockSource: '烹饪等级3',
    requiredSkill: { type: 'farming', level: 3 },
    description: '春日限定的桃花饼。'
  },
  {
    id: 'fish_noodle',
    name: '鱼汤面',
    ingredients: [
      { itemId: 'crucian', quantity: 1 },
      { itemId: 'winter_wheat', quantity: 2 }
    ],
    effect: { staminaRestore: 30, healthRestore: 15 },
    unlockSource: '钓鱼等级2',
    requiredSkill: { type: 'fishing', level: 2 },
    description: '鲜美的鱼汤面。'
  },
  {
    id: 'miner_iron_pot',
    name: '矿工铁锅饭',
    ingredients: [
      { itemId: 'rice', quantity: 2 },
      { itemId: 'copper_ore', quantity: 1 },
      { itemId: 'firewood', quantity: 1 }
    ],
    effect: {
      staminaRestore: 35,
      healthRestore: 30,
      buff: { type: 'mining', value: 25, description: '挖矿体力消耗-25%（当天）' }
    },
    unlockSource: '挖矿等级4',
    requiredSkill: { type: 'mining', level: 4 },
    description: '矿工们的铁锅大杂烩。'
  },
  {
    id: 'bamboo_shoot_stir_fry',
    name: '冬笋炒肉',
    ingredients: [
      { itemId: 'winter_bamboo_shoot', quantity: 2 },
      { itemId: 'firewood', quantity: 1 }
    ],
    effect: { staminaRestore: 25, healthRestore: 10 },
    unlockSource: '初始自带',
    description: '鲜香的冬笋炒肉片。'
  },
  {
    id: 'dried_persimmon',
    name: '柿饼',
    ingredients: [{ itemId: 'persimmon', quantity: 3 }],
    effect: { staminaRestore: 20, healthRestore: 5 },
    unlockSource: '初始自带',
    description: '晒干的柿饼，甘甜绵密。'
  },
  {
    id: 'lotus_seed_soup',
    name: '莲子羹',
    ingredients: [
      { itemId: 'lotus_seed', quantity: 2 },
      { itemId: 'honey', quantity: 1 }
    ],
    effect: {
      staminaRestore: 45,
      healthRestore: 20,
      buff: { type: 'luck', value: 15, description: '幸运+15%（当天）' }
    },
    unlockSource: '烹饪等级5',
    requiredSkill: { type: 'farming', level: 5 },
    description: '清心安神的莲子羹。'
  },
  {
    id: 'sesame_paste',
    name: '芝麻糊',
    ingredients: [
      { itemId: 'sesame', quantity: 3 },
      { itemId: 'rice', quantity: 1 }
    ],
    effect: { staminaRestore: 30, healthRestore: 10 },
    unlockSource: '初始自带',
    description: '浓郁香滑的芝麻糊。'
  },
  {
    id: 'ginseng_soup',
    name: '人参汤',
    ingredients: [
      { itemId: 'ginseng', quantity: 1 },
      { itemId: 'herb', quantity: 2 },
      { itemId: 'firewood', quantity: 1 }
    ],
    effect: {
      staminaRestore: 60,
      healthRestore: 30,
      buff: { type: 'farming', value: 20, description: '农耕体力消耗-20%（当天）' }
    },
    unlockSource: '采集等级5',
    requiredSkill: { type: 'foraging', level: 5 },
    description: '滋补元气的人参汤。'
  },
  {
    id: 'corn_pancake',
    name: '玉米烙',
    ingredients: [
      { itemId: 'corn', quantity: 2 },
      { itemId: 'sesame_oil', quantity: 1 }
    ],
    effect: { staminaRestore: 25, healthRestore: 10 },
    unlockSource: '初始自带',
    description: '金黄酥脆的玉米烙。'
  },
  {
    id: 'osmanthus_lotus_root',
    name: '桂花藕粉',
    ingredients: [
      { itemId: 'osmanthus', quantity: 1 },
      { itemId: 'lotus_root', quantity: 1 }
    ],
    effect: {
      staminaRestore: 35,
      healthRestore: 15,
      buff: { type: 'luck', value: 10, description: '幸运+10%（当天）' }
    },
    unlockSource: '烹饪等级3',
    requiredSkill: { type: 'farming', level: 3 },
    description: '清香四溢的桂花藕粉。'
  }
]

/** 根据ID获取食谱 */
export const getRecipeById = (id: string): RecipeDef | undefined => {
  return RECIPES.find(r => r.id === id)
}
