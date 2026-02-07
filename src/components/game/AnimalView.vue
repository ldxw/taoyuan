<template>
  <div>
    <h3 class="text-accent text-sm mb-3">
      <Home :size="14" class="inline" />
      畜棚
    </h3>
    <p class="text-xs text-muted mb-3">建造畜舍后可购买和饲养动物，每天喂食干草并抚摸可提升友好度。</p>

    <!-- 畜舍列表 -->
    <div v-for="bDef in ANIMAL_BUILDINGS" :key="bDef.type" class="mb-4 border border-accent/20 rounded-[2px] p-3">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-accent">{{ bDef.name }}</span>
        <span v-if="isBuildingBuilt(bDef.type)" class="text-xs text-muted">
          {{ getAnimalsInBuilding(bDef.type).length }}/{{ bDef.capacity }}
        </span>
        <button v-else class="btn text-xs" @click="handleBuildBuilding(bDef.type)">
          <Hammer :size="14" />
          建造 ({{ bDef.cost }}文 + 材料)
        </button>
      </div>

      <template v-if="isBuildingBuilt(bDef.type)">
        <!-- 购买动物按钮 -->
        <div class="flex gap-2 mb-2 flex-wrap">
          <button
            v-for="aDef in getAnimalDefsForBuilding(bDef.type)"
            :key="aDef.type"
            class="btn text-xs"
            :disabled="getAnimalsInBuilding(bDef.type).length >= bDef.capacity"
            @click="handleBuyAnimal(aDef.type)"
          >
            <ShoppingCart :size="14" />
            买{{ aDef.name }} ({{ aDef.cost }}文)
          </button>
        </div>

        <!-- 动物列表 -->
        <div
          v-for="animal in getAnimalsInBuilding(bDef.type)"
          :key="animal.id"
          class="flex items-center gap-3 py-1 border-t border-accent/10"
        >
          <span class="text-xs w-16">{{ animal.name }}</span>
          <div class="flex-1">
            <div class="w-full h-1.5 bg-bg rounded-[2px] border border-accent/10">
              <div class="h-full rounded-[2px] bg-danger transition-all" :style="{ width: Math.floor(animal.friendship / 10) + '%' }" />
            </div>
          </div>
          <span class="text-xs text-muted w-8">{{ getMoodText(animal.mood) }}</span>
          <button class="btn text-xs py-0 px-1" :disabled="animal.wasPetted" @click="handlePetAnimal(animal.id)">
            <Hand :size="14" />
            {{ animal.wasPetted ? '已摸' : '抚摸' }}
          </button>
        </div>

        <p v-if="getAnimalsInBuilding(bDef.type).length === 0" class="text-xs text-muted">暂无动物。</p>
      </template>
      <template v-else>
        <p class="text-xs text-muted">需要：{{ bDef.materialCost.map(m => `${getItemName(m.itemId)}×${m.quantity}`).join('、') }}</p>
      </template>
    </div>

    <!-- 喂食 -->
    <div class="flex items-center gap-3 mt-3">
      <button class="btn text-xs" :disabled="animalStore.animals.length === 0" @click="handleFeedAll">
        <Apple :size="14" />
        喂食全部 (需干草×{{ unfedCount }})
      </button>
      <span class="text-xs text-muted">干草库存：{{ hayCount }}</span>
      <button class="btn text-xs" :disabled="playerStore.money < HAY_PRICE" @click="handleBuyHay">
        <ShoppingCart :size="14" />
        买干草 ({{ HAY_PRICE }}文)
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { Hammer, ShoppingCart, Hand, Apple, Home } from 'lucide-vue-next'
  import { useAnimalStore, useInventoryStore, usePlayerStore, useGameStore } from '@/stores'
  import { ANIMAL_BUILDINGS, ANIMAL_DEFS, HAY_ITEM_ID, HAY_PRICE, getItemById } from '@/data'
  import { ACTION_TIME_COSTS } from '@/data/timeConstants'
  import type { AnimalBuildingType, AnimalType } from '@/types'
  import { addLog } from '@/composables/useGameLog'
  import { handleEndDay } from '@/composables/useEndDay'

  const animalStore = useAnimalStore()
  const inventoryStore = useInventoryStore()
  const playerStore = usePlayerStore()
  const gameStore = useGameStore()

  /** 干草库存数量 */
  const hayCount = computed(() => inventoryStore.getItemCount(HAY_ITEM_ID))

  /** 未喂食动物数量 */
  const unfedCount = computed(() => animalStore.animals.filter(a => !a.wasFed).length)

  /** 查询物品中文名 */
  const getItemName = (itemId: string): string => {
    return getItemById(itemId)?.name ?? itemId
  }

  /** 判断畜舍是否已建造 */
  const isBuildingBuilt = (type: AnimalBuildingType): boolean => {
    return animalStore.buildings.find(b => b.type === type)?.built ?? false
  }

  /** 获取某畜舍中的动物列表 */
  const getAnimalsInBuilding = (type: AnimalBuildingType) => {
    return animalStore.animals.filter(a => {
      const def = ANIMAL_DEFS.find(d => d.type === a.type)
      return def?.building === type
    })
  }

  /** 获取某畜舍可购买的动物定义 */
  const getAnimalDefsForBuilding = (type: AnimalBuildingType) => {
    return ANIMAL_DEFS.filter(d => d.building === type)
  }

  /** 心情文字 */
  const getMoodText = (mood: number): string => {
    if (mood > 200) return '开心'
    if (mood > 100) return '一般'
    return '低落'
  }

  /** 建造畜舍 */
  const handleBuildBuilding = (type: AnimalBuildingType) => {
    const success = animalStore.buildBuilding(type)
    const bDef = ANIMAL_BUILDINGS.find(b => b.type === type)
    if (success) {
      addLog(`成功建造了${bDef?.name ?? '畜舍'}！`)
      const tr = gameStore.advanceTime(2)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) handleEndDay()
    } else {
      addLog(`建造${bDef?.name ?? '畜舍'}失败，请检查金币和材料是否充足。`)
    }
  }

  /** 购买动物 */
  const handleBuyAnimal = (type: AnimalType) => {
    const aDef = ANIMAL_DEFS.find(d => d.type === type)
    if (!aDef) return
    const count = animalStore.animals.filter(a => a.type === type).length
    const defaultName = `${aDef.name}${count + 1}`
    const success = animalStore.buyAnimal(type, defaultName)
    if (success) {
      addLog(`买了一只${aDef.name}，取名「${defaultName}」。`)
    } else {
      addLog(`购买${aDef.name}失败，请检查金币和畜舍容量。`)
    }
  }

  /** 抚摸动物 */
  const handlePetAnimal = (id: string) => {
    const success = animalStore.petAnimal(id)
    if (success) {
      const animal = animalStore.animals.find(a => a.id === id)
      addLog(`抚摸了${animal?.name ?? '动物'}，友好度提升了。`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.petAnimal)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) handleEndDay()
    } else {
      addLog('今天已经抚摸过了。')
    }
  }

  /** 喂食全部动物 */
  const handleFeedAll = () => {
    const result = animalStore.feedAll()
    if (result.fedCount > 0) {
      addLog(`喂食了${result.fedCount}只动物。`)
    }
    if (result.noHayCount > 0) {
      addLog(`干草不足，${result.noHayCount}只动物未能喂食。`)
    }
    if (result.fedCount === 0 && result.noHayCount === 0) {
      addLog('所有动物今天都已喂过了。')
    }
    if (result.fedCount > 0) {
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.feedAnimals)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) handleEndDay()
    }
  }

  /** 购买干草 */
  const handleBuyHay = () => {
    if (!playerStore.spendMoney(HAY_PRICE)) {
      addLog('金币不足，无法购买干草。')
      return
    }
    inventoryStore.addItem(HAY_ITEM_ID)
    addLog(`购买了1份干草，花费${HAY_PRICE}文。`)
  }
</script>
