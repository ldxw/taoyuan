<template>
  <div>
    <h3 class="text-accent text-sm mb-3">
      <BookOpen :size="14" class="inline" />
      图鉴与成就
    </h3>

    <!-- 三栏切换 -->
    <div class="flex gap-2 mb-3">
      <button class="btn text-xs" :class="{ 'bg-accent text-bg': tab === 'collection' }" @click="tab = 'collection'">
        <Eye :size="14" />
        物品图鉴 ({{ achievementStore.discoveredCount }})
      </button>
      <button class="btn text-xs" :class="{ 'bg-accent text-bg': tab === 'achievements' }" @click="tab = 'achievements'">
        <Trophy :size="14" />
        成就 ({{ completedCount }}/{{ ACHIEVEMENTS.length }})
      </button>
      <button class="btn text-xs" :class="{ 'bg-accent text-bg': tab === 'bundles' }" @click="tab = 'bundles'">
        <Target :size="14" />
        社区任务 ({{ completedBundleCount }}/{{ COMMUNITY_BUNDLES.length }})
      </button>
    </div>

    <!-- 物品图鉴 -->
    <div v-if="tab === 'collection'">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-1 max-h-64 overflow-y-auto">
        <div
          v-for="item in allItems"
          :key="item.id"
          class="border border-accent/20 rounded p-1 text-xs text-center"
          :class="achievementStore.isDiscovered(item.id) ? 'text-accent' : 'text-muted/30'"
          :title="achievementStore.isDiscovered(item.id) ? `${item.name}: ${item.description}` : '???'"
        >
          {{ achievementStore.isDiscovered(item.id) ? item.name : '???' }}
        </div>
      </div>
    </div>

    <!-- 成就列表 -->
    <div v-if="tab === 'achievements'" class="flex flex-col gap-2 max-h-64 overflow-y-auto">
      <div
        v-for="a in ACHIEVEMENTS"
        :key="a.id"
        class="border border-accent/20 rounded p-2 text-xs"
        :class="{ 'border-success/50 bg-success/5': isCompleted(a.id) }"
      >
        <div class="flex items-center justify-between">
          <span class="font-bold" :class="isCompleted(a.id) ? 'text-success' : 'text-accent'">
            {{ isCompleted(a.id) ? '✓ ' : '' }}{{ a.name }}
          </span>
          <span class="text-muted">{{ getProgressText(a) }}</span>
        </div>
        <p class="text-muted mt-0.5">{{ a.description }}</p>
        <p class="text-accent/70 mt-0.5">
          奖励: {{ a.reward.money ? `${a.reward.money}文` : '' }}
          {{ a.reward.items?.map(i => `${getItemName(i.itemId)}×${i.quantity}`).join(', ') ?? '' }}
        </p>
      </div>
    </div>

    <!-- 社区任务板 -->
    <div v-if="tab === 'bundles'" class="flex flex-col gap-3 max-h-64 overflow-y-auto">
      <div
        v-for="bundle in COMMUNITY_BUNDLES"
        :key="bundle.id"
        class="border border-accent/20 rounded p-2"
        :class="{ 'border-success/50 bg-success/5': achievementStore.isBundleComplete(bundle.id) }"
      >
        <p class="text-sm font-bold" :class="achievementStore.isBundleComplete(bundle.id) ? 'text-success' : 'text-accent'">
          {{ achievementStore.isBundleComplete(bundle.id) ? '✓ ' : '' }}{{ bundle.name }}
        </p>
        <p class="text-xs text-muted mb-1">{{ bundle.description }}</p>
        <div class="flex flex-wrap gap-1 mb-1">
          <div
            v-for="req in bundle.requiredItems"
            :key="req.itemId"
            class="text-xs border border-accent/10 rounded px-1"
            :class="getSubmittedCount(bundle.id, req.itemId) >= req.quantity ? 'text-success' : 'text-muted'"
          >
            {{ getItemName(req.itemId) }}
            {{ getSubmittedCount(bundle.id, req.itemId) }}/{{ req.quantity }}
          </div>
        </div>
        <div v-if="!achievementStore.isBundleComplete(bundle.id)" class="flex flex-wrap gap-1">
          <button
            v-for="req in bundle.requiredItems.filter(r => getSubmittedCount(bundle.id, r.itemId) < r.quantity)"
            :key="'submit_' + req.itemId"
            class="btn text-xs"
            :disabled="!inventoryStore.hasItem(req.itemId)"
            @click="handleSubmit(bundle.id, req.itemId)"
          >
            <Send :size="14" />
            提交{{ getItemName(req.itemId) }}
          </button>
        </div>
        <p class="text-xs text-accent/70 mt-1">奖励: {{ bundle.reward.description }}</p>
      </div>
    </div>

    <!-- 统计数据 -->
    <div class="mt-4 text-xs text-muted">
      <p class="mb-1">—— 统计 ——</p>
      <p>
        作物收获: {{ achievementStore.stats.totalCropsHarvested }} | 钓鱼: {{ achievementStore.stats.totalFishCaught }} | 烹饪:
        {{ achievementStore.stats.totalRecipesCooked }}
      </p>
      <p>累计收入: {{ achievementStore.stats.totalMoneyEarned }}文 | 矿洞最深: {{ achievementStore.stats.highestMineFloor }}层</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { BookOpen, Eye, Trophy, Target, Send } from 'lucide-vue-next'
  import { ref, computed } from 'vue'
  import { useAchievementStore, useInventoryStore } from '@/stores'
  import { ACHIEVEMENTS, COMMUNITY_BUNDLES } from '@/data/achievements'
  import { ITEMS, getItemById } from '@/data/items'
  import { sfxClick } from '@/composables/useAudio'
  import { addLog } from '@/composables/useGameLog'

  const achievementStore = useAchievementStore()
  const inventoryStore = useInventoryStore()

  type Tab = 'collection' | 'achievements' | 'bundles'
  const tab = ref<Tab>('collection')

  const allItems = ITEMS

  const completedCount = computed(() => achievementStore.completedAchievements.length)
  const completedBundleCount = computed(() => achievementStore.completedBundles.length)

  const isCompleted = (id: string): boolean => {
    return achievementStore.completedAchievements.includes(id)
  }

  const getItemName = (id: string): string => {
    return getItemById(id)?.name ?? id
  }

  const getSubmittedCount = (bundleId: string, itemId: string): number => {
    return achievementStore.getBundleProgress(bundleId)[itemId] ?? 0
  }

  const getProgressText = (a: (typeof ACHIEVEMENTS)[number]): string => {
    const c = a.condition
    const s = achievementStore.stats
    switch (c.type) {
      case 'itemCount':
        return `${achievementStore.discoveredCount}/${c.count}`
      case 'cropHarvest':
        return `${s.totalCropsHarvested}/${c.count}`
      case 'fishCaught':
        return `${s.totalFishCaught}/${c.count}`
      case 'moneyEarned':
        return `${s.totalMoneyEarned}/${c.amount}`
      case 'mineFloor':
        return `${s.highestMineFloor}/${c.floor}`
      case 'recipesCooked':
        return `${s.totalRecipesCooked}/${c.count}`
      default:
        return ''
    }
  }

  const handleSubmit = (bundleId: string, itemId: string) => {
    if (achievementStore.submitToBundle(bundleId, itemId, 1)) {
      sfxClick()
      const bundle = COMMUNITY_BUNDLES.find(b => b.id === bundleId)
      addLog(`向「${bundle?.name}」提交了${getItemName(itemId)}。`)
      if (achievementStore.isBundleComplete(bundleId)) {
        addLog(`「${bundle?.name}」完成！获得了奖励！`)
      }
    } else {
      addLog('提交失败。')
    }
  }
</script>
