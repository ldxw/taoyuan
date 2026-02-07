<template>
  <div>
    <h3 class="text-accent text-sm mb-3">农舍</h3>

    <!-- 农舍升级 -->
    <div class="border border-accent/20 rounded-[2px] p-3 mb-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-accent">{{ homeStore.farmhouseName }}</span>
        <span class="text-xs text-muted">等级 {{ homeStore.farmhouseLevel }}</span>
      </div>
      <p class="text-xs text-muted mb-2">{{ currentBenefit }}</p>
      <div v-if="homeStore.nextUpgrade" class="flex items-center justify-between border-t border-accent/10 pt-2">
        <div>
          <span class="text-xs">升级为「{{ homeStore.nextUpgrade.name }}」</span>
          <span class="text-xs text-muted ml-2">{{ homeStore.nextUpgrade.description }}</span>
        </div>
        <button class="btn text-xs" @click="handleUpgrade">
          <ArrowUp :size="14" />
          {{ homeStore.nextUpgrade.cost }}文
        </button>
      </div>
      <div v-if="homeStore.nextUpgrade" class="text-xs text-muted mt-1">
        需要：{{ homeStore.nextUpgrade.materialCost.map(m => `${getItemName(m.itemId)}×${m.quantity}`).join('、') }}
      </div>
    </div>

    <!-- 山洞 -->
    <div class="border border-accent/20 rounded-[2px] p-3 mb-4">
      <span class="text-sm text-accent">
        <Mountain :size="14" class="inline" />
        山洞
      </span>
      <div v-if="!homeStore.caveUnlocked" class="mt-2">
        <p class="text-xs text-muted">山洞尚未开放。（累计收入达到一定额度后自动开放）</p>
      </div>
      <div v-else-if="homeStore.caveChoice === 'none'" class="mt-2">
        <p class="text-xs text-muted mb-2">选择山洞用途（选定后不可更改）：</p>
        <div class="flex gap-2">
          <button class="btn text-xs" @click="handleChooseCave('mushroom')">
            <Gem :size="14" />
            蘑菇洞 (每天60%概率产蘑菇)
          </button>
          <button class="btn text-xs" @click="handleChooseCave('fruit_bat')">
            <Gem :size="14" />
            蝙蝠洞 (每天50%概率产水果)
          </button>
        </div>
      </div>
      <div v-else class="mt-2">
        <p class="text-xs">
          {{ homeStore.caveChoice === 'mushroom' ? '蘑菇洞 — 每天有概率产出野蘑菇。' : '蝙蝠洞 — 每天有概率产出各季水果。' }}
        </p>
      </div>
    </div>

    <!-- 温室 -->
    <div class="border border-accent/20 rounded-[2px] p-3 mb-4">
      <span class="text-sm text-accent">
        <Leaf :size="14" class="inline" />
        温室
      </span>
      <div v-if="!homeStore.greenhouseUnlocked" class="mt-2">
        <p class="text-xs text-muted mb-2">解锁温室后可在任何季节种植作物，作物自动浇水。</p>
        <button class="btn text-xs" @click="handleUnlockGreenhouse">
          <Unlock :size="14" />
          解锁温室 ({{ GREENHOUSE_UNLOCK_COST }}文 + 材料)
        </button>
      </div>
      <div v-else class="mt-2">
        <p class="text-xs text-success">温室已开放。可在农场面板中切换至温室进行种植。</p>
      </div>
    </div>

    <!-- 子女 -->
    <div v-if="npcStore.getSpouse()" class="border border-accent/20 rounded-[2px] p-3 mb-4">
      <span class="text-sm text-accent">
        <Users :size="14" class="inline" />
        家人
      </span>
      <div v-if="npcStore.children.length === 0 && !npcStore.pendingChild" class="mt-2">
        <p class="text-xs text-muted">婚后生活安稳，也许将来会有小生命到来。</p>
      </div>
      <div v-if="npcStore.pendingChild" class="mt-2">
        <p class="text-xs text-success">新生命即将到来……（{{ npcStore.childCountdown }}天后）</p>
      </div>
      <div v-if="npcStore.children.length > 0" class="mt-2 flex flex-col gap-2">
        <div v-for="child in npcStore.children" :key="child.id" class="flex items-center gap-3">
          <span class="text-xs w-10">{{ child.name }}</span>
          <span class="text-xs text-muted w-10">{{ CHILD_STAGE_NAMES[child.stage] }}</span>
          <span class="text-xs text-muted">{{ child.daysOld }}天</span>
          <div v-if="child.stage !== 'baby'" class="flex gap-0.5">
            <span v-for="h in 10" :key="h" class="text-xs" :class="child.friendship >= h * 30 ? 'text-danger' : 'text-muted/30'">
              &#x2665;
            </span>
          </div>
          <button
            v-if="child.stage !== 'baby' && !child.interactedToday"
            class="btn text-xs py-0 px-1"
            @click="handleInteractChild(child.id)"
          >
            <Heart :size="14" />
            互动
          </button>
          <span v-else-if="child.stage !== 'baby' && child.interactedToday" class="text-xs text-muted">今日已互动</span>
          <span v-else-if="child.stage === 'baby'" class="text-xs text-muted">还太小了</span>
        </div>
      </div>
    </div>

    <!-- 酒窖 -->
    <div v-if="homeStore.hasCellar" class="border border-accent/20 rounded-[2px] p-3">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-accent">酒窖</span>
        <span class="text-xs text-muted">{{ homeStore.cellarSlots.length }}/6</span>
      </div>
      <p class="text-xs text-muted mb-2">放入酒类陈酿14天可提升一档品质。</p>

      <!-- 陈酿中的酒 -->
      <div v-for="(slot, idx) in homeStore.cellarSlots" :key="idx" class="flex items-center gap-2 py-1 border-t border-accent/10">
        <span class="text-xs w-20">{{ getItemName(slot.itemId) }}</span>
        <span class="text-xs text-muted w-10">{{ QUALITY_NAMES[slot.quality] }}</span>
        <div class="flex-1 h-1.5 bg-bg rounded-[2px] border border-accent/10">
          <div
            class="h-full rounded-[2px] bg-accent transition-all"
            :style="{ width: Math.min(100, Math.floor((slot.daysAging / 14) * 100)) + '%' }"
          />
        </div>
        <span class="text-xs text-muted">{{ slot.daysAging }}/14天</span>
        <button class="btn text-xs py-0 px-1" @click="handleRemoveAging(idx)">取出</button>
      </div>

      <!-- 放入新酒 -->
      <div v-if="homeStore.cellarSlots.length < 6 && ageableInInventory.length > 0" class="mt-2 border-t border-accent/10 pt-2">
        <p class="text-xs text-muted mb-1">放入陈酿：</p>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="item in ageableInInventory"
            :key="item.itemId + item.quality"
            class="btn text-xs"
            @click="handleStartAging(item.itemId, item.quality)"
          >
            {{ getItemName(item.itemId) }}({{ QUALITY_NAMES[item.quality] }})
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { ArrowUp, Mountain, Gem, Unlock, Heart, Leaf, Users } from 'lucide-vue-next'
  import { useHomeStore, useInventoryStore, useNpcStore } from '@/stores'
  import { getItemById } from '@/data'
  import { GREENHOUSE_UNLOCK_COST } from '@/data/buildings'
  import { ACTION_TIME_COSTS } from '@/data/timeConstants'
  import { useGameStore } from '@/stores'
  import type { Quality } from '@/types'
  import type { ChildStage } from '@/types'
  import { addLog } from '@/composables/useGameLog'
  import { handleEndDay } from '@/composables/useEndDay'

  const homeStore = useHomeStore()
  const inventoryStore = useInventoryStore()
  const gameStore = useGameStore()
  const npcStore = useNpcStore()

  const QUALITY_NAMES: Record<Quality, string> = {
    normal: '普通',
    fine: '优良',
    excellent: '精品',
    supreme: '极品'
  }

  const CHILD_STAGE_NAMES: Record<ChildStage, string> = {
    baby: '婴儿',
    toddler: '幼儿',
    child: '孩童',
    teen: '少年'
  }

  const handleInteractChild = (childId: number) => {
    const result = npcStore.interactWithChild(childId)
    if (result) {
      addLog(result.message)
      if (result.item) {
        inventoryStore.addItem(result.item)
        const itemDef = getItemById(result.item)
        addLog(`获得了${itemDef?.name ?? result.item}！`)
      }
    }
  }

  const AGEABLE_ITEMS = ['watermelon_wine', 'osmanthus_wine', 'peach_wine', 'jujube_wine', 'corn_wine', 'rice_vinegar']

  const currentBenefit = computed(() => {
    switch (homeStore.farmhouseLevel) {
      case 0:
        return '简陋的茅屋。'
      case 1:
        return '厨房升级，烹饪恢复+20%。'
      case 2:
        return '宅院扩建，每晚额外恢复10%体力。'
      case 3:
        return '地下酒窖开放，可陈酿美酒提升品质。'
      default:
        return ''
    }
  })

  const ageableInInventory = computed(() => {
    return inventoryStore.items.filter(inv => AGEABLE_ITEMS.includes(inv.itemId) && inv.quality !== 'supreme')
  })

  const getItemName = (itemId: string): string => {
    return getItemById(itemId)?.name ?? itemId
  }

  const handleUpgrade = () => {
    const upgrade = homeStore.nextUpgrade
    if (!upgrade) return
    if (homeStore.upgradeFarmhouse()) {
      addLog(`农舍升级为「${upgrade.name}」！${upgrade.description}`)
    } else {
      addLog('金币或材料不足，无法升级。')
    }
  }

  const handleChooseCave = (choice: 'mushroom' | 'fruit_bat') => {
    if (homeStore.chooseCave(choice)) {
      const name = choice === 'mushroom' ? '蘑菇洞' : '蝙蝠洞'
      addLog(`选择了${name}，每天会有被动产出。`)
    }
  }

  const handleUnlockGreenhouse = () => {
    if (homeStore.unlockGreenhouse()) {
      addLog('温室已解锁！可在农场面板中切换至温室进行种植。')
    } else {
      addLog('金币或材料不足，无法解锁温室。')
    }
  }

  const handleStartAging = (itemId: string, quality: Quality) => {
    if (homeStore.startAging(itemId, quality)) {
      const name = getItemName(itemId)
      addLog(`将${name}放入酒窖陈酿。`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.aging)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) handleEndDay()
    } else {
      addLog('无法放入酒窖（已满或物品不可陈酿）。')
    }
  }

  const handleRemoveAging = (index: number) => {
    const result = homeStore.removeAging(index)
    if (result) {
      inventoryStore.addItem(result.itemId, 1, result.quality)
      const name = getItemName(result.itemId)
      addLog(`从酒窖取出了${name}。`)
    }
  }
</script>
