import type { FertilizerType } from './processing'

/** 地块状态 */
export type PlotState = 'wasteland' | 'tilled' | 'planted' | 'growing' | 'harvestable'

/** 农场地块 */
export interface FarmPlot {
  id: number
  state: PlotState
  /** 种植的作物ID */
  cropId: string | null
  /** 已生长天数 */
  growthDays: number
  /** 今天是否已浇水 */
  watered: boolean
  /** 连续未浇水天数 */
  unwateredDays: number
  /** 已施加的肥料类型 */
  fertilizer: FertilizerType | null
}

/** 作物定义（配置数据用） */
export interface CropDef {
  id: string
  name: string
  seedId: string
  season: import('./game').Season[]
  growthDays: number
  sellPrice: number
  seedPrice: number
  /** 是否需要深度灌溉 */
  deepWatering: boolean
  description: string
  /** 是否为再生作物（收获后可重新长出） */
  regrowth?: boolean
  /** 再生天数 */
  regrowthDays?: number
}

/** 农场尺寸 */
export type FarmSize = 4 | 6 | 8
