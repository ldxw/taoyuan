<template>
  <div>
    <h3 class="text-accent text-sm mb-3">
      <ClipboardList :size="14" class="inline" />
      告示栏
    </h3>

    <!-- 告示栏任务 -->
    <div class="mb-4">
      <p class="text-xs text-muted mb-2">
        <Calendar :size="14" class="inline" />
        今日委托
      </p>
      <div v-if="questStore.boardQuests.length === 0" class="text-xs text-muted">今日暂无委托。</div>
      <div v-else class="flex flex-col gap-2">
        <div v-for="quest in questStore.boardQuests" :key="quest.id" class="border border-accent/20 rounded p-2">
          <p class="text-xs">{{ quest.description }}</p>
          <div class="flex justify-between items-center mt-1">
            <span class="text-xs text-muted">奖励: {{ quest.moneyReward }}文 + 好感{{ quest.friendshipReward }}</span>
            <button
              class="btn text-xs"
              :disabled="questStore.activeQuests.length >= questStore.MAX_ACTIVE_QUESTS"
              @click="handleAccept(quest.id)"
            >
              <Plus :size="14" />
              接取
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 进行中任务 -->
    <div class="mb-4">
      <p class="text-xs text-muted mb-2">
        <Clock :size="14" class="inline" />
        进行中 ({{ questStore.activeQuests.length }}/{{ questStore.MAX_ACTIVE_QUESTS }})
      </p>
      <div v-if="questStore.activeQuests.length === 0" class="text-xs text-muted">暂无进行中的任务。</div>
      <div v-else class="flex flex-col gap-2">
        <div v-for="quest in questStore.activeQuests" :key="quest.id" class="border border-accent/20 rounded p-2">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-xs">{{ quest.description }}</p>
              <p class="text-xs text-muted mt-0.5">剩余 {{ quest.daysRemaining }} 天 · 奖励 {{ quest.moneyReward }}文</p>
            </div>
          </div>
          <!-- Progress bar for non-delivery quests -->
          <div v-if="quest.type !== 'delivery'" class="mt-1">
            <div class="flex items-center gap-2">
              <div class="flex-1 h-1.5 bg-bg rounded-[2px] border border-accent/10">
                <div
                  class="h-full rounded-[2px] bg-accent transition-all"
                  :style="{ width: Math.floor((quest.collectedQuantity / quest.targetQuantity) * 100) + '%' }"
                />
              </div>
              <span class="text-xs text-muted">{{ quest.collectedQuantity }}/{{ quest.targetQuantity }}</span>
            </div>
          </div>
          <!-- For delivery: show current inventory count -->
          <div v-else class="mt-1">
            <span class="text-xs text-muted">背包中: {{ inventoryStore.getItemCount(quest.targetItemId) }}/{{ quest.targetQuantity }}</span>
          </div>
          <!-- Submit button -->
          <button
            class="btn text-xs mt-1"
            :class="{ 'bg-accent text-bg': canSubmit(quest) }"
            :disabled="!canSubmit(quest)"
            @click="handleSubmit(quest.id)"
          >
            <CheckCircle :size="14" />
            提交
          </button>
        </div>
      </div>
    </div>

    <!-- 累计完成 -->
    <p class="text-xs text-muted">累计完成委托: {{ questStore.completedQuestCount }} 个</p>
  </div>
</template>

<script setup lang="ts">
  import { ClipboardList, Calendar, Clock, Plus, CheckCircle } from 'lucide-vue-next'
  import type { QuestInstance } from '@/types'
  import { useQuestStore, useInventoryStore } from '@/stores'
  import { addLog } from '@/composables/useGameLog'

  const questStore = useQuestStore()
  const inventoryStore = useInventoryStore()

  const canSubmit = (quest: QuestInstance): boolean => {
    if (quest.type === 'delivery') {
      return inventoryStore.getItemCount(quest.targetItemId) >= quest.targetQuantity
    }
    return quest.collectedQuantity >= quest.targetQuantity
  }

  const handleAccept = (questId: string) => {
    const result = questStore.acceptQuest(questId)
    addLog(result.message)
  }

  const handleSubmit = (questId: string) => {
    const result = questStore.submitQuest(questId)
    addLog(result.message)
  }
</script>
