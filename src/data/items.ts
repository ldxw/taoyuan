import type { ItemDef } from '@/types/item'
import { CROPS } from './crops'
import { FISH } from './fish'
import { RECIPES } from './recipes'
import { PROCESSING_MACHINES, SPRINKLERS, FERTILIZERS, BAITS, TACKLES, BOMBS } from './processing'
import { FRUIT_TREE_DEFS } from './fruitTrees'

/** 从作物定义自动生成种子物品 */
const SEED_ITEMS: ItemDef[] = CROPS.map(crop => ({
  id: crop.seedId,
  name: `${crop.name}种子`,
  category: 'seed',
  description: `${crop.name}的种子，${crop.season
    .map(s => {
      const names: Record<string, string> = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' }
      return names[s]
    })
    .join('/')}季可种植。`,
  sellPrice: Math.floor(crop.seedPrice / 2),
  edible: false
}))

/** 从作物定义自动生成收获物品 */
const CROP_ITEMS: ItemDef[] = CROPS.map(crop => ({
  id: crop.id,
  name: crop.name,
  category: 'crop',
  description: crop.description,
  sellPrice: crop.sellPrice,
  edible: true,
  staminaRestore: Math.floor(crop.sellPrice / 5),
  healthRestore: Math.floor(crop.sellPrice / 10)
}))

/** 矿石物品 */
const ORE_ITEMS: ItemDef[] = [
  { id: 'copper_ore', name: '铜矿', category: 'ore', description: '常见的金属矿石。', sellPrice: 15, edible: false },
  { id: 'iron_ore', name: '铁矿', category: 'ore', description: '坚硬的铁矿石。', sellPrice: 30, edible: false },
  { id: 'gold_ore', name: '金矿', category: 'ore', description: '珍贵的金矿石。', sellPrice: 60, edible: false },
  { id: 'quartz', name: '石英', category: 'gem', description: '晶莹剔透的石英。', sellPrice: 25, edible: false },
  { id: 'jade', name: '翡翠', category: 'gem', description: '温润的翡翠。', sellPrice: 80, edible: false },
  { id: 'ruby', name: '红宝石', category: 'gem', description: '光芒四射的红宝石。', sellPrice: 120, edible: false }
]

/** 杂项 */
const MISC_ITEMS: ItemDef[] = [
  { id: 'wood', name: '木材', category: 'material', description: '建造和制作的基础材料。', sellPrice: 5, edible: false },
  { id: 'bamboo', name: '竹子', category: 'material', description: '竹林中采集的翠竹。', sellPrice: 10, edible: false },
  { id: 'herb', name: '草药', category: 'material', description: '山间野生的草药。', sellPrice: 15, edible: false },
  { id: 'firewood', name: '柴火', category: 'material', description: '烹饪用的燃料。', sellPrice: 5, edible: false },
  {
    id: 'winter_bamboo_shoot',
    name: '冬笋',
    category: 'misc',
    description: '冬季特有的鲜嫩竹笋。',
    sellPrice: 40,
    edible: true,
    staminaRestore: 8,
    healthRestore: 3
  },
  { id: 'wintersweet', name: '腊梅', category: 'gift', description: '寒冬中绽放的腊梅，送礼佳品。', sellPrice: 50, edible: false },
  {
    id: 'wild_mushroom',
    name: '野蘑菇',
    category: 'misc',
    description: '秋天的山林中采到的蘑菇。',
    sellPrice: 30,
    edible: true,
    staminaRestore: 5,
    healthRestore: 2
  },
  { id: 'ginseng', name: '人参', category: 'misc', description: '极其珍贵的野生人参。', sellPrice: 200, edible: false },
  {
    id: 'wild_berry',
    name: '野果',
    category: 'misc',
    description: '夏天山间的甜美野果。',
    sellPrice: 20,
    edible: true,
    staminaRestore: 5,
    healthRestore: 2
  },
  { id: 'pine_cone', name: '松果', category: 'material', description: '松树上掉落的果实。', sellPrice: 10, edible: false },
  { id: 'jade_ring', name: '翡翠戒指', category: 'gift', description: '精心打磨的翡翠戒指，可以用来求婚。', sellPrice: 500, edible: false }
]

/** 从鱼定义自动生成鱼物品 */
const FISH_ITEMS: ItemDef[] = FISH.map(fish => ({
  id: fish.id,
  name: fish.name,
  category: 'fish' as const,
  description: fish.description,
  sellPrice: fish.sellPrice,
  edible: true,
  staminaRestore: Math.floor(fish.sellPrice / 5),
  healthRestore: Math.floor(fish.sellPrice / 8)
}))

/** 从食谱定义自动生成烹饪物品 */
const FOOD_ITEMS: ItemDef[] = RECIPES.map(recipe => ({
  id: `food_${recipe.id}`,
  name: recipe.name,
  category: 'food' as const,
  description: recipe.description,
  sellPrice: Math.floor(recipe.effect.staminaRestore * 2),
  edible: true,
  staminaRestore: recipe.effect.staminaRestore,
  healthRestore: recipe.effect.healthRestore ?? Math.floor(recipe.effect.staminaRestore * 0.4)
}))

/** 加工品物品 */
const PROCESSED_ITEMS: ItemDef[] = [
  {
    id: 'watermelon_wine',
    name: '西瓜酒',
    category: 'processed',
    description: '甘甜的西瓜酿成的佳酿。',
    sellPrice: 390,
    edible: true,
    staminaRestore: 25,
    healthRestore: 15
  },
  {
    id: 'osmanthus_wine',
    name: '桂花酿',
    category: 'processed',
    description: '馥郁芬芳的桂花酒。',
    sellPrice: 600,
    edible: true,
    staminaRestore: 30,
    healthRestore: 18
  },
  { id: 'rice_vinegar', name: '米醋', category: 'processed', description: '家酿老陈醋。', sellPrice: 190, edible: false },
  {
    id: 'pickled_cabbage',
    name: '腌白菜',
    category: 'processed',
    description: '开胃的腌白菜。',
    sellPrice: 120,
    edible: true,
    staminaRestore: 10,
    healthRestore: 5
  },
  {
    id: 'dried_radish',
    name: '萝卜干',
    category: 'processed',
    description: '香脆的萝卜干。',
    sellPrice: 160,
    edible: true,
    staminaRestore: 12,
    healthRestore: 5
  },
  {
    id: 'pumpkin_preserve',
    name: '南瓜酱',
    category: 'processed',
    description: '浓郁的南瓜酱。',
    sellPrice: 410,
    edible: true,
    staminaRestore: 15,
    healthRestore: 8
  },
  {
    id: 'honey',
    name: '蜂蜜',
    category: 'processed',
    description: '金黄甘甜的蜂蜜。',
    sellPrice: 100,
    edible: true,
    staminaRestore: 20,
    healthRestore: 10
  },
  { id: 'sesame_oil', name: '芝麻油', category: 'processed', description: '醇香的小磨麻油。', sellPrice: 100, edible: false },
  { id: 'tea_oil', name: '茶油', category: 'processed', description: '珍贵的山茶油。', sellPrice: 250, edible: false },
  {
    id: 'peach_wine',
    name: '桃花酒',
    category: 'processed',
    description: '清甜的桃花酒。',
    sellPrice: 420,
    edible: true,
    staminaRestore: 25,
    healthRestore: 15
  },
  {
    id: 'jujube_wine',
    name: '红枣酒',
    category: 'processed',
    description: '醇厚滋补的红枣酒。',
    sellPrice: 300,
    edible: true,
    staminaRestore: 20,
    healthRestore: 12
  },
  {
    id: 'corn_wine',
    name: '玉米酒',
    category: 'processed',
    description: '淡雅清香的玉米酒。',
    sellPrice: 255,
    edible: true,
    staminaRestore: 18,
    healthRestore: 10
  },
  {
    id: 'pickled_chili',
    name: '泡椒',
    category: 'processed',
    description: '酸辣开胃的泡椒。',
    sellPrice: 180,
    edible: true,
    staminaRestore: 10,
    healthRestore: 5
  },
  {
    id: 'pickled_ginger',
    name: '腌姜',
    category: 'processed',
    description: '酸甜脆嫩的腌姜。',
    sellPrice: 200,
    edible: true,
    staminaRestore: 12,
    healthRestore: 5
  }
]

/** 机器物品 */
const MACHINE_ITEMS: ItemDef[] = PROCESSING_MACHINES.map(m => ({
  id: `machine_${m.id}`,
  name: m.name,
  category: 'machine' as const,
  description: m.description,
  sellPrice: Math.floor(m.craftMoney * 0.5),
  edible: false
}))

/** 洒水器物品 */
const SPRINKLER_ITEMS: ItemDef[] = SPRINKLERS.map(s => ({
  id: s.id,
  name: s.name,
  category: 'sprinkler' as const,
  description: s.description,
  sellPrice: Math.floor(s.craftMoney * 0.5),
  edible: false
}))

/** 肥料物品 */
const FERTILIZER_ITEMS: ItemDef[] = FERTILIZERS.map(f => ({
  id: f.id,
  name: f.name,
  category: 'fertilizer' as const,
  description: f.description,
  sellPrice: 5,
  edible: false
}))

/** 鱼饵物品 */
const BAIT_ITEMS: ItemDef[] = BAITS.map(b => ({
  id: b.id,
  name: b.name,
  category: 'bait' as const,
  description: b.description,
  sellPrice: b.shopPrice ?? 5,
  edible: false
}))

/** 浮漂物品 */
const TACKLE_ITEMS: ItemDef[] = TACKLES.map(t => ({
  id: t.id,
  name: t.name,
  category: 'tackle' as const,
  description: t.description,
  sellPrice: t.shopPrice ? Math.floor(t.shopPrice * 0.5) : 50,
  edible: false
}))

/** 动物产品 */
const ANIMAL_PRODUCT_ITEMS: ItemDef[] = [
  {
    id: 'egg',
    name: '鸡蛋',
    category: 'animal_product',
    description: '新鲜的鸡蛋。',
    sellPrice: 50,
    edible: true,
    staminaRestore: 5,
    healthRestore: 3
  },
  {
    id: 'duck_egg',
    name: '鸭蛋',
    category: 'animal_product',
    description: '个大味美的鸭蛋。',
    sellPrice: 95,
    edible: true,
    staminaRestore: 8,
    healthRestore: 4
  },
  {
    id: 'milk',
    name: '牛奶',
    category: 'animal_product',
    description: '新鲜的牛奶。',
    sellPrice: 125,
    edible: true,
    staminaRestore: 10,
    healthRestore: 5
  },
  { id: 'wool', name: '羊毛', category: 'animal_product', description: '柔软的羊毛。', sellPrice: 340, edible: false },
  { id: 'hay', name: '干草', category: 'material', description: '喂养牲畜的干草。', sellPrice: 0, edible: false }
]

/** 果树水果 */
const FRUIT_TREE_ITEMS: ItemDef[] = FRUIT_TREE_DEFS.map(t => ({
  id: t.fruitId,
  name: t.fruitName,
  category: 'fruit' as const,
  description: `${t.name}结出的${t.fruitName}。`,
  sellPrice: t.fruitSellPrice,
  edible: true,
  staminaRestore: Math.floor(t.fruitSellPrice / 5),
  healthRestore: Math.floor(t.fruitSellPrice / 10)
}))

/** 树苗 */
const SAPLING_ITEMS: ItemDef[] = FRUIT_TREE_DEFS.map(t => ({
  id: t.saplingId,
  name: `${t.name}苗`,
  category: 'sapling' as const,
  description: `种下后${t.growthDays}天可成熟，${t.fruitSeason === 'spring' ? '春' : t.fruitSeason === 'summer' ? '夏' : t.fruitSeason === 'autumn' ? '秋' : '冬'}季产出${t.fruitName}。`,
  sellPrice: Math.floor(t.saplingPrice / 2),
  edible: false
}))

/** 野树产物和材料 */
const WILD_TREE_ITEMS: ItemDef[] = [
  {
    id: 'camphor_seed',
    name: '樟树种子',
    category: 'material',
    description: '樟树的种子，种下后可长成樟树。',
    sellPrice: 15,
    edible: false
  },
  {
    id: 'mulberry',
    name: '桑葚',
    category: 'misc',
    description: '紫黑色的桑葚，酸甜可口。',
    sellPrice: 25,
    edible: true,
    staminaRestore: 5,
    healthRestore: 2
  },
  { id: 'pine_resin', name: '松脂', category: 'material', description: '松树分泌的树脂，可用于制作。', sellPrice: 30, edible: false },
  { id: 'camphor_oil', name: '樟脑油', category: 'material', description: '樟树提取的精油，气味清香。', sellPrice: 50, edible: false },
  { id: 'silk', name: '蚕丝', category: 'material', description: '桑树上采集的蚕丝，光滑细腻。', sellPrice: 40, edible: false },
  { id: 'tapper', name: '采脂器', category: 'machine', description: '安装到成熟野树上，定期产出树脂。', sellPrice: 100, edible: false }
]

/** 炸弹物品 */
const BOMB_ITEMS: ItemDef[] = BOMBS.map(b => ({
  id: b.id,
  name: b.name,
  category: 'bomb' as const,
  description: b.description,
  sellPrice: b.shopPrice ?? 25,
  edible: false
}))

/** 所有物品定义 */
export const ITEMS: ItemDef[] = [
  ...SEED_ITEMS,
  ...CROP_ITEMS,
  ...ORE_ITEMS,
  ...MISC_ITEMS,
  ...FISH_ITEMS,
  ...FOOD_ITEMS,
  ...PROCESSED_ITEMS,
  ...MACHINE_ITEMS,
  ...SPRINKLER_ITEMS,
  ...FERTILIZER_ITEMS,
  ...BAIT_ITEMS,
  ...TACKLE_ITEMS,
  ...ANIMAL_PRODUCT_ITEMS,
  ...FRUIT_TREE_ITEMS,
  ...SAPLING_ITEMS,
  ...WILD_TREE_ITEMS,
  ...BOMB_ITEMS
]

/** 根据ID查找物品 */
export const getItemById = (id: string): ItemDef | undefined => {
  return ITEMS.find(i => i.id === id)
}
