import type { AnimalBuildingDef, AnimalDef } from '@/types'

/** 畜舍定义 */
export const ANIMAL_BUILDINGS: AnimalBuildingDef[] = [
  {
    type: 'coop',
    name: '鸡舍',
    description: '饲养鸡鸭的小屋。',
    capacity: 4,
    cost: 4000,
    materialCost: [
      { itemId: 'wood', quantity: 100 },
      { itemId: 'bamboo', quantity: 50 }
    ]
  },
  {
    type: 'barn',
    name: '牲口棚',
    description: '饲养牛羊的棚舍。',
    capacity: 4,
    cost: 6000,
    materialCost: [
      { itemId: 'wood', quantity: 150 },
      { itemId: 'iron_ore', quantity: 20 }
    ]
  }
]

/** 动物定义 */
export const ANIMAL_DEFS: AnimalDef[] = [
  {
    type: 'chicken',
    name: '鸡',
    building: 'coop',
    cost: 800,
    productId: 'egg',
    productName: '鸡蛋',
    produceDays: 1,
    friendship: { min: 0, max: 1000 }
  },
  {
    type: 'duck',
    name: '鸭',
    building: 'coop',
    cost: 1200,
    productId: 'duck_egg',
    productName: '鸭蛋',
    produceDays: 2,
    friendship: { min: 0, max: 1000 }
  },
  {
    type: 'cow',
    name: '牛',
    building: 'barn',
    cost: 1500,
    productId: 'milk',
    productName: '牛奶',
    produceDays: 1,
    friendship: { min: 0, max: 1000 }
  },
  {
    type: 'sheep',
    name: '羊',
    building: 'barn',
    cost: 8000,
    productId: 'wool',
    productName: '羊毛',
    produceDays: 3,
    friendship: { min: 0, max: 1000 }
  }
]

/** 干草物品ID */
export const HAY_ITEM_ID = 'hay'

/** 干草购买价格 */
export const HAY_PRICE = 50

export const getAnimalDef = (type: string): AnimalDef | undefined => {
  return ANIMAL_DEFS.find(d => d.type === type)
}

export const getBuildingDef = (type: string): AnimalBuildingDef | undefined => {
  return ANIMAL_BUILDINGS.find(b => b.type === type)
}
