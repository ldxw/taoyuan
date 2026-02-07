<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-8 px-4" @click.once="startBgm">
    <!-- 标题 -->
    <div class="text-center">
      <div class="logo" />
      <h1 class="text-accent mb-2 text-2xl md:text-4xl tracking-widest">桃源乡</h1>
      <p class="text-muted text-sm">—— 文字田园物语 ——</p>
    </div>

    <!-- 主菜单 -->
    <template v-if="!showFarmSelect">
      <div class="flex flex-col gap-3 w-full md:w-100">
        <button class="btn text-center justify-center text-lg py-3" @click="showFarmSelect = true">
          <Play :size="14" />
          新的旅程
        </button>

        <!-- 存档列表 -->
        <div v-for="info in slots" :key="info.slot" class="w-full">
          <div v-if="info.exists" class="flex gap-1 w-full">
            <button class="btn flex-1 justify-between" @click="handleLoadGame(info.slot)">
              <span>
                <FolderOpen :size="14" class="inline" />
                存档 {{ info.slot + 1 }}
              </span>
              <span class="text-muted text-xs">
                第{{ info.year }}年 {{ SEASON_NAMES[info.season as keyof typeof SEASON_NAMES] }} 第{{ info.day }}天 · {{ info.money }}文
              </span>
            </button>
            <button class="btn px-2 text-xs" @click="handleExportSlot(info.slot)" title="导出">
              <Download :size="12" />
            </button>
            <button class="btn btn-danger px-2 text-xs" @click="handleDeleteSlot(info.slot)" title="删除">
              <Trash2 :size="12" />
            </button>
          </div>
        </div>

        <!-- 导入存档 -->
        <button class="btn text-center justify-center text-sm" @click="triggerImport">
          <Upload :size="14" />
          导入存档
        </button>
        <input ref="fileInputRef" type="file" accept=".tyx" class="hidden" @change="handleImportFile" />
      </div>
    </template>

    <!-- 农场选择 -->
    <template v-else>
      <p class="text-muted text-sm">选择你的田庄类型</p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl w-full px-4">
        <button
          v-for="farm in FARM_MAP_DEFS"
          :key="farm.type"
          class="border rounded-lg p-4 text-left transition-all cursor-pointer"
          :class="selectedMap === farm.type ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'"
          @click="selectedMap = farm.type"
        >
          <div class="font-bold mb-1">{{ farm.name }}</div>
          <div class="text-muted text-xs mb-2">{{ farm.description }}</div>
          <div class="text-accent text-xs">{{ farm.bonus }}</div>
        </button>
      </div>

      <div class="flex gap-3">
        <button class="btn" @click="handleBackToMenu">
          <ArrowLeft :size="14" />
          返回
        </button>
        <button class="btn text-lg px-6" @click="handleNewGame">
          <Play :size="14" />
          开始旅程
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { Play, FolderOpen, ArrowLeft, Trash2, Download, Upload } from 'lucide-vue-next'
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useGameStore, useSaveStore, useFarmStore, useAnimalStore, SEASON_NAMES } from '@/stores'
  import { FARM_MAP_DEFS } from '@/data/farmMaps'
  import { useAudio } from '@/composables/useAudio'
  import type { FarmMapType } from '@/types'

  const router = useRouter()
  const { startBgm } = useAudio()

  const gameStore = useGameStore()
  const saveStore = useSaveStore()
  const farmStore = useFarmStore()
  const animalStore = useAnimalStore()

  const slots = ref(saveStore.getSlots())
  const showFarmSelect = ref(false)
  const selectedMap = ref<FarmMapType>('standard')

  const refreshSlots = () => {
    slots.value = saveStore.getSlots()
  }

  const handleBackToMenu = () => {
    showFarmSelect.value = false
    selectedMap.value = 'standard'
  }

  const handleNewGame = () => {
    // 分配空闲存档槽位
    const slot = saveStore.assignNewSlot()
    if (slot < 0) {
      alert('存档槽位已满，请先删除一个旧存档。')
      return
    }
    gameStore.startNewGame(selectedMap.value)
    // 标准农场初始6×6，其余4×4
    farmStore.resetFarm(selectedMap.value === 'standard' ? 6 : 4)
    // 草地农场：免费鸡舍 + 2只鸡
    if (selectedMap.value === 'meadowlands') {
      const coop = animalStore.buildings.find(b => b.type === 'coop')
      if (coop) coop.built = true
      animalStore.animals.push(
        {
          id: 'chicken_init_1',
          type: 'chicken',
          name: '小花',
          friendship: 100,
          mood: 200,
          daysOwned: 0,
          daysSinceProduct: 0,
          wasFed: false,
          wasPetted: false
        },
        {
          id: 'chicken_init_2',
          type: 'chicken',
          name: '小白',
          friendship: 100,
          mood: 200,
          daysOwned: 0,
          daysSinceProduct: 0,
          wasFed: false,
          wasPetted: false
        }
      )
    }
    router.push('/game')
  }

  const handleLoadGame = (slot: number) => {
    if (saveStore.loadFromSlot(slot)) {
      router.push('/game')
    }
  }

  const handleDeleteSlot = (slot: number) => {
    if (confirm(`确定删除存档 ${slot + 1}？此操作不可恢复。`)) {
      saveStore.deleteSlot(slot)
      refreshSlots()
    }
  }

  const handleExportSlot = (slot: number) => {
    if (!saveStore.exportSave(slot)) {
      alert('导出失败。')
    }
  }

  const fileInputRef = ref<HTMLInputElement | null>(null)

  const triggerImport = () => {
    fileInputRef.value?.click()
  }

  const handleImportFile = (e: Event) => {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const content = reader.result as string
      // 找到第一个空槽位导入，没有则提示
      const emptySlot = slots.value.find(s => !s.exists)
      if (!emptySlot) {
        alert('存档槽位已满，请先删除一个旧存档。')
      } else if (saveStore.importSave(emptySlot.slot, content)) {
        refreshSlots()
        alert(`已导入到存档 ${emptySlot.slot + 1}。`)
      } else {
        alert('存档文件无效或已损坏。')
      }
      input.value = ''
    }
    reader.readAsText(file)
  }
</script>

<style scoped>
  .logo {
    width: 96px;
    height: 96px;
    margin: 0 auto 8px;
    background: url(@/assets/logo.png) center / contain no-repeat;
    image-rendering: pixelated;
  }

  @media (min-width: 768px) {
    .logo {
      width: 128px;
      height: 128px;
      margin-bottom: 12px;
    }
  }
</style>
