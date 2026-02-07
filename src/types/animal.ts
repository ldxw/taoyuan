import type { Season } from '.'

export type AnimalBuildingType = 'coop' | 'barn'
export type AnimalType = 'chicken' | 'duck' | 'cow' | 'sheep'

export interface AnimalBuildingDef {
  type: AnimalBuildingType
  name: string
  description: string
  capacity: number
  cost: number
  materialCost: { itemId: string; quantity: number }[]
}

export interface AnimalDef {
  type: AnimalType
  name: string
  building: AnimalBuildingType
  cost: number
  productId: string
  productName: string
  produceDays: number
  friendship: { min: number; max: number }
}

export interface Animal {
  id: string
  type: AnimalType
  name: string
  friendship: number
  mood: number
  daysOwned: number
  daysSinceProduct: number
  wasFed: boolean
  wasPetted: boolean
}

export type FruitTreeType = 'peach_tree' | 'lychee_tree' | 'mandarin_tree' | 'plum_tree'

export interface FruitTreeDef {
  type: FruitTreeType
  name: string
  saplingId: string
  saplingPrice: number
  fruitId: string
  fruitName: string
  fruitSeason: Season
  growthDays: number
  fruitSellPrice: number
}

export interface PlantedFruitTree {
  id: number
  type: FruitTreeType
  growthDays: number
  mature: boolean
  seasonAge: number
  todayFruit: boolean
}

export type FarmhouseLevel = 0 | 1 | 2 | 3
export type CaveChoice = 'none' | 'mushroom' | 'fruit_bat'
