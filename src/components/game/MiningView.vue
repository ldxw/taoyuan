<template>
  <div>
    <h3 class="text-accent text-sm mb-3">
      <Mountain :size="14" class="inline" />
      云隐矿洞
      <span v-if="miningStore.isExploring" class="text-muted">— 第{{ miningStore.currentFloor }}层 ({{ zoneName }})</span>
    </h3>

    <!-- 未进入矿洞 -->
    <div v-if="!miningStore.isExploring">
      <p class="text-xs text-muted mb-2">安全点进度：{{ miningStore.safePointFloor > 0 ? `第${miningStore.safePointFloor}层` : '入口' }}</p>
      <button class="btn text-xs" @click="handleEnterMine">
        <Pickaxe :size="14" />
        进入矿洞
      </button>
    </div>

    <!-- 矿洞探索 -->
    <div v-else-if="!miningStore.inCombat">
      <div class="flex gap-2 flex-wrap mb-3">
        <button class="btn text-xs" :disabled="miningStore.floorOresCollected" @click="handleMineOre">
          <Gem :size="14" />
          {{ miningStore.floorOresCollected ? '已采完' : '采集矿石' }}
        </button>
        <button
          v-for="bombItem in availableBombs"
          :key="bombItem.id"
          class="btn text-xs"
          :disabled="miningStore.floorOresCollected"
          @click="handleUseBomb(bombItem.id)"
        >
          <Zap :size="14" />
          {{ bombItem.name }} (×{{ bombItem.count }})
        </button>
        <button class="btn text-xs" :disabled="miningStore.floorMonsterDefeated" @click="handleEncounter">
          <Search :size="14" />
          {{ miningStore.floorMonsterDefeated ? '已清除' : '搜索怪物' }}
        </button>
        <button class="btn text-xs" @click="handleNextFloor">
          <ChevronDown :size="14" />
          下一层
        </button>
        <button class="btn btn-danger text-xs" @click="handleLeave">
          <LogOut :size="14" />
          离开矿洞
        </button>
      </div>

      <div class="text-xs text-muted space-y-1">
        <p v-for="(msg, i) in recentLog" :key="i" :class="{ 'text-text': i === 0 }">{{ msg }}</p>
      </div>
    </div>

    <!-- 战斗中 -->
    <div v-else>
      <!-- 玩家 HP -->
      <div class="game-panel mb-3">
        <p class="text-xs mb-1">你的 HP: {{ playerStore.hp }}/{{ playerStore.getMaxHp() }}</p>
        <div class="bg-bg rounded-[2px] h-2">
          <div
            class="h-2 bg-success rounded-[2px] transition-all"
            :class="{ 'bg-danger': playerStore.getIsLowHp() }"
            :style="{ width: `${playerStore.getHpPercent()}%` }"
          />
        </div>
      </div>
      <!-- 怪物 HP -->
      <div class="game-panel mb-3">
        <p class="text-xs mb-1">
          <span class="text-danger">{{ miningStore.combatMonster?.name }}</span>
          — HP: {{ miningStore.combatMonsterHp }}/{{ miningStore.combatMonster?.hp }}
        </p>
        <div class="bg-bg rounded-[2px] h-2">
          <div
            class="h-2 bg-danger rounded-[2px] transition-all"
            :style="{ width: `${miningStore.combatMonster ? (miningStore.combatMonsterHp / miningStore.combatMonster.hp) * 100 : 0}%` }"
          />
        </div>
      </div>

      <div class="flex gap-2 mb-3">
        <button class="btn text-xs" @click="handleCombat('attack')">
          <Swords :size="14" />
          攻击
        </button>
        <button class="btn text-xs" @click="handleCombat('defend')">
          <Shield :size="14" />
          防御
        </button>
        <button class="btn btn-danger text-xs" @click="handleCombat('flee')">
          <MoveRight :size="14" />
          逃跑
        </button>
      </div>

      <div class="text-xs space-y-1">
        <p v-for="(msg, i) in miningStore.combatLog.slice().reverse()" :key="i" :class="{ 'text-muted': i > 0 }">{{ msg }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { Mountain, Pickaxe, Gem, Zap, Search, ChevronDown, LogOut, Swords, Shield, MoveRight } from 'lucide-vue-next'
  import { useMiningStore, useGameStore, usePlayerStore, useInventoryStore } from '@/stores'
  import { ZONE_NAMES, getFloor } from '@/data'
  import { ACTION_TIME_COSTS } from '@/data/timeConstants'
  import { BOMBS } from '@/data/processing'
  import type { CombatAction } from '@/types'
  import { sfxMine, sfxAttack, sfxHurt, sfxClick } from '@/composables/useAudio'
  import { useAudio } from '@/composables/useAudio'
  import { addLog } from '@/composables/useGameLog'
  import { handleEndDay } from '@/composables/useEndDay'

  const miningStore = useMiningStore()
  const gameStore = useGameStore()
  const playerStore = usePlayerStore()
  const inventoryStore = useInventoryStore()
  const { startBattleBgm, resumeNormalBgm } = useAudio()
  const exploreLog = ref<string[]>([])

  const recentLog = computed(() => exploreLog.value.slice(-8).reverse())

  const availableBombs = computed(() => {
    return BOMBS.map(b => ({ id: b.id, name: b.name, count: inventoryStore.getItemCount(b.id) })).filter(b => b.count > 0)
  })

  const zoneName = computed(() => {
    const floor = getFloor(miningStore.currentFloor)
    return floor ? ZONE_NAMES[floor.zone] : ''
  })

  const handleEnterMine = () => {
    const msg = miningStore.enterMine()
    exploreLog.value = [msg]
    sfxClick()
    addLog(msg)
  }

  const handleMineOre = () => {
    if (gameStore.isPastBedtime) {
      addLog('太晚了，没法继续挖矿了。')
      handleEndDay()
      return
    }
    const result = miningStore.mineOre()
    sfxMine()
    exploreLog.value.push(result.message)
    addLog(result.message)
    const tr = gameStore.advanceTime(ACTION_TIME_COSTS.mineOre)
    if (tr.message) addLog(tr.message)
    if (tr.passedOut) handleEndDay()
  }

  const handleUseBomb = (bombId: string) => {
    if (gameStore.isPastBedtime) {
      addLog('太晚了，没法继续了。')
      handleEndDay()
      return
    }
    const result = miningStore.useBomb(bombId)
    if (result.success) sfxMine()
    exploreLog.value.push(result.message)
    addLog(result.message)
    if (result.success) {
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.mineOre)
      if (tr.message) {
        exploreLog.value.push(tr.message)
        addLog(tr.message)
      }
      if (tr.passedOut) handleEndDay()
    }
  }

  const handleEncounter = () => {
    if (gameStore.isPastBedtime) {
      addLog('太晚了，该回去了。')
      handleEndDay()
      return
    }
    const result = miningStore.encounterMonster()
    if (result.found) {
      startBattleBgm()
      addLog(result.message)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.combat)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) handleEndDay()
    } else {
      exploreLog.value.push(result.message)
    }
  }

  const handleCombat = (action: CombatAction) => {
    const result = miningStore.combatAction(action)
    if (action === 'attack') sfxAttack()
    if (result.message.includes('受到')) sfxHurt()
    addLog(result.message)
    if (result.combatOver) {
      resumeNormalBgm()
      if (!miningStore.isExploring) {
        exploreLog.value.push(result.message)
      }
    }
  }

  const handleNextFloor = () => {
    if (gameStore.isPastBedtime) {
      addLog('太晚了，该回去了。')
      handleEndDay()
      return
    }
    const result = miningStore.goNextFloor()
    exploreLog.value.push(result.message)
    addLog(result.message)
    const tr = gameStore.advanceTime(ACTION_TIME_COSTS.nextFloor)
    if (tr.message) addLog(tr.message)
    if (tr.passedOut) handleEndDay()
  }

  const handleLeave = () => {
    if (miningStore.inCombat) resumeNormalBgm()
    const msg = miningStore.leaveMine()
    exploreLog.value = []
    addLog(msg)
  }
</script>
