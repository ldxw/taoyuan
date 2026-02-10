<template>
  <div>
    <h3 class="text-accent text-sm mb-3">桃源村</h3>

    <!-- NPC 网格：移动端紧凑，桌面端详细 -->
    <div class="grid grid-cols-4 md:grid-cols-3 gap-1.5 md:gap-2">
      <div
        v-for="npc in NPCS"
        :key="npc.id"
        class="border border-accent/20 rounded-xs p-1.5 md:p-2 transition-colors"
        :class="[npcAvailable(npc.id) ? 'cursor-pointer hover:bg-accent/5' : 'opacity-50', 'text-center md:text-left']"
        @click="handleSelectNpc(npc.id)"
      >
        <!-- 移动端：紧凑布局 -->
        <div class="md:hidden">
          <p class="text-xs truncate" :class="levelColor(npcStore.getFriendshipLevel(npc.id))">
            {{ npc.name }}
          </p>
          <p class="text-[10px]" :class="heartCount(npc.id) > 0 ? 'text-danger' : 'text-muted/30'">{{ heartCount(npc.id) }}&#x2665;</p>
          <div class="flex items-center justify-center gap-0.5 mt-0.5 min-h-3.5">
            <Heart v-if="npcStore.getNpcState(npc.id)?.married" :size="10" class="text-danger" />
            <Heart v-else-if="npcStore.getNpcState(npc.id)?.dating" :size="10" class="text-danger/50" />
            <Heart v-else-if="npc.marriageable" :size="10" class="text-muted/30" />
            <Cake v-if="npcStore.isBirthday(npc.id)" :size="10" class="text-danger" />
          </div>
        </div>
        <!-- 桌面端：显示更多信息 -->
        <div class="hidden md:block">
          <div class="flex items-center justify-between">
            <span class="text-xs" :class="levelColor(npcStore.getFriendshipLevel(npc.id))">
              {{ npc.name }}
              <span v-if="npcStore.getNpcState(npc.id)?.married" class="text-danger text-[10px] ml-0.5">[伴侣]</span>
              <span v-else-if="npcStore.getNpcState(npc.id)?.dating" class="text-danger/70 text-[10px] ml-0.5">[约会中]</span>
            </span>
            <span v-if="npc.marriageable" class="text-danger/50"><Heart :size="10" /></span>
          </div>
          <p class="text-[10px] text-muted truncate">{{ npc.role }}</p>
          <div class="flex items-center justify-between mt-0.5">
            <div class="flex gap-px">
              <span
                v-for="h in 10"
                :key="h"
                class="text-[10px]"
                :class="(npcStore.getNpcState(npc.id)?.friendship ?? 0) >= h * 250 ? 'text-danger' : 'text-muted/30'"
              >
                &#x2665;
              </span>
            </div>
            <Cake v-if="npcStore.isBirthday(npc.id)" :size="10" class="text-danger" />
          </div>
        </div>
      </div>
    </div>

    <!-- NPC 交互弹窗 -->
    <Transition name="panel-fade">
      <div v-if="selectedNpc" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" @click.self="selectedNpc = null">
        <div class="game-panel max-w-lg w-full max-h-[80vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-3">
            <div>
              <p class="text-sm text-accent">
                {{ selectedNpcDef?.name }} — {{ selectedNpcDef?.role }}
                <span v-if="selectedNpcState?.married" class="text-danger text-xs ml-1">[伴侣]</span>
                <span v-else-if="selectedNpcState?.dating" class="text-danger/70 text-xs ml-1">[约会中]</span>
              </p>
              <p class="text-xs text-muted">{{ selectedNpcDef?.personality }}</p>
              <p v-if="selectedNpcDef?.birthday" class="text-xs text-muted">
                生日: {{ SEASON_NAMES_MAP[selectedNpcDef.birthday.season] }}{{ selectedNpcDef.birthday.day }}日
                <span v-if="npcStore.isBirthday(selectedNpc!)" class="text-danger ml-1">（今天！送礼好感×8）</span>
              </p>
            </div>
            <button class="btn text-xs" @click="selectedNpc = null">关闭</button>
          </div>

          <!-- 已触发的心事件 -->
          <div v-if="selectedNpcState && selectedNpcState.triggeredHeartEvents.length > 0" class="mb-3">
            <p class="text-xs text-muted mb-1">回忆：</p>
            <div class="flex gap-1 flex-wrap">
              <span v-for="eid in selectedNpcState.triggeredHeartEvents" :key="eid" class="text-xs border border-accent/20 rounded-xs px-1">
                {{ getHeartEventTitle(eid) }}
              </span>
            </div>
          </div>

          <!-- 对话 -->
          <div class="mb-3 flex gap-2 flex-wrap">
            <button class="btn text-xs w-full" :disabled="selectedNpcState?.talkedToday" @click="handleTalk">
              <MessageCircle :size="14" />
              {{ selectedNpcState?.talkedToday ? '今天已聊过' : '聊天' }}
            </button>
            <!-- 赠帕按钮 -->
            <button v-if="canStartDating" class="btn text-xs text-danger border-danger/40" @click="handleStartDating">
              <Heart :size="14" />
              赠帕
            </button>
            <!-- 求婚按钮 -->
            <button v-if="canPropose" class="btn text-xs text-danger border-danger/40" @click="handlePropose">
              <Heart :size="14" />
              求婚
            </button>
            <!-- 离婚按钮 -->
            <button v-if="selectedNpcState?.married" class="btn text-xs text-danger border-danger/40" @click="showDivorceConfirm = true">
              休书
            </button>
          </div>

          <!-- 婚礼倒计时 -->
          <p v-if="npcStore.weddingCountdown > 0 && npcStore.weddingNpcId === selectedNpc" class="text-xs text-accent mb-3">
            婚礼将在 {{ npcStore.weddingCountdown }} 天后举行！
          </p>

          <!-- 离婚确认 -->
          <div v-if="showDivorceConfirm" class="game-panel mb-3 border-danger/40">
            <p class="text-xs text-danger mb-2">确定要与{{ selectedNpcDef?.name }}和离吗？（花费30000文）</p>
            <div class="flex gap-2">
              <button class="btn text-xs text-danger" @click="handleDivorce">确认</button>
              <button class="btn text-xs" @click="showDivorceConfirm = false">取消</button>
            </div>
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
            <template v-if="selectedNpcState?.giftedToday">
              <div class="flex flex-col items-center justify-center py-6 text-muted">
                <Gift :size="32" class="mb-2" />
                <p class="text-xs">今天已送过礼物了。</p>
              </div>
            </template>
            <template v-else-if="(selectedNpcState?.giftsThisWeek ?? 0) >= 2">
              <div class="flex flex-col items-center justify-center py-6 text-muted">
                <Gift :size="32" class="mb-2" />
                <p class="text-xs">本周已送过2次礼物了。</p>
              </div>
            </template>
            <template v-else>
              <div class="flex flex-col gap-1 max-h-40 overflow-y-auto">
                <div
                  v-for="item in giftableItems"
                  :key="`${item.itemId}_${item.quality ?? 'normal'}`"
                  class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
                  @click="activeGiftKey = item.itemId + ':' + item.quality"
                >
                  <span class="text-xs" :class="qualityTextClass(item.quality)">
                    {{ getItemById(item.itemId)?.name }}
                  </span>
                  <Gift :size="12" class="text-muted" />
                </div>
              </div>
              <div v-if="giftableItems.length === 0" class="flex flex-col items-center justify-center py-6 text-muted">
                <Package :size="32" class="mb-2" />
                <p class="text-xs">背包为空</p>
              </div>
            </template>
          </div>

          <!-- 送礼物品详情弹窗 -->
          <Transition name="panel-fade">
            <div
              v-if="activeGiftItem && activeGiftDef"
              class="fixed inset-0 bg-black/60 flex items-center justify-center z-60 p-4"
              @click.self="activeGiftKey = null"
            >
              <div class="game-panel max-w-xs w-full relative">
                <button class="absolute top-2 right-2 text-muted hover:text-text" @click="activeGiftKey = null">
                  <X :size="14" />
                </button>
                <p class="text-sm mb-2 pr-6" :class="qualityTextClass(activeGiftItem.quality, 'text-accent')">
                  {{ activeGiftDef.name }}
                </p>
                <div class="border border-accent/10 rounded-xs p-2 mb-2">
                  <p class="text-xs text-muted">{{ activeGiftDef.description }}</p>
                </div>
                <div class="border border-accent/10 rounded-xs p-2 mb-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-muted">数量</span>
                    <span class="text-xs">&times;{{ activeGiftItem.quantity }}</span>
                  </div>
                  <div v-if="activeGiftItem.quality !== 'normal'" class="flex items-center justify-between mt-0.5">
                    <span class="text-xs text-muted">品质</span>
                    <span class="text-xs" :class="qualityTextClass(activeGiftItem.quality)">
                      {{ QUALITY_NAMES[activeGiftItem.quality] }}
                    </span>
                  </div>
                </div>
                <div class="flex flex-col gap-1.5">
                  <button class="btn text-xs w-full justify-center" @click="handleGift(activeGiftItem!.itemId, activeGiftItem!.quality)">
                    <Gift :size="14" />
                    赠送给{{ selectedNpcDef?.name }}
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { MessageCircle, Heart, Gift, Cake, X, Package } from 'lucide-vue-next'
  import { useNpcStore, useInventoryStore, useCookingStore, useGameStore, usePlayerStore } from '@/stores'
  import { NPCS, getNpcById, getItemById, getHeartEventById } from '@/data'
  import { ACTION_TIME_COSTS, isNpcAvailable } from '@/data/timeConstants'
  import { addLog } from '@/composables/useGameLog'
  import { triggerHeartEvent } from '@/composables/useDialogs'
  import { handleEndDay } from '@/composables/useEndDay'
  import type { FriendshipLevel, Quality } from '@/types'

  const npcStore = useNpcStore()
  const inventoryStore = useInventoryStore()
  const cookingStore = useCookingStore()
  const gameStore = useGameStore()
  const playerStore = usePlayerStore()

  const selectedNpc = ref<string | null>(null)
  const dialogueText = ref<string | null>(null)
  const showDivorceConfirm = ref(false)
  const activeGiftKey = ref<string | null>(null)

  const activeGiftItem = computed(() => {
    if (!activeGiftKey.value) return null
    const [itemId, quality] = activeGiftKey.value.split(':')
    return inventoryStore.items.find(i => i.itemId === itemId && i.quality === quality) ?? null
  })

  const activeGiftDef = computed(() => {
    if (!activeGiftItem.value) return null
    return getItemById(activeGiftItem.value.itemId) ?? null
  })

  const selectedNpcDef = computed(() => (selectedNpc.value ? getNpcById(selectedNpc.value) : null))
  const selectedNpcState = computed(() => (selectedNpc.value ? npcStore.getNpcState(selectedNpc.value) : null))

  const npcAvailable = (npcId: string): boolean => {
    return isNpcAvailable(npcId, gameStore.day, gameStore.hour)
  }

  const handleSelectNpc = (npcId: string) => {
    if (npcAvailable(npcId)) {
      selectedNpc.value = npcId
      dialogueText.value = null
      showDivorceConfirm.value = false
    }
  }

  const heartCount = (npcId: string): number => {
    const friendship = npcStore.getNpcState(npcId)?.friendship ?? 0
    return Math.min(10, Math.floor(friendship / 250))
  }

  const giftableItems = computed(() =>
    inventoryStore.items.filter(i => {
      const def = getItemById(i.itemId)
      return def && def.category !== 'seed'
    })
  )

  /** 是否可以赠帕开始约会 */
  const canStartDating = computed(() => {
    if (!selectedNpcDef.value?.marriageable) return false
    if (selectedNpcDef.value.gender === playerStore.gender) return false
    if (selectedNpcState.value?.dating) return false
    if (selectedNpcState.value?.married) return false
    if (npcStore.npcStates.some(s => s.married)) return false
    if ((selectedNpcState.value?.friendship ?? 0) < 2000) return false
    if (!inventoryStore.hasItem('silk_ribbon')) return false
    return true
  })

  /** 是否可以求婚 */
  const canPropose = computed(() => {
    if (!selectedNpcDef.value?.marriageable) return false
    if (selectedNpcDef.value.gender === playerStore.gender) return false
    if (!selectedNpcState.value?.dating) return false
    if (selectedNpcState.value?.married) return false
    if (npcStore.npcStates.some(s => s.married)) return false
    if (npcStore.weddingCountdown > 0) return false
    if ((selectedNpcState.value?.friendship ?? 0) < 2500) return false
    if (!inventoryStore.hasItem('jade_ring')) return false
    return true
  })

  const SEASON_NAMES_MAP: Record<string, string> = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' }

  const qualityTextClass = (q: Quality, fallback = ''): string => {
    if (q === 'fine') return 'text-quality-fine'
    if (q === 'excellent') return 'text-quality-excellent'
    if (q === 'supreme') return 'text-quality-supreme'
    return fallback
  }

  const QUALITY_NAMES: Record<Quality, string> = {
    normal: '普通',
    fine: '优良',
    excellent: '精品',
    supreme: '极品'
  }

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
    const cookingGiftBonus = cookingStore.activeBuff?.type === 'giftBonus' ? cookingStore.activeBuff.value : 1
    const ringGiftBonus = inventoryStore.getRingEffectValue('gift_friendship')
    const giftMultiplier = cookingGiftBonus * (1 + ringGiftBonus)
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

      // 关闭送礼弹窗
      activeGiftKey.value = null

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

  const handleStartDating = () => {
    if (!selectedNpc.value) return
    const result = npcStore.startDating(selectedNpc.value)
    if (result.success) {
      dialogueText.value = result.message
      addLog(result.message)
    } else {
      addLog(result.message)
    }
  }

  const handleDivorce = () => {
    const result = npcStore.divorce()
    if (result.success) {
      addLog(result.message)
      dialogueText.value = result.message
    } else {
      addLog(result.message)
    }
    showDivorceConfirm.value = false
  }
</script>
