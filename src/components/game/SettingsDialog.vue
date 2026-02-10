<template>
  <Transition name="panel-fade">
    <div v-if="open" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
      <div class="game-panel w-full max-w-xs text-center relative">
        <button class="absolute top-2 right-2 text-muted hover:text-text" @click="$emit('close')">
          <X :size="14" />
        </button>
        <p class="text-accent text-sm mb-4">—— 设置 ——</p>

        <div class="flex flex-col gap-3">
          <!-- 时间控制 -->
          <div class="border border-accent/20 rounded-xs p-3">
            <p class="text-xs text-muted mb-2">时间控制</p>
            <div class="flex items-center justify-center gap-2">
              <button class="btn text-xs py-1 px-3" @click="togglePause">
                <Pause v-if="!isPaused" :size="12" />
                <Play v-else :size="12" />
                {{ isPaused ? '继续' : '暂停' }}
              </button>
              <button class="btn text-xs py-1 px-3" @click="cycleSpeed">速度 {{ gameSpeed }}×</button>
            </div>
          </div>

          <!-- 音频控制 -->
          <div class="border border-accent/20 rounded-xs p-3">
            <p class="text-xs text-muted mb-2">音频</p>
            <div class="flex items-center justify-center gap-2">
              <button class="btn text-xs py-1 px-3" @click="toggleSfx">
                <Volume2 v-if="sfxEnabled" :size="12" />
                <VolumeX v-else :size="12" />
                音效
              </button>
              <button class="btn text-xs py-1 px-3" @click="toggleBgm">
                <Headphones v-if="bgmEnabled" :size="12" />
                <HeadphoneOff v-else :size="12" />
                音乐
              </button>
            </div>
          </div>
          <!-- 字体大小 -->
          <div class="border border-accent/20 rounded-xs p-3">
            <p class="text-xs text-muted mb-2">字体大小</p>
            <div class="flex items-center justify-center gap-3">
              <button class="btn text-xs py-1 px-3" :disabled="settingsStore.fontSize <= 12" @click="settingsStore.changeFontSize(-1)">
                <Minus :size="12" />
              </button>
              <span class="text-sm w-8 text-center">{{ settingsStore.fontSize }}</span>
              <button class="btn text-xs py-1 px-3" :disabled="settingsStore.fontSize >= 24" @click="settingsStore.changeFontSize(1)">
                <Plus :size="12" />
              </button>
            </div>
          </div>

          <!-- 配色主题 -->
          <div class="border border-accent/20 rounded-xs p-3">
            <p class="text-xs text-muted mb-2">配色主题</p>
            <div class="flex items-center justify-center gap-2">
              <button
                v-for="t in THEMES"
                :key="t.key"
                class="w-8 h-8 border rounded-xs flex items-center justify-center text-[10px] transition-colors"
                :class="settingsStore.theme === t.key ? 'border-accent' : 'border-accent/20'"
                :style="{ backgroundColor: t.bg, color: t.text }"
                :title="t.name"
                @click="settingsStore.changeTheme(t.key)"
              >
                {{ t.name.charAt(0) }}
              </button>
            </div>
          </div>

          <!-- 存档管理 -->
          <button class="btn text-xs py-1 px-3 w-full justify-center" @click="showSaveManager = true">
            <FolderOpen :size="12" />
            存档管理
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- 存档管理弹窗 -->
  <Transition name="panel-fade">
    <SaveManager v-if="showSaveManager" @close="showSaveManager = false" />
  </Transition>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { X, Pause, Play, Volume2, VolumeX, Headphones, HeadphoneOff, FolderOpen, Minus, Plus } from 'lucide-vue-next'
  import { useAudio } from '@/composables/useAudio'
  import { useGameClock } from '@/composables/useGameClock'
  import { useSettingsStore } from '@/stores/useSettingsStore'
  import { THEMES } from '@/data/themes'
  import SaveManager from '@/components/game/SaveManager.vue'

  defineProps<{ open: boolean }>()
  defineEmits<{ close: [] }>()

  const { sfxEnabled, bgmEnabled, toggleSfx, toggleBgm } = useAudio()
  const { isPaused, gameSpeed, togglePause, cycleSpeed } = useGameClock()
  const settingsStore = useSettingsStore()

  const showSaveManager = ref(false)
</script>
