<template>
  <div class="game-panel">
    <h3 class="text-accent text-sm mb-3">农展会</h3>

    <!-- 选择展品阶段 -->
    <div v-if="!submitted">
      <p class="text-xs text-muted mb-3">
        从背包中选择最多
        <span class="text-accent">5</span>
        件展品参展。品质越高、价值越高的物品得分越多！
      </p>

      <!-- 已选展品 -->
      <div class="mb-3">
        <p class="text-xs text-muted mb-1">已选展品（{{ selectedItems.length }} / 5）：</p>
        <div v-if="selectedItems.length === 0" class="text-xs text-muted">尚未选择任何物品。</div>
        <div v-else class="flex flex-wrap gap-2">
          <button v-for="(sel, i) in selectedItems" :key="i" class="btn text-xs" :title="'点击移除'" @click="removeSelection(i)">
            {{ getItemById(sel.itemId)?.name }}
            <span v-if="sel.quality !== 'normal'" class="ml-0.5" :class="qualityClass(sel.quality)">
              [{{ QUALITY_LABELS[sel.quality] }}]
            </span>
            <span class="text-danger ml-1">×</span>
          </button>
        </div>
      </div>

      <p class="text-xs text-muted mb-1">
        预计总分：
        <span class="text-accent">{{ previewScore }}</span>
      </p>

      <!-- 背包物品选择 -->
      <div class="mb-3">
        <p class="text-xs text-muted mb-1">可选物品：</p>
        <div v-if="selectableItems.length === 0" class="text-xs text-muted">背包中没有可参展的物品。</div>
        <div v-else class="grid grid-cols-4 gap-2">
          <button
            v-for="item in selectableItems"
            :key="item.itemId + item.quality"
            class="border border-accent/20 rounded-[2px] p-2 text-xs text-center hover:border-accent/50 transition-colors"
            :disabled="selectedItems.length >= 5"
            @click="addSelection(item)"
          >
            <div class="truncate">{{ getItemById(item.itemId)?.name }}</div>
            <div class="text-muted">×{{ item.quantity }}</div>
            <div v-if="item.quality !== 'normal'" class="mt-0.5" :class="qualityClass(item.quality)">
              {{ QUALITY_LABELS[item.quality] }}
            </div>
            <div class="text-muted mt-0.5">{{ getItemById(item.itemId)?.sellPrice }}文</div>
          </button>
        </div>
      </div>

      <button class="btn text-xs" :disabled="selectedItems.length === 0" @click="handleSubmit">参展！</button>
    </div>

    <!-- 结果阶段 -->
    <div v-else>
      <p class="text-xs text-muted mb-3">评审结束！以下是最终排名：</p>

      <div class="mb-3">
        <div
          v-for="(entry, i) in rankings"
          :key="entry.name"
          class="flex items-center justify-between text-xs py-1 border-b border-accent/10 last:border-0"
        >
          <div>
            <span
              class="mr-2"
              :class="{
                'text-accent': i === 0,
                'text-success': entry.name === '你'
              }"
            >
              第{{ i + 1 }}名
            </span>
            <span :class="{ 'text-success': entry.name === '你' }">{{ entry.name }}</span>
          </div>
          <span class="text-muted">{{ entry.score }} 分</span>
        </div>
      </div>

      <!-- 展品明细 -->
      <div class="mb-3">
        <p class="text-xs text-muted mb-1">你的展品明细：</p>
        <div v-for="(d, i) in scoreDetails" :key="i" class="text-xs mb-0.5">
          <span class="text-accent">{{ d.name }}</span>
          <span v-if="d.qualityLabel" class="ml-0.5" :class="qualityClass(d.quality)">[{{ d.qualityLabel }}]</span>
          <span class="text-muted ml-1">{{ d.basePrice }}文 × {{ d.multiplier }} = {{ d.score }}分</span>
        </div>
        <p class="text-xs mt-1">
          总分：
          <span class="text-accent">{{ playerScore }}</span>
        </p>
      </div>

      <div class="mb-3 text-xs">
        <span v-if="playerRank === 1" class="text-accent">恭喜你荣获金奖！奖金 1000文</span>
        <span v-else-if="playerRank === 2" class="text-success">你获得了银奖！奖金 500文</span>
        <span v-else-if="playerRank === 3" class="text-success">你获得了铜奖！奖金 200文</span>
        <span v-else class="text-muted">很遗憾，没有获得名次。明年再来吧！</span>
      </div>

      <button class="btn text-xs" @click="handleClaim">领取奖励</button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useInventoryStore } from '@/stores'
  import { getItemById } from '@/data'
  import type { Quality } from '@/types'

  const emit = defineEmits<{
    complete: [prize: number]
  }>()

  const inventoryStore = useInventoryStore()

  const QUALITY_LABELS: Record<Quality, string> = {
    normal: '普通',
    fine: '优良',
    excellent: '精品',
    supreme: '极品'
  }

  const QUALITY_MULTIPLIERS: Record<Quality, number> = {
    normal: 1,
    fine: 1.25,
    excellent: 1.5,
    supreme: 2
  }

  interface SelectedItem {
    itemId: string
    quality: Quality
  }

  interface ScoreDetail {
    name: string
    quality: Quality
    qualityLabel: string
    basePrice: number
    multiplier: number
    score: number
  }

  interface Participant {
    name: string
    score: number
  }

  const selectedItems = ref<SelectedItem[]>([])
  const submitted = ref(false)
  const rankings = ref<Participant[]>([])
  const scoreDetails = ref<ScoreDetail[]>([])
  const playerScore = ref(0)

  /** 可参展的背包物品（排除种子、机器等非展示类物品） */
  const selectableItems = computed(() => {
    const exhibitCategories = ['crop', 'fish', 'food', 'processed', 'gem', 'misc']
    return inventoryStore.items.filter(item => {
      const def = getItemById(item.itemId)
      return def && exhibitCategories.includes(def.category)
    })
  })

  /** 预览当前选择的总分 */
  const previewScore = computed(() => {
    return selectedItems.value.reduce((sum, sel) => {
      const def = getItemById(sel.itemId)
      if (!def) return sum
      const mult = QUALITY_MULTIPLIERS[sel.quality]
      return sum + Math.round(def.sellPrice * mult)
    }, 0)
  })

  const playerRank = computed(() => {
    const idx = rankings.value.findIndex(e => e.name === '你')
    return idx === -1 ? 99 : idx + 1
  })

  const qualityClass = (quality: Quality): string => {
    const classes: Record<Quality, string> = {
      normal: '',
      fine: 'text-quality-fine',
      excellent: 'text-quality-excellent',
      supreme: 'text-quality-supreme'
    }
    return classes[quality]
  }

  const addSelection = (item: { itemId: string; quality: Quality }) => {
    if (selectedItems.value.length >= 5) return
    selectedItems.value.push({ itemId: item.itemId, quality: item.quality })
  }

  const removeSelection = (index: number) => {
    selectedItems.value.splice(index, 1)
  }

  const handleSubmit = () => {
    if (selectedItems.value.length === 0) return

    // 计算玩家分数明细
    const details: ScoreDetail[] = []
    let total = 0
    for (const sel of selectedItems.value) {
      const def = getItemById(sel.itemId)
      if (!def) continue
      const mult = QUALITY_MULTIPLIERS[sel.quality]
      const score = Math.round(def.sellPrice * mult)
      total += score
      details.push({
        name: def.name,
        quality: sel.quality,
        qualityLabel: sel.quality !== 'normal' ? QUALITY_LABELS[sel.quality] : '',
        basePrice: def.sellPrice,
        multiplier: mult,
        score
      })
    }
    scoreDetails.value = details
    playerScore.value = total

    // 生成NPC分数（600-1200范围）
    const npcs: Participant[] = [
      { name: '秋月', score: Math.round(600 + Math.random() * 600) },
      { name: '陈伯', score: Math.round(600 + Math.random() * 600) },
      { name: '小满', score: Math.round(600 + Math.random() * 600) }
    ]

    const player: Participant = { name: '你', score: total }
    const all = [...npcs, player]
    all.sort((a, b) => b.score - a.score)
    rankings.value = all
    submitted.value = true
  }

  const handleClaim = () => {
    const prizes: Record<number, number> = { 1: 1000, 2: 500, 3: 200 }
    const prize = prizes[playerRank.value] ?? 0
    emit('complete', prize)
  }
</script>
