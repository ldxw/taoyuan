<template>
  <div class="game-panel">
    <h3 class="text-accent text-sm mb-3">钓鱼大赛</h3>

    <!-- 比赛进行中 -->
    <div v-if="!finished">
      <p class="text-xs text-muted mb-2">第 {{ currentRound }} / 3 轮</p>

      <!-- 已钓到的鱼 -->
      <div v-if="catches.length > 0" class="mb-3">
        <p class="text-xs text-muted mb-1">你的收获：</p>
        <div v-for="(c, i) in catches" :key="i" class="text-xs mb-0.5">
          <span class="text-accent">{{ c.name }}</span>
          <span class="text-muted ml-1">{{ c.weight }}斤 (+{{ c.score }}分)</span>
        </div>
      </div>

      <p class="text-xs mb-3">
        当前总分：
        <span class="text-accent">{{ playerTotal }}</span>
        分
      </p>

      <button class="btn text-xs" @click="handleCast">下竿！</button>
    </div>

    <!-- 比赛结束 -->
    <div v-else>
      <p class="text-xs text-muted mb-3">比赛结束！以下是最终排名：</p>

      <div class="mb-3">
        <div
          v-for="(entry, i) in rankings"
          :key="entry.name"
          class="flex items-center justify-between text-xs py-1 border-b border-accent/10 last:border-0"
        >
          <div>
            <span
              class="mr-2"
              :class="{
                'text-accent': i === 0,
                'text-success': entry.name === '你'
              }"
            >
              第{{ i + 1 }}名
            </span>
            <span :class="{ 'text-success': entry.name === '你' }">{{ entry.name }}</span>
          </div>
          <span class="text-muted">{{ entry.score }} 分</span>
        </div>
      </div>

      <div class="mb-3 text-xs">
        <span v-if="playerRank === 1" class="text-accent">恭喜你获得冠军！奖金 500文</span>
        <span v-else-if="playerRank === 2" class="text-success">你获得了亚军！奖金 200文</span>
        <span v-else-if="playerRank === 3" class="text-success">你获得了季军！奖金 100文</span>
        <span v-else class="text-muted">很遗憾，没有获得名次。下次再努力吧！</span>
      </div>

      <button class="btn text-xs" @click="handleClaim">领取奖励</button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'

  const emit = defineEmits<{
    complete: [prize: number]
  }>()

  /** 鱼池：可随机钓到的鱼 */
  const FISH_POOL = [
    { name: '鲫鱼', minWeight: 0.5, maxWeight: 2.0, baseScore: 10 },
    { name: '鲤鱼', minWeight: 1.0, maxWeight: 4.0, baseScore: 20 },
    { name: '草鱼', minWeight: 2.0, maxWeight: 6.0, baseScore: 30 },
    { name: '鲈鱼', minWeight: 1.5, maxWeight: 5.0, baseScore: 40 },
    { name: '鲶鱼', minWeight: 2.0, maxWeight: 7.0, baseScore: 35 },
    { name: '桂花鱼', minWeight: 1.0, maxWeight: 3.5, baseScore: 50 },
    { name: '锦鲤', minWeight: 1.5, maxWeight: 4.5, baseScore: 60 },
    { name: '鲟鱼', minWeight: 3.0, maxWeight: 10.0, baseScore: 70 }
  ]

  interface CatchRecord {
    name: string
    weight: number
    score: number
  }

  interface Participant {
    name: string
    score: number
  }

  const currentRound = ref(1)
  const catches = ref<CatchRecord[]>([])
  const finished = ref(false)
  const rankings = ref<Participant[]>([])

  const playerTotal = computed(() => catches.value.reduce((sum, c) => sum + c.score, 0))

  const playerRank = computed(() => {
    const idx = rankings.value.findIndex(e => e.name === '你')
    return idx === -1 ? 99 : idx + 1
  })

  /** 随机生成一条鱼 */
  const randomCatch = (): CatchRecord => {
    const fish = FISH_POOL[Math.floor(Math.random() * FISH_POOL.length)]!
    const weight = +(fish.minWeight + Math.random() * (fish.maxWeight - fish.minWeight)).toFixed(1)
    const score = Math.round(fish.baseScore * (weight / fish.minWeight))
    return { name: fish.name, weight, score }
  }

  /** 生成NPC分数 */
  const generateNpcScore = (name: string): Participant => {
    // 每位NPC模拟3轮钓鱼
    let total = 0
    for (let i = 0; i < 3; i++) {
      const c = randomCatch()
      total += c.score
    }
    return { name, score: total }
  }

  const handleCast = () => {
    const c = randomCatch()
    catches.value.push(c)

    if (currentRound.value >= 3) {
      // 比赛结束，生成NPC结果并排名
      const npcs = [generateNpcScore('秋月'), generateNpcScore('陈伯'), generateNpcScore('小满')]
      const player: Participant = { name: '你', score: playerTotal.value }
      const all = [...npcs, player]
      all.sort((a, b) => b.score - a.score)
      rankings.value = all
      finished.value = true
    } else {
      currentRound.value++
    }
  }

  const handleClaim = () => {
    const prizes: Record<number, number> = { 1: 500, 2: 200, 3: 100 }
    const prize = prizes[playerRank.value] ?? 0
    emit('complete', prize)
  }
</script>
