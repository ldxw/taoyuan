<template>
  <div>
    <div class="flex items-center justify-between mb-1">
      <div class="flex items-center gap-1.5 text-sm text-accent">
        <BookOpen :size="14" />
        <span>图鉴与成就</span>
      </div>
      <span class="text-xs text-muted">{{ achievementStore.perfectionPercent }}%</span>
    </div>

    <!-- 四栏切换 -->
    <div class="flex gap-1 mb-3">
      <button
        class="btn text-xs flex-1 justify-center"
        :class="{ 'bg-accent! text-bg!': tab === 'collection' }"
        @click="tab = 'collection'"
      >
        图鉴
      </button>
      <button
        class="btn text-xs flex-1 justify-center"
        :class="{ 'bg-accent! text-bg!': tab === 'achievements' }"
        @click="tab = 'achievements'"
      >
        成就
      </button>
      <button class="btn text-xs flex-1 justify-center" :class="{ 'bg-accent! text-bg!': tab === 'bundles' }" @click="tab = 'bundles'">
        社区
      </button>
      <button class="btn text-xs flex-1 justify-center" :class="{ 'bg-accent! text-bg!': tab === 'shipping' }" @click="tab = 'shipping'">
        出货
      </button>
    </div>

    <!-- 物品图鉴 -->
    <template v-if="tab === 'collection'">
      <p class="text-xs text-muted mb-2">已发现 {{ achievementStore.discoveredCount }}/{{ allItems.length }}</p>
      <div class="grid grid-cols-3 md:grid-cols-5 gap-1 max-h-72 overflow-y-auto">
        <div
          v-for="item in allItems"
          :key="item.id"
          class="border rounded-xs p-1.5 text-xs text-center transition-colors truncate"
          :class="
            achievementStore.isDiscovered(item.id)
              ? 'border-accent/20 cursor-pointer hover:bg-accent/5 ' + getCategoryColor(item.category)
              : 'border-accent/10 text-muted/30'
          "
          @click="achievementStore.isDiscovered(item.id) && (activeCollectionId = item.id)"
        >
          {{ achievementStore.isDiscovered(item.id) ? item.name : '???' }}
        </div>
      </div>
    </template>

    <!-- 图鉴详情弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="activeCollectionItem"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="activeCollectionId = null"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="activeCollectionId = null">
            <X :size="14" />
          </button>

          <p class="text-sm mb-2" :class="getCategoryColor(activeCollectionItem.category)">{{ activeCollectionItem.name }}</p>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs text-muted">{{ activeCollectionItem.description }}</p>
          </div>

          <div class="border border-accent/10 rounded-xs p-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">分类</span>
              <span class="text-xs">{{ CATEGORY_NAMES[activeCollectionItem.category] ?? activeCollectionItem.category }}</span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">售价</span>
              <span class="text-xs text-accent">{{ activeCollectionItem.sellPrice }}文</span>
            </div>
            <div v-if="activeCollectionItem.edible && activeCollectionItem.staminaRestore" class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">恢复</span>
              <span class="text-xs text-success">
                +{{ activeCollectionItem.staminaRestore }}体力
                <template v-if="activeCollectionItem.healthRestore">/ +{{ activeCollectionItem.healthRestore }}HP</template>
              </span>
            </div>
            <div v-if="achievementStore.getDiscoveryTime(activeCollectionItem.id)" class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">发现于</span>
              <span class="text-xs text-muted">{{ achievementStore.getDiscoveryTime(activeCollectionItem.id) }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 成就列表 -->
    <template v-if="tab === 'achievements'">
      <p class="text-xs text-muted mb-2">已完成 {{ achievementStore.completedAchievements.length }}/{{ ACHIEVEMENTS.length }}</p>
      <div class="grid grid-cols-3 md:grid-cols-5 gap-1 max-h-72 overflow-y-auto">
        <div
          v-for="a in ACHIEVEMENTS"
          :key="a.id"
          class="border rounded-xs p-1.5 text-xs text-center transition-colors truncate"
          :class="isCompleted(a.id) ? 'border-accent/20 cursor-pointer hover:bg-accent/5 text-success' : 'border-accent/10 text-muted/30'"
          @click="isCompleted(a.id) && (activeAchievement = a)"
        >
          {{ isCompleted(a.id) ? a.name : '???' }}
        </div>
      </div>
    </template>

    <!-- 成就详情弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="activeAchievement"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="activeAchievement = null"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="activeAchievement = null">
            <X :size="14" />
          </button>

          <p class="text-sm text-success mb-2">{{ activeAchievement.name }}</p>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs text-muted">{{ activeAchievement.description }}</p>
          </div>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">进度</span>
              <span class="text-xs">{{ getProgressText(activeAchievement) }}</span>
            </div>
          </div>

          <div class="border border-accent/10 rounded-xs p-2">
            <p class="text-xs text-muted mb-1">奖励</p>
            <p class="text-xs text-accent">
              {{ activeAchievement.reward.money ? `${activeAchievement.reward.money}文` : '' }}
              {{ activeAchievement.reward.items?.map(i => `${getItemName(i.itemId)}×${i.quantity}`).join(', ') ?? '' }}
            </p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 社区任务板 -->
    <template v-if="tab === 'bundles'">
      <div class="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
        <div
          v-for="bundle in COMMUNITY_BUNDLES"
          :key="bundle.id"
          class="border rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
          :class="achievementStore.isBundleComplete(bundle.id) ? 'border-success/30' : 'border-accent/20'"
          @click="activeBundle = bundle"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <CircleCheck v-if="achievementStore.isBundleComplete(bundle.id)" :size="12" class="text-success shrink-0" />
              <Circle v-else :size="12" class="text-muted shrink-0" />
              <span class="text-xs" :class="achievementStore.isBundleComplete(bundle.id) ? 'text-success' : 'text-accent'">
                {{ bundle.name }}
              </span>
            </div>
            <span class="text-xs text-muted whitespace-nowrap ml-2">
              {{ getBundleProgress(bundle) }}
            </span>
          </div>
          <p class="text-xs text-muted mt-0.5 pl-4.5">{{ bundle.description }}</p>
        </div>
      </div>
    </template>

    <!-- 社区任务详情弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="activeBundle"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="activeBundle = null"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="activeBundle = null">
            <X :size="14" />
          </button>

          <p class="text-sm mb-2" :class="achievementStore.isBundleComplete(activeBundle.id) ? 'text-success' : 'text-accent'">
            {{ activeBundle.name }}
          </p>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs text-muted">{{ activeBundle.description }}</p>
          </div>

          <!-- 需求物品 -->
          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs text-muted mb-1">所需物品</p>
            <div v-for="req in activeBundle.requiredItems" :key="req.itemId" class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">{{ getItemName(req.itemId) }}</span>
              <span class="text-xs" :class="getSubmittedCount(activeBundle.id, req.itemId) >= req.quantity ? 'text-success' : ''">
                {{ getSubmittedCount(activeBundle.id, req.itemId) }}/{{ req.quantity }}
              </span>
            </div>
          </div>

          <!-- 奖励 -->
          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs text-muted mb-1">奖励</p>
            <p class="text-xs text-accent">{{ activeBundle.reward.description }}</p>
          </div>

          <!-- 提交按钮 -->
          <div v-if="!achievementStore.isBundleComplete(activeBundle.id)" class="flex flex-col gap-1">
            <button
              v-for="req in activeBundle.requiredItems.filter(r => getSubmittedCount(activeBundle!.id, r.itemId) < r.quantity)"
              :key="'submit_' + req.itemId"
              class="btn text-xs w-full justify-center"
              :disabled="!inventoryStore.hasItem(req.itemId)"
              @click="handleSubmit(activeBundle!.id, req.itemId)"
            >
              <Send :size="12" />
              提交{{ getItemName(req.itemId) }}
            </button>
          </div>

          <!-- 已完成 -->
          <div v-else class="border border-success/30 rounded-xs p-2">
            <div class="flex items-center gap-1">
              <CircleCheck :size="12" class="text-success" />
              <span class="text-xs text-success">已完成</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 出货收集 -->
    <template v-if="tab === 'shipping'">
      <p class="text-xs text-muted mb-2">出货记录 {{ shopStore.shippedItems.length }}/{{ shippableItems.length }}</p>
      <div class="flex flex-col gap-2 max-h-72 overflow-y-auto">
        <div v-for="(items, category) in itemsByCategory" :key="category" class="border border-accent/20 rounded-xs p-2">
          <p class="text-xs text-muted mb-1">{{ CATEGORY_NAMES[category] ?? category }}</p>
          <div class="grid grid-cols-3 md:grid-cols-5 gap-1">
            <div
              v-for="item in items"
              :key="item.id"
              class="border rounded-xs p-1 text-xs text-center truncate"
              :class="
                shopStore.shippedItems.includes(item.id)
                  ? 'border-accent/20 ' + getCategoryColor(item.category)
                  : 'border-accent/10 text-muted/30'
              "
            >
              {{ shopStore.shippedItems.includes(item.id) ? item.name : '???' }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 完成度 -->
    <div class="mt-3 border border-accent/20 rounded-xs p-2">
      <div class="flex items-center gap-2 text-xs mb-1.5">
        <span class="text-xs text-muted shrink-0">完成度</span>
        <div class="flex-1 h-1 bg-bg rounded-xs border border-accent/10">
          <div class="h-full bg-accent rounded-xs transition-all" :style="{ width: achievementStore.perfectionPercent + '%' }" />
        </div>
        <span class="text-xs text-accent whitespace-nowrap">{{ achievementStore.perfectionPercent }}%</span>
      </div>
      <div class="grid grid-cols-2 gap-x-3 gap-y-0.5">
        <div class="flex items-center justify-between">
          <span class="text-xs text-muted">作物收获</span>
          <span class="text-xs">{{ achievementStore.stats.totalCropsHarvested }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-muted">钓鱼</span>
          <span class="text-xs">{{ achievementStore.stats.totalFishCaught }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-muted">烹饪</span>
          <span class="text-xs">{{ achievementStore.stats.totalRecipesCooked }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-muted">累计收入</span>
          <span class="text-xs">{{ achievementStore.stats.totalMoneyEarned }}文</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-muted">矿洞最深</span>
          <span class="text-xs">{{ achievementStore.stats.highestMineFloor }}层</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-muted">怪物击杀</span>
          <span class="text-xs">{{ achievementStore.stats.totalMonstersKilled }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { BookOpen, CircleCheck, Circle, Send, X } from 'lucide-vue-next'
  import { ref, computed } from 'vue'
  import { useAchievementStore, useInventoryStore, useShopStore, useAnimalStore } from '@/stores'
  import { ACHIEVEMENTS, COMMUNITY_BUNDLES } from '@/data/achievements'
  import { ITEMS, getItemById } from '@/data/items'
  import { sfxClick } from '@/composables/useAudio'
  import { addLog } from '@/composables/useGameLog'
  import type { ItemCategory, AchievementDef, CommunityBundleDef } from '@/types'

  const achievementStore = useAchievementStore()
  const inventoryStore = useInventoryStore()
  const shopStore = useShopStore()
  const animalStore = useAnimalStore()

  type Tab = 'collection' | 'achievements' | 'bundles' | 'shipping'
  const tab = ref<Tab>('collection')

  const allItems = ITEMS

  /** 成就详情弹窗 */
  const activeAchievement = ref<AchievementDef | null>(null)

  /** 社区任务弹窗 */
  const activeBundle = ref<CommunityBundleDef | null>(null)

  /** 社区任务完成进度文本 */
  const getBundleProgress = (bundle: CommunityBundleDef): string => {
    const done = bundle.requiredItems.filter(r => getSubmittedCount(bundle.id, r.itemId) >= r.quantity).length
    return `${done}/${bundle.requiredItems.length}`
  }

  /** 图鉴详情弹窗 */
  const activeCollectionId = ref<string | null>(null)
  const activeCollectionItem = computed(() => {
    if (!activeCollectionId.value) return null
    return getItemById(activeCollectionId.value) ?? null
  })

  /** 按分类给物品名称上色 */
  const CATEGORY_COLOR_MAP: Partial<Record<ItemCategory, string>> = {
    crop: 'text-success',
    fish: 'text-water',
    ore: 'text-earth',
    gem: 'text-quality-supreme',
    food: 'text-quality-fine',
    fruit: 'text-success',
    animal_product: 'text-quality-fine',
    processed: 'text-accent',
    material: 'text-muted',
    misc: 'text-muted',
    gift: 'text-quality-excellent',
    seed: 'text-success/60',
    machine: 'text-muted',
    sprinkler: 'text-water',
    fertilizer: 'text-success/60',
    sapling: 'text-success/60',
    bait: 'text-water',
    tackle: 'text-water',
    bomb: 'text-danger'
  }

  const getCategoryColor = (category: ItemCategory): string => {
    return CATEGORY_COLOR_MAP[category] ?? 'text-accent'
  }

  // === 出货收集 ===

  const CATEGORY_NAMES: Record<string, string> = {
    crop: '农作物',
    fish: '鱼类',
    animal_product: '畜产品',
    processed: '加工品',
    fruit: '水果',
    ore: '矿石',
    gem: '宝石',
    material: '材料',
    misc: '杂货',
    food: '料理',
    gift: '礼品'
  }

  /** 可出货的类别（排除种子、机器、工具类） */
  const SHIPPABLE_CATEGORIES = ['crop', 'fish', 'animal_product', 'processed', 'fruit', 'ore', 'gem', 'material', 'misc', 'food', 'gift']

  const shippableItems = computed(() => ITEMS.filter(i => SHIPPABLE_CATEGORIES.includes(i.category)))

  const itemsByCategory = computed(() => {
    const groups: Record<string, typeof ITEMS> = {}
    for (const item of shippableItems.value) {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category]!.push(item)
    }
    return groups
  })

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
      case 'skullCavernFloor':
        return `${s.skullCavernBestFloor}/${c.floor}`
      case 'recipesCooked':
        return `${s.totalRecipesCooked}/${c.count}`
      case 'monstersKilled':
        return `${s.totalMonstersKilled}/${c.count}`
      case 'shippedCount':
        return `${shopStore.shippedItems.length}/${c.count}`
      case 'fullShipment':
        return `${shopStore.shippedItems.length}/${shippableItems.value.length}`
      case 'animalCount':
        return `${animalStore.animals.length}/${c.count}`
      case 'questsCompleted':
        return `${c.count}`
      default:
        return ''
    }
  }

  const handleSubmit = (bundleId: string, itemId: string) => {
    const bundle = COMMUNITY_BUNDLES.find(b => b.id === bundleId)
    const req = bundle?.requiredItems.find(r => r.itemId === itemId)
    if (!req) return

    const submitted = getSubmittedCount(bundleId, itemId)
    const needed = req.quantity - submitted
    const available = inventoryStore.getItemCount(itemId)
    const toSubmit = Math.min(needed, available)
    if (toSubmit <= 0) return

    if (achievementStore.submitToBundle(bundleId, itemId, toSubmit)) {
      sfxClick()
      addLog(`向「${bundle?.name}」提交了${getItemName(itemId)}×${toSubmit}。`)
      if (achievementStore.isBundleComplete(bundleId)) {
        addLog(`「${bundle?.name}」完成！获得了奖励！`)
      }
    } else {
      addLog('提交失败。')
    }
  }
</script>
