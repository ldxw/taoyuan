<template>
  <div v-if="gameStore.isGameStarted" class="flex flex-col gap-2 md:gap-4 h-screen p-2 md:p-4">
    <!-- 状态栏 -->
    <StatusBar @request-sleep="showSleepConfirm = true" />

    <button class="btn text-center justify-center text-sm md:!hidden" @click.stop="showSleepConfirm = true">
      <Moon :size="12" />
      {{ sleepLabel }}
    </button>

    <!-- 内容 -->
    <div class="flex flex-col md:flex-row gap-2 md:gap-4 flex-1 min-h-0">
      <div class="flex flex-col gap-2 md:gap-4 flex-1 min-w-0">
        <!-- 主面板（带过渡） -->
        <div class="game-panel flex-1 min-h-0 overflow-y-auto">
          <router-view v-slot="{ Component }">
            <Transition name="panel-fade" mode="out-in">
              <component :is="Component" :key="$route.path" />
            </Transition>
          </router-view>
        </div>
      </div>
    </div>

    <!-- 移动端地图按钮 -->
    <button class="mobile-map-btn md:!hidden" @click="showMobileMap = true">
      <Map :size="20" />
    </button>

    <!-- 移动端地图菜单 -->
    <MobileMapMenu :open="showMobileMap" :current="currentPanel" @close="showMobileMap = false" />

    <!-- 季节事件弹窗 -->
    <EventDialog v-if="currentEvent" :event="currentEvent" @close="closeEvent" />

    <!-- 心事件弹窗 -->
    <HeartEventDialog v-if="pendingHeartEvent" :event="pendingHeartEvent" @close="closeHeartEvent" />

    <!-- 互动节日 -->
    <div v-if="currentFestival" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <FishingContestView v-if="currentFestival === 'fishing_contest'" @complete="closeFestival" />
      <HarvestFairView v-if="currentFestival === 'harvest_fair'" @complete="closeFestival" />
    </div>

    <!-- 技能专精选择弹窗 -->
    <PerkSelectDialog v-if="pendingPerk" :skill-type="pendingPerk.skillType" :level="pendingPerk.level" @select="handlePerkSelect" />

    <!-- 休息确认 -->
    <Transition name="panel-fade">
      <div
        v-if="showSleepConfirm"
        class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
        @click.self="showSleepConfirm = false"
      >
        <div class="game-panel max-w-xs w-full text-center">
          <p class="text-accent text-sm mb-3">—— {{ sleepLabel }} ——</p>
          <p class="text-xs leading-relaxed mb-1">{{ sleepSummary }}</p>
          <p v-if="sleepWarning" class="text-danger text-xs mb-1">{{ sleepWarning }}</p>
          <div class="flex gap-3 justify-center mt-4">
            <button class="btn text-xs" @click="showSleepConfirm = false">
              <X :size="12" />
              再等等
            </button>
            <button class="btn btn-danger text-xs" @click="confirmSleep">
              <Moon :size="12" />
              {{ sleepLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useGameStore, usePlayerStore } from '@/stores'
  import { useDialogs } from '@/composables/useDialogs'
  import { handleEndDay } from '@/composables/useEndDay'
  import { useAudio } from '@/composables/useAudio'
  import { Moon, X, Map } from 'lucide-vue-next'
  import MobileMapMenu from '@/components/game/MobileMapMenu.vue'
  import StatusBar from '@/components/game/StatusBar.vue'
  import EventDialog from '@/components/game/EventDialog.vue'
  import HeartEventDialog from '@/components/game/HeartEventDialog.vue'
  import PerkSelectDialog from '@/components/game/PerkSelectDialog.vue'
  import FishingContestView from '@/components/game/FishingContestView.vue'
  import HarvestFairView from '@/components/game/HarvestFairView.vue'

  const router = useRouter()
  const route = useRoute()
  const gameStore = useGameStore()
  const playerStore = usePlayerStore()
  const { switchToSeasonalBgm } = useAudio()

  // 游戏未开始时重定向到主菜单
  if (!gameStore.isGameStarted) {
    router.replace('/')
  }

  const { currentEvent, pendingHeartEvent, currentFestival, pendingPerk, closeEvent, closeHeartEvent, closeFestival, handlePerkSelect } =
    useDialogs()

  /** 从路由名称获取当前面板标识 */
  const currentPanel = computed(() => {
    return (route.name as string) ?? 'farm'
  })

  /** 移动端地图菜单 */
  const showMobileMap = ref(false)

  /** 休息确认弹窗 */
  const showSleepConfirm = ref(false)

  const sleepLabel = computed(() => {
    if (gameStore.hour >= 24) return '倒头就睡'
    if (gameStore.hour >= 20) return '回家休息'
    return '休息'
  })

  const sleepSummary = computed(() => {
    if (playerStore.stamina <= 0 || gameStore.hour >= 26) {
      return '你已经精疲力竭……将在原地昏倒。'
    }
    if (gameStore.hour >= 24) {
      return '已经过了午夜，拖着疲惫的身体回家……'
    }
    return '回到家中，安稳入睡。明日又是新的一天。'
  })

  const sleepWarning = computed(() => {
    if (playerStore.stamina <= 0 || gameStore.hour >= 26) {
      return '体力仅恢复50%，并损失10%金币（上限1000文）'
    }
    if (gameStore.hour >= 24) {
      return '体力仅恢复75%'
    }
    return ''
  })

  const confirmSleep = () => {
    showSleepConfirm.value = false
    handleEndDay()
    switchToSeasonalBgm()
  }
</script>
