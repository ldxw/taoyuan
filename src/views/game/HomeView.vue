<template>
  <div>
    <h3 class="text-accent text-sm mb-3">
      <Home :size="14" class="inline" />
      农舍
    </h3>

    <!-- 农舍升级 -->
    <div class="border border-accent/20 rounded-xs p-3 mb-4">
      <div class="flex items-center justify-between mb-1">
        <span class="text-sm text-accent">{{ homeStore.farmhouseName }}</span>
        <span class="text-xs text-muted">等级 {{ homeStore.farmhouseLevel }}</span>
      </div>
      <p class="text-xs text-muted mb-2">{{ currentBenefit }}</p>
      <div
        v-if="homeStore.nextUpgrade"
        class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
        @click="showUpgradeModal = true"
      >
        <span class="text-xs">升级为「{{ homeStore.nextUpgrade.name }}」</span>
        <span class="text-xs text-accent whitespace-nowrap">{{ homeStore.nextUpgrade.cost }}文</span>
      </div>
    </div>

    <!-- 山洞 -->
    <div class="border border-accent/20 rounded-xs p-3 mb-4">
      <p class="text-sm text-accent mb-2">
        <Mountain :size="14" class="inline" />
        山洞
      </p>
      <div v-if="!homeStore.caveUnlocked">
        <p class="text-xs text-muted">山洞尚未开放。（累计收入达到一定额度后自动开放）</p>
      </div>
      <div v-else-if="homeStore.caveChoice === 'none'">
        <p class="text-xs text-muted mb-2">选择山洞用途（选定后不可更改）：</p>
        <div class="flex flex-col gap-1">
          <div
            class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
            @click="handleChooseCave('mushroom')"
          >
            <span class="text-xs">蘑菇洞</span>
            <span class="text-xs text-muted">每天60%概率产蘑菇</span>
          </div>
          <div
            class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
            @click="handleChooseCave('fruit_bat')"
          >
            <span class="text-xs">蝙蝠洞</span>
            <span class="text-xs text-muted">每天50%概率产水果</span>
          </div>
        </div>
      </div>
      <div v-else>
        <p class="text-xs">
          {{ homeStore.caveChoice === 'mushroom' ? '蘑菇洞 — 每天有概率产出野蘑菇。' : '蝙蝠洞 — 每天有概率产出各季水果。' }}
        </p>
      </div>
    </div>

    <!-- 温室 -->
    <div class="border border-accent/20 rounded-xs p-3 mb-4">
      <p class="text-sm text-accent mb-2">
        <Leaf :size="14" class="inline" />
        温室
      </p>
      <div v-if="!homeStore.greenhouseUnlocked">
        <p class="text-xs text-muted mb-2">解锁温室后可在任何季节种植作物，作物自动浇水。</p>
        <div
          class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
          @click="showGreenhouseModal = true"
        >
          <span class="text-xs">解锁温室</span>
          <span class="text-xs text-accent whitespace-nowrap">{{ GREENHOUSE_UNLOCK_COST }}文</span>
        </div>
      </div>
      <div v-else>
        <p class="text-xs text-success">温室已开放。可在农场面板中切换至温室进行种植。</p>
      </div>
    </div>

    <!-- 仓库 -->
    <div class="border border-accent/20 rounded-xs p-3 mb-4">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm text-accent">
          <Warehouse :size="14" class="inline" />
          仓库
        </p>
        <span v-if="warehouseStore.unlocked" class="text-xs text-muted">{{ warehouseStore.items.length }}/{{ warehouseStore.capacity }}</span>
      </div>

      <!-- 未解锁 -->
      <div v-if="!warehouseStore.unlocked">
        <p class="text-xs text-muted mb-2">解锁仓库后可额外存放物品，容量独立于背包。</p>
        <div
          class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
          @click="showWarehouseUnlockModal = true"
        >
          <span class="text-xs">解锁仓库</span>
          <span class="text-xs text-accent whitespace-nowrap">{{ warehouseStore.UNLOCK_COST }}文</span>
        </div>
      </div>

      <!-- 已解锁 -->
      <template v-else>
        <!-- 仓库物品列表 -->
        <div v-if="warehouseStore.items.length > 0" class="flex flex-col gap-1 mb-2 max-h-36 overflow-y-auto">
          <div
            v-for="(item, idx) in warehouseStore.items"
            :key="idx"
            class="flex items-center justify-between border border-accent/10 rounded-xs px-2 py-1"
          >
            <span class="text-xs truncate mr-2" :class="qualityTextClass(item.quality)">
              {{ getItemName(item.itemId) }}
              <span v-if="item.quality !== 'normal'" class="text-[10px]">({{ QUALITY_LABEL[item.quality] }})</span>
            </span>
            <div class="flex items-center gap-1.5">
              <span class="text-xs text-muted">&times;{{ item.quantity }}</span>
              <button class="btn text-xs py-0 px-1" @click="handleWithdraw(item.itemId, item.quality)">取出</button>
            </div>
          </div>
        </div>
        <div v-else class="flex flex-col items-center justify-center py-4 text-muted mb-2">
          <Warehouse :size="24" />
          <p class="text-xs mt-1">仓库空空如也</p>
        </div>

        <!-- 存入按钮 -->
        <button v-if="depositableItems.length > 0" class="btn text-xs" @click="showDepositModal = true">
          <ArrowDown :size="12" />
          存入物品
        </button>
      </template>
    </div>

    <!-- 子女 -->
    <div v-if="npcStore.getSpouse()" class="border border-accent/20 rounded-xs p-3 mb-4">
      <p class="text-sm text-accent mb-2">
        <Users :size="14" class="inline" />
        家人
      </p>
      <div v-if="npcStore.children.length === 0 && !npcStore.pendingChild">
        <div class="flex flex-col items-center justify-center py-6 text-muted">
          <Users :size="32" class="mb-2" />
          <p class="text-xs">婚后生活安稳，也许将来会有小生命到来。</p>
        </div>
      </div>
      <div v-if="npcStore.pendingChild" class="mb-2">
        <p class="text-xs text-success">新生命即将到来……（{{ npcStore.childCountdown }}天后）</p>
      </div>
      <div v-if="npcStore.children.length > 0" class="flex flex-col gap-1">
        <div v-for="child in npcStore.children" :key="child.id" class="border border-accent/10 rounded-xs p-2">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-accent">{{ child.name }}</span>
            <div class="flex items-center gap-1">
              <button
                v-if="child.stage !== 'baby' && !child.interactedToday"
                class="btn text-xs py-0 px-1"
                @click="handleInteractChild(child.id)"
              >
                <Heart :size="14" />
                互动
              </button>
              <span v-else-if="child.stage !== 'baby'" class="text-xs text-muted">已互动</span>
              <span v-else class="text-xs text-muted">还太小</span>
              <button class="btn text-xs py-0 px-1 text-danger" @click="releaseConfirmChildId = child.id">送走</button>
            </div>
          </div>
          <p class="text-[10px] text-muted mb-0.5">{{ CHILD_STAGE_NAMES[child.stage] }} · {{ child.daysOld }}天</p>
          <div v-if="child.stage !== 'baby'" class="flex gap-0.5">
            <span v-for="h in 10" :key="h" class="text-xs" :class="child.friendship >= h * 30 ? 'text-danger' : 'text-muted/30'">
              &#x2665;
            </span>
          </div>
        </div>
      </div>
      <!-- 送走子女确认 -->
      <div v-if="releaseConfirmChildId !== null" class="mt-2 game-panel border-danger/40">
        <p class="text-xs text-danger mb-2">确定将{{ getChildName(releaseConfirmChildId) }}送往远方亲戚家吗？（花费10000文）</p>
        <div class="flex gap-2">
          <button class="btn text-xs text-danger" @click="handleReleaseChild">确认</button>
          <button class="btn text-xs" @click="releaseConfirmChildId = null">取消</button>
        </div>
      </div>
    </div>

    <!-- 酒窖 -->
    <div v-if="homeStore.hasCellar" class="border border-accent/20 rounded-xs p-3">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-accent">酒窖</span>
        <span class="text-xs text-muted">{{ homeStore.cellarSlots.length }}/6</span>
      </div>
      <p class="text-xs text-muted mb-2">放入酒类陈酿14天可提升一档品质。</p>

      <!-- 陈酿中的酒 -->
      <div v-if="homeStore.cellarSlots.length > 0" class="flex flex-col gap-1 mb-3">
        <div v-for="(slot, idx) in homeStore.cellarSlots" :key="idx" class="border border-accent/10 rounded-xs p-2">
          <div class="flex items-center justify-between mb-1">
            <span
              class="text-xs"
              :class="{
                'text-quality-fine': slot.quality === 'fine',
                'text-quality-excellent': slot.quality === 'excellent',
                'text-quality-supreme': slot.quality === 'supreme',
                'text-accent': slot.quality === 'normal'
              }"
            >
              {{ getItemName(slot.itemId) }}
            </span>
            <button class="btn text-xs py-0 px-1" @click="handleRemoveAging(idx)">取出</button>
          </div>
          <div class="flex items-center gap-1">
            <span class="text-[10px] text-muted w-6">陈酿</span>
            <div class="flex-1 h-1.5 bg-bg rounded-xs border border-accent/10">
              <div
                class="h-full rounded-xs bg-accent transition-all"
                :style="{ width: Math.min(100, Math.floor((slot.daysAging / 14) * 100)) + '%' }"
              />
            </div>
            <span class="text-[10px] text-muted">{{ slot.daysAging }}/14天</span>
          </div>
        </div>
      </div>
      <div v-else class="flex flex-col items-center justify-center py-6 text-muted mb-3">
        <Gem :size="32" class="mb-2" />
        <p class="text-xs">酒窖空空如也</p>
      </div>

      <!-- 放入新酒 -->
      <button v-if="homeStore.cellarSlots.length < 6 && ageableInInventory.length > 0" class="btn text-xs" @click="showAgingModal = true">
        放入陈酿
      </button>
    </div>

    <!-- 升级农舍弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showUpgradeModal && homeStore.nextUpgrade"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="showUpgradeModal = false"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="showUpgradeModal = false">
            <X :size="14" />
          </button>

          <p class="text-sm text-accent mb-2">升级农舍</p>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs">升级为「{{ homeStore.nextUpgrade.name }}」</p>
            <p class="text-xs text-muted mt-0.5">{{ homeStore.nextUpgrade.description }}</p>
          </div>

          <div class="border border-accent/10 rounded-xs p-2 mb-2 space-y-1">
            <p class="text-xs text-muted mb-1">所需材料</p>
            <div v-for="mat in homeStore.nextUpgrade.materialCost" :key="mat.itemId" class="flex items-center justify-between">
              <span class="text-xs text-muted">{{ getItemName(mat.itemId) }}</span>
              <span class="text-xs" :class="inventoryStore.getItemCount(mat.itemId) >= mat.quantity ? '' : 'text-danger'">
                {{ inventoryStore.getItemCount(mat.itemId) }}/{{ mat.quantity }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">金币</span>
              <span class="text-xs" :class="playerStore.money >= homeStore.nextUpgrade.cost ? '' : 'text-danger'">
                {{ homeStore.nextUpgrade.cost }}文
              </span>
            </div>
          </div>

          <button
            class="btn text-xs w-full justify-center"
            :class="{ 'bg-accent! text-bg!': canUpgradeFarmhouse }"
            :disabled="!canUpgradeFarmhouse"
            @click="handleUpgradeFromModal"
          >
            <ArrowUp :size="12" />
            升级
          </button>
        </div>
      </div>
    </Transition>

    <!-- 解锁温室弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showGreenhouseModal"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="showGreenhouseModal = false"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="showGreenhouseModal = false">
            <X :size="14" />
          </button>

          <p class="text-sm text-accent mb-2">解锁温室</p>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs text-muted">解锁后可在任何季节种植作物，作物自动浇水。</p>
          </div>

          <div class="border border-accent/10 rounded-xs p-2 mb-2 space-y-1">
            <p class="text-xs text-muted mb-1">所需材料</p>
            <div v-for="mat in GREENHOUSE_MATERIAL_COST" :key="mat.itemId" class="flex items-center justify-between">
              <span class="text-xs text-muted">{{ getItemName(mat.itemId) }}</span>
              <span class="text-xs" :class="inventoryStore.getItemCount(mat.itemId) >= mat.quantity ? '' : 'text-danger'">
                {{ inventoryStore.getItemCount(mat.itemId) }}/{{ mat.quantity }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">金币</span>
              <span class="text-xs" :class="playerStore.money >= GREENHOUSE_UNLOCK_COST ? '' : 'text-danger'">
                {{ GREENHOUSE_UNLOCK_COST }}文
              </span>
            </div>
          </div>

          <button
            class="btn text-xs w-full justify-center"
            :class="{ 'bg-accent! text-bg!': canUnlockGreenhouse }"
            :disabled="!canUnlockGreenhouse"
            @click="handleUnlockFromModal"
          >
            <Unlock :size="12" />
            解锁
          </button>
        </div>
      </div>
    </Transition>

    <!-- 放入陈酿列表弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showAgingModal"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="showAgingModal = false"
      >
        <div class="game-panel max-w-xs w-full">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm text-accent">放入陈酿</p>
            <button class="btn text-xs py-0 px-1" @click="showAgingModal = false">
              <X :size="12" />
            </button>
          </div>
          <div class="flex flex-col gap-1">
            <div
              v-for="item in ageableInInventory"
              :key="item.itemId + item.quality"
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
              @click="handleStartAgingFromModal(item.itemId, item.quality)"
            >
              <span
                class="text-xs"
                :class="{
                  'text-quality-fine': item.quality === 'fine',
                  'text-quality-excellent': item.quality === 'excellent',
                  'text-quality-supreme': item.quality === 'supreme'
                }"
              >
                {{ getItemName(item.itemId) }}
              </span>
              <span class="text-xs text-muted">&times;{{ item.quantity }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 仓库存入弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showDepositModal"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="showDepositModal = false"
      >
        <div class="game-panel max-w-sm w-full">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm text-accent">存入仓库</p>
            <button class="btn text-xs py-0 px-1" @click="showDepositModal = false">
              <X :size="12" />
            </button>
          </div>
          <div class="flex flex-col gap-1 max-h-60 overflow-y-auto">
            <div
              v-for="item in depositableItems"
              :key="item.itemId + item.quality"
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
              @click="handleDeposit(item.itemId, item.quality)"
            >
              <span class="text-xs truncate mr-2" :class="qualityTextClass(item.quality)">
                {{ getItemName(item.itemId) }}
                <span v-if="item.quality !== 'normal'" class="text-[10px]">({{ QUALITY_LABEL[item.quality] }})</span>
              </span>
              <span class="text-xs text-muted">&times;{{ item.quantity }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 仓库解锁弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showWarehouseUnlockModal"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="showWarehouseUnlockModal = false"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="showWarehouseUnlockModal = false">
            <X :size="14" />
          </button>

          <p class="text-sm text-accent mb-2">解锁仓库</p>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs text-muted">独立于背包的额外存储空间，初始{{ warehouseStore.INITIAL_CAPACITY }}格，可在商店购买扩容。</p>
          </div>

          <div class="border border-accent/10 rounded-xs p-2 mb-2 space-y-1">
            <div v-for="mat in WAREHOUSE_UNLOCK_MATERIALS" :key="mat.itemId" class="flex items-center justify-between">
              <span class="text-xs text-muted">{{ getItemName(mat.itemId) }}</span>
              <span class="text-xs" :class="inventoryStore.getItemCount(mat.itemId) >= mat.quantity ? '' : 'text-danger'">
                {{ inventoryStore.getItemCount(mat.itemId) }}/{{ mat.quantity }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">金币</span>
              <span class="text-xs" :class="playerStore.money >= warehouseStore.UNLOCK_COST ? '' : 'text-danger'">
                {{ warehouseStore.UNLOCK_COST }}文
              </span>
            </div>
          </div>

          <button
            class="btn text-xs w-full justify-center"
            :class="{ 'bg-accent! text-bg!': canUnlockWarehouse }"
            :disabled="!canUnlockWarehouse"
            @click="handleUnlockWarehouse"
          >
            <Unlock :size="12" />
            解锁
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { ArrowUp, ArrowDown, Mountain, Gem, Unlock, Heart, Leaf, Users, Home, Warehouse, X } from 'lucide-vue-next'
  import { useHomeStore, useInventoryStore, useNpcStore, useGameStore, usePlayerStore, useWarehouseStore } from '@/stores'
  import { getItemById } from '@/data'
  import { GREENHOUSE_UNLOCK_COST, GREENHOUSE_MATERIAL_COST, WAREHOUSE_UNLOCK_MATERIALS } from '@/data/buildings'
  import { ACTION_TIME_COSTS } from '@/data/timeConstants'
  import type { Quality, ChildStage } from '@/types'
  import { addLog } from '@/composables/useGameLog'
  import { handleEndDay } from '@/composables/useEndDay'

  const homeStore = useHomeStore()
  const inventoryStore = useInventoryStore()
  const gameStore = useGameStore()
  const npcStore = useNpcStore()
  const playerStore = usePlayerStore()
  const warehouseStore = useWarehouseStore()

  const releaseConfirmChildId = ref<number | null>(null)
  const showUpgradeModal = ref(false)
  const showGreenhouseModal = ref(false)
  const showAgingModal = ref(false)
  const showDepositModal = ref(false)
  const showWarehouseUnlockModal = ref(false)

  const CHILD_STAGE_NAMES: Record<ChildStage, string> = {
    baby: '婴儿',
    toddler: '幼儿',
    child: '孩童',
    teen: '少年'
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

  const getChildName = (childId: number): string => {
    return npcStore.children.find(c => c.id === childId)?.name ?? '孩子'
  }

  // === 操作处理 ===

  const handleUpgradeFromModal = () => {
    const upgrade = homeStore.nextUpgrade
    if (!upgrade) return
    if (homeStore.upgradeFarmhouse()) {
      addLog(`农舍升级为「${upgrade.name}」！${upgrade.description}`)
      showUpgradeModal.value = false
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

  const handleUnlockFromModal = () => {
    if (homeStore.unlockGreenhouse()) {
      addLog('温室已解锁！可在农场面板中切换至温室进行种植。')
      showGreenhouseModal.value = false
    } else {
      addLog('金币或材料不足，无法解锁温室。')
    }
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

  const handleReleaseChild = () => {
    if (releaseConfirmChildId.value === null) return
    const result = npcStore.releaseChild(releaseConfirmChildId.value)
    addLog(result.message)
    releaseConfirmChildId.value = null
  }

  const handleStartAgingFromModal = (itemId: string, quality: Quality) => {
    if (homeStore.startAging(itemId, quality)) {
      const name = getItemName(itemId)
      addLog(`将${name}放入酒窖陈酿。`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.aging)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) handleEndDay()
    } else {
      addLog('无法放入酒窖（已满或物品不可陈酿）。')
    }
    // 酒窖满或无剩余可陈酿物品时关闭弹窗
    if (homeStore.cellarSlots.length >= 6 || ageableInInventory.value.length === 0) {
      showAgingModal.value = false
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

  // === 仓库 ===

  const handleUnlockWarehouse = () => {
    if (warehouseStore.unlocked) return
    if (!canUnlockWarehouse.value) {
      addLog('金币或材料不足，无法解锁仓库。')
      return
    }
    for (const mat of WAREHOUSE_UNLOCK_MATERIALS) {
      inventoryStore.removeItem(mat.itemId, mat.quantity)
    }
    playerStore.spendMoney(warehouseStore.UNLOCK_COST)
    warehouseStore.unlocked = true
    showWarehouseUnlockModal.value = false
    addLog(`仓库已解锁！（-${warehouseStore.UNLOCK_COST}文）`)
  }

  const canUnlockWarehouse = computed(() => {
    if (playerStore.money < warehouseStore.UNLOCK_COST) return false
    return WAREHOUSE_UNLOCK_MATERIALS.every(mat => inventoryStore.getItemCount(mat.itemId) >= mat.quantity)
  })

  const canUpgradeFarmhouse = computed(() => {
    const upgrade = homeStore.nextUpgrade
    if (!upgrade) return false
    if (playerStore.money < upgrade.cost) return false
    return upgrade.materialCost.every(mat => inventoryStore.getItemCount(mat.itemId) >= mat.quantity)
  })

  const canUnlockGreenhouse = computed(() => {
    if (playerStore.money < GREENHOUSE_UNLOCK_COST) return false
    return GREENHOUSE_MATERIAL_COST.every(mat => inventoryStore.getItemCount(mat.itemId) >= mat.quantity)
  })

  const QUALITY_LABEL: Record<Quality, string> = {
    normal: '普通',
    fine: '优良',
    excellent: '精品',
    supreme: '极品'
  }

  const qualityTextClass = (q: Quality, fallback = ''): string => {
    if (q === 'fine') return 'text-quality-fine'
    if (q === 'excellent') return 'text-quality-excellent'
    if (q === 'supreme') return 'text-quality-supreme'
    return fallback
  }

  /** 背包中可存入仓库的物品（排除种子） */
  const depositableItems = computed(() =>
    inventoryStore.items.filter(i => {
      const def = getItemById(i.itemId)
      return def && def.category !== 'seed'
    })
  )

  /** 计算容器中某物品的可用空间 */
  const calcAvailableSpace = (
    storeItems: { itemId: string; quality: Quality; quantity: number }[],
    storeCap: number,
    itemId: string,
    quality: Quality
  ): number => {
    const MAX_STACK = 99
    let space = 0
    for (const s of storeItems) {
      if (s.itemId === itemId && s.quality === quality && s.quantity < MAX_STACK) {
        space += MAX_STACK - s.quantity
      }
    }
    const emptySlots = storeCap - storeItems.length
    space += emptySlots * MAX_STACK
    return space
  }

  /** 存入仓库（每次存一组） */
  const handleDeposit = (itemId: string, quality: Quality) => {
    const slot = inventoryStore.items.find(i => i.itemId === itemId && i.quality === quality)
    if (!slot) return
    const qty = slot.quantity
    const space = calcAvailableSpace(warehouseStore.items, warehouseStore.capacity, itemId, quality)
    const toTransfer = Math.min(qty, space)
    if (toTransfer <= 0) {
      addLog('仓库已满，无法存入。')
      return
    }
    inventoryStore.removeItem(itemId, toTransfer, quality)
    warehouseStore.addItem(itemId, toTransfer, quality)
    if (toTransfer < qty) {
      addLog(`仓库空间不足，存入了${getItemName(itemId)}×${toTransfer}。`)
    } else {
      addLog(`存入了${getItemName(itemId)}×${toTransfer}。`)
    }
    if (depositableItems.value.length === 0 || warehouseStore.isFull) {
      showDepositModal.value = false
    }
  }

  /** 从仓库取出（每次取一组） */
  const handleWithdraw = (itemId: string, quality: Quality) => {
    const slot = warehouseStore.items.find(i => i.itemId === itemId && i.quality === quality)
    if (!slot) return
    const qty = slot.quantity
    const space = calcAvailableSpace(inventoryStore.items, inventoryStore.capacity, itemId, quality)
    const toTransfer = Math.min(qty, space)
    if (toTransfer <= 0) {
      addLog('背包已满，无法取出。')
      return
    }
    warehouseStore.removeItem(itemId, toTransfer, quality)
    inventoryStore.addItem(itemId, toTransfer, quality)
    if (toTransfer < qty) {
      addLog(`背包空间不足，取出了${getItemName(itemId)}×${toTransfer}。`)
    } else {
      addLog(`取出了${getItemName(itemId)}×${toTransfer}。`)
    }
  }
</script>
