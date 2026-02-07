<template>
  <div>
    <h3 class="text-accent text-sm mb-3">
      <Fish :size="14" class="inline" />
      清溪钓鱼
    </h3>

    <!-- 未开始钓鱼 -->
    <div v-if="!fishingStore.isActive">
      <!-- 装备面板 -->
      <div class="mb-3 border border-accent/20 rounded p-2">
        <p class="text-xs text-muted mb-2">装备</p>
        <div class="flex gap-3 items-center flex-wrap">
          <!-- 鱼饵 -->
          <div class="flex items-center gap-1">
            <span class="text-xs">鱼饵:</span>
            <span v-if="fishingStore.equippedBait" class="text-xs text-accent">{{ getBaitName(fishingStore.equippedBait) }}</span>
            <span v-else class="text-xs text-muted">无</span>
            <button v-if="fishingStore.equippedBait" class="btn text-xs py-0 px-1" @click="handleUnequipBait">
              <X :size="14" />
              卸下
            </button>
            <select
              v-if="availableBaits.length > 0 && !fishingStore.equippedBait"
              class="text-xs bg-bg border border-accent/30 rounded px-1 py-0.5"
              @change="handleEquipBait($event)"
            >
              <option value="">选择鱼饵</option>
              <option v-for="b in availableBaits" :key="b.id" :value="b.id">{{ b.name }} (×{{ b.count }})</option>
            </select>
          </div>
          <!-- 浮漂 -->
          <div class="flex items-center gap-1">
            <span class="text-xs">浮漂:</span>
            <span v-if="fishingStore.equippedTackle" class="text-xs text-accent">
              {{ getTackleName(fishingStore.equippedTackle) }}
              <span class="text-muted">({{ fishingStore.tackleDurability }})</span>
            </span>
            <span v-else class="text-xs text-muted">无</span>
            <button v-if="fishingStore.equippedTackle" class="btn text-xs py-0 px-1" @click="handleUnequipTackle">
              <X :size="14" />
              卸下
            </button>
            <select
              v-if="availableTackles.length > 0 && !fishingStore.equippedTackle"
              class="text-xs bg-bg border border-accent/30 rounded px-1 py-0.5"
              @change="handleEquipTackle($event)"
            >
              <option value="">选择浮漂</option>
              <option v-for="t in availableTackles" :key="t.id" :value="t.id">{{ t.name }} (×{{ t.count }})</option>
            </select>
          </div>
        </div>
      </div>

      <p class="text-xs text-muted mb-3">当前可钓：{{ fishingStore.availableFish.map(f => f.name).join('、') || '无' }}</p>
      <button class="btn text-xs" @click="handleStartFishing">
        <Target :size="14" />
        抛竿
      </button>

      <!-- 上次结果 -->
      <div v-if="lastResult" class="mt-3 text-xs">
        <p>{{ lastResult }}</p>
      </div>
    </div>

    <!-- 钓鱼中 -->
    <div v-else>
      <div class="game-panel mb-3">
        <p class="text-xs mb-2">
          目标：
          <span class="text-accent">{{ fishingStore.currentFish?.name }}</span>
          — 回合 {{ fishingStore.currentRound }}/{{ fishingStore.currentFish?.rounds }} — 拉线 {{ fishingStore.reelCount }}/{{
            fishingStore.currentFish?.requiredReel
          }}
        </p>
        <div class="flex gap-2">
          <div class="flex-1 bg-bg rounded-[2px] h-3">
            <div
              class="h-3 bg-water rounded-[2px] transition-all"
              :style="{
                width: `${fishingStore.currentFish ? (fishingStore.reelCount / fishingStore.currentFish.requiredReel) * 100 : 0}%`
              }"
            />
          </div>
        </div>
      </div>

      <div class="flex gap-2 mb-3">
        <button class="btn text-xs" @click="handleAction('reel')">
          <ArrowUp :size="14" />
          拉线
        </button>
        <button class="btn text-xs" @click="handleAction('slack')">
          <ArrowDown :size="14" />
          放线
        </button>
        <button class="btn text-xs" @click="handleAction('wait')">
          <Clock :size="14" />
          等待
        </button>
      </div>

      <!-- 回合日志 -->
      <div class="space-y-1">
        <p v-for="(log, i) in fishingStore.roundLog.slice().reverse()" :key="i" class="text-xs" :class="{ 'text-muted': i > 0 }">
          {{ log.message }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { Fish, X, Target, ArrowUp, ArrowDown, Clock } from 'lucide-vue-next'
  import { useFishingStore, useGameStore, useInventoryStore } from '@/stores'
  import { getBaitById, getTackleById } from '@/data/processing'
  import type { FishingAction, BaitType, TackleType } from '@/types'
  import { ACTION_TIME_COSTS } from '@/data/timeConstants'
  import { sfxReel, sfxFishCatch, sfxLineBroken, sfxClick } from '@/composables/useAudio'
  import { addLog } from '@/composables/useGameLog'
  import { handleEndDay } from '@/composables/useEndDay'

  const fishingStore = useFishingStore()
  const gameStore = useGameStore()
  const inventoryStore = useInventoryStore()
  const lastResult = ref<string | null>(null)

  /** 背包中可用的鱼饵 */
  const availableBaits = computed(() => {
    const baitTypes: BaitType[] = ['standard_bait', 'wild_bait', 'magic_bait']
    return baitTypes.map(id => ({ id, name: getBaitById(id)?.name ?? id, count: inventoryStore.getItemCount(id) })).filter(b => b.count > 0)
  })

  /** 背包中可用的浮漂 */
  const availableTackles = computed(() => {
    const tackleTypes: TackleType[] = ['spinner', 'trap_bobber', 'cork_bobber', 'quality_bobber']
    const rodTier = inventoryStore.getTool?.('fishingRod')?.tier ?? 'basic'
    if (rodTier === 'basic') return []
    return tackleTypes
      .map(id => ({ id, name: getTackleById(id)?.name ?? id, count: inventoryStore.getItemCount(id) }))
      .filter(t => t.count > 0)
  })

  const getBaitName = (type: BaitType): string => {
    return getBaitById(type)?.name ?? type
  }

  const getTackleName = (type: TackleType): string => {
    return getTackleById(type)?.name ?? type
  }

  const handleEquipBait = (event: Event) => {
    const value = (event.target as HTMLSelectElement).value as BaitType
    if (!value) return
    const result = fishingStore.equipBait(value)
    addLog(result.message)
    ;(event.target as HTMLSelectElement).value = ''
  }

  const handleUnequipBait = () => {
    const msg = fishingStore.unequipBait()
    addLog(msg)
  }

  const handleEquipTackle = (event: Event) => {
    const value = (event.target as HTMLSelectElement).value as TackleType
    if (!value) return
    const result = fishingStore.equipTackle(value)
    addLog(result.message)
    ;(event.target as HTMLSelectElement).value = ''
  }

  const handleUnequipTackle = () => {
    const msg = fishingStore.unequipTackle()
    addLog(msg)
  }

  const handleStartFishing = () => {
    if (gameStore.isPastBedtime) {
      addLog('太晚了，没法钓鱼了。')
      handleEndDay()
      return
    }
    const result = fishingStore.startFishing()
    if (result.success) {
      sfxClick()
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.fishStart)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) handleEndDay()
    }
    addLog(result.message)
    if (!result.success) {
      lastResult.value = result.message
    }
  }

  const handleAction = (action: FishingAction) => {
    const result = fishingStore.doRound(action)
    if (result) {
      if (action === 'reel') sfxReel()
      addLog(result.message)
      if (!fishingStore.isActive) {
        lastResult.value = result.message
        if (result.message.includes('钓到')) sfxFishCatch()
        else if (result.message.includes('断') || result.message.includes('跑')) sfxLineBroken()
      }
    }
  }
</script>
