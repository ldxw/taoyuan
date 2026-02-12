<template>
  <div v-if="gameStore.isGameStarted" class="flex flex-col gap-2 md:gap-4 h-screen p-2 md:p-4" :class="{ 'py-10': isWebView }">
    <!-- 状态栏 -->
    <StatusBar @request-sleep="showSleepConfirm = true" />

    <button class="btn text-center justify-center text-sm md:hidden!" @click.stop="showSleepConfirm = true">
      <Moon :size="12" />
      {{ sleepLabel }}
    </button>

    <!-- 内容 -->
    <div class="game-panel flex-1 min-h-0 overflow-y-auto">
      <router-view v-slot="{ Component }">
        <Transition name="panel-fade" mode="out-in">
          <component :is="Component" :key="$route.path" />
        </Transition>
      </router-view>
    </div>

    <!-- 移动端地图按钮 -->
    <button class="mobile-map-btn md:hidden!" @click="showMobileMap = true">
      <Map :size="20" />
    </button>
    <button class="mobile-setting-btn md:hidden!" @click="showSettings = true">
      <SettingsIcon :size="20" />
    </button>

    <SettingsDialog :open="showSettings" @close="showSettings = false" />

    <!-- 移动端地图菜单 -->
    <MobileMapMenu :open="showMobileMap" :current="currentPanel" @close="showMobileMap = false" />

    <!-- 季节事件弹窗 -->
    <Transition name="panel-fade">
      <EventDialog v-if="currentEvent" :event="currentEvent" @close="closeEvent" />
    </Transition>

    <!-- 心事件弹窗 -->
    <Transition name="panel-fade">
      <HeartEventDialog v-if="pendingHeartEvent" :event="pendingHeartEvent" @close="closeHeartEvent" />
    </Transition>

    <!-- 互动节日 -->
    <Transition name="panel-fade">
      <div v-if="currentFestival" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <FishingContestView v-if="currentFestival === 'fishing_contest'" @complete="closeFestival" />
        <HarvestFairView v-if="currentFestival === 'harvest_fair'" @complete="closeFestival" />
        <DragonBoatView v-if="currentFestival === 'dragon_boat'" @complete="closeFestival" />
        <LanternRiddleView v-if="currentFestival === 'lantern_riddle'" @complete="closeFestival" />
        <PotThrowingView v-if="currentFestival === 'pot_throwing'" @complete="closeFestival" />
        <DumplingMakingView v-if="currentFestival === 'dumpling_making'" @complete="closeFestival" />
        <FireworkShowView v-if="currentFestival === 'firework_show'" @complete="closeFestival" />
      </div>
    </Transition>

    <!-- 技能专精选择弹窗 -->
    <Transition name="panel-fade">
      <PerkSelectDialog v-if="pendingPerk" :skill-type="pendingPerk.skillType" :level="pendingPerk.level" @select="handlePerkSelect" />
    </Transition>

    <!-- 宠物领养弹窗 -->
    <Transition name="panel-fade">
      <div v-if="pendingPetAdoption" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div class="game-panel max-w-xs w-full text-center">
          <p class="text-accent text-sm mb-3">—— 小动物来访 ——</p>
          <p class="text-xs leading-relaxed mb-3">一只小动物在你家门口徘徊，看起来很想有个家。你要收养它吗？</p>
          <div class="flex gap-3 justify-center mb-3">
            <button class="btn text-xs" :class="petChoice === 'cat' ? 'bg-accent! text-bg!' : ''" @click="petChoice = 'cat'">猫</button>
            <button class="btn text-xs" :class="petChoice === 'dog' ? 'bg-accent! text-bg!' : ''" @click="petChoice = 'dog'">狗</button>
          </div>
          <div v-if="petChoice" class="mb-3">
            <p class="text-xs text-muted mb-1">给它取个名字：</p>
            <input
              v-model="petNameInput"
              class="w-full bg-bg border border-accent/30 rounded-xs px-2 py-1 text-xs text-text"
              :placeholder="petChoice === 'cat' ? '小花' : '旺财'"
              maxlength="8"
            />
          </div>
          <button class="btn text-xs" :disabled="!petChoice" @click="confirmPetAdoption">领养</button>
        </div>
      </div>
    </Transition>

    <!-- 休息确认 -->
    <Transition name="panel-fade">
      <div v-if="showSleepConfirm" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
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
  import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useGameStore, usePlayerStore, useAnimalStore } from '@/stores'
  import { useDialogs } from '@/composables/useDialogs'
  import { handleEndDay } from '@/composables/useEndDay'
  import { useGameClock } from '@/composables/useGameClock'
  import { useAudio } from '@/composables/useAudio'
  import { Moon, X, Map, Settings as SettingsIcon } from 'lucide-vue-next'
  import MobileMapMenu from '@/components/game/MobileMapMenu.vue'
  import StatusBar from '@/components/game/StatusBar.vue'
  import EventDialog from '@/components/game/EventDialog.vue'
  import HeartEventDialog from '@/components/game/HeartEventDialog.vue'
  import PerkSelectDialog from '@/components/game/PerkSelectDialog.vue'
  import FishingContestView from '@/components/game/FishingContestView.vue'
  import HarvestFairView from '@/components/game/HarvestFairView.vue'
  import DragonBoatView from '@/components/game/DragonBoatView.vue'
  import LanternRiddleView from '@/components/game/LanternRiddleView.vue'
  import PotThrowingView from '@/components/game/PotThrowingView.vue'
  import DumplingMakingView from '@/components/game/DumplingMakingView.vue'
  import FireworkShowView from '@/components/game/FireworkShowView.vue'
  import SettingsDialog from '@/components/game/SettingsDialog.vue'

  const router = useRouter()
  const route = useRoute()
  const gameStore = useGameStore()
  const playerStore = usePlayerStore()
  const { switchToSeasonalBgm } = useAudio()

  // 游戏未开始时重定向到主菜单
  if (!gameStore.isGameStarted) {
    router.replace('/')
  }

  const {
    currentEvent,
    pendingHeartEvent,
    currentFestival,
    pendingPerk,
    pendingPetAdoption,
    closeEvent,
    closeHeartEvent,
    closeFestival,
    handlePerkSelect,
    closePetAdoption
  } = useDialogs()

  const { startClock, stopClock, pauseClock, resumeClock } = useGameClock()

  /** 移动端地图菜单 */
  const showMobileMap = ref(false)

  /** 休息确认弹窗 */
  const showSleepConfirm = ref(false)

  /** 设置弹窗 */
  const showSettings = ref(false)

  // 实时时钟生命周期
  onMounted(() => startClock())
  onUnmounted(() => stopClock())

  // 弹窗打开时自动暂停时钟，全部关闭后恢复
  watch(
    () =>
      !!(
        currentEvent.value ||
        pendingHeartEvent.value ||
        currentFestival.value ||
        pendingPerk.value ||
        pendingPetAdoption.value ||
        showSleepConfirm.value
      ),
    hasModal => {
      if (hasModal) pauseClock()
      else resumeClock()
    }
  )

  // 判断是否webview环境
  const isWebView = window.__WEBVIEW__

  /** 从路由名称获取当前面板标识 */
  const currentPanel = computed(() => {
    return (route.name as string) ?? 'farm'
  })

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

  /** 宠物领养 */
  const petChoice = ref<'cat' | 'dog' | null>(null)
  const petNameInput = ref('')

  const confirmPetAdoption = () => {
    if (!petChoice.value) return
    const animalStore = useAnimalStore()
    const defaultName = petChoice.value === 'cat' ? '小花' : '旺财'
    const name = petNameInput.value.trim() || defaultName
    animalStore.adoptPet(petChoice.value, name)
    closePetAdoption()
    petChoice.value = null
    petNameInput.value = ''
  }

  const confirmSleep = () => {
    showSleepConfirm.value = false
    pauseClock()
    handleEndDay()
    switchToSeasonalBgm()
    resumeClock()
  }
</script>

<style scoped>
  /* 移动端地图按钮 */
  .mobile-map-btn,
  .mobile-setting-btn {
    position: fixed;
    bottom: calc(calc(var(--spacing) * 10) + constant(safe-area-inset-bottom, 0px));
    bottom: calc(calc(var(--spacing) * 10) + env(safe-area-inset-bottom, 0px));
    right: 12px;
    z-index: 40;
    width: 40px;
    height: 40px;
    border-radius: 2px;
    background: var(--color-panel);
    border: 2px solid var(--color-accent);
    color: var(--color-accent);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    transition:
      background-color 0.15s,
      color 0.15s;
  }

  .mobile-setting-btn {
    bottom: calc(calc(var(--spacing) * 10) + 48px + constant(safe-area-inset-bottom, 0px));
    bottom: calc(calc(var(--spacing) * 10) + 48px + env(safe-area-inset-bottom, 0px));
  }

  .mobile-map-btn:hover,
  .mobile-map-btn:active {
    background: var(--color-accent);
    color: var(--color-bg);
  }
</style>
