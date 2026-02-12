<template>
  <div>
    <!-- 标题 -->
    <div class="flex items-center justify-between mb-1">
      <div class="flex items-center gap-1.5 text-sm text-accent">
        <Package :size="14" />
        <span>背包</span>
      </div>
      <span class="text-xs text-muted">
        {{ inventoryStore.items.length }}/{{ inventoryStore.capacity }}
        <span v-if="inventoryStore.tempItems.length > 0" class="text-danger">+{{ inventoryStore.tempItems.length }}溢出</span>
      </span>
    </div>

    <!-- 页签切换 -->
    <div class="flex gap-1 mb-3">
      <button class="btn text-xs flex-1 justify-center" :class="{ 'bg-accent! text-bg!': tab === 'items' }" @click="tab = 'items'">
        物品
      </button>
      <button class="btn text-xs flex-1 justify-center" :class="{ 'bg-accent! text-bg!': tab === 'tools' }" @click="tab = 'tools'">
        装备
      </button>
      <button
        class="btn text-xs flex-1 justify-center"
        :class="{ 'bg-danger! text-text!': tab === 'temp', 'text-danger': tab !== 'temp' && inventoryStore.tempItems.length > 0 }"
        @click="tab = 'temp'"
      >
        临时{{ inventoryStore.tempItems.length > 0 ? `(${inventoryStore.tempItems.length})` : '' }}
      </button>
    </div>

    <!-- 物品页 -->
    <template v-if="tab === 'items'">
      <div v-if="inventoryStore.items.length > 1" class="flex justify-end mb-1.5">
        <button class="btn w-full md:w-auto text-xs py-0 px-1.5" @click="inventoryStore.sortItems()">
          <ArrowDown01 :size="12" />
          整理
        </button>
      </div>
      <div v-if="inventoryStore.items.length > 0" class="grid grid-cols-3 md:grid-cols-5 gap-1.5">
        <div
          v-for="(item, idx) in inventoryStore.items"
          :key="idx"
          class="border border-accent/20 rounded-xs p-1.5 text-center cursor-pointer hover:bg-accent/5 transition-colors"
          @click="activeItemKey = item.itemId + ':' + item.quality"
        >
          <div
            class="text-xs truncate"
            :class="{
              'text-quality-fine': item.quality === 'fine',
              'text-quality-excellent': item.quality === 'excellent',
              'text-quality-supreme': item.quality === 'supreme'
            }"
          >
            {{ getItemById(item.itemId)?.name }}
          </div>
          <div class="text-xs text-muted">×{{ item.quantity }}</div>
        </div>

        <!-- 空格子 -->
        <div
          v-for="i in Math.max(0, inventoryStore.capacity - inventoryStore.items.length)"
          :key="'empty-' + i"
          class="border border-accent/10 rounded-xs p-1.5 text-center text-xs text-muted/30"
        >
          空
        </div>
      </div>
      <div v-else class="flex flex-col items-center justify-center py-4 text-muted">
        <Package :size="24" />
        <p class="text-xs mt-1">背包是空的</p>
      </div>
    </template>

    <!-- 临时背包页 -->
    <template v-if="tab === 'temp'">
      <div v-if="inventoryStore.tempItems.length > 0">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[10px] text-muted">背包满时溢出的物品，请及时取回</span>
          <button v-if="!inventoryStore.isFull" class="btn text-xs py-0 px-1.5" @click="handleMoveAllFromTemp">全部取回</button>
        </div>
        <div class="grid grid-cols-3 md:grid-cols-5 gap-1.5">
          <div
            v-for="(item, idx) in inventoryStore.tempItems"
            :key="'temp-' + idx"
            class="border border-danger/30 rounded-xs p-1.5 text-center cursor-pointer hover:bg-danger/5 transition-colors"
            @click="activeTempIdx = idx"
          >
            <div
              class="text-xs truncate"
              :class="{
                'text-quality-fine': item.quality === 'fine',
                'text-quality-excellent': item.quality === 'excellent',
                'text-quality-supreme': item.quality === 'supreme'
              }"
            >
              {{ getItemById(item.itemId)?.name }}
            </div>
            <div class="text-xs text-muted">×{{ item.quantity }}</div>
          </div>

          <!-- 空格子 -->
          <div
            v-for="i in Math.max(0, 10 - inventoryStore.tempItems.length)"
            :key="'temp-empty-' + i"
            class="border border-danger/10 rounded-xs p-1.5 text-center text-xs text-muted/30"
          >
            空
          </div>
        </div>
      </div>
      <div v-else class="flex flex-col items-center justify-center py-4 text-muted">
        <Archive :size="24" />
        <p class="text-xs mt-1">临时背包是空的</p>
      </div>
    </template>

    <!-- 装备页 -->
    <template v-if="tab === 'tools'">
      <!-- 工具 -->
      <div class="border border-accent/20 rounded-xs p-2 mb-3">
        <p class="text-xs text-muted mb-1">工具</p>
        <div class="flex flex-col gap-1">
          <div
            v-for="tool in inventoryStore.tools"
            :key="tool.type"
            class="flex items-center justify-between border border-accent/10 rounded-xs px-2 py-1"
          >
            <span class="text-xs">{{ TOOL_NAMES[tool.type] }}</span>
            <span class="text-xs text-muted">{{ TIER_NAMES[tool.tier] }}</span>
          </div>
        </div>
      </div>

      <!-- 武器 -->
      <div class="border border-accent/20 rounded-xs p-2 mb-3">
        <p class="text-xs text-muted mb-1">武器</p>
        <div class="flex flex-col gap-1 max-h-40 overflow-y-auto">
          <div
            v-for="(weapon, idx) in inventoryStore.ownedWeapons"
            :key="idx"
            class="flex items-center justify-between border rounded-xs px-2 py-1 cursor-pointer hover:bg-accent/5"
            :class="idx === inventoryStore.equippedWeaponIndex ? 'border-accent/30' : 'border-accent/10'"
            @click="activeWeaponIdx = idx"
          >
            <span class="text-xs" :class="idx === inventoryStore.equippedWeaponIndex ? 'text-accent' : ''">
              {{ getWeaponDisplayName(weapon.defId, weapon.enchantmentId) }}
            </span>
            <span v-if="idx === inventoryStore.equippedWeaponIndex" class="text-xs text-accent">装备中</span>
            <span v-else class="text-xs text-muted">{{ getWeaponSellPrice(weapon.defId, weapon.enchantmentId) }}文</span>
          </div>
        </div>
      </div>

      <!-- 戒指 -->
      <div class="border border-accent/20 rounded-xs p-2">
        <p class="text-xs text-muted mb-1">戒指</p>
        <div v-if="inventoryStore.ownedRings.length > 0" class="flex flex-col gap-1">
          <!-- 槽位 -->
          <div class="flex gap-1 mb-1">
            <div class="flex-1 border border-accent/10 rounded-xs px-2 py-1 text-center">
              <p class="text-[10px] text-muted">槽位1</p>
              <p class="text-xs" :class="equippedRing1Name ? 'text-accent' : 'text-muted/40'">
                {{ equippedRing1Name ?? '空' }}
              </p>
            </div>
            <div class="flex-1 border border-accent/10 rounded-xs px-2 py-1 text-center">
              <p class="text-[10px] text-muted">槽位2</p>
              <p class="text-xs" :class="equippedRing2Name ? 'text-accent' : 'text-muted/40'">
                {{ equippedRing2Name ?? '空' }}
              </p>
            </div>
          </div>
          <!-- 拥有的戒指列表 -->
          <div class="max-h-40 overflow-y-auto flex flex-col gap-1">
            <div
              v-for="(ring, idx) in inventoryStore.ownedRings"
              :key="idx"
              class="flex items-center justify-between border rounded-xs px-2 py-1 cursor-pointer hover:bg-accent/5"
              :class="isRingEquipped(idx) ? 'border-accent/30' : 'border-accent/10'"
              @click="activeRingIdx = idx"
            >
              <div class="min-w-0">
                <span class="text-xs" :class="isRingEquipped(idx) ? 'text-accent' : ''">
                  {{ getRingById(ring.defId)?.name ?? ring.defId }}
                </span>
                <p class="text-[10px] text-muted truncate">{{ getRingById(ring.defId)?.description }}</p>
              </div>
              <div class="flex gap-1 shrink-0 ml-2">
                <button
                  class="btn text-xs py-0 px-1.5"
                  :class="inventoryStore.equippedRingSlot1 === idx ? 'bg-accent! text-bg!' : ''"
                  @click.stop="handleToggleRingSlot(idx, 0)"
                >
                  槽1
                </button>
                <button
                  class="btn text-xs py-0 px-1.5"
                  :class="inventoryStore.equippedRingSlot2 === idx ? 'bg-accent! text-bg!' : ''"
                  @click.stop="handleToggleRingSlot(idx, 1)"
                >
                  槽2
                </button>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="text-xs text-muted/40 text-center py-2">暂无戒指</p>
      </div>
    </template>

    <!-- 临时背包物品详情弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="activeTempItem"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="activeTempIdx = null"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="activeTempIdx = null">
            <X :size="14" />
          </button>
          <p
            class="text-sm mb-2"
            :class="{
              'text-quality-fine': activeTempItem.quality === 'fine',
              'text-quality-excellent': activeTempItem.quality === 'excellent',
              'text-quality-supreme': activeTempItem.quality === 'supreme',
              'text-accent': activeTempItem.quality === 'normal'
            }"
          >
            {{ activeTempItemDef?.name }}
            <span class="text-xs text-danger ml-1">（临时）</span>
          </p>
          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs text-muted">{{ activeTempItemDef?.description }}</p>
          </div>
          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">数量</span>
              <span class="text-xs">×{{ activeTempItem.quantity }}</span>
            </div>
            <div v-if="activeTempItem.quality !== 'normal'" class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">品质</span>
              <span
                class="text-xs"
                :class="{
                  'text-quality-fine': activeTempItem.quality === 'fine',
                  'text-quality-excellent': activeTempItem.quality === 'excellent',
                  'text-quality-supreme': activeTempItem.quality === 'supreme'
                }"
              >
                {{ QUALITY_NAMES[activeTempItem.quality] }}
              </span>
            </div>
          </div>
          <div class="flex flex-col gap-1.5">
            <button
              class="btn text-xs w-full justify-center"
              :class="inventoryStore.isFull ? 'opacity-50' : ''"
              :disabled="inventoryStore.isFull"
              @click="handleMoveFromTemp"
            >
              <ArrowRight :size="12" />
              放入背包
            </button>
            <button class="btn text-xs w-full justify-center text-danger border-danger/40" @click="handleDiscardTemp">丢弃</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 物品详情弹窗 -->
    <Transition name="panel-fade">
      <div v-if="activeItem" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="activeItemKey = null">
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="activeItemKey = null">
            <X :size="14" />
          </button>

          <p
            class="text-sm mb-2"
            :class="{
              'text-quality-fine': activeItem.quality === 'fine',
              'text-quality-excellent': activeItem.quality === 'excellent',
              'text-quality-supreme': activeItem.quality === 'supreme',
              'text-accent': activeItem.quality === 'normal'
            }"
          >
            {{ activeItemDef?.name }}
          </p>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs text-muted">{{ activeItemDef?.description }}</p>
          </div>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">数量</span>
              <span class="text-xs">×{{ activeItem.quantity }}</span>
            </div>
            <div v-if="activeItem.quality !== 'normal'" class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">品质</span>
              <span
                class="text-xs"
                :class="{
                  'text-quality-fine': activeItem.quality === 'fine',
                  'text-quality-excellent': activeItem.quality === 'excellent',
                  'text-quality-supreme': activeItem.quality === 'supreme'
                }"
              >
                {{ QUALITY_NAMES[activeItem.quality] }}
              </span>
            </div>
            <div v-if="activeItemDef?.sellPrice" class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">售价</span>
              <span class="text-xs text-accent">{{ activeItemDef.sellPrice }}文</span>
            </div>
            <div v-if="activeItemDef?.staminaRestore" class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">恢复</span>
              <span class="text-xs text-success">
                +{{ activeItemDef.staminaRestore }}体力
                <template v-if="activeItemDef.healthRestore">/ +{{ activeItemDef.healthRestore }}HP</template>
              </span>
            </div>
            <div v-if="activeItemBuff" class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">增益</span>
              <span class="text-xs text-accent">{{ activeItemBuff.description }}</span>
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <button
              v-if="isEdible(activeItem.itemId)"
              class="btn text-xs w-full justify-center"
              @click="handleEat(activeItem.itemId, activeItem.quality)"
            >
              <Apple :size="12" />
              食用
            </button>
            <button
              v-if="isUsable(activeItem.itemId)"
              class="btn text-xs w-full justify-center"
              @click="handleUse(activeItem.itemId, activeItem.quality)"
            >
              <Zap :size="12" />
              使用
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 武器详情弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="activeWeaponIdx !== null && activeWeaponDef"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="activeWeaponIdx = null"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="activeWeaponIdx = null">
            <X :size="14" />
          </button>
          <p class="text-sm text-accent mb-2">{{ activeWeaponName }}</p>
          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs text-muted">{{ activeWeaponDef.description }}</p>
          </div>
          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">类型</span>
              <span class="text-xs">{{ WEAPON_TYPE_NAMES[activeWeaponDef.type] }}</span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">攻击力</span>
              <span class="text-xs">{{ activeWeaponDef.attack }}</span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">暴击率</span>
              <span class="text-xs">{{ Math.round(activeWeaponDef.critRate * 100) }}%</span>
            </div>
            <div v-if="activeWeaponEnchant" class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">附魔</span>
              <span class="text-xs text-accent">{{ activeWeaponEnchant.name }}：{{ activeWeaponEnchant.description }}</span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">售价</span>
              <span class="text-xs text-accent">{{ activeWeaponPrice }}文</span>
            </div>
          </div>
          <div class="flex flex-col gap-1.5">
            <button
              v-if="activeWeaponIdx !== inventoryStore.equippedWeaponIndex"
              class="btn text-xs w-full justify-center"
              @click="handleEquipWeapon"
            >
              装备
            </button>
            <button
              v-if="activeWeaponIdx !== inventoryStore.equippedWeaponIndex && inventoryStore.ownedWeapons.length > 1"
              class="btn text-xs w-full justify-center text-danger border-danger/40"
              @click="handleSellWeapon"
            >
              卖出 · {{ activeWeaponPrice }}文
            </button>
            <p v-if="activeWeaponIdx === inventoryStore.equippedWeaponIndex" class="text-[10px] text-muted text-center">
              当前装备中，请先切换其他武器再卖出
            </p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 戒指详情弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="activeRingIdx !== null && activeRingDef"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="activeRingIdx = null"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="activeRingIdx = null">
            <X :size="14" />
          </button>
          <p class="text-sm text-accent mb-2">{{ activeRingDef.name }}</p>
          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs text-muted">{{ activeRingDef.description }}</p>
          </div>
          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <div v-for="eff in activeRingDef.effects" :key="eff.type" class="flex items-center justify-between mt-0.5 first:mt-0">
              <span class="text-xs text-muted">{{ RING_EFFECT_NAMES[eff.type] ?? eff.type }}</span>
              <span class="text-xs text-success">+{{ formatEffectValue(eff) }}</span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">售价</span>
              <span class="text-xs text-accent">{{ activeRingDef.sellPrice }}文</span>
            </div>
          </div>
          <div class="flex flex-col gap-1.5">
            <div class="flex gap-1.5">
              <button class="btn text-xs flex-1 justify-center" @click="handleEquipRingFromPopup(0)">
                {{ inventoryStore.equippedRingSlot1 === activeRingIdx ? '卸下槽1' : '装备槽1' }}
              </button>
              <button class="btn text-xs flex-1 justify-center" @click="handleEquipRingFromPopup(1)">
                {{ inventoryStore.equippedRingSlot2 === activeRingIdx ? '卸下槽2' : '装备槽2' }}
              </button>
            </div>
            <button class="btn text-xs w-full justify-center text-danger border-danger/40" @click="handleSellRing">
              卖出 · {{ activeRingDef.sellPrice }}文
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { Apple, Archive, ArrowDown01, ArrowRight, Package, X, Zap } from 'lucide-vue-next'
  import { useInventoryStore, usePlayerStore, useSkillStore, useGameStore, useCookingStore } from '@/stores'
  import { getItemById, TOOL_NAMES, TIER_NAMES } from '@/data'
  import { getRecipeById } from '@/data/recipes'
  import { getWeaponById, getWeaponDisplayName, getWeaponSellPrice, getEnchantmentById, WEAPON_TYPE_NAMES } from '@/data/weapons'
  import { getRingById } from '@/data/rings'
  import { QUALITY_NAMES } from '@/composables/useFarmActions'
  import { addLog } from '@/composables/useGameLog'
  import type { Quality, RingEffectType } from '@/types'

  const inventoryStore = useInventoryStore()
  const playerStore = usePlayerStore()
  const skillStore = useSkillStore()
  const gameStore = useGameStore()
  const cookingStore = useCookingStore()

  // === 页签 ===

  const tab = ref<'items' | 'tools' | 'temp'>('items')

  // === 戒指辅助 ===

  const equippedRing1Name = computed(() => {
    const idx = inventoryStore.equippedRingSlot1
    const ring = inventoryStore.ownedRings[idx]
    if (!ring) return null
    return getRingById(ring.defId)?.name ?? null
  })

  const equippedRing2Name = computed(() => {
    const idx = inventoryStore.equippedRingSlot2
    const ring = inventoryStore.ownedRings[idx]
    if (!ring) return null
    return getRingById(ring.defId)?.name ?? null
  })

  const isRingEquipped = (idx: number): boolean => {
    return inventoryStore.equippedRingSlot1 === idx || inventoryStore.equippedRingSlot2 === idx
  }

  /** 切换戒指槽位（点击高亮按钮 → 卸下；点击非高亮按钮 → 装备/换位） */
  const handleToggleRingSlot = (ringIdx: number, slot: 0 | 1) => {
    const slotRef = slot === 0 ? inventoryStore.equippedRingSlot1 : inventoryStore.equippedRingSlot2
    if (slotRef === ringIdx) {
      inventoryStore.unequipRing(slot)
    } else {
      inventoryStore.equipRing(ringIdx, slot)
    }
  }

  // === 戒指效果显示 ===

  const RING_EFFECT_NAMES: Record<RingEffectType, string> = {
    attack_bonus: '攻击力',
    crit_rate_bonus: '暴击率',
    defense_bonus: '防御',
    vampiric: '吸血',
    max_hp_bonus: '最大HP',
    stamina_reduction: '体力消耗',
    mining_stamina: '采矿体力',
    farming_stamina: '农作体力',
    fishing_stamina: '钓鱼体力',
    crop_quality_bonus: '作物品质',
    crop_growth_bonus: '作物生长',
    fish_quality_bonus: '鱼类品质',
    fishing_calm: '钓鱼稳定',
    sell_price_bonus: '售价加成',
    shop_discount: '商店折扣',
    gift_friendship: '送礼好感',
    monster_drop_bonus: '掉落率',
    exp_bonus: '经验加成',
    treasure_find: '宝箱概率',
    ore_bonus: '矿石加成',
    luck: '幸运'
  }

  const PERCENTAGE_EFFECTS: Set<RingEffectType> = new Set([
    'crit_rate_bonus',
    'vampiric',
    'stamina_reduction',
    'mining_stamina',
    'farming_stamina',
    'fishing_stamina',
    'crop_quality_bonus',
    'crop_growth_bonus',
    'fish_quality_bonus',
    'fishing_calm',
    'sell_price_bonus',
    'shop_discount',
    'gift_friendship',
    'monster_drop_bonus',
    'exp_bonus',
    'treasure_find',
    'ore_bonus',
    'luck'
  ])

  const formatEffectValue = (eff: { type: RingEffectType; value: number }): string => {
    if (PERCENTAGE_EFFECTS.has(eff.type)) return `${Math.round(eff.value * 100)}%`
    return `${eff.value}`
  }

  // === 武器弹窗 ===

  const activeWeaponIdx = ref<number | null>(null)

  const activeWeaponDef = computed(() => {
    if (activeWeaponIdx.value === null) return null
    const weapon = inventoryStore.ownedWeapons[activeWeaponIdx.value]
    if (!weapon) return null
    return getWeaponById(weapon.defId) ?? null
  })

  const activeWeaponName = computed(() => {
    if (activeWeaponIdx.value === null) return ''
    const weapon = inventoryStore.ownedWeapons[activeWeaponIdx.value]
    if (!weapon) return ''
    return getWeaponDisplayName(weapon.defId, weapon.enchantmentId)
  })

  const activeWeaponEnchant = computed(() => {
    if (activeWeaponIdx.value === null) return null
    const weapon = inventoryStore.ownedWeapons[activeWeaponIdx.value]
    if (!weapon?.enchantmentId) return null
    return getEnchantmentById(weapon.enchantmentId) ?? null
  })

  const activeWeaponPrice = computed(() => {
    if (activeWeaponIdx.value === null) return 0
    const weapon = inventoryStore.ownedWeapons[activeWeaponIdx.value]
    if (!weapon) return 0
    return getWeaponSellPrice(weapon.defId, weapon.enchantmentId)
  })

  const handleEquipWeapon = () => {
    if (activeWeaponIdx.value === null) return
    inventoryStore.equipWeapon(activeWeaponIdx.value)
    activeWeaponIdx.value = null
  }

  const handleSellWeapon = () => {
    if (activeWeaponIdx.value === null) return
    const result = inventoryStore.sellWeapon(activeWeaponIdx.value)
    addLog(result.message)
    activeWeaponIdx.value = null
  }

  // === 戒指弹窗 ===

  const activeRingIdx = ref<number | null>(null)

  const activeRingDef = computed(() => {
    if (activeRingIdx.value === null) return null
    const ring = inventoryStore.ownedRings[activeRingIdx.value]
    if (!ring) return null
    return getRingById(ring.defId) ?? null
  })

  const handleEquipRingFromPopup = (slot: 0 | 1) => {
    if (activeRingIdx.value === null) return
    const slotRef = slot === 0 ? inventoryStore.equippedRingSlot1 : inventoryStore.equippedRingSlot2
    if (slotRef === activeRingIdx.value) {
      inventoryStore.unequipRing(slot)
    } else {
      inventoryStore.equipRing(activeRingIdx.value, slot)
    }
  }

  const handleSellRing = () => {
    if (activeRingIdx.value === null) return
    const result = inventoryStore.sellRing(activeRingIdx.value)
    addLog(result.message)
    activeRingIdx.value = null
  }

  // === 临时背包 ===

  const activeTempIdx = ref<number | null>(null)

  const activeTempItem = computed(() => {
    if (activeTempIdx.value === null) return null
    return inventoryStore.tempItems[activeTempIdx.value] ?? null
  })

  const activeTempItemDef = computed(() => {
    if (!activeTempItem.value) return null
    return getItemById(activeTempItem.value.itemId) ?? null
  })

  const handleMoveFromTemp = () => {
    if (activeTempIdx.value === null) return
    const success = inventoryStore.moveFromTemp(activeTempIdx.value)
    if (success) {
      addLog('物品已转移到背包。')
      activeTempIdx.value = null
    } else {
      addLog('背包空间不足，部分物品仍在临时背包中。')
    }
  }

  const handleMoveAllFromTemp = () => {
    const moved = inventoryStore.moveAllFromTemp()
    if (moved > 0) {
      addLog(`已将${moved}项物品从临时背包转移到背包。`)
    }
    if (inventoryStore.tempItems.length > 0) {
      addLog('部分物品因空间不足仍在临时背包中。')
    }
  }

  const handleDiscardTemp = () => {
    if (activeTempIdx.value === null) return
    const item = inventoryStore.tempItems[activeTempIdx.value]
    const name = getItemById(item?.itemId ?? '')?.name ?? ''
    inventoryStore.discardTempItem(activeTempIdx.value)
    addLog(`丢弃了${name}。`)
    activeTempIdx.value = null
  }

  // === 物品弹窗 ===

  const activeItemKey = ref<string | null>(null)

  const activeItem = computed(() => {
    if (!activeItemKey.value) return null
    const [itemId, quality] = activeItemKey.value.split(':')
    return inventoryStore.items.find(i => i.itemId === itemId && i.quality === quality) ?? null
  })

  const activeItemDef = computed(() => {
    if (!activeItem.value) return null
    return getItemById(activeItem.value.itemId) ?? null
  })

  /** 烹饪品的buff描述 */
  const activeItemBuff = computed(() => {
    if (!activeItem.value) return null
    const itemId = activeItem.value.itemId
    if (!itemId.startsWith('food_')) return null
    const recipe = getRecipeById(itemId.slice(5))
    return recipe?.effect.buff ?? null
  })

  const isEdible = (itemId: string): boolean => {
    const def = getItemById(itemId)
    return !!def?.edible && !!def.staminaRestore
  }

  const handleEat = (itemId: string, quality: Quality) => {
    const def = getItemById(itemId)
    if (!def?.edible || !def.staminaRestore) return
    const staminaFull = playerStore.stamina >= playerStore.maxStamina
    const hpFull = playerStore.hp >= playerStore.getMaxHp()
    if (staminaFull && hpFull) {
      addLog('体力和生命值都已满，不需要食用。')
      return
    }

    // 烹饪品走 cookingStore.eat()，以正确应用buff、厨房加成等
    if (itemId.startsWith('food_')) {
      const recipeId = itemId.slice(5) // 去掉 'food_' 前缀
      const result = cookingStore.eat(recipeId)
      if (result.success) {
        addLog(result.message)
      } else {
        addLog(result.message)
      }
      // 物品消耗完则关闭弹窗
      if (!inventoryStore.items.find(i => i.itemId === itemId && i.quality === quality)) {
        activeItemKey.value = null
      }
      return
    }

    if (!inventoryStore.removeItem(itemId, 1, quality)) return
    // 炼金师专精：食物恢复+50%
    const alchemistBonus = skillStore.getSkill('foraging').perk10 === 'alchemist' ? 1.5 : 1.0
    const staminaRestore = Math.floor(def.staminaRestore * alchemistBonus)
    playerStore.restoreStamina(staminaRestore)
    let msg = `食用了${def.name}，恢复${staminaRestore}体力`
    if (def.healthRestore) {
      const healthRestore = Math.floor(def.healthRestore * alchemistBonus)
      playerStore.restoreHealth(healthRestore)
      msg += `、${healthRestore}生命值`
    }
    msg += '。'
    addLog(msg)
    // 物品消耗完则关闭弹窗
    if (!inventoryStore.items.find(i => i.itemId === itemId && i.quality === quality)) {
      activeItemKey.value = null
    }
  }

  /** 可使用的特殊物品 */
  const USABLE_ITEMS = new Set(['rain_totem'])

  const isUsable = (itemId: string): boolean => {
    return USABLE_ITEMS.has(itemId)
  }

  const handleUse = (itemId: string, quality: Quality) => {
    if (itemId === 'rain_totem') {
      if (!inventoryStore.removeItem(itemId, 1, quality)) return
      gameStore.setTomorrowWeather('rainy')
      addLog('你使用了雨图腾，明天将会下雨。')
    }
    // 物品消耗完则关闭弹窗
    if (!inventoryStore.items.find(i => i.itemId === itemId && i.quality === quality)) {
      activeItemKey.value = null
    }
  }
</script>
