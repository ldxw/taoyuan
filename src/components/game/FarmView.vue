<template>
  <div>
    <h3 class="text-accent text-sm mb-3">你的田庄 ({{ farmStore.farmSize }}×{{ farmStore.farmSize }})</h3>

    <!-- 操作模式选择 -->
    <div class="flex gap-2 mb-3 flex-wrap">
      <button class="btn text-xs" :class="{ 'bg-accent text-bg': farmMode === 'crop' && !selectedSeed }" @click="selectCropMode(null)">
        <Droplets :size="14" />
        浇水/收获
      </button>
      <button
        v-for="seed in plantableSeeds"
        :key="seed.seedId"
        class="btn text-xs"
        :class="{ 'bg-accent text-bg': farmMode === 'crop' && selectedSeed === seed.cropId }"
        @click="selectCropMode(seed.cropId)"
      >
        <Leaf :size="14" />
        {{ seed.name }} (×{{ seed.count }})
      </button>
      <span class="text-muted text-xs mx-1">|</span>
      <button
        v-for="s in sprinklerItems"
        :key="s.itemId"
        class="btn text-xs"
        :class="{ 'bg-accent text-bg': farmMode === 'sprinkler' && selectedSprinkler === s.type }"
        @click="selectSprinklerMode(s.type)"
      >
        <Droplet :size="14" />
        {{ s.name }} (×{{ s.count }})
      </button>
      <button
        v-for="f in fertilizerItems"
        :key="f.itemId"
        class="btn text-xs"
        :class="{ 'bg-accent text-bg': farmMode === 'fertilizer' && selectedFertilizer === f.type }"
        @click="selectFertilizerMode(f.type)"
      >
        <Beaker :size="14" />
        {{ f.name }} (×{{ f.count }})
      </button>
    </div>

    <!-- 农场网格 -->
    <div class="grid gap-1 max-w-full md:max-w-md" :style="{ gridTemplateColumns: `repeat(${farmStore.farmSize}, minmax(0, 1fr))` }">
      <button
        v-for="plot in farmStore.plots"
        :key="plot.id"
        class="aspect-square rounded-[2px] flex flex-col items-center justify-center text-sm cursor-pointer transition-colors hover:border-accent/60 hover:bg-panel/80 relative"
        :class="[getPlotDisplay(plot).color, needsWater(plot) ? 'border-2 border-danger/50' : 'border border-accent/20']"
        :title="getPlotTooltip(plot)"
        @click="handlePlotAction(plot.id)"
      >
        {{ getPlotDisplay(plot).text }}
        <!-- 需浇水标记 -->
        <Droplets
          v-if="(plot.state === 'planted' || plot.state === 'growing') && !plot.watered"
          :size="8"
          class="absolute bottom-0 right-0 text-danger"
        />
        <!-- 洒水器标记 -->
        <Droplet v-if="hasSprinkler(plot.id)" :size="8" class="absolute top-0 right-0 text-water" />
        <!-- 肥料标记 -->
        <CirclePlus v-if="plot.fertilizer" :size="8" class="absolute bottom-0 left-0 text-success" />
      </button>
    </div>

    <!-- 图例 -->
    <div class="flex gap-4 mt-3 text-xs text-muted flex-wrap">
      <span>
        <span class="text-muted">荒</span>
        =荒地
      </span>
      <span>
        <span class="text-earth">耕</span>
        =已耕
      </span>
      <span>
        <span class="text-success/60">苗</span>
        =已种
      </span>
      <span>
        <span class="text-success">长</span>
        =生长中
      </span>
      <span>
        <span class="text-water">润</span>
        =已浇水
      </span>
      <span>
        <span class="text-accent">熟</span>
        =可收获
      </span>
      <span>
        <Droplet :size="12" class="text-water inline" />
        =洒水器
      </span>
      <span>
        <CirclePlus :size="12" class="text-success inline" />
        =肥料
      </span>
      <span>
        <Droplets :size="12" class="text-danger inline" />
        =需浇水
      </span>
    </div>
    <!-- 浇水提示 -->
    <p v-if="unwateredCount > 0" class="text-xs text-danger mt-1">还有 {{ unwateredCount }} 块地需要浇水</p>

    <!-- 果树区 -->
    <div class="mt-4 border-t border-accent/20 pt-3">
      <h3 class="text-accent text-sm mb-2">
        <TreeDeciduous :size="14" class="inline" />
        果树 ({{ farmStore.fruitTrees.length }}/{{ MAX_FRUIT_TREES }})
      </h3>
      <div v-if="farmStore.fruitTrees.length > 0" class="flex flex-col gap-1 mb-2">
        <div v-for="tree in farmStore.fruitTrees" :key="tree.id" class="flex items-center gap-3 text-xs">
          <span class="w-16">{{ getTreeName(tree.type) }}</span>
          <span v-if="!tree.mature" class="text-muted">生长中 {{ tree.growthDays }}/28天</span>
          <span v-else-if="tree.todayFruit" class="text-accent">今日已结果</span>
          <span v-else class="text-success">已成熟 ({{ tree.seasonAge }}季) · {{ getTreeFruitSeason(tree.type) }}产果</span>
          <div v-if="!tree.mature" class="flex-1 h-1.5 bg-bg rounded-[2px] border border-accent/10">
            <div
              class="h-full rounded-[2px] bg-success transition-all"
              :style="{ width: Math.floor((tree.growthDays / 28) * 100) + '%' }"
            />
          </div>
        </div>
      </div>
      <div v-if="plantableSaplings.length > 0 && farmStore.fruitTrees.length < MAX_FRUIT_TREES" class="flex gap-2 flex-wrap">
        <button v-for="s in plantableSaplings" :key="s.saplingId" class="btn text-xs" @click="handlePlantTree(s.type)">
          <TreePine :size="14" />
          种{{ s.name }} (×{{ s.count }})
        </button>
      </div>
      <p v-else-if="farmStore.fruitTrees.length === 0" class="text-xs text-muted">购买树苗后可在此种植果树。</p>
    </div>

    <!-- 野树区 -->
    <div class="mt-4 border-t border-accent/20 pt-3">
      <h3 class="text-accent text-sm mb-2">
        <TreePine :size="14" class="inline" />
        野树 ({{ farmStore.wildTrees.length }}/{{ MAX_WILD_TREES }})
      </h3>
      <div v-if="farmStore.wildTrees.length > 0" class="flex flex-col gap-1 mb-2">
        <div v-for="tree in farmStore.wildTrees" :key="tree.id" class="flex items-center gap-3 text-xs">
          <span class="w-12">{{ getWildTreeName(tree.type) }}</span>
          <template v-if="!tree.mature">
            <span class="text-muted">生长中 {{ tree.growthDays }}/{{ getWildTreeDef(tree.type)?.growthDays ?? '?' }}天</span>
            <div class="flex-1 h-1.5 bg-bg rounded-[2px] border border-accent/10">
              <div
                class="h-full rounded-[2px] bg-success transition-all"
                :style="{ width: Math.floor((tree.growthDays / (getWildTreeDef(tree.type)?.growthDays ?? 28)) * 100) + '%' }"
              />
            </div>
          </template>
          <template v-else-if="!tree.hasTapper">
            <span class="text-success">已成熟</span>
            <button v-if="hasTapper" class="btn text-xs" @click="handleAttachTapper(tree.id)">
              <Wrench :size="14" />
              装采脂器
            </button>
            <span v-else class="text-muted">需在工坊制造采脂器</span>
          </template>
          <template v-else-if="tree.tapReady">
            <span class="text-accent">可收取</span>
            <button class="btn text-xs bg-accent text-bg" @click="handleCollectTapProduct(tree.id)">
              <Gift :size="14" />
              收取
            </button>
          </template>
          <template v-else>
            <span class="text-muted">采脂中 {{ tree.tapDaysElapsed }}/{{ getWildTreeDef(tree.type)?.tapCycleDays ?? '?' }}天</span>
          </template>
        </div>
      </div>
      <div v-if="plantableWildSeeds.length > 0 && farmStore.wildTrees.length < MAX_WILD_TREES" class="flex gap-2 flex-wrap">
        <button v-for="s in plantableWildSeeds" :key="s.type" class="btn text-xs" @click="handlePlantWildTree(s.type)">
          <TreePine :size="14" />
          种{{ s.name }} (×{{ s.count }})
        </button>
      </div>
      <p v-else-if="farmStore.wildTrees.length === 0" class="text-xs text-muted">采集松果、樟树种子或桑葚后可在此种植野树。</p>
    </div>

    <!-- 温室 -->
    <div v-if="showGreenhouse" class="mt-4 border-t border-accent/20 pt-3">
      <div class="flex items-center gap-2 mb-2">
        <h3 class="text-accent text-sm">温室</h3>
        <button class="btn text-xs py-0 px-1" :class="{ 'bg-accent text-bg': greenhouseMode }" @click="greenhouseMode = !greenhouseMode">
          <template v-if="greenhouseMode">
            <ArrowLeft :size="14" />
            返回农场
          </template>
          <template v-else>
            <ArrowRight :size="14" />
            进入温室
          </template>
        </button>
      </div>
      <template v-if="greenhouseMode">
        <!-- 温室种子选择 -->
        <div class="flex gap-2 mb-2 flex-wrap">
          <button class="btn text-xs" :class="{ 'bg-accent text-bg': !ghSelectedSeed }" @click="ghSelectedSeed = null">
            <Droplets :size="14" />
            浇水/收获
          </button>
          <button
            v-for="seed in allSeeds"
            :key="seed.seedId"
            class="btn text-xs"
            :class="{ 'bg-accent text-bg': ghSelectedSeed === seed.cropId }"
            @click="ghSelectedSeed = seed.cropId"
          >
            {{ seed.name }} (×{{ seed.count }})
          </button>
        </div>
        <!-- 温室地块 -->
        <div class="grid gap-1 max-w-md" style="grid-template-columns: repeat(4, minmax(0, 1fr))">
          <button
            v-for="plot in farmStore.greenhousePlots"
            :key="plot.id"
            class="aspect-square border border-accent/20 rounded-[2px] flex flex-col items-center justify-center text-sm cursor-pointer transition-colors hover:border-accent/60 hover:bg-panel/80"
            :class="getPlotDisplay(plot).color"
            :title="getPlotTooltip(plot)"
            @click="handleGreenhouseAction(plot.id)"
          >
            {{ getPlotDisplay(plot).text }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import {
    Droplets,
    Leaf,
    Droplet,
    Beaker,
    TreePine,
    TreeDeciduous,
    ArrowRight,
    ArrowLeft,
    Wrench,
    Gift,
    CirclePlus
  } from 'lucide-vue-next'
  import { useFarmStore, useInventoryStore, useGameStore, useHomeStore, usePlayerStore, useSkillStore, SEASON_NAMES } from '@/stores'
  import { getCropById, getCropsBySeason } from '@/data'
  import { FRUIT_TREE_DEFS, MAX_FRUIT_TREES } from '@/data/fruitTrees'
  import { WILD_TREE_DEFS, MAX_WILD_TREES, getWildTreeDef } from '@/data/wildTrees'
  import { CROPS } from '@/data/crops'
  import { FERTILIZERS, getFertilizerById } from '@/data/processing'
  import { ACTION_TIME_COSTS } from '@/data/timeConstants'
  import { addLog, showFloat } from '@/composables/useGameLog'
  import { handlePlotClick, useFarmActions, QUALITY_NAMES } from '@/composables/useFarmActions'
  import type { SprinklerType, FertilizerType, FruitTreeType, WildTreeType } from '@/types'
  import { sfxHarvest } from '@/composables/useAudio'

  const { selectedSeed } = useFarmActions()

  const farmStore = useFarmStore()
  const inventoryStore = useInventoryStore()
  const gameStore = useGameStore()
  const homeStore = useHomeStore()

  type FarmMode = 'crop' | 'sprinkler' | 'fertilizer'
  const farmMode = ref<FarmMode>('crop')
  const selectedSprinkler = ref<SprinklerType | null>(null)
  const selectedFertilizer = ref<FertilizerType | null>(null)

  const selectCropMode = (cropId: string | null) => {
    farmMode.value = 'crop'
    selectedSeed.value = cropId
  }

  const selectSprinklerMode = (type: SprinklerType) => {
    farmMode.value = 'sprinkler'
    selectedSprinkler.value = type
  }

  const selectFertilizerMode = (type: FertilizerType) => {
    farmMode.value = 'fertilizer'
    selectedFertilizer.value = type
  }

  /** 背包中的洒水器 */
  const sprinklerItems = computed(() => {
    const types: { type: SprinklerType; itemId: string; name: string }[] = [
      { type: 'bamboo_sprinkler', itemId: 'bamboo_sprinkler', name: '竹筒洒水器' },
      { type: 'copper_sprinkler', itemId: 'copper_sprinkler', name: '铜管洒水器' }
    ]
    return types.map(s => ({ ...s, count: inventoryStore.getItemCount(s.itemId) })).filter(s => s.count > 0)
  })

  /** 背包中的肥料 */
  const fertilizerItems = computed(() => {
    return FERTILIZERS.map(f => ({
      type: f.id as FertilizerType,
      itemId: f.id,
      name: f.name,
      count: inventoryStore.getItemCount(f.id)
    })).filter(f => f.count > 0)
  })

  /** 当前季节可种植的作物 */
  const plantableSeeds = computed(() => {
    return getCropsBySeason(gameStore.season)
      .filter(crop => inventoryStore.hasItem(crop.seedId))
      .map(crop => ({
        cropId: crop.id,
        seedId: crop.seedId,
        name: crop.name,
        count: inventoryStore.getItemCount(crop.seedId)
      }))
  })

  const hasSprinkler = (plotId: number): boolean => {
    return farmStore.sprinklers.some(s => s.plotId === plotId)
  }

  /** 判断地块是否需要浇水 */
  const needsWater = (plot: (typeof farmStore.plots)[number]): boolean => {
    return (plot.state === 'planted' || plot.state === 'growing') && !plot.watered
  }

  /** 未浇水地块数量 */
  const unwateredCount = computed(() => farmStore.plots.filter(needsWater).length)

  const handlePlotAction = (plotId: number) => {
    if (farmMode.value === 'sprinkler' && selectedSprinkler.value) {
      // 放置洒水器
      if (hasSprinkler(plotId)) {
        // 已有洒水器则拆除
        const type = farmStore.removeSprinkler(plotId)
        if (type) {
          inventoryStore.addItem(type)
          addLog('拆除了洒水器，已回收到背包。')
        }
        return
      }
      if (!inventoryStore.removeItem(selectedSprinkler.value)) {
        addLog('背包中没有该洒水器了。')
        return
      }
      if (farmStore.placeSprinkler(plotId, selectedSprinkler.value)) {
        addLog('放置了洒水器，周围地块将自动浇水。')
      } else {
        inventoryStore.addItem(selectedSprinkler.value) // 回退
        addLog('无法在此放置洒水器。')
      }
      return
    }

    if (farmMode.value === 'fertilizer' && selectedFertilizer.value) {
      // 施肥
      if (!inventoryStore.removeItem(selectedFertilizer.value)) {
        addLog('背包中没有该肥料了。')
        return
      }
      if (farmStore.applyFertilizer(plotId, selectedFertilizer.value)) {
        const fertDef = getFertilizerById(selectedFertilizer.value)
        addLog(`施了${fertDef?.name ?? '肥料'}。`)
      } else {
        inventoryStore.addItem(selectedFertilizer.value)
        addLog('无法在此施肥（需要已开垦且未施肥的地块）。')
      }
      return
    }

    // 默认：农作操作
    handlePlotClick(plotId)
  }

  /** 地块显示文字 */
  const getPlotDisplay = (plot: (typeof farmStore.plots)[number]) => {
    switch (plot.state) {
      case 'wasteland':
        return { text: '荒', color: 'text-muted' }
      case 'tilled':
        return { text: '耕', color: 'text-earth' }
      case 'planted':
        return { text: plot.watered ? '润' : '苗', color: plot.watered ? 'text-water' : 'text-success/60' }
      case 'growing': {
        const crop = getCropById(plot.cropId!)
        const progress = crop ? Math.floor((plot.growthDays / crop.growthDays) * 100) : 0
        return {
          text: plot.watered ? '润' : '长',
          color: plot.watered ? 'text-water' : progress > 60 ? 'text-success' : 'text-success/80'
        }
      }
      case 'harvestable':
        return { text: '熟', color: 'text-accent' }
      default:
        return { text: '？', color: 'text-muted' }
    }
  }

  const getPlotTooltip = (plot: (typeof farmStore.plots)[number]): string => {
    let tip = ''
    if (plot.state === 'wasteland') tip = '荒地（点击开垦）'
    else if (plot.state === 'tilled') tip = '已耕地（选择种子后点击播种）'
    else if (plot.state === 'harvestable') {
      const crop = getCropById(plot.cropId!)
      tip = `${crop?.name ?? ''}已成熟（点击收获）`
    } else if (plot.state === 'planted' || plot.state === 'growing') {
      const crop = getCropById(plot.cropId!)
      tip = `${crop?.name ?? ''} ${plot.growthDays}/${crop?.growthDays ?? '?'}天 ${plot.watered ? '已浇水' : '需浇水'}`
    }
    if (hasSprinkler(plot.id)) tip += ' [洒水器]'
    if (plot.fertilizer) {
      const fertDef = getFertilizerById(plot.fertilizer)
      tip += ` [${fertDef?.name ?? plot.fertilizer}]`
    }
    return tip
  }

  // === 果树 ===

  const getTreeName = (type: string): string => {
    return FRUIT_TREE_DEFS.find(d => d.type === type)?.name ?? type
  }

  const getTreeFruitSeason = (type: string): string => {
    const def = FRUIT_TREE_DEFS.find(d => d.type === type)
    if (!def) return '?'
    return SEASON_NAMES[def.fruitSeason as keyof typeof SEASON_NAMES]
  }

  const plantableSaplings = computed(() => {
    return FRUIT_TREE_DEFS.filter(d => inventoryStore.hasItem(d.saplingId)).map(d => ({
      type: d.type as FruitTreeType,
      saplingId: d.saplingId,
      name: d.name,
      count: inventoryStore.getItemCount(d.saplingId)
    }))
  })

  /** 背包中可种植的野树种子 */
  const plantableWildSeeds = computed(() => {
    return WILD_TREE_DEFS.filter(d => inventoryStore.hasItem(d.seedItemId)).map(d => ({
      type: d.type as WildTreeType,
      seedItemId: d.seedItemId,
      name: d.name,
      count: inventoryStore.getItemCount(d.seedItemId)
    }))
  })

  /** 背包中是否有采脂器 */
  const hasTapper = computed(() => inventoryStore.getItemCount('tapper') > 0)

  const handlePlantTree = (treeType: FruitTreeType) => {
    const def = FRUIT_TREE_DEFS.find(d => d.type === treeType)
    if (!def) return
    if (!inventoryStore.removeItem(def.saplingId)) {
      addLog('背包中没有该树苗。')
      return
    }
    if (farmStore.plantFruitTree(treeType)) {
      addLog(`种下了${def.name}苗，需28天成熟。`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.plantTree)
      if (tr.message) addLog(tr.message)
    } else {
      inventoryStore.addItem(def.saplingId)
      addLog(`果树位已满（最多${MAX_FRUIT_TREES}棵）。`)
    }
  }

  // === 野树 ===

  const getWildTreeName = (type: string): string => {
    return getWildTreeDef(type)?.name ?? type
  }

  const handlePlantWildTree = (treeType: WildTreeType) => {
    const def = WILD_TREE_DEFS.find(d => d.type === treeType)
    if (!def) return
    if (!inventoryStore.removeItem(def.seedItemId)) {
      addLog('背包中没有该种子。')
      return
    }
    if (farmStore.plantWildTree(treeType)) {
      addLog(`种下了${def.name}，需${def.growthDays}天成熟。`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.plantTree)
      if (tr.message) addLog(tr.message)
    } else {
      inventoryStore.addItem(def.seedItemId)
      addLog(`野树位已满（最多${MAX_WILD_TREES}棵）。`)
    }
  }

  const handleAttachTapper = (treeId: number) => {
    if (!inventoryStore.removeItem('tapper')) {
      addLog('背包中没有采脂器。')
      return
    }
    if (farmStore.attachTapper(treeId)) {
      addLog('安装了采脂器，将定期产出树脂。')
    } else {
      inventoryStore.addItem('tapper')
      addLog('无法安装采脂器（需要已成熟且未装采脂器的野树）。')
    }
  }

  const handleCollectTapProduct = (treeId: number) => {
    const productId = farmStore.collectTapProduct(treeId)
    if (productId) {
      inventoryStore.addItem(productId)
      const def = WILD_TREE_DEFS.find(d => d.tapProduct === productId)
      addLog(`收取了${def?.tapProductName ?? productId}！`)
    }
  }

  // === 温室 ===

  const showGreenhouse = computed(() => homeStore.greenhouseUnlocked)
  const greenhouseMode = ref(false)
  const ghSelectedSeed = ref<string | null>(null)

  /** 温室可用的所有种子（不限季节） */
  const allSeeds = computed(() => {
    return CROPS.filter(crop => inventoryStore.hasItem(crop.seedId)).map(crop => ({
      cropId: crop.id,
      seedId: crop.seedId,
      name: crop.name,
      count: inventoryStore.getItemCount(crop.seedId)
    }))
  })

  const handleGreenhouseAction = (plotId: number) => {
    const plot = farmStore.greenhousePlots[plotId]
    if (!plot) return

    if (ghSelectedSeed.value && plot.state === 'tilled') {
      const crop = getCropById(ghSelectedSeed.value)
      if (!crop) return
      if (!inventoryStore.removeItem(crop.seedId)) {
        addLog('背包中没有该种子了。')
        return
      }
      if (farmStore.greenhousePlantCrop(plotId, ghSelectedSeed.value)) {
        addLog(`在温室中播种了${crop.name}。`)
      } else {
        inventoryStore.addItem(crop.seedId)
      }
    } else if (plot.state === 'harvestable') {
      const playerStore = usePlayerStore()
      if (!playerStore.consumeStamina(1)) {
        addLog('体力不足，无法收获。')
        return
      }
      const cropId = farmStore.greenhouseHarvestPlot(plotId)
      if (cropId) {
        const cropDef = getCropById(cropId)
        const skillStore = useSkillStore()
        const quality = skillStore.rollCropQualityWithBonus(0)
        inventoryStore.addItem(cropId, 1, quality)
        const qualityLabel = quality !== 'normal' ? `(${QUALITY_NAMES[quality]})` : ''
        sfxHarvest()
        showFloat(`+${cropDef?.name ?? cropId}${qualityLabel}`, 'success')
        addLog(`在温室收获了${cropDef?.name ?? cropId}${qualityLabel}！(-1体力)`)
      }
    }
  }
</script>
