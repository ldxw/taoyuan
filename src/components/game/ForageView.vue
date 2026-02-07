<template>
  <div>
    <h3 class="text-accent text-sm mb-3">
      <TreePine :size="14" class="inline" />
      竹林采集
    </h3>
    <p class="text-xs text-muted mb-3">消耗5体力进行一次采集，可能获得多种物品。</p>

    <button class="btn text-xs mb-4" @click="handleForage">
      <Search :size="14" />
      采集一次
    </button>

    <div v-if="lastResults.length > 0" class="space-y-1">
      <p class="text-xs text-accent mb-1">采集结果：</p>
      <p v-for="(r, i) in lastResults" :key="i" class="text-xs">{{ r }}</p>
    </div>

    <div class="mt-4">
      <p class="text-xs text-muted">当前季节可采集：</p>
      <div class="flex gap-2 flex-wrap mt-1">
        <span v-for="item in currentForage" :key="item.itemId" class="text-xs border border-accent/20 rounded-[2px] px-2 py-1">
          {{ item.name }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { TreePine, Search } from 'lucide-vue-next'
  import {
    usePlayerStore,
    useInventoryStore,
    useSkillStore,
    useGameStore,
    useAchievementStore,
    useCookingStore,
    useWalletStore
  } from '@/stores'
  import type { Quality } from '@/types'
  import { getForageItems, getItemById } from '@/data'
  import { WEATHER_FORAGE_MODIFIER } from '@/data/forage'
  import { ACTION_TIME_COSTS } from '@/data/timeConstants'
  import { sfxForage } from '@/composables/useAudio'
  import { addLog } from '@/composables/useGameLog'
  import { handleEndDay } from '@/composables/useEndDay'

  const playerStore = usePlayerStore()
  const inventoryStore = useInventoryStore()
  const skillStore = useSkillStore()
  const gameStore = useGameStore()
  const achievementStore = useAchievementStore()
  const cookingStore = useCookingStore()
  const walletStore = useWalletStore()

  const lastResults = ref<string[]>([])

  const currentForage = computed(() => getForageItems(gameStore.season))

  const handleForage = () => {
    if (gameStore.isPastBedtime) {
      addLog('太晚了，没法采集了。')
      handleEndDay()
      return
    }

    const cost = Math.max(1, Math.floor(5 * (1 - skillStore.getStaminaReduction('foraging'))))
    if (!playerStore.consumeStamina(cost)) {
      addLog('体力不足，无法采集。')
      return
    }

    sfxForage()

    const items = currentForage.value
    const gathered: string[] = []
    const foragingSkill = skillStore.getSkill('foraging')
    const isForestFarm = gameStore.farmMapType === 'forest'
    const forestXpBonus = isForestFarm ? 1.25 : 1.0

    for (const item of items) {
      // 草药师专精：采集概率+20%
      const herbalistBonus = foragingSkill.perk5 === 'herbalist' ? 1.2 : 1.0
      const cookingBuff = cookingStore.activeBuff?.type === 'luck' ? cookingStore.activeBuff.value / 100 : 0
      const adjustedChance = Math.min(
        1,
        item.chance * (WEATHER_FORAGE_MODIFIER[gameStore.weather] ?? 1) * herbalistBonus * (1 + cookingBuff)
      )
      if (Math.random() < adjustedChance) {
        // 采集品质随采集等级提升 (botanist专精→excellent)
        let quality = skillStore.rollForageQuality()
        // 钱袋: 神农本草 品质+1档
        const walletBoost = walletStore.getForageQualityBoost()
        if (walletBoost > 0) {
          const qualityOrder: Quality[] = ['normal', 'fine', 'excellent', 'supreme']
          const idx = qualityOrder.indexOf(quality)
          const newIdx = Math.min(idx + walletBoost, qualityOrder.length - 1)
          quality = qualityOrder[newIdx]!
        }
        // 森林农场加成：20% 概率双倍
        const qty = isForestFarm && Math.random() < 0.2 ? 2 : 1
        inventoryStore.addItem(item.itemId, qty, quality)
        achievementStore.discoverItem(item.itemId)
        const itemDef = getItemById(item.itemId)
        const name = itemDef?.name ?? item.itemId
        gathered.push(qty > 1 ? `${name}×${qty}` : name)
        skillStore.addExp('foraging', Math.floor(item.expReward * forestXpBonus))
      }
    }

    // 伐木工专精：25% 概率额外获得木材
    if (foragingSkill.perk5 === 'lumberjack' && Math.random() < 0.25) {
      inventoryStore.addItem('wood')
      gathered.push('木材')
    }

    if (gathered.length === 0) {
      gathered.push('什么也没找到……')
    }

    lastResults.value = gathered.map(g => (g === '什么也没找到……' ? g : `获得了${g}`))
    const { leveledUp, newLevel } = skillStore.addExp('foraging', 0) // 检查等级
    let msg = `在竹林中采集，获得了${gathered.filter(g => g !== '什么也没找到……').join('、') || '空气'}。(-${cost}体力)`
    if (leveledUp) msg += ` 采集提升到${newLevel}级！`
    addLog(msg)

    const tr = gameStore.advanceTime(ACTION_TIME_COSTS.forage)
    if (tr.message) addLog(tr.message)
    if (tr.passedOut) handleEndDay()
  }
</script>
