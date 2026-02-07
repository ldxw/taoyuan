<template>
  <div>
    <h3 class="text-accent text-sm mb-3">加工坊</h3>

    <!-- 制造区 -->
    <div class="mb-4">
      <p class="text-xs text-muted mb-2">
        <Hammer :size="14" class="inline" />
        —— 制造 ——
      </p>
      <div class="flex flex-wrap gap-2 mb-2">
        <button
          v-for="m in PROCESSING_MACHINES"
          :key="m.id"
          class="btn text-xs"
          :disabled="!processingStore.canCraft(m.craftCost, m.craftMoney) || processingStore.machineCount >= processingStore.MAX_MACHINES"
          @click="handleCraftMachine(m.id)"
        >
          造{{ m.name }} ({{ m.craftMoney }}文)
        </button>
      </div>
      <div class="flex flex-wrap gap-2 mb-2">
        <button
          v-for="s in SPRINKLERS"
          :key="s.id"
          class="btn text-xs"
          :disabled="!processingStore.canCraft(s.craftCost, s.craftMoney)"
          @click="handleCraftSprinkler(s.id)"
        >
          造{{ s.name }} ({{ s.craftMoney }}文)
        </button>
        <button
          v-for="f in FERTILIZERS"
          :key="f.id"
          class="btn text-xs"
          :disabled="!processingStore.canCraft(f.craftCost, f.craftMoney)"
          @click="handleCraftFertilizer(f.id)"
        >
          造{{ f.name }}
        </button>
      </div>
      <div class="flex flex-wrap gap-2 mb-2">
        <button
          v-for="b in BAITS"
          :key="b.id"
          class="btn text-xs"
          :disabled="!processingStore.canCraft(b.craftCost, b.craftMoney)"
          @click="handleCraftBait(b.id)"
        >
          造{{ b.name }}
        </button>
        <button
          v-for="t in TACKLES"
          :key="t.id"
          class="btn text-xs"
          :disabled="!processingStore.canCraft(t.craftCost, t.craftMoney)"
          @click="handleCraftTackle(t.id)"
        >
          造{{ t.name }}
        </button>
      </div>
      <div class="flex flex-wrap gap-2 mb-2">
        <button class="btn text-xs" :disabled="!processingStore.canCraft(TAPPER.craftCost, TAPPER.craftMoney)" @click="handleCraftTapper">
          造{{ TAPPER.name }} ({{ TAPPER.craftMoney }}文)
        </button>
        <button
          v-for="b in BOMBS"
          :key="b.id"
          class="btn text-xs"
          :disabled="!processingStore.canCraft(b.craftCost, b.craftMoney)"
          @click="handleCraftBomb(b.id)"
        >
          造{{ b.name }}
        </button>
      </div>
      <p class="text-xs text-muted">
        机器 {{ processingStore.machineCount }}/{{ processingStore.MAX_MACHINES }}
        | 点击制造后，机器自动放置到加工区；洒水器和肥料放入背包。
      </p>
      <div class="mt-2">
        <button class="btn text-xs" :disabled="!canCraftJadeRing" @click="handleCraftJadeRing">造翡翠戒指 (翡翠×1 + 金矿×2 + 500文)</button>
      </div>
    </div>

    <!-- 加工机器区 -->
    <div>
      <p class="text-xs text-muted mb-2">
        <Boxes :size="14" class="inline" />
        —— 加工区 ——
      </p>
      <div v-if="processingStore.machines.length === 0" class="text-xs text-muted">还没有机器，先制造一台吧。</div>
      <div v-else class="flex flex-col gap-3">
        <div v-for="(slot, idx) in processingStore.machines" :key="idx" class="border border-accent/20 rounded p-2">
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm text-accent">{{ getMachineName(slot.machineType) }}</span>
            <button class="text-xs text-danger hover:underline inline-flex items-center gap-1" @click="handleRemoveMachine(idx)">
              <Trash2 :size="14" />
              拆除
            </button>
          </div>

          <!-- 空闲：选择配方 -->
          <div v-if="!slot.recipeId">
            <div class="flex flex-wrap gap-1">
              <button
                v-for="recipe in processingStore.getAvailableRecipes(slot.machineType)"
                :key="recipe.id"
                class="btn text-xs"
                :disabled="recipe.inputItemId !== null && !inventoryStore.hasItem(recipe.inputItemId, recipe.inputQuantity)"
                @click="handleStartProcessing(idx, recipe.id)"
              >
                {{ recipe.name }}
                <span v-if="recipe.inputItemId" class="text-muted">({{ getItemName(recipe.inputItemId) }}×{{ recipe.inputQuantity }})</span>
              </button>
            </div>
            <p v-if="processingStore.getAvailableRecipes(slot.machineType).length === 0" class="text-xs text-muted">无可用配方</p>
          </div>

          <!-- 加工中 -->
          <div v-else-if="!slot.ready" class="text-xs">
            <span class="text-muted">加工中: {{ getRecipeName(slot.recipeId) }} ({{ slot.daysProcessed }}/{{ slot.totalDays }}天)</span>
            <div class="w-full h-1.5 bg-bg rounded mt-1 border border-accent/10">
              <div
                class="h-full bg-accent rounded transition-all"
                :style="{ width: Math.floor((slot.daysProcessed / slot.totalDays) * 100) + '%' }"
              />
            </div>
          </div>

          <!-- 完成 -->
          <div v-else class="flex items-center gap-2">
            <span class="text-xs text-success">加工完成！</span>
            <button class="btn text-xs bg-accent text-bg" @click="handleCollect(idx)">
              <Package :size="14" />
              收取
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 材料参考 -->
    <div class="mt-4">
      <p class="text-xs text-muted mb-1">
        <BookOpen :size="14" class="inline" />
        —— 制造材料参考 ——
      </p>
      <div class="text-xs text-muted leading-relaxed">
        <div v-for="m in PROCESSING_MACHINES" :key="'ref_' + m.id" class="mb-1">
          <span class="text-accent">{{ m.name }}</span>
          :
          {{ m.craftCost.map(c => `${getItemName(c.itemId)}×${c.quantity}`).join(', ') }}
          <span v-if="m.craftMoney">+ {{ m.craftMoney }}文</span>
          <span class="ml-2 text-muted">— {{ m.description }}</span>
        </div>
        <div v-for="s in SPRINKLERS" :key="'ref_' + s.id" class="mb-1">
          <span class="text-accent">{{ s.name }}</span>
          :
          {{ s.craftCost.map(c => `${getItemName(c.itemId)}×${c.quantity}`).join(', ') }}
          <span v-if="s.craftMoney">+ {{ s.craftMoney }}文</span>
          <span class="ml-2 text-muted">— {{ s.description }}</span>
        </div>
        <div v-for="f in FERTILIZERS" :key="'ref_' + f.id" class="mb-1">
          <span class="text-accent">{{ f.name }}</span>
          :
          {{ f.craftCost.map(c => `${getItemName(c.itemId)}×${c.quantity}`).join(', ') }}
          <span class="ml-2 text-muted">— {{ f.description }}</span>
        </div>
        <div v-for="b in BAITS" :key="'ref_' + b.id" class="mb-1">
          <span class="text-accent">{{ b.name }}</span>
          :
          {{ b.craftCost.map(c => `${getItemName(c.itemId)}×${c.quantity}`).join(', ') }}
          <span class="ml-2 text-muted">— {{ b.description }}</span>
        </div>
        <div v-for="t in TACKLES" :key="'ref_' + t.id" class="mb-1">
          <span class="text-accent">{{ t.name }}</span>
          :
          {{ t.craftCost.map(c => `${getItemName(c.itemId)}×${c.quantity}`).join(', ') }}
          <span class="ml-2 text-muted">— {{ t.description }}</span>
        </div>
        <div class="mb-1">
          <span class="text-accent">{{ TAPPER.name }}</span>
          :
          {{ TAPPER.craftCost.map(c => `${getItemName(c.itemId)}×${c.quantity}`).join(', ') }}
          <span v-if="TAPPER.craftMoney">+ {{ TAPPER.craftMoney }}文</span>
          <span class="ml-2 text-muted">— {{ TAPPER.description }}</span>
        </div>
        <div v-for="b in BOMBS" :key="'ref_' + b.id" class="mb-1">
          <span class="text-accent">{{ b.name }}</span>
          :
          {{ b.craftCost.map(c => `${getItemName(c.itemId)}×${c.quantity}`).join(', ') }}
          <span class="ml-2 text-muted">— {{ b.description }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Hammer, Trash2, Package, Boxes, BookOpen } from 'lucide-vue-next'
  import type { MachineType } from '@/types'
  import { computed } from 'vue'
  import { useProcessingStore, useInventoryStore, usePlayerStore, useGameStore } from '@/stores'
  import { PROCESSING_MACHINES, SPRINKLERS, FERTILIZERS, BAITS, TACKLES, TAPPER, BOMBS, getProcessingRecipeById } from '@/data/processing'
  import { getItemById } from '@/data/items'
  import { ACTION_TIME_COSTS } from '@/data/timeConstants'
  import { sfxClick } from '@/composables/useAudio'
  import { addLog } from '@/composables/useGameLog'
  import { handleEndDay } from '@/composables/useEndDay'

  const processingStore = useProcessingStore()
  const inventoryStore = useInventoryStore()
  const playerStore = usePlayerStore()
  const gameStore = useGameStore()

  const JADE_RING_COST = [
    { itemId: 'jade', quantity: 1 },
    { itemId: 'gold_ore', quantity: 2 }
  ]
  const JADE_RING_MONEY = 500

  const canCraftJadeRing = computed(() => processingStore.canCraft(JADE_RING_COST, JADE_RING_MONEY))

  const getMachineName = (type: MachineType): string => {
    return PROCESSING_MACHINES.find(m => m.id === type)?.name ?? type
  }

  const getItemName = (id: string): string => {
    return getItemById(id)?.name ?? id
  }

  const getRecipeName = (recipeId: string): string => {
    return getProcessingRecipeById(recipeId)?.name ?? recipeId
  }

  const handleCraftMachine = (machineType: MachineType) => {
    if (processingStore.craftMachine(machineType)) {
      sfxClick()
      addLog(`制造了${getMachineName(machineType)}并放置到加工区。`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.craftMachine)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) {
        handleEndDay()
        return
      }
    } else {
      addLog('材料不足或已达上限。')
    }
  }

  const handleCraftSprinkler = (sprinklerId: string) => {
    if (processingStore.craftSprinkler(sprinklerId)) {
      sfxClick()
      const name = SPRINKLERS.find(s => s.id === sprinklerId)?.name ?? sprinklerId
      addLog(`制造了${name}，已放入背包。去农场放置吧。`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.craftMachine)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) {
        handleEndDay()
        return
      }
    } else {
      addLog('材料不足。')
    }
  }

  const handleCraftFertilizer = (fertilizerId: string) => {
    if (processingStore.craftFertilizer(fertilizerId)) {
      sfxClick()
      const name = FERTILIZERS.find(f => f.id === fertilizerId)?.name ?? fertilizerId
      addLog(`制造了${name}，已放入背包。`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.craftMachine)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) {
        handleEndDay()
        return
      }
    } else {
      addLog('材料不足。')
    }
  }

  const handleCraftBait = (baitId: string) => {
    if (processingStore.craftBait(baitId)) {
      sfxClick()
      const name = BAITS.find(b => b.id === baitId)?.name ?? baitId
      addLog(`制造了${name}，已放入背包。`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.craftMachine)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) {
        handleEndDay()
        return
      }
    } else {
      addLog('材料不足。')
    }
  }

  const handleCraftTackle = (tackleId: string) => {
    if (processingStore.craftTackle(tackleId)) {
      sfxClick()
      const name = TACKLES.find(t => t.id === tackleId)?.name ?? tackleId
      addLog(`制造了${name}，已放入背包。`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.craftMachine)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) {
        handleEndDay()
        return
      }
    } else {
      addLog('材料不足。')
    }
  }

  const handleCraftTapper = () => {
    if (processingStore.craftTapper()) {
      sfxClick()
      addLog(`制造了采脂器，已放入背包。去农场安装到野树上吧。`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.craftMachine)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) {
        handleEndDay()
        return
      }
    } else {
      addLog('材料不足。')
    }
  }

  const handleCraftBomb = (bombId: string) => {
    if (processingStore.craftBomb(bombId)) {
      sfxClick()
      const name = BOMBS.find(b => b.id === bombId)?.name ?? bombId
      addLog(`制造了${name}，已放入背包。`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.craftMachine)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) {
        handleEndDay()
        return
      }
    } else {
      addLog('材料不足。')
    }
  }

  const handleStartProcessing = (slotIndex: number, recipeId: string) => {
    if (processingStore.startProcessing(slotIndex, recipeId)) {
      sfxClick()
      const recipe = getProcessingRecipeById(recipeId)
      addLog(`开始加工${recipe?.name ?? recipeId}，需要${recipe?.processingDays ?? '?'}天。`)
    } else {
      addLog('原料不足或机器正在使用。')
    }
  }

  const handleCollect = (slotIndex: number) => {
    const outputId = processingStore.collectProduct(slotIndex)
    if (outputId) {
      sfxClick()
      const name = getItemById(outputId)?.name ?? outputId
      addLog(`收取了${name}！`)
    }
  }

  const handleRemoveMachine = (slotIndex: number) => {
    const slot = processingStore.machines[slotIndex]
    if (!slot) return
    const name = getMachineName(slot.machineType)
    if (processingStore.removeMachine(slotIndex)) {
      addLog(`拆除了${name}。`)
    }
  }

  const handleCraftJadeRing = () => {
    if (!canCraftJadeRing.value) return
    if (!playerStore.spendMoney(JADE_RING_MONEY)) return
    for (const c of JADE_RING_COST) {
      if (!inventoryStore.removeItem(c.itemId, c.quantity)) {
        playerStore.earnMoney(JADE_RING_MONEY)
        return
      }
    }
    inventoryStore.addItem('jade_ring')
    sfxClick()
    addLog('制造了翡翠戒指！可以用来求婚。')
    const tr = gameStore.advanceTime(ACTION_TIME_COSTS.craftMachine)
    if (tr.message) addLog(tr.message)
    if (tr.passedOut) {
      handleEndDay()
      return
    }
  }
</script>
