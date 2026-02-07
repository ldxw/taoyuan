<template>
  <div class="flex flex-col md:flex-row gap-4 md:gap-6">
    <!-- 购买区 -->
    <div class="flex-1">
      <h3 class="text-accent text-sm mb-3">
        <Sprout :size="14" class="inline" />
        万物铺 · 当季种子
      </h3>
      <div class="flex flex-col gap-2">
        <div
          v-for="seed in shopStore.availableSeeds"
          :key="seed.seedId"
          class="flex items-center justify-between border border-accent/20 rounded-[2px] px-3 py-2"
        >
          <div>
            <span class="text-sm">{{ seed.cropName }}种子</span>
            <span class="text-muted text-xs ml-2">{{ seed.growthDays }}天 → 售{{ seed.sellPrice }}文</span>
          </div>
          <button class="btn text-xs" :disabled="playerStore.money < seed.price" @click="handleBuySeed(seed.seedId)">
            <ShoppingCart :size="14" />
            {{ seed.price }}文
          </button>
        </div>
        <p v-if="shopStore.availableSeeds.length === 0" class="text-muted text-xs">本季没有种子出售。</p>
      </div>

      <!-- 杂货 -->
      <h3 class="text-accent text-sm mb-3 mt-4">
        <Package :size="14" class="inline" />
        杂货
      </h3>
      <div class="flex flex-col gap-2">
        <!-- 背包扩容 -->
        <div v-if="inventoryStore.capacity < 36" class="flex items-center justify-between border border-accent/20 rounded-[2px] px-3 py-2">
          <div>
            <span class="text-sm">背包扩容</span>
            <span class="text-muted text-xs ml-2">当前{{ inventoryStore.capacity }}格 → {{ inventoryStore.capacity + 4 }}格</span>
          </div>
          <button class="btn text-xs" :disabled="playerStore.money < bagPrice" @click="handleBuyBag">
            <ShoppingCart :size="14" />
            {{ bagPrice }}文
          </button>
        </div>

        <!-- 农场扩建 -->
        <div v-if="farmExpandInfo" class="flex items-center justify-between border border-accent/20 rounded-[2px] px-3 py-2">
          <div>
            <span class="text-sm">农场扩建</span>
            <span class="text-muted text-xs ml-2">
              {{ farmStore.farmSize }}×{{ farmStore.farmSize }} → {{ farmExpandInfo.newSize }}×{{ farmExpandInfo.newSize }}
            </span>
          </div>
          <button class="btn text-xs" :disabled="playerStore.money < farmExpandInfo.price" @click="handleBuyFarmExpand">
            <ShoppingCart :size="14" />
            {{ farmExpandInfo.price }}文
          </button>
        </div>

        <!-- 树苗 -->
        <div
          v-for="tree in FRUIT_TREE_DEFS"
          :key="tree.saplingId"
          class="flex items-center justify-between border border-accent/20 rounded-[2px] px-3 py-2"
        >
          <div>
            <span class="text-sm">{{ tree.name }}苗</span>
            <span class="text-muted text-xs ml-2">28天成熟 · {{ seasonName(tree.fruitSeason) }}季产{{ tree.fruitName }}</span>
          </div>
          <button
            class="btn text-xs"
            :disabled="playerStore.money < tree.saplingPrice"
            @click="handleBuySapling(tree.saplingId, tree.saplingPrice, tree.name)"
          >
            <ShoppingCart :size="14" />
            {{ tree.saplingPrice }}文
          </button>
        </div>

        <!-- 干草 -->
        <div class="flex items-center justify-between border border-accent/20 rounded-[2px] px-3 py-2">
          <div>
            <span class="text-sm">干草</span>
            <span class="text-muted text-xs ml-2">喂养牲畜用</span>
          </div>
          <button class="btn text-xs" :disabled="playerStore.money < HAY_PRICE" @click="handleBuyHay">
            <ShoppingCart :size="14" />
            {{ HAY_PRICE }}文
          </button>
        </div>

        <!-- 炸弹 -->
        <div
          v-for="b in BOMBS.filter(b => b.shopPrice !== null)"
          :key="b.id"
          class="flex items-center justify-between border border-accent/20 rounded-[2px] px-3 py-2"
        >
          <div>
            <span class="text-sm">{{ b.name }}</span>
            <span class="text-muted text-xs ml-2">{{ b.description }}</span>
          </div>
          <button class="btn text-xs" :disabled="playerStore.money < b.shopPrice!" @click="handleBuyItem(b.id, b.shopPrice!, b.name)">
            <ShoppingCart :size="14" />
            {{ b.shopPrice }}文
          </button>
        </div>
      </div>

      <!-- 钓鱼用品 -->
      <h3 class="text-accent text-sm mb-3 mt-4">
        <Fish :size="14" class="inline" />
        钓鱼用品
      </h3>
      <div class="flex flex-col gap-2">
        <div
          v-for="b in shopStore.shopBaits"
          :key="b.id"
          class="flex items-center justify-between border border-accent/20 rounded-[2px] px-3 py-2"
        >
          <div>
            <span class="text-sm">{{ b.name }}</span>
            <span class="text-muted text-xs ml-2">{{ b.description }}</span>
          </div>
          <button class="btn text-xs" :disabled="playerStore.money < b.price" @click="handleBuyItem(b.id, b.price, b.name)">
            <ShoppingCart :size="14" />
            {{ b.price }}文
          </button>
        </div>
        <div
          v-for="t in shopStore.shopTackles"
          :key="t.id"
          class="flex items-center justify-between border border-accent/20 rounded-[2px] px-3 py-2"
        >
          <div>
            <span class="text-sm">{{ t.name }}</span>
            <span class="text-muted text-xs ml-2">{{ t.description }}</span>
          </div>
          <button class="btn text-xs" :disabled="playerStore.money < t.price" @click="handleBuyItem(t.id, t.price, t.name)">
            <ShoppingCart :size="14" />
            {{ t.price }}文
          </button>
        </div>
      </div>

      <!-- 肥料 -->
      <h3 class="text-accent text-sm mb-3 mt-4">
        <Leaf :size="14" class="inline" />
        肥料
      </h3>
      <div class="flex flex-col gap-2">
        <div
          v-for="f in shopStore.shopFertilizers"
          :key="f.id"
          class="flex items-center justify-between border border-accent/20 rounded-[2px] px-3 py-2"
        >
          <div>
            <span class="text-sm">{{ f.name }}</span>
            <span class="text-muted text-xs ml-2">{{ f.description }}</span>
          </div>
          <button class="btn text-xs" :disabled="playerStore.money < f.price" @click="handleBuyItem(f.id, f.price, f.name)">
            <ShoppingCart :size="14" />
            {{ f.price }}文
          </button>
        </div>
      </div>
    </div>

    <!-- 出售区 -->
    <div class="flex-1">
      <h3 class="text-accent text-sm mb-3">
        <TrendingUp :size="14" class="inline" />
        出售物品
      </h3>
      <div class="flex flex-col gap-2">
        <div
          v-for="item in getSellableItems()"
          :key="item.itemId + item.quality"
          class="flex items-center justify-between border border-accent/20 rounded-[2px] px-3 py-2"
        >
          <div>
            <span class="text-sm">{{ item.def?.name }}</span>
            <span class="text-muted text-xs ml-1">×{{ item.quantity }}</span>
          </div>
          <button class="btn text-xs" @click="handleSellItem(item.itemId, item.quality)">
            <Coins :size="14" />
            售 {{ item.def?.sellPrice }}文
          </button>
        </div>
        <p v-if="getSellableItems().length === 0" class="text-muted text-xs">背包中没有可出售的物品。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { ShoppingCart, Coins, Sprout, Package, TrendingUp, Fish, Leaf } from 'lucide-vue-next'
  import { useShopStore, usePlayerStore, useInventoryStore, useFarmStore } from '@/stores'
  import { getItemById } from '@/data'
  import { FRUIT_TREE_DEFS } from '@/data/fruitTrees'
  import { BOMBS } from '@/data/processing'
  import { HAY_PRICE } from '@/data/animals'
  import { SEASON_NAMES } from '@/stores'
  import { addLog } from '@/composables/useGameLog'
  import { handleBuySeed, handleSellItem } from '@/composables/useFarmActions'
  import type { Season } from '@/types'

  const shopStore = useShopStore()
  const playerStore = usePlayerStore()
  const inventoryStore = useInventoryStore()
  const farmStore = useFarmStore()

  /** 背包扩容价格（每次扩容递增） */
  const bagPrice = computed(() => {
    const level = (inventoryStore.capacity - 20) / 4 // 0, 1, 2, 3
    return 500 + level * 500 // 500, 1000, 1500, 2000
  })

  /** 农场扩建信息 */
  const farmExpandInfo = computed(() => {
    const prices: Record<number, { newSize: number; price: number }> = {
      4: { newSize: 6, price: 2000 },
      6: { newSize: 8, price: 5000 }
    }
    return prices[farmStore.farmSize] ?? null
  })

  const handleBuyBag = () => {
    if (!playerStore.spendMoney(bagPrice.value)) {
      addLog('金币不足。')
      return
    }
    if (inventoryStore.expandCapacity()) {
      addLog(`背包扩容至${inventoryStore.capacity}格！(-${bagPrice.value}文)`)
    } else {
      playerStore.earnMoney(bagPrice.value)
      addLog('背包已满级。')
    }
  }

  const handleBuyFarmExpand = () => {
    const info = farmExpandInfo.value
    if (!info) return
    if (!playerStore.spendMoney(info.price)) {
      addLog('金币不足。')
      return
    }
    const newSize = farmStore.expandFarm()
    if (newSize) {
      addLog(`农场扩建至${newSize}×${newSize}！(-${info.price}文)`)
    } else {
      playerStore.earnMoney(info.price)
      addLog('农场已满级。')
    }
  }

  /** 季节名称 */
  const seasonName = (season: Season): string => {
    return SEASON_NAMES[season] ?? season
  }

  /** 购买树苗 */
  const handleBuySapling = (saplingId: string, price: number, treeName: string) => {
    if (!playerStore.spendMoney(price)) {
      addLog('金币不足。')
      return
    }
    inventoryStore.addItem(saplingId)
    addLog(`购买了${treeName}苗。(-${price}文)`)
  }

  /** 购买干草 */
  const handleBuyHay = () => {
    if (!playerStore.spendMoney(HAY_PRICE)) {
      addLog('金币不足。')
      return
    }
    inventoryStore.addItem('hay')
    addLog(`购买了干草。(-${HAY_PRICE}文)`)
  }

  /** 购买通用物品（鱼饵/浮漂/肥料） */
  const handleBuyItem = (itemId: string, price: number, name: string) => {
    if (shopStore.buyItem(itemId, price)) {
      addLog(`购买了${name}。(-${price}文)`)
    } else {
      addLog('金币不足或背包已满。')
    }
  }

  /** 可出售的背包物品（排除种子） */
  const getSellableItems = () => {
    return inventoryStore.items
      .map(inv => {
        const def = getItemById(inv.itemId)
        return { ...inv, def }
      })
      .filter(item => item.def && item.def.category !== 'seed')
  }
</script>
