<template>
  <div>
    <h3 class="text-accent text-sm mb-3">桃源村</h3>

    <!-- NPC 列表 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div
        v-for="npc in NPCS"
        :key="npc.id"
        class="game-panel transition-colors"
        :class="npcAvailable(npc.id) ? 'cursor-pointer hover:border-accent/60' : 'opacity-50'"
        @click="handleSelectNpc(npc.id)"
      >
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm">
              {{ npc.name }}
              <span v-if="npcStore.getNpcState(npc.id)?.married" class="text-danger text-xs ml-1">[伴侣]</span>
            </p>
            <p class="text-xs text-muted">{{ npc.role }}</p>
            <p v-if="npcStore.isBirthday(npc.id)" class="text-xs text-danger">
              <Cake :size="14" class="inline" />
              今天生日!
            </p>
          </div>
          <span v-if="npc.marriageable" class="text-xs text-danger/50"><Heart :size="14" /></span>
        </div>
        <p class="text-xs mt-1" :class="levelColor(npcStore.getFriendshipLevel(npc.id))">
          {{ LEVEL_NAMES[npcStore.getFriendshipLevel(npc.id)] }}
          ({{ npcStore.getNpcState(npc.id)?.friendship ?? 0 }})
        </p>
        <!-- 心级别进度条 -->
        <div class="mt-1 flex gap-0.5">
          <span
            v-for="h in 10"
            :key="h"
            class="text-xs"
            :class="(npcStore.getNpcState(npc.id)?.friendship ?? 0) >= h * 40 ? 'text-danger' : 'text-muted/30'"
          >
            &#x2665;
          </span>
        </div>
        <p v-if="!npcAvailable(npc.id)" class="text-xs text-muted mt-1">{{ npcUnavailableReason(npc.id) }}</p>
      </div>
    </div>

    <!-- NPC 交互弹窗 -->
    <div v-if="selectedNpc" class="mt-4 game-panel">
      <div class="flex justify-between items-center mb-3">
        <div>
          <p class="text-sm text-accent">
            {{ selectedNpcDef?.name }} — {{ selectedNpcDef?.role }}
            <span v-if="selectedNpcState?.married" class="text-danger text-xs ml-1">[伴侣]</span>
          </p>
          <p class="text-xs text-muted">{{ selectedNpcDef?.personality }}</p>
          <p v-if="selectedNpcDef?.birthday" class="text-xs text-muted">
            生日: {{ SEASON_NAMES_MAP[selectedNpcDef.birthday.season] }}{{ selectedNpcDef.birthday.day }}日
            <span v-if="npcStore.isBirthday(selectedNpc!)" class="text-danger ml-1">（今天！送礼好感×5）</span>
          </p>
        </div>
        <button class="btn text-xs" @click="selectedNpc = null">关闭</button>
      </div>

      <!-- 已触发的心事件 -->
      <div v-if="selectedNpcState && selectedNpcState.triggeredHeartEvents.length > 0" class="mb-3">
        <p class="text-xs text-muted mb-1">回忆：</p>
        <div class="flex gap-1 flex-wrap">
          <span v-for="eid in selectedNpcState.triggeredHeartEvents" :key="eid" class="text-xs border border-accent/20 rounded-[2px] px-1">
            {{ getHeartEventTitle(eid) }}
          </span>
        </div>
      </div>

      <!-- 对话 -->
      <div class="mb-3 flex gap-2 flex-wrap">
        <button class="btn text-xs" :disabled="selectedNpcState?.talkedToday" @click="handleTalk">
          <MessageCircle :size="14" />
          {{ selectedNpcState?.talkedToday ? '今天已聊过' : '聊天' }}
        </button>
        <!-- 求婚按钮 -->
        <button v-if="canPropose" class="btn text-xs text-danger border-danger/40" @click="handlePropose">
          <Heart :size="14" />
          求婚
        </button>
      </div>

      <!-- 对话内容 -->
      <div v-if="dialogueText" class="game-panel mb-3 text-xs">
        <p class="text-accent mb-1">「{{ selectedNpcDef?.name }}」</p>
        <p>{{ dialogueText }}</p>
      </div>

      <!-- 送礼 -->
      <div>
        <p class="text-xs text-muted mb-2">
          送礼（选择背包中的物品）
          <span v-if="npcStore.isBirthday(selectedNpc!)" class="text-danger">— 生日加成中!</span>
        </p>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="item in giftableItems"
            :key="`${item.itemId}_${item.quality ?? 'normal'}`"
            class="btn text-xs"
            :disabled="selectedNpcState?.giftedToday"
            @click="handleGift(item.itemId, item.quality)"
          >
            <Gift :size="14" />
            {{ getItemById(item.itemId)?.name }}
            <span v-if="item.quality && item.quality !== 'normal'" class="text-accent ml-0.5">{{ QUALITY_LABELS[item.quality] }}</span>
            (&times;{{ item.quantity }})
          </button>
          <p v-if="giftableItems.length === 0" class="text-xs text-muted">背包为空</p>
        </div>
        <p v-if="selectedNpcState?.giftedToday" class="text-xs text-muted mt-1">今天已送过礼物了。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { MessageCircle, Heart, Gift, Cake } from 'lucide-vue-next'
  import { useNpcStore, useInventoryStore, useCookingStore, useGameStore } from '@/stores'
  import { NPCS, getNpcById, getItemById, getHeartEventById } from '@/data'
  import { ACTION_TIME_COSTS, isNpcAvailable, getNpcUnavailableReason } from '@/data/timeConstants'
  import { addLog } from '@/composables/useGameLog'
  import { triggerHeartEvent } from '@/composables/useDialogs'
  import { handleEndDay } from '@/composables/useEndDay'
  import type { FriendshipLevel, Quality } from '@/types'

  const npcStore = useNpcStore()
  const inventoryStore = useInventoryStore()
  const cookingStore = useCookingStore()
  const gameStore = useGameStore()

  const selectedNpc = ref<string | null>(null)
  const dialogueText = ref<string | null>(null)

  const selectedNpcDef = computed(() => (selectedNpc.value ? getNpcById(selectedNpc.value) : null))
  const selectedNpcState = computed(() => (selectedNpc.value ? npcStore.getNpcState(selectedNpc.value) : null))

  const npcAvailable = (npcId: string): boolean => {
    return isNpcAvailable(npcId, gameStore.day, gameStore.hour)
  }

  const handleSelectNpc = (npcId: string) => {
    if (npcAvailable(npcId)) {
      selectedNpc.value = npcId
    }
  }

  const npcUnavailableReason = (npcId: string): string => {
    return getNpcUnavailableReason(npcId, gameStore.day, gameStore.hour) ?? ''
  }

  const giftableItems = computed(() =>
    inventoryStore.items.filter(i => {
      const def = getItemById(i.itemId)
      return def && def.category !== 'seed'
    })
  )

  /** 是否可以求婚 */
  const canPropose = computed(() => {
    if (!selectedNpcDef.value?.marriageable) return false
    if (selectedNpcState.value?.married) return false
    if (npcStore.npcStates.some(s => s.married)) return false
    if ((selectedNpcState.value?.friendship ?? 0) < 300) return false
    if (!inventoryStore.hasItem('jade_ring')) return false
    return true
  })

  const LEVEL_NAMES: Record<FriendshipLevel, string> = {
    stranger: '陌生',
    acquaintance: '相识',
    friendly: '友善',
    bestFriend: '挚友'
  }

  const SEASON_NAMES_MAP: Record<string, string> = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' }

  const QUALITY_LABELS: Record<string, string> = { normal: '', fine: '优', excellent: '精', supreme: '极' }

  const levelColor = (level: FriendshipLevel): string => {
    switch (level) {
      case 'stranger':
        return 'text-muted'
      case 'acquaintance':
        return 'text-water'
      case 'friendly':
        return 'text-success'
      case 'bestFriend':
        return 'text-accent'
    }
  }

  const getHeartEventTitle = (eventId: string): string => {
    return getHeartEventById(eventId)?.title ?? eventId
  }

  const handleTalk = () => {
    if (!selectedNpc.value) return
    if (gameStore.isPastBedtime) {
      addLog('太晚了，人家都睡了。')
      handleEndDay()
      return
    }
    const result = npcStore.talkTo(selectedNpc.value)
    if (result) {
      dialogueText.value = result.message
      addLog(`与${selectedNpcDef.value?.name}聊天。(+${result.friendshipGain}好感)`)

      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.talk)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) {
        handleEndDay()
        return
      }

      // 检查心事件触发
      const heartEvent = npcStore.checkHeartEvent(selectedNpc.value)
      if (heartEvent) {
        triggerHeartEvent(heartEvent)
      }
    }
  }

  const handleGift = (itemId: string, quality: Quality = 'normal') => {
    if (!selectedNpc.value) return
    const giftMultiplier = cookingStore.activeBuff?.type === 'giftBonus' ? cookingStore.activeBuff.value : 1
    const result = npcStore.giveGift(selectedNpc.value, itemId, giftMultiplier, quality)
    if (result) {
      const itemName = getItemById(itemId)?.name ?? itemId
      const npcName = selectedNpcDef.value?.name
      if (result.gain > 0) {
        addLog(`送给${npcName}${itemName}，${npcName}觉得${result.reaction}。(+${result.gain}好感)`)
      } else if (result.gain < 0) {
        addLog(`送给${npcName}${itemName}，${npcName}${result.reaction}这个……(${result.gain}好感)`)
      } else {
        addLog(`送给${npcName}${itemName}，${npcName}觉得${result.reaction}。`)
      }

      // 送礼后也检查心事件
      const heartEvent = npcStore.checkHeartEvent(selectedNpc.value)
      if (heartEvent) {
        triggerHeartEvent(heartEvent)
      }
    }
  }

  const handlePropose = () => {
    if (!selectedNpc.value) return
    const result = npcStore.propose(selectedNpc.value)
    if (result.success) {
      dialogueText.value = result.message
      addLog(result.message)
    } else {
      addLog(result.message)
    }
  }
</script>
