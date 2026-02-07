<template>
  <div class="border-b border-accent/30 pb-2 md:pb-3 flex flex-col gap-1">
    <!-- 第一行：日期时间天气 + 金币 -->
    <div class="flex items-center justify-between text-xs md:text-sm">
      <div class="flex items-center gap-2 md:gap-3">
        <span class="text-accent font-bold">桃源乡</span>
        <span class="hidden md:inline">第{{ gameStore.year }}年</span>
        <span>{{ SEASON_NAMES[gameStore.season] }} 第{{ gameStore.day }}天</span>
        <span class="text-muted hidden md:inline">({{ gameStore.weekdayName }})</span>
        <span :class="{ 'text-danger': gameStore.isLateNight }">{{ gameStore.timeDisplay }}</span>
        <span class="text-muted">{{ WEATHER_NAMES[gameStore.weather] }}</span>
        <span class="text-muted/60 text-xs hidden md:inline">→{{ WEATHER_NAMES[gameStore.tomorrowWeather] }}</span>
      </div>
      <span class="text-accent shrink-0">
        <Coins :size="12" class="inline" />
        {{ playerStore.money }}文
      </span>
    </div>

    <!-- 第二行：状态条 + 音频控制 -->
    <div class="flex items-center justify-between text-xs flex-wrap gap-y-1">
      <div class="flex items-center gap-2 md:gap-4 flex-wrap gap-y-1">
        <!-- 体力 -->
        <div class="flex items-center gap-1">
          <span :class="{ 'text-danger stamina-critical': playerStore.isExhausted }">
            <Zap :size="12" class="inline" />
            {{ playerStore.stamina }}/{{ playerStore.maxStamina }}
          </span>
          <div class="w-14 md:w-20 h-2 bg-bg rounded-[2px] border border-accent/20">
            <div
              class="h-full rounded-[2px] transition-all duration-300"
              :class="staminaBarColor"
              :style="{ width: playerStore.staminaPercent + '%' }"
            />
          </div>
        </div>
        <!-- HP（矿洞或受伤时显示） -->
        <div v-if="showHpBar" class="flex items-center gap-1">
          <span :class="{ 'text-danger stamina-critical': playerStore.getIsLowHp() }">
            <Heart :size="12" class="inline" />
            {{ playerStore.hp }}/{{ playerStore.getMaxHp() }}
          </span>
          <div class="w-12 md:w-16 h-2 bg-bg rounded-[2px] border border-accent/20">
            <div
              class="h-full rounded-[2px] transition-all duration-300"
              :class="hpBarColor"
              :style="{ width: playerStore.getHpPercent() + '%' }"
            />
          </div>
        </div>
        <!-- 剩余时间 -->
        <div class="flex items-center gap-1">
          <Clock :size="12" class="text-muted" />
          <div class="w-12 md:w-16 h-2 bg-bg rounded-[2px] border border-accent/20">
            <div class="h-full rounded-[2px] transition-all duration-300" :class="timeBarColor" :style="{ width: timePercent + '%' }" />
          </div>
        </div>
      </div>
      <!-- 音频控制 -->
      <div class="flex items-center gap-1 shrink-0">
        <button class="!hidden btn btn-danger text-xs py-0 px-2 min-h-0 md:!flex" @click.stop="handleSleep">
          <Moon :size="12" />
          {{ sleepLabel }}
        </button>
        <button class="btn text-xs py-0 px-1 min-h-0" @click="toggleSfx">
          <Volume2 v-if="sfxEnabled" :size="14" />
          <VolumeX v-else :size="14" />
        </button>
        <button class="btn text-xs py-0 px-1 min-h-0" @click="toggleBgm">
          <Music :size="14" :class="{ 'opacity-30': !bgmEnabled }" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useGameStore, usePlayerStore, SEASON_NAMES, WEATHER_NAMES } from '@/stores'
  import { useAudio } from '@/composables/useAudio'
  import { handleEndDay } from '@/composables/useEndDay'
  import { DAY_START_HOUR, DAY_END_HOUR } from '@/data/timeConstants'
  import { Zap, Heart, Clock, Coins, Volume2, VolumeX, Music, Moon } from 'lucide-vue-next'

  const gameStore = useGameStore()
  const playerStore = usePlayerStore()
  const { sfxEnabled, bgmEnabled, toggleSfx, toggleBgm, switchToSeasonalBgm } = useAudio()

  const staminaBarColor = computed(() => {
    const pct = playerStore.staminaPercent
    if (pct <= 12) return 'bg-danger stamina-critical'
    if (pct <= 35) return 'bg-danger'
    if (pct <= 60) return 'bg-accent'
    return 'bg-success'
  })

  /** HP 条是否显示：在矿洞中或HP不满 */
  const showHpBar = computed(() => {
    return gameStore.currentLocationGroup === 'mine' || playerStore.hp < playerStore.getMaxHp()
  })

  const hpBarColor = computed(() => {
    const pct = playerStore.getHpPercent()
    if (pct <= 25) return 'bg-danger stamina-critical'
    if (pct <= 60) return 'bg-danger'
    return 'bg-success'
  })

  /** 剩余时间百分比 */
  const timePercent = computed(() => {
    const total = DAY_END_HOUR - DAY_START_HOUR // 20 hours
    const remaining = DAY_END_HOUR - gameStore.hour
    return Math.max(0, Math.round((remaining / total) * 100))
  })

  const timeBarColor = computed(() => {
    if (gameStore.isLateNight) return 'bg-danger'
    if (timePercent.value <= 25) return 'bg-danger'
    if (timePercent.value <= 50) return 'bg-accent'
    return 'bg-success'
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
