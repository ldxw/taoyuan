<template>
  <div v-if="gameStore.isGameStarted" class="flex flex-col gap-2 md:gap-4 h-screen p-2 md:p-4">
    <!-- 浮动文字 -->
    <FloatingText />

    <!-- 状态栏 -->
    <StatusBar />

    <button class="btn btn-danger text-xs py-0 px-2 min-h-0 md:!hidden" @click.stop="handleSleep">
      <Moon :size="12" />
      {{ sleepLabel }}
    </button>

    <!-- 主体：侧边栏 + 内容 -->
    <div class="flex flex-col md:flex-row gap-2 md:gap-4 flex-1 min-h-0">
      <!-- 侧边菜单（桌面端） -->
      <nav class="game-panel hidden md:flex flex-col gap-2 w-34 shrink-0">
        <button
          v-for="tab in TABS"
          :key="tab.key"
          class="btn text-xs justify-start"
          :class="{ '!bg-accent !text-bg': currentPanel === tab.key }"
          @click="navigateToPanel(tab.key)"
        >
          <component :is="tab.icon" :size="14" />
          {{ tab.label }}
        </button>
        <div class="flex-1" />
      </nav>

      <div class="flex flex-col gap-2 md:gap-4 flex-1 min-w-0 pb-14 md:pb-0">
        <!-- 主面板（带过渡） -->
        <div class="game-panel flex-1 min-h-0 overflow-y-auto">
          <router-view v-slot="{ Component }">
            <Transition name="panel-fade" mode="out-in">
              <component :is="Component" :key="$route.path" />
            </Transition>
          </router-view>
        </div>

        <!-- 游戏日志 -->
        <div class="game-panel shrink-0">
          <div class="flex items-center justify-between cursor-pointer md:cursor-default" @click="logExpanded = !logExpanded">
            <p class="text-accent text-xs">—— 日志 ——</p>
            <div class="flex items-center gap-2">
              <span class="text-xs text-muted md:hidden">{{ logExpanded ? '收起' : '展开' }}</span>
            </div>
          </div>
          <div class="mt-5 md:max-h-40 md:overflow-y-auto" :class="logExpanded ? 'max-h-40 overflow-y-auto' : 'hidden md:block'">
            <p v-for="(log, i) in logs" :key="i" class="text-xs leading-relaxed mt-1" :class="{ 'text-muted': i > 0 }">
              {{ log }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 移动端底部导航 -->
    <nav class="mobile-nav flex md:hidden gap-2 items-center">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        class="btn text-xs shrink-0 py-1"
        :class="{ '!bg-accent !text-bg': currentPanel === tab.key }"
        @click="navigateToPanel(tab.key)"
      >
        <component :is="tab.icon" :size="14" />
        {{ tab.label }}
      </button>
    </nav>

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
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useGameStore } from '@/stores'
  import { useGameLog } from '@/composables/useGameLog'
  import { useDialogs } from '@/composables/useDialogs'
  import { TABS, navigateToPanel } from '@/composables/useNavigation'
  import { handleEndDay } from '@/composables/useEndDay'
  import { useAudio } from '@/composables/useAudio'
  import { Moon } from 'lucide-vue-next'
  import StatusBar from '@/components/game/StatusBar.vue'
  import FloatingText from '@/components/game/FloatingText.vue'
  import EventDialog from '@/components/game/EventDialog.vue'
  import HeartEventDialog from '@/components/game/HeartEventDialog.vue'
  import PerkSelectDialog from '@/components/game/PerkSelectDialog.vue'
  import FishingContestView from '@/components/game/FishingContestView.vue'
  import HarvestFairView from '@/components/game/HarvestFairView.vue'

  const router = useRouter()
  const route = useRoute()
  const gameStore = useGameStore()
  const { switchToSeasonalBgm } = useAudio()

  // 游戏未开始时重定向到主菜单
  if (!gameStore.isGameStarted) {
    router.replace('/')
  }

  const { logs } = useGameLog()
  const { currentEvent, pendingHeartEvent, currentFestival, pendingPerk, closeEvent, closeHeartEvent, closeFestival, handlePerkSelect } =
    useDialogs()

  /** 日志面板折叠状态 */
  const logExpanded = ref(true)

  /** 从路由名称获取当前面板标识 */
  const currentPanel = computed(() => {
    return (route.name as string) ?? 'farm'
  })

  const sleepLabel = computed(() => {
    if (gameStore.hour >= 24) return '倒头就睡'
    if (gameStore.hour >= 20) return '回家休息'
    return '休息'
  })

  const handleSleep = () => {
    handleEndDay()
    switchToSeasonalBgm()
  }
</script>
