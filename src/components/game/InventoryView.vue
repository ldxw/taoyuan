<template>
  <div>
    <h3 class="text-accent text-sm mb-3">
      <Package :size="14" class="inline" />
      背包 ({{ inventoryStore.items.length }}/{{ inventoryStore.capacity }})
    </h3>

    <!-- 工具栏 -->
    <div class="mb-4">
      <p class="text-xs text-muted mb-2">
        <Wrench :size="14" class="inline" />
        工具栏
      </p>
      <div class="flex gap-2 flex-wrap">
        <div v-for="tool in inventoryStore.tools" :key="tool.type" class="border border-accent/30 rounded-[2px] px-3 py-2 text-xs">
          {{ TOOL_NAMES[tool.type] }}
          <span class="text-muted ml-1">{{ TIER_NAMES[tool.tier] }}</span>
        </div>
      </div>
    </div>

    <!-- 物品格子 -->
    <div class="grid grid-cols-3 md:grid-cols-5 gap-2">
      <div
        v-for="item in inventoryStore.items"
        :key="item.itemId + item.quality"
        class="border rounded-[2px] p-2 text-xs text-center"
        :class="item.quality !== 'normal' ? QUALITY_COLORS[item.quality] : 'border-accent/20'"
        :title="`${getItemById(item.itemId)?.description ?? ''}`"
      >
        <div class="truncate">{{ getItemById(item.itemId)?.name }}</div>
        <div class="text-muted">×{{ item.quantity }}</div>
        <div
          v-if="item.quality !== 'normal'"
          class="text-xs mt-0.5"
          :class="{
            'text-quality-fine': item.quality === 'fine',
            'text-quality-excellent': item.quality === 'excellent',
            'text-quality-supreme': item.quality === 'supreme'
          }"
        >
          {{ QUALITY_LABELS[item.quality] }}
        </div>
        <button
          v-if="isEdible(item.itemId)"
          class="btn text-xs mt-1 w-full justify-center py-0.5"
          @click="handleEat(item.itemId, item.quality)"
        >
          <Apple :size="14" />
          食用
        </button>
      </div>

      <!-- 空格子 -->
      <div
        v-for="i in Math.max(0, inventoryStore.capacity - inventoryStore.items.length)"
        :key="'empty-' + i"
        class="border border-accent/10 rounded-[2px] p-2 text-xs text-center text-muted/30"
      >
        空
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Apple, Package, Wrench } from 'lucide-vue-next'
  import { useInventoryStore, usePlayerStore, useSkillStore } from '@/stores'
  import { getItemById } from '@/data'
  import { addLog } from '@/composables/useGameLog'
  import type { Quality } from '@/types'

  const inventoryStore = useInventoryStore()
  const playerStore = usePlayerStore()
  const skillStore = useSkillStore()

  const TOOL_NAMES: Record<string, string> = {
    wateringCan: '水壶',
    hoe: '锄头',
    pickaxe: '镐',
    fishingRod: '鱼竿'
  }

  const TIER_NAMES: Record<string, string> = {
    basic: '初始',
    iron: '铁制',
    steel: '精钢'
  }

  const QUALITY_LABELS: Record<string, string> = {
    normal: '',
    fine: '优良',
    excellent: '精品',
    supreme: '极品'
  }

  const QUALITY_COLORS: Record<string, string> = {
    normal: '',
    fine: 'border-quality-fine',
    excellent: 'border-quality-excellent',
    supreme: 'border-quality-supreme'
  }

  const isEdible = (itemId: string): boolean => {
    const def = getItemById(itemId)
    return !!def?.edible && !!def.staminaRestore
  }

  const handleEat = (itemId: string, quality: Quality) => {
    const def = getItemById(itemId)
    if (!def?.edible || !def.staminaRestore) return
    const staminaFull = playerStore.stamina >= playerStore.maxStamina
    const hpFull = playerStore.hp >= playerStore.getMaxHp()
    if (staminaFull && hpFull) {
      addLog('体力和生命值都已满，不需要食用。')
      return
    }
    if (!inventoryStore.removeItem(itemId, 1, quality)) return
    // 炼金师专精：食物恢复+50%
    const alchemistBonus = skillStore.getSkill('foraging').perk10 === 'alchemist' ? 1.5 : 1.0
    const staminaRestore = Math.floor(def.staminaRestore * alchemistBonus)
    playerStore.restoreStamina(staminaRestore)
    let msg = `食用了${def.name}，恢复${staminaRestore}体力`
    if (def.healthRestore) {
      const healthRestore = Math.floor(def.healthRestore * alchemistBonus)
      playerStore.restoreHealth(healthRestore)
      msg += `、${healthRestore}生命值`
    }
    msg += '。'
    addLog(msg)
  }
</script>
