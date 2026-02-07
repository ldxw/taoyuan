import type { CropDef } from '@/types/farm'

/** 所有作物定义 */
export const CROPS: CropDef[] = [
  // 春季
  {
    id: 'cabbage',
    name: '青菜',
    seedId: 'seed_cabbage',
    season: ['spring'],
    growthDays: 3,
    sellPrice: 35,
    seedPrice: 10,
    deepWatering: false,
    description: '最基础的蔬菜，容易种植。'
  },
  {
    id: 'radish',
    name: '萝卜',
    seedId: 'seed_radish',
    season: ['spring'],
    growthDays: 4,
    sellPrice: 55,
    seedPrice: 15,
    deepWatering: false,
    description: '脆甜多汁的根茎作物。'
  },
  {
    id: 'potato',
    name: '土豆',
    seedId: 'seed_potato',
    season: ['spring'],
    growthDays: 5,
    sellPrice: 80,
    seedPrice: 25,
    deepWatering: false,
    description: '朴实耐饱的粮食。'
  },
  {
    id: 'tea',
    name: '茶苗',
    seedId: 'seed_tea',
    season: ['spring'],
    growthDays: 8,
    sellPrice: 160,
    seedPrice: 80,
    deepWatering: false,
    description: '精心培育的好茶，价值不菲。'
  },
  // 夏季
  {
    id: 'watermelon',
    name: '西瓜',
    seedId: 'seed_watermelon',
    season: ['summer'],
    growthDays: 6,
    sellPrice: 130,
    seedPrice: 40,
    deepWatering: false,
    description: '盛夏消暑的佳品。'
  },
  {
    id: 'rice',
    name: '稻谷',
    seedId: 'seed_rice',
    season: ['summer'],
    growthDays: 7,
    sellPrice: 75,
    seedPrice: 20,
    deepWatering: false,
    description: '民以食为天。'
  },
  {
    id: 'lotus_root',
    name: '莲藕',
    seedId: 'seed_lotus_root',
    season: ['summer'],
    growthDays: 8,
    sellPrice: 170,
    seedPrice: 50,
    deepWatering: true,
    description: '需深度灌溉，但收益颇丰。'
  },
  {
    id: 'sesame',
    name: '芝麻',
    seedId: 'seed_sesame',
    season: ['summer'],
    growthDays: 4,
    sellPrice: 45,
    seedPrice: 15,
    deepWatering: false,
    description: '小小芝麻，用途广泛。'
  },
  // 秋季
  {
    id: 'pumpkin',
    name: '南瓜',
    seedId: 'seed_pumpkin',
    season: ['autumn'],
    growthDays: 7,
    sellPrice: 180,
    seedPrice: 50,
    deepWatering: false,
    description: '金秋时节的丰收象征。'
  },
  {
    id: 'sweet_potato',
    name: '红薯',
    seedId: 'seed_sweet_potato',
    season: ['autumn'],
    growthDays: 5,
    sellPrice: 65,
    seedPrice: 20,
    deepWatering: false,
    description: '甜糯可口的粗粮。'
  },
  {
    id: 'chrysanthemum',
    name: '菊花',
    seedId: 'seed_chrysanthemum',
    season: ['autumn'],
    growthDays: 6,
    sellPrice: 120,
    seedPrice: 35,
    deepWatering: false,
    description: '采菊东篱下，可作送礼佳品。'
  },
  {
    id: 'osmanthus',
    name: '桂花',
    seedId: 'seed_osmanthus',
    season: ['autumn'],
    growthDays: 8,
    sellPrice: 200,
    seedPrice: 60,
    deepWatering: false,
    description: '桂花飘香，高级作物。'
  },
  // 春季新作物
  {
    id: 'bamboo_shoot',
    name: '春笋',
    seedId: 'seed_bamboo_shoot',
    season: ['spring'],
    growthDays: 4,
    sellPrice: 50,
    seedPrice: 15,
    deepWatering: false,
    description: '春天的竹林间挖出的鲜嫩笋。'
  },
  {
    id: 'peach',
    name: '桃',
    seedId: 'seed_peach',
    season: ['spring'],
    growthDays: 7,
    sellPrice: 140,
    seedPrice: 45,
    deepWatering: false,
    description: '鲜美多汁的桃子。',
    regrowth: true,
    regrowthDays: 3
  },
  {
    id: 'green_bean',
    name: '豆角',
    seedId: 'seed_green_bean',
    season: ['spring', 'summer'],
    growthDays: 6,
    sellPrice: 45,
    seedPrice: 12,
    deepWatering: false,
    description: '清脆的豆角，跨春夏生长。',
    regrowth: true,
    regrowthDays: 3
  },
  // 夏季新作物
  {
    id: 'chili',
    name: '辣椒',
    seedId: 'seed_chili',
    season: ['summer'],
    growthDays: 5,
    sellPrice: 60,
    seedPrice: 15,
    deepWatering: false,
    description: '火辣的开胃椒。',
    regrowth: true,
    regrowthDays: 3
  },
  {
    id: 'lotus_seed',
    name: '莲子',
    seedId: 'seed_lotus_seed',
    season: ['summer'],
    growthDays: 9,
    sellPrice: 200,
    seedPrice: 60,
    deepWatering: true,
    description: '清心养神的莲子，需深灌。'
  },
  {
    id: 'corn',
    name: '玉米',
    seedId: 'seed_corn',
    season: ['summer', 'autumn'],
    growthDays: 8,
    sellPrice: 85,
    seedPrice: 25,
    deepWatering: false,
    description: '金灿灿的玉米，跨夏秋生长。',
    regrowth: true,
    regrowthDays: 4
  },
  // 秋季新作物
  {
    id: 'jujube',
    name: '红枣',
    seedId: 'seed_jujube',
    season: ['autumn'],
    growthDays: 6,
    sellPrice: 100,
    seedPrice: 30,
    deepWatering: false,
    description: '滋补佳品红枣。',
    regrowth: true,
    regrowthDays: 4
  },
  {
    id: 'persimmon',
    name: '柿子',
    seedId: 'seed_persimmon',
    season: ['autumn'],
    growthDays: 7,
    sellPrice: 150,
    seedPrice: 40,
    deepWatering: false,
    description: '软糯香甜的柿子。'
  },
  {
    id: 'ginger',
    name: '生姜',
    seedId: 'seed_ginger',
    season: ['autumn', 'winter'],
    growthDays: 6,
    sellPrice: 70,
    seedPrice: 20,
    deepWatering: false,
    description: '驱寒暖身的生姜，跨秋冬生长。'
  },
  // 冬季新作物
  {
    id: 'winter_wheat',
    name: '冬小麦',
    seedId: 'seed_winter_wheat',
    season: ['winter'],
    growthDays: 10,
    sellPrice: 60,
    seedPrice: 15,
    deepWatering: false,
    description: '耐寒的冬小麦。'
  },
  {
    id: 'garlic',
    name: '大蒜',
    seedId: 'seed_garlic',
    season: ['winter'],
    growthDays: 6,
    sellPrice: 55,
    seedPrice: 15,
    deepWatering: false,
    description: '辛辣的大蒜，冬季也能种。'
  },
  {
    id: 'snow_lotus',
    name: '雪莲',
    seedId: 'seed_snow_lotus',
    season: ['winter'],
    growthDays: 12,
    sellPrice: 350,
    seedPrice: 100,
    deepWatering: true,
    description: '传说中的雪莲花，极其珍贵。'
  }
]

/** 根据ID查找作物 */
export const getCropById = (id: string): CropDef | undefined => {
  return CROPS.find(c => c.id === id)
}

/** 根据季节获取可种作物 */
export const getCropsBySeason = (season: string): CropDef[] => {
  return CROPS.filter(c => c.season.includes(season as any))
}
