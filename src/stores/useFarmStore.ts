import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { FarmPlot, FarmSize, Season, Quality } from '@/types'
import type { SprinklerType, FertilizerType, PlantedFruitTree, FruitTreeType, WildTreeType, PlantedWildTree } from '@/types'
import { getCropById } from '@/data'
import { SPRINKLERS, getFertilizerById } from '@/data/processing'
import { FRUIT_TREE_DEFS, MAX_FRUIT_TREES } from '@/data/fruitTrees'
import { MAX_WILD_TREES, getWildTreeDef } from '@/data/wildTrees'
import { GREENHOUSE_PLOT_COUNT } from '@/data/buildings'
import { useWalletStore } from './useWalletStore'

/** 已放置洒水器 */
export interface PlacedSprinkler {
  id: string
  type: SprinklerType
  plotId: number
}

/** 创建初始地块 */
const createPlots = (size: FarmSize): FarmPlot[] => {
  const total = size * size
  return Array.from({ length: total }, (_, i) => ({
    id: i,
    state: 'wasteland' as const,
    cropId: null,
    growthDays: 0,
    watered: false,
    unwateredDays: 0,
    fertilizer: null
  }))
}

export const useFarmStore = defineStore('farm', () => {
  const farmSize = ref<FarmSize>(4)
  const plots = ref<FarmPlot[]>(createPlots(4))
  const sprinklers = ref<PlacedSprinkler[]>([])
  const fruitTrees = ref<PlantedFruitTree[]>([])
  const greenhousePlots = ref<FarmPlot[]>([])
  const wildTrees = ref<PlantedWildTree[]>([])

  const tilledPlots = computed(() => plots.value.filter(p => p.state !== 'wasteland'))
  const harvestableCount = computed(() => plots.value.filter(p => p.state === 'harvestable').length)

  /** 重置农场为指定大小（用于新游戏初始化） */
  const resetFarm = (size: FarmSize) => {
    farmSize.value = size
    plots.value = createPlots(size)
    sprinklers.value = []
    fruitTrees.value = []
    greenhousePlots.value = []
    wildTrees.value = []
  }

  /** 开垦地块 */
  const tillPlot = (plotId: number): boolean => {
    const plot = plots.value[plotId]
    if (!plot || plot.state !== 'wasteland') return false
    plot.state = 'tilled'
    return true
  }

  /** 播种 */
  const plantCrop = (plotId: number, cropId: string): boolean => {
    const plot = plots.value[plotId]
    if (!plot || plot.state !== 'tilled') return false
    const crop = getCropById(cropId)
    if (!crop) return false
    plot.state = 'planted'
    plot.cropId = cropId
    plot.growthDays = 0
    plot.watered = false
    plot.unwateredDays = 0
    return true
  }

  /** 浇水 */
  const waterPlot = (plotId: number): boolean => {
    const plot = plots.value[plotId]
    if (!plot || (plot.state !== 'planted' && plot.state !== 'growing')) return false
    if (plot.watered) return false
    plot.watered = true
    plot.unwateredDays = 0
    return true
  }

  /** 收获，返回作物ID（支持再生作物） */
  const harvestPlot = (plotId: number): string | null => {
    const plot = plots.value[plotId]
    if (!plot || plot.state !== 'harvestable') return null
    const cropId = plot.cropId
    const crop = cropId ? getCropById(cropId) : null

    // 再生作物：收获后回到生长状态
    if (crop && crop.regrowth && crop.regrowthDays) {
      plot.state = 'growing'
      plot.growthDays = crop.growthDays - crop.regrowthDays
      plot.watered = false
      plot.unwateredDays = 0
    } else {
      plot.state = 'tilled'
      plot.cropId = null
      plot.growthDays = 0
      plot.watered = false
      plot.unwateredDays = 0
      plot.fertilizer = null
    }

    return cropId
  }

  // === 洒水器 ===

  /** 获取洒水器覆盖的地块ID列表 */
  const getSprinklerCoverage = (plotId: number, range: number): number[] => {
    const size = farmSize.value
    const row = Math.floor(plotId / size)
    const col = plotId % size
    const covered: number[] = []

    if (range === 4) {
      // 上下左右4块
      const offsets = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1]
      ]
      for (const [dr, dc] of offsets) {
        const nr = row + dr!,
          nc = col + dc!
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          covered.push(nr * size + nc)
        }
      }
    } else if (range === 8) {
      // 周围8块
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          const nr = row + dr,
            nc = col + dc
          if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
            covered.push(nr * size + nc)
          }
        }
      }
    }
    return covered
  }

  /** 放置洒水器 */
  const placeSprinkler = (plotId: number, sprinklerType: SprinklerType): boolean => {
    if (sprinklers.value.some(s => s.plotId === plotId)) return false
    const plot = plots.value[plotId]
    if (!plot) return false
    sprinklers.value.push({
      id: `${sprinklerType}_${plotId}`,
      type: sprinklerType,
      plotId
    })
    return true
  }

  /** 移除洒水器 */
  const removeSprinkler = (plotId: number): SprinklerType | null => {
    const idx = sprinklers.value.findIndex(s => s.plotId === plotId)
    if (idx === -1) return null
    const type = sprinklers.value[idx]!.type
    sprinklers.value.splice(idx, 1)
    return type
  }

  /** 获取被所有洒水器覆盖的地块集合 */
  const getAllWateredBySprinklers = (): Set<number> => {
    const watered = new Set<number>()
    for (const s of sprinklers.value) {
      const def = SPRINKLERS.find(d => d.id === s.type)
      if (!def) continue
      for (const pid of getSprinklerCoverage(s.plotId, def.range)) {
        watered.add(pid)
      }
    }
    return watered
  }

  // === 肥料 ===

  /** 给地块施肥 */
  const applyFertilizer = (plotId: number, fertilizerType: FertilizerType): boolean => {
    const plot = plots.value[plotId]
    if (!plot) return false
    if (plot.state === 'wasteland') return false
    if (plot.fertilizer) return false
    plot.fertilizer = fertilizerType
    return true
  }

  /** 每日更新所有地块 */
  const dailyUpdate = (isRainy: boolean) => {
    const sprinklerWatered = getAllWateredBySprinklers()
    const walletGrowth = useWalletStore().getCropGrowthBonus()

    for (const plot of plots.value) {
      if (plot.state !== 'planted' && plot.state !== 'growing') continue

      // 雨天或洒水器范围内自动浇水
      if (isRainy || sprinklerWatered.has(plot.id)) {
        plot.watered = true
        plot.unwateredDays = 0
      }

      // 处理浇水状态
      if (plot.watered) {
        // 肥料加速：百分比增长
        const fertDef = plot.fertilizer ? getFertilizerById(plot.fertilizer) : null
        const growthIncrement = 1 + (fertDef?.growthSpeedup ?? 0) + walletGrowth
        plot.growthDays += growthIncrement
        const crop = getCropById(plot.cropId!)
        if (crop && plot.growthDays >= crop.growthDays) {
          plot.state = 'harvestable'
        } else if (plot.state === 'planted') {
          plot.state = 'growing'
        }
      } else {
        plot.unwateredDays++
        if (plot.unwateredDays >= 2) {
          plot.state = 'tilled'
          plot.cropId = null
          plot.growthDays = 0
          plot.unwateredDays = 0
          plot.fertilizer = null
        }
      }

      // 重置每日浇水状态（保湿土可能保留）
      const retainFert = plot.fertilizer ? getFertilizerById(plot.fertilizer) : null
      if (retainFert?.retainChance && Math.random() < retainFert.retainChance) {
        // 保湿土保持浇水
      } else {
        plot.watered = false
      }
    }
  }

  /** 换季处理：枯萎不适合新季节的作物，退化空耕地 */
  const onSeasonChange = (newSeason: Season): { witheredCount: number; reclaimedCount: number } => {
    let witheredCount = 0
    let reclaimedCount = 0

    for (const plot of plots.value) {
      // 作物枯萎检查
      if ((plot.state === 'planted' || plot.state === 'growing' || plot.state === 'harvestable') && plot.cropId) {
        const crop = getCropById(plot.cropId)
        if (crop && !crop.season.includes(newSeason)) {
          plot.state = 'tilled'
          plot.cropId = null
          plot.growthDays = 0
          plot.watered = false
          plot.unwateredDays = 0
          plot.fertilizer = null
          witheredCount++
        }
      }

      // 空耕地退化（冬→春更严重）
      if (plot.state === 'tilled' && !plot.cropId) {
        const revertChance = newSeason === 'spring' ? 0.3 : 0.15
        if (Math.random() < revertChance) {
          plot.state = 'wasteland'
          plot.fertilizer = null
          reclaimedCount++
        }
      }
    }

    return { witheredCount, reclaimedCount }
  }

  /** 雷暴闪电：25%概率摧毁一株随机作物 */
  const lightningStrike = (): { hit: boolean; cropName?: string } => {
    const croppedPlots = plots.value.filter(p => (p.state === 'planted' || p.state === 'growing' || p.state === 'harvestable') && p.cropId)
    if (croppedPlots.length === 0) return { hit: false }

    if (Math.random() > 0.25) return { hit: false }

    const target = croppedPlots[Math.floor(Math.random() * croppedPlots.length)]!
    const crop = getCropById(target.cropId!)
    const cropName = crop?.name ?? '作物'

    target.state = 'tilled'
    target.cropId = null
    target.growthDays = 0
    target.watered = false
    target.unwateredDays = 0

    return { hit: true, cropName }
  }

  /** 扩建农场 */
  const expandFarm = (): FarmSize | null => {
    const sizes: FarmSize[] = [4, 6, 8]
    const currentIndex = sizes.indexOf(farmSize.value)
    if (currentIndex >= sizes.length - 1) return null
    const newSize = sizes[currentIndex + 1]!
    const oldPlots = [...plots.value]
    const newPlots = createPlots(newSize)
    for (let row = 0; row < farmSize.value; row++) {
      for (let col = 0; col < farmSize.value; col++) {
        const oldIndex = row * farmSize.value + col
        const newIndex = row * newSize + col
        const oldPlot = oldPlots[oldIndex]
        if (oldPlot) {
          newPlots[newIndex] = { ...oldPlot, id: newIndex }
        }
      }
    }
    farmSize.value = newSize
    plots.value = newPlots
    return newSize
  }

  // === 果树 ===

  /** 种植果树 */
  const plantFruitTree = (treeType: FruitTreeType): boolean => {
    if (fruitTrees.value.length >= MAX_FRUIT_TREES) return false
    fruitTrees.value.push({
      id: fruitTrees.value.length,
      type: treeType,
      growthDays: 0,
      mature: false,
      seasonAge: 0,
      todayFruit: false
    })
    return true
  }

  /** 果树每日更新 */
  const dailyFruitTreeUpdate = (currentSeason: Season): { fruits: { fruitId: string; quality: Quality }[] } => {
    const results: { fruitId: string; quality: Quality }[] = []
    for (const tree of fruitTrees.value) {
      tree.growthDays++
      tree.todayFruit = false
      if (!tree.mature && tree.growthDays >= 28) {
        tree.mature = true
      }
      if (tree.mature) {
        const def = FRUIT_TREE_DEFS.find(d => d.type === tree.type)
        if (def && def.fruitSeason === currentSeason) {
          const quality = getFruitQuality(tree.seasonAge)
          results.push({ fruitId: def.fruitId, quality })
          tree.todayFruit = true
        }
      }
    }
    return { fruits: results }
  }

  /** 果树品质：0季normal, 1季fine, 2季excellent, 3+季supreme */
  const getFruitQuality = (seasonAge: number): Quality => {
    if (seasonAge >= 3) return 'supreme'
    if (seasonAge >= 2) return 'excellent'
    if (seasonAge >= 1) return 'fine'
    return 'normal'
  }

  /** 果树换季更新 */
  const fruitTreeSeasonUpdate = (): void => {
    for (const tree of fruitTrees.value) {
      if (tree.mature) tree.seasonAge++
      tree.todayFruit = false
    }
  }

  // === 野树 ===

  /** 种植野树 */
  const plantWildTree = (treeType: WildTreeType): boolean => {
    if (wildTrees.value.length >= MAX_WILD_TREES) return false
    wildTrees.value.push({
      id: wildTrees.value.length,
      type: treeType,
      growthDays: 0,
      mature: false,
      hasTapper: false,
      tapDaysElapsed: 0,
      tapReady: false
    })
    return true
  }

  /** 安装采脂器 */
  const attachTapper = (treeId: number): boolean => {
    const tree = wildTrees.value.find(t => t.id === treeId)
    if (!tree || !tree.mature || tree.hasTapper) return false
    tree.hasTapper = true
    tree.tapDaysElapsed = 0
    tree.tapReady = false
    return true
  }

  /** 收取采脂产物 */
  const collectTapProduct = (treeId: number): string | null => {
    const tree = wildTrees.value.find(t => t.id === treeId)
    if (!tree || !tree.tapReady) return null
    const def = getWildTreeDef(tree.type)
    if (!def) return null
    tree.tapReady = false
    tree.tapDaysElapsed = 0
    return def.tapProduct
  }

  /** 野树每日更新 */
  const dailyWildTreeUpdate = (): { products: { treeId: number; productId: string; productName: string }[] } => {
    const readyProducts: { treeId: number; productId: string; productName: string }[] = []
    for (const tree of wildTrees.value) {
      if (!tree.mature) {
        tree.growthDays++
        const def = getWildTreeDef(tree.type)
        if (def && tree.growthDays >= def.growthDays) {
          tree.mature = true
        }
      }
      if (tree.hasTapper && tree.mature && !tree.tapReady) {
        tree.tapDaysElapsed++
        const def = getWildTreeDef(tree.type)
        if (def && tree.tapDaysElapsed >= def.tapCycleDays) {
          tree.tapReady = true
          readyProducts.push({ treeId: tree.id, productId: def.tapProduct, productName: def.tapProductName })
        }
      }
    }
    return { products: readyProducts }
  }

  // === 温室 ===

  /** 初始化温室地块 */
  const initGreenhouse = (): void => {
    if (greenhousePlots.value.length > 0) return
    greenhousePlots.value = Array.from({ length: GREENHOUSE_PLOT_COUNT }, (_, i) => ({
      id: i,
      state: 'tilled' as const,
      cropId: null,
      growthDays: 0,
      watered: false,
      unwateredDays: 0,
      fertilizer: null
    }))
  }

  /** 温室播种 */
  const greenhousePlantCrop = (plotId: number, cropId: string): boolean => {
    const plot = greenhousePlots.value[plotId]
    if (!plot || plot.state !== 'tilled') return false
    const crop = getCropById(cropId)
    if (!crop) return false
    plot.state = 'planted'
    plot.cropId = cropId
    plot.growthDays = 0
    plot.watered = false
    plot.unwateredDays = 0
    return true
  }

  /** 温室收获 */
  const greenhouseHarvestPlot = (plotId: number): string | null => {
    const plot = greenhousePlots.value[plotId]
    if (!plot || plot.state !== 'harvestable') return null
    const cropId = plot.cropId
    const crop = cropId ? getCropById(cropId) : null

    if (crop && crop.regrowth && crop.regrowthDays) {
      plot.state = 'growing'
      plot.growthDays = crop.growthDays - crop.regrowthDays
      plot.watered = false
      plot.unwateredDays = 0
    } else {
      plot.state = 'tilled'
      plot.cropId = null
      plot.growthDays = 0
      plot.watered = false
      plot.unwateredDays = 0
      plot.fertilizer = null
    }
    return cropId
  }

  /** 温室每日更新（自动浇水，无天气影响） */
  const greenhouseDailyUpdate = (): void => {
    const walletGrowth = useWalletStore().getCropGrowthBonus()
    for (const plot of greenhousePlots.value) {
      if (plot.state !== 'planted' && plot.state !== 'growing') continue
      plot.watered = true
      const fertDef = plot.fertilizer ? getFertilizerById(plot.fertilizer) : null
      const growthIncrement = 1 + (fertDef?.growthSpeedup ?? 0) + walletGrowth
      plot.growthDays += growthIncrement
      const crop = getCropById(plot.cropId!)
      if (crop && plot.growthDays >= crop.growthDays) {
        plot.state = 'harvestable'
      } else if (plot.state === 'planted') {
        plot.state = 'growing'
      }
      plot.watered = false
    }
  }

  const serialize = () => {
    return {
      farmSize: farmSize.value,
      plots: plots.value,
      sprinklers: sprinklers.value,
      fruitTrees: fruitTrees.value,
      greenhousePlots: greenhousePlots.value,
      wildTrees: wildTrees.value
    }
  }

  /** 存档迁移：旧肥料名称映射 */
  const migrateFertilizer = (f: string | null): FertilizerType | null => {
    if (!f) return null
    if (f === 'compost') return 'basic_fertilizer'
    if (f === 'bone_meal') return 'deluxe_speed_gro'
    return f as FertilizerType
  }

  const deserialize = (data: ReturnType<typeof serialize>) => {
    farmSize.value = data.farmSize as FarmSize
    plots.value = data.plots.map(p => ({ ...p, fertilizer: migrateFertilizer(p.fertilizer) }))
    sprinklers.value = (data as any).sprinklers ?? []
    fruitTrees.value = (data as any).fruitTrees ?? []
    wildTrees.value = (data as any).wildTrees ?? []
    greenhousePlots.value = ((data as any).greenhousePlots ?? []).map((p: any) => ({ ...p, fertilizer: migrateFertilizer(p.fertilizer) }))
  }

  return {
    farmSize,
    plots,
    sprinklers,
    fruitTrees,
    greenhousePlots,
    tilledPlots,
    harvestableCount,
    resetFarm,
    tillPlot,
    plantCrop,
    waterPlot,
    harvestPlot,
    getSprinklerCoverage,
    placeSprinkler,
    removeSprinkler,
    getAllWateredBySprinklers,
    applyFertilizer,
    dailyUpdate,
    onSeasonChange,
    lightningStrike,
    expandFarm,
    plantFruitTree,
    dailyFruitTreeUpdate,
    fruitTreeSeasonUpdate,
    wildTrees,
    plantWildTree,
    attachTapper,
    collectTapProduct,
    dailyWildTreeUpdate,
    initGreenhouse,
    greenhousePlantCrop,
    greenhouseHarvestPlot,
    greenhouseDailyUpdate,
    serialize,
    deserialize
  }
})
