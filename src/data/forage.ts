import type { Weather } from '@/types'

/** 采集物定义 */
export interface ForageItemDef {
  itemId: string
  name: string
  season: ('spring' | 'summer' | 'autumn' | 'winter')[]
  chance: number // 出现概率 0-1
  expReward: number
}

/** 天气对采集概率的修正 */
export const WEATHER_FORAGE_MODIFIER: Record<Weather, number> = {
  sunny: 1.0,
  rainy: 1.15,
  stormy: 0.8,
  snowy: 0.9,
  windy: 1.1
}

/** 竹林采集物 */
export const FORAGE_ITEMS: ForageItemDef[] = [
  { itemId: 'bamboo', name: '竹子', season: ['spring', 'summer', 'autumn'], chance: 0.5, expReward: 3 },
  { itemId: 'wood', name: '木材', season: ['spring', 'summer', 'autumn', 'winter'], chance: 0.6, expReward: 2 },
  { itemId: 'herb', name: '草药', season: ['spring', 'summer', 'autumn'], chance: 0.3, expReward: 5 },
  { itemId: 'firewood', name: '柴火', season: ['spring', 'summer', 'autumn', 'winter'], chance: 0.7, expReward: 1 },
  { itemId: 'winter_bamboo_shoot', name: '冬笋', season: ['winter'], chance: 0.35, expReward: 8 },
  { itemId: 'wintersweet', name: '腊梅', season: ['winter'], chance: 0.2, expReward: 10 },
  { itemId: 'wild_mushroom', name: '野蘑菇', season: ['autumn'], chance: 0.35, expReward: 6 },
  { itemId: 'ginseng', name: '人参', season: ['autumn', 'winter'], chance: 0.1, expReward: 15 },
  { itemId: 'wild_berry', name: '野果', season: ['summer'], chance: 0.4, expReward: 4 },
  { itemId: 'pine_cone', name: '松果', season: ['autumn', 'winter'], chance: 0.3, expReward: 5 },
  { itemId: 'camphor_seed', name: '樟树种子', season: ['spring', 'summer'], chance: 0.15, expReward: 5 },
  { itemId: 'mulberry', name: '桑葚', season: ['summer', 'autumn'], chance: 0.2, expReward: 4 }
]

/** 获取当前季节可采集物 */
export const getForageItems = (season: string): ForageItemDef[] => {
  return FORAGE_ITEMS.filter(f => f.season.includes(season as any))
}
