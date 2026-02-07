import type { FruitTreeDef } from '@/types'

/** 果树定义 */
export const FRUIT_TREE_DEFS: FruitTreeDef[] = [
  {
    type: 'peach_tree',
    name: '桃树',
    saplingId: 'sapling_peach',
    saplingPrice: 300,
    fruitId: 'tree_peach',
    fruitName: '鲜桃',
    fruitSeason: 'spring',
    growthDays: 28,
    fruitSellPrice: 60
  },
  {
    type: 'lychee_tree',
    name: '荔枝树',
    saplingId: 'sapling_lychee',
    saplingPrice: 400,
    fruitId: 'lychee',
    fruitName: '荔枝',
    fruitSeason: 'summer',
    growthDays: 28,
    fruitSellPrice: 80
  },
  {
    type: 'mandarin_tree',
    name: '橘树',
    saplingId: 'sapling_mandarin',
    saplingPrice: 350,
    fruitId: 'mandarin',
    fruitName: '橘子',
    fruitSeason: 'autumn',
    growthDays: 28,
    fruitSellPrice: 70
  },
  {
    type: 'plum_tree',
    name: '梅树',
    saplingId: 'sapling_plum',
    saplingPrice: 500,
    fruitId: 'plum_blossom',
    fruitName: '梅花',
    fruitSeason: 'winter',
    growthDays: 28,
    fruitSellPrice: 100
  }
]

/** 最大果树数量 */
export const MAX_FRUIT_TREES = 6

export const getFruitTreeDef = (type: string): FruitTreeDef | undefined => {
  return FRUIT_TREE_DEFS.find(d => d.type === type)
}
