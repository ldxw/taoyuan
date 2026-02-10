<template>
  <div>
    <div class="flex items-center justify-between mb-1">
      <div class="flex items-center gap-1.5 text-sm text-accent">
        <Sprout :size="14" />
        <span>田庄 ({{ farmStore.farmSize }}×{{ farmStore.farmSize }})</span>
      </div>
      <div class="text-xs text-muted flex gap-3">
        <span v-if="farmStore.scarecrows > 0">稻草人 {{ farmStore.scarecrows }}</span>
        <span v-else class="text-danger/80">无稻草人</span>
        <span v-if="farmStore.lightningRods > 0">避雷针 {{ farmStore.lightningRods }}</span>
      </div>
    </div>

    <!-- 批量操作按钮 -->
    <div class="flex gap-1.5 mb-3 flex-wrap">
      <button class="btn text-xs" :disabled="unwateredCount === 0" @click="doBatchWater">
        <Droplets :size="12" />
        一键浇水 ({{ unwateredCount }})
      </button>
      <button class="btn text-xs" :disabled="wastelandCount === 0" @click="doBatchTill">
        <Shovel :size="12" />
        一键开垦 ({{ wastelandCount }})
      </button>
      <button class="btn text-xs" :disabled="harvestableCount === 0" @click="doBatchHarvest">
        <Wheat :size="12" />
        一键收获 ({{ harvestableCount }})
      </button>
    </div>

    <!-- 农场网格 -->
    <div class="border border-accent/20 rounded-xs p-2">
      <div class="grid gap-0.5 max-w-full md:max-w-md" :style="{ gridTemplateColumns: `repeat(${farmStore.farmSize}, minmax(0, 1fr))` }">
        <button
          v-for="plot in farmStore.plots"
          :key="plot.id"
          class="aspect-square rounded-xs flex flex-col items-center justify-center cursor-pointer transition-colors relative leading-tight"
          :class="[
            getPlotDisplay(plot).color,
            getPlotDisplay(plot).bg,
            needsWater(plot) ? 'border-2 border-danger/50' : 'border border-accent/15',
            plot.state === 'harvestable' ? 'hover:border-accent/60' : 'hover:border-accent/40'
          ]"
          :title="getPlotTooltip(plot)"
          @click="activePlotId = plot.id"
        >
          <span class="text-xs font-bold">{{ getPlotDisplay(plot).text }}</span>
          <span v-if="plot.cropId" class="text-[10px] opacity-60 truncate max-w-full px-0.5">{{ getCropName(plot.cropId) }}</span>
          <!-- 角标 -->
          <Droplets
            v-if="(plot.state === 'planted' || plot.state === 'growing') && !plot.watered"
            :size="8"
            class="absolute bottom-0 right-0 text-danger drop-shadow-sm"
          />
          <Droplet v-if="hasSprinkler(plot.id)" :size="8" class="absolute top-0 right-0 text-water drop-shadow-sm" />
          <CirclePlus v-if="plot.fertilizer" :size="8" class="absolute bottom-0 left-0 text-success drop-shadow-sm" />
        </button>
      </div>
    </div>

    <!-- 地块操作弹窗 -->
    <Transition name="panel-fade">
      <div v-if="activePlot" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="activePlotId = null">
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="activePlotId = null">
            <X :size="14" />
          </button>
          <p class="text-accent text-sm mb-2">地块 #{{ activePlot.id + 1 }}</p>

          <!-- 状态信息 -->
          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <div class="flex flex-col gap-1">
              <div class="flex items-center justify-between">
                <span class="text-xs text-muted">状态</span>
                <span class="text-xs">{{ plotStateLabel }}{{ activePlot.giantCropGroup !== null ? '（巨型）' : '' }}</span>
              </div>
              <div v-if="activePlot.cropId" class="flex items-center justify-between">
                <span class="text-xs text-muted">作物</span>
                <span class="text-xs">{{ activePlot.giantCropGroup !== null ? '巨型' : '' }}{{ getCropName(activePlot.cropId) }}</span>
              </div>
              <!-- 生长进度条 -->
              <div v-if="activePlot.cropId && activePlot.state !== 'harvestable'" class="flex items-center gap-2">
                <span class="text-xs text-muted shrink-0">生长</span>
                <div class="flex-1 h-1 bg-bg rounded-xs border border-accent/10">
                  <div
                    class="h-full rounded-xs bg-success transition-all"
                    :style="{ width: Math.floor((activePlot.growthDays / (Number(plotCropGrowthDays) || 1)) * 100) + '%' }"
                  />
                </div>
                <span class="text-xs text-muted whitespace-nowrap">{{ activePlot.growthDays }}/{{ plotCropGrowthDays }}天</span>
              </div>
              <div v-if="activePlot.cropId && activePlot.giantCropGroup === null" class="flex items-center justify-between">
                <span class="text-xs text-muted">浇水</span>
                <span class="text-xs" :class="activePlot.watered ? 'text-success' : 'text-danger'">
                  {{ activePlot.watered ? '已浇水' : '未浇水' }}
                </span>
              </div>
              <div v-if="activePlot.fertilizer" class="flex items-center justify-between">
                <span class="text-xs text-muted">肥料</span>
                <span class="text-xs text-success">{{ plotFertName }}</span>
              </div>
              <div v-if="hasSprinkler(activePlot.id)" class="flex items-center justify-between">
                <span class="text-xs text-muted">洒水器</span>
                <span class="text-xs text-water">已安装</span>
              </div>
            </div>
            <p v-if="activePlot.giantCropGroup !== null" class="text-xs text-accent mt-1">收获可获得大量作物！</p>
          </div>

          <!-- 操作区 -->
          <div class="flex flex-col gap-1.5">
            <!-- 荒地 → 开垦 -->
            <button v-if="activePlot.state === 'wasteland'" class="btn text-xs w-full justify-center" @click="doTill">
              <Shovel :size="12" />
              开垦
            </button>

            <!-- 未浇水 → 浇水 -->
            <button v-if="canWater" class="btn text-xs w-full justify-center" @click="doWater">
              <Droplets :size="12" />
              浇水
            </button>

            <!-- 可收获 → 收获 -->
            <button
              v-if="activePlot.state === 'harvestable'"
              class="btn text-xs w-full justify-center bg-accent! text-bg!"
              @click="doHarvest"
            >
              <Wheat :size="12" />
              收获
            </button>

            <!-- 已耕 → 种植列表 -->
            <div v-if="activePlot.state === 'tilled' && plantableSeeds.length > 0" class="border border-accent/10 rounded-xs p-2">
              <p class="text-xs text-muted mb-1">种植</p>
              <div class="flex flex-wrap gap-1">
                <button v-for="seed in plantableSeeds" :key="seed.cropId" class="btn text-xs" @click="doPlant(seed.cropId)">
                  {{ seed.name }} (×{{ seed.count }})
                </button>
              </div>
            </div>

            <!-- 施肥 -->
            <div v-if="canFertilize && fertilizerItems.length > 0" class="border border-accent/10 rounded-xs p-2">
              <p class="text-xs text-muted mb-1">施肥</p>
              <div class="flex flex-wrap gap-1">
                <button v-for="f in fertilizerItems" :key="f.itemId" class="btn text-xs" @click="doFertilize(f.type)">
                  {{ f.name }} (×{{ f.count }})
                </button>
              </div>
            </div>

            <!-- 洒水器 -->
            <div v-if="!hasSprinkler(activePlot.id) && sprinklerItems.length > 0" class="border border-accent/10 rounded-xs p-2">
              <p class="text-xs text-muted mb-1">洒水器</p>
              <div class="flex flex-wrap gap-1">
                <button v-for="s in sprinklerItems" :key="s.itemId" class="btn text-xs" @click="doPlaceSprinkler(s.type)">
                  {{ s.name }} (×{{ s.count }})
                </button>
              </div>
            </div>
            <button v-if="hasSprinkler(activePlot.id)" class="btn text-xs w-full justify-center" @click="doRemoveSprinkler">
              拆除洒水器
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 图例与提示 -->
    <div class="mt-2 border border-accent/10 rounded-xs p-2">
      <div class="flex gap-x-3 gap-y-0.5 flex-wrap text-xs text-muted">
        <span>
          <span class="text-muted">荒</span>
          =荒地
        </span>
        <span>
          <span class="text-earth">耕</span>
          =已耕
        </span>
        <span>
          <span class="text-success/60">苗</span>
          =已种
        </span>
        <span>
          <span class="text-success">长</span>
          =生长中
        </span>
        <span>
          <span class="text-water">润</span>
          =已浇水
        </span>
        <span>
          <span class="text-accent">熟</span>
          =可收获
        </span>
        <span>
          <span class="text-accent">巨</span>
          =巨型
        </span>
        <span>
          <Droplet :size="10" class="text-water inline" />
          =洒水器
        </span>
        <span>
          <CirclePlus :size="10" class="text-success inline" />
          =肥料
        </span>
        <span>
          <Droplets :size="10" class="text-danger inline" />
          =需浇水
        </span>
      </div>
      <p v-if="unwateredCount > 0" class="text-xs text-danger mt-1">还有 {{ unwateredCount }} 块地需要浇水</p>
    </div>

    <!-- 出货箱入口 -->
    <div
      class="mt-3 flex items-center justify-between border border-accent/20 rounded-xs px-3 py-2 cursor-pointer hover:bg-accent/5"
      @click="showShippingBox = true"
    >
      <div class="flex items-center gap-1.5">
        <Package :size="14" class="text-accent" />
        <span class="text-sm text-accent">出货箱</span>
        <span v-if="shopStore.shippingBox.length > 0" class="text-xs text-muted">{{ shopStore.shippingBox.length }}种</span>
      </div>
      <span v-if="shippingBoxTotal > 0" class="text-xs text-accent">≈{{ shippingBoxTotal }}文</span>
      <span v-else class="text-xs text-muted">空</span>
    </div>

    <!-- 出货箱弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showShippingBox"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="showShippingBox = false"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="showShippingBox = false">
            <X :size="14" />
          </button>
          <div class="flex items-center gap-1.5 text-sm text-accent mb-1">
            <Package :size="14" />
            <span>出货箱</span>
          </div>
          <p class="text-xs text-muted mb-2">放入的物品将在次日结算。</p>

          <!-- 已放入的物品 -->
          <div v-if="shopStore.shippingBox.length > 0" class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs text-muted mb-1">已放入</p>
            <div class="flex flex-col gap-1 max-h-36 overflow-y-auto">
              <div
                v-for="(entry, idx) in shopStore.shippingBox"
                :key="idx"
                class="flex items-center justify-between border border-accent/20 rounded-xs px-2 py-1 cursor-pointer hover:bg-accent/5"
                @click="handleRemoveFromBox(entry.itemId, entry.quantity, entry.quality)"
              >
                <div class="min-w-0">
                  <span
                    class="text-xs"
                    :class="{
                      'text-quality-fine': entry.quality === 'fine',
                      'text-quality-excellent': entry.quality === 'excellent',
                      'text-quality-supreme': entry.quality === 'supreme'
                    }"
                  >
                    {{ getItemName(entry.itemId) }}
                  </span>
                  <span class="text-muted text-xs ml-1">×{{ entry.quantity }}</span>
                </div>
                <span class="text-xs text-accent whitespace-nowrap ml-2">
                  ≈{{ shopStore.calculateSellPrice(entry.itemId, entry.quantity, entry.quality) }}文
                </span>
              </div>
            </div>
            <p class="text-xs text-accent mt-1.5">预计收入：{{ shippingBoxTotal }}文</p>
          </div>
          <div v-else class="flex flex-col items-center justify-center py-4 text-muted mb-2">
            <Package :size="24" />
            <p class="text-xs mt-1">出货箱是空的</p>
          </div>

          <!-- 可放入的背包物品 -->
          <div v-if="shippableItems.length > 0" class="border border-accent/10 rounded-xs p-2">
            <p class="text-xs text-muted mb-1">背包物品</p>
            <div class="flex flex-col gap-1 overflow-auto max-h-48">
              <div
                v-for="item in shippableItems"
                :key="item.itemId + item.quality"
                class="flex items-center justify-between border border-accent/10 rounded-xs px-2 py-1"
              >
                <div class="min-w-0">
                  <span
                    class="text-xs"
                    :class="{
                      'text-quality-fine': item.quality === 'fine',
                      'text-quality-excellent': item.quality === 'excellent',
                      'text-quality-supreme': item.quality === 'supreme'
                    }"
                  >
                    {{ item.def?.name }}
                  </span>
                  <span class="text-muted text-xs ml-1">×{{ item.quantity }}</span>
                </div>
                <div class="flex gap-1">
                  <button class="btn text-xs" @click="handleAddToBox(item.itemId, 1, item.quality)">放入1</button>
                  <button v-if="item.quantity > 1" class="btn text-xs" @click="handleAddToBox(item.itemId, item.quantity, item.quality)">
                    全部
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 果树区 -->
    <div class="mt-3 border border-accent/20 rounded-xs p-3">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-1.5 text-sm text-accent">
          <TreeDeciduous :size="14" />
          <span>果树</span>
        </div>
        <span class="text-xs text-muted">{{ farmStore.fruitTrees.length }}/{{ MAX_FRUIT_TREES }}</span>
      </div>
      <div v-if="farmStore.fruitTrees.length > 0" class="flex flex-col gap-1 mb-2">
        <div
          v-for="tree in farmStore.fruitTrees"
          :key="tree.id"
          class="flex items-center justify-between border border-accent/10 rounded-xs px-3 py-1.5"
        >
          <span class="text-xs" :class="tree.mature ? 'text-accent' : 'text-muted'">{{ getTreeName(tree.type) }}</span>
          <template v-if="!tree.mature">
            <div class="flex items-center gap-2 flex-1 ml-3">
              <div class="flex-1 h-1 bg-bg rounded-xs border border-accent/10">
                <div
                  class="h-full rounded-xs bg-success transition-all"
                  :style="{ width: Math.floor((tree.growthDays / 28) * 100) + '%' }"
                />
              </div>
              <span class="text-xs text-muted whitespace-nowrap">{{ tree.growthDays }}/28天</span>
            </div>
          </template>
          <span v-else-if="tree.todayFruit" class="text-xs text-accent">今日已结果</span>
          <span v-else class="text-xs text-success">已成熟 · {{ getTreeFruitSeason(tree.type) }}产果</span>
        </div>
      </div>
      <div v-else class="flex flex-col items-center justify-center py-4 text-muted mb-2">
        <TreeDeciduous :size="24" />
        <p class="text-xs mt-1">暂无果树</p>
      </div>
      <div v-if="plantableSaplings.length > 0 && farmStore.fruitTrees.length < MAX_FRUIT_TREES" class="flex gap-1.5 flex-wrap">
        <button v-for="s in plantableSaplings" :key="s.saplingId" class="btn text-xs" @click="handlePlantTree(s.type)">
          <TreePine :size="12" />
          种{{ s.name }} (×{{ s.count }})
        </button>
      </div>
    </div>

    <!-- 野树区 -->
    <div class="mt-3 border border-accent/20 rounded-xs p-3">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-1.5 text-sm text-accent">
          <TreePine :size="14" />
          <span>野树</span>
        </div>
        <span class="text-xs text-muted">{{ farmStore.wildTrees.length }}/{{ MAX_WILD_TREES }}</span>
      </div>
      <div v-if="farmStore.wildTrees.length > 0" class="flex flex-col gap-1 mb-2">
        <div
          v-for="tree in farmStore.wildTrees"
          :key="tree.id"
          class="flex items-center justify-between border border-accent/10 rounded-xs px-3 py-1.5"
        >
          <span class="text-xs" :class="tree.mature ? 'text-accent' : 'text-muted'">{{ getWildTreeName(tree.type) }}</span>
          <template v-if="!tree.mature">
            <div class="flex items-center gap-2 flex-1 ml-3">
              <div class="flex-1 h-1 bg-bg rounded-xs border border-accent/10">
                <div
                  class="h-full rounded-xs bg-success transition-all"
                  :style="{ width: Math.floor((tree.growthDays / (getWildTreeDef(tree.type)?.growthDays ?? 28)) * 100) + '%' }"
                />
              </div>
              <span class="text-xs text-muted whitespace-nowrap">
                {{ tree.growthDays }}/{{ getWildTreeDef(tree.type)?.growthDays ?? '?' }}天
              </span>
            </div>
          </template>
          <template v-else-if="!tree.hasTapper">
            <div class="flex items-center gap-2">
              <span class="text-xs text-success">已成熟</span>
              <button v-if="hasTapper" class="btn text-xs" @click.stop="handleAttachTapper(tree.id)">
                <Wrench :size="12" />
                装采脂器
              </button>
              <span v-else class="text-xs text-muted">需制造采脂器</span>
            </div>
          </template>
          <template v-else-if="tree.tapReady">
            <div class="flex items-center gap-2">
              <span class="text-xs text-accent">可收取</span>
              <button class="btn text-xs bg-accent! text-bg!" @click.stop="handleCollectTapProduct(tree.id)">
                <Gift :size="12" />
                收取
              </button>
            </div>
          </template>
          <template v-else>
            <span class="text-xs text-muted">采脂中 {{ tree.tapDaysElapsed }}/{{ getWildTreeDef(tree.type)?.tapCycleDays ?? '?' }}天</span>
          </template>
        </div>
      </div>
      <div v-else class="flex flex-col items-center justify-center py-4 text-muted mb-2">
        <TreePine :size="24" />
        <p class="text-xs mt-1">暂无野树</p>
      </div>
      <div v-if="plantableWildSeeds.length > 0 && farmStore.wildTrees.length < MAX_WILD_TREES" class="flex gap-1.5 flex-wrap">
        <button v-for="s in plantableWildSeeds" :key="s.type" class="btn text-xs" @click="handlePlantWildTree(s.type)">
          <TreePine :size="12" />
          种{{ s.name }} (×{{ s.count }})
        </button>
      </div>
    </div>

    <!-- 温室 -->
    <div v-if="showGreenhouse" class="mt-3 border border-accent/20 rounded-xs p-3">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-1.5 text-sm text-accent">
          <Warehouse :size="14" />
          <span>温室</span>
        </div>
        <button class="btn text-xs" :class="{ 'bg-accent! text-bg!': greenhouseMode }" @click="greenhouseMode = !greenhouseMode">
          <template v-if="greenhouseMode">
            <ArrowLeft :size="12" />
            返回
          </template>
          <template v-else>
            <ArrowRight :size="12" />
            进入
          </template>
        </button>
      </div>
      <p v-if="!greenhouseMode" class="text-xs text-muted">无季节限制，自动浇水。</p>
      <template v-if="greenhouseMode">
        <!-- 温室地块 -->
        <div class="grid gap-1 max-w-md" style="grid-template-columns: repeat(4, minmax(0, 1fr))">
          <button
            v-for="plot in farmStore.greenhousePlots"
            :key="plot.id"
            class="aspect-square border border-accent/20 rounded-xs flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-accent/60 hover:bg-panel/80 leading-tight"
            :class="getPlotDisplay(plot).color"
            :title="getPlotTooltip(plot)"
            @click="activeGhPlotId = plot.id"
          >
            <span class="text-sm">{{ getPlotDisplay(plot).text }}</span>
            <span v-if="plot.cropId" class="text-[10px] opacity-70 truncate max-w-full px-0.5">{{ getCropName(plot.cropId) }}</span>
          </button>
        </div>
      </template>
    </div>

    <!-- 温室地块操作弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="activeGhPlot"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="activeGhPlotId = null"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="activeGhPlotId = null">
            <X :size="14" />
          </button>
          <p class="text-accent text-sm mb-2">温室地块 #{{ activeGhPlot.id + 1 }}</p>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <div class="flex flex-col gap-1">
              <div class="flex items-center justify-between">
                <span class="text-xs text-muted">状态</span>
                <span class="text-xs">{{ ghPlotStateLabel }}</span>
              </div>
              <div v-if="activeGhPlot.cropId" class="flex items-center justify-between">
                <span class="text-xs text-muted">作物</span>
                <span class="text-xs">{{ getCropName(activeGhPlot.cropId) }}</span>
              </div>
              <div v-if="activeGhPlot.cropId && activeGhPlot.state !== 'harvestable'" class="flex items-center gap-2">
                <span class="text-xs text-muted shrink-0">生长</span>
                <div class="flex-1 h-1 bg-bg rounded-xs border border-accent/10">
                  <div
                    class="h-full rounded-xs bg-success transition-all"
                    :style="{ width: Math.floor((activeGhPlot.growthDays / (Number(ghPlotCropGrowthDays) || 1)) * 100) + '%' }"
                  />
                </div>
                <span class="text-xs text-muted whitespace-nowrap">{{ activeGhPlot.growthDays }}/{{ ghPlotCropGrowthDays }}天</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-muted">特性</span>
                <span class="text-xs text-water">自动浇水 · 无季节限制</span>
              </div>
            </div>
          </div>

          <!-- 操作区 -->
          <div class="flex flex-col gap-1.5">
            <!-- 已耕 → 种植（所有种子） -->
            <div v-if="activeGhPlot.state === 'tilled' && allSeeds.length > 0" class="border border-accent/10 rounded-xs p-2">
              <p class="text-xs text-muted mb-1">种植</p>
              <div class="flex flex-wrap gap-1">
                <button v-for="seed in allSeeds" :key="seed.cropId" class="btn text-xs" @click="doGhPlant(seed.cropId)">
                  {{ seed.name }} (×{{ seed.count }})
                </button>
              </div>
            </div>

            <!-- 可收获 → 收获 -->
            <button
              v-if="activeGhPlot.state === 'harvestable'"
              class="btn text-xs w-full justify-center bg-accent! text-bg!"
              @click="doGhHarvest"
            >
              <Wheat :size="12" />
              收获
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import {
    Droplets,
    Droplet,
    TreePine,
    TreeDeciduous,
    ArrowRight,
    ArrowLeft,
    Wrench,
    Gift,
    CirclePlus,
    X,
    Shovel,
    Wheat,
    Sprout,
    Package,
    Warehouse
  } from 'lucide-vue-next'
  import {
    useFarmStore,
    useInventoryStore,
    useGameStore,
    useHomeStore,
    usePlayerStore,
    useSkillStore,
    useShopStore,
    SEASON_NAMES
  } from '@/stores'
  import { getCropById, getCropsBySeason, getItemById } from '@/data'
  import { FRUIT_TREE_DEFS, MAX_FRUIT_TREES } from '@/data/fruitTrees'
  import { WILD_TREE_DEFS, MAX_WILD_TREES, getWildTreeDef } from '@/data/wildTrees'
  import { CROPS } from '@/data/crops'
  import { FERTILIZERS, getFertilizerById } from '@/data/processing'
  import { ACTION_TIME_COSTS } from '@/data/timeConstants'
  import { addLog, showFloat } from '@/composables/useGameLog'
  import {
    handlePlotClick,
    useFarmActions,
    handleBatchWater,
    handleBatchTill,
    handleBatchHarvest,
    QUALITY_NAMES
  } from '@/composables/useFarmActions'
  import type { SprinklerType, FertilizerType, FruitTreeType, WildTreeType } from '@/types'
  import { sfxHarvest } from '@/composables/useAudio'

  const { selectedSeed } = useFarmActions()

  const farmStore = useFarmStore()
  const inventoryStore = useInventoryStore()
  const gameStore = useGameStore()
  const homeStore = useHomeStore()
  const shopStore = useShopStore()

  // === 出货箱 ===

  const showShippingBox = ref(false)

  const getItemName = (itemId: string): string => getItemById(itemId)?.name ?? itemId

  const shippableItems = computed(() => {
    return inventoryStore.items
      .map(inv => ({ ...inv, def: getItemById(inv.itemId) }))
      .filter(item => item.def && item.def.category !== 'seed' && item.def.category !== 'machine' && item.def.category !== 'sprinkler')
  })

  const shippingBoxTotal = computed(() => {
    return shopStore.shippingBox.reduce((sum, entry) => sum + shopStore.calculateSellPrice(entry.itemId, entry.quantity, entry.quality), 0)
  })

  const handleAddToBox = (itemId: string, quantity: number, quality: import('@/types').Quality) => {
    if (shopStore.addToShippingBox(itemId, quantity, quality)) {
      const name = getItemName(itemId)
      addLog(`将${name}×${quantity}放入了出货箱。`)
    }
  }

  const handleRemoveFromBox = (itemId: string, quantity: number, quality: import('@/types').Quality) => {
    if (shopStore.removeFromShippingBox(itemId, quantity, quality)) {
      const name = getItemName(itemId)
      addLog(`从出货箱取出了${name}×${quantity}。`)
    }
  }

  // === 地块弹窗状态 ===

  const activePlotId = ref<number | null>(null)
  const activePlot = computed(() => (activePlotId.value !== null ? (farmStore.plots.find(p => p.id === activePlotId.value) ?? null) : null))

  const activeGhPlotId = ref<number | null>(null)
  const activeGhPlot = computed(() => (activeGhPlotId.value !== null ? (farmStore.greenhousePlots[activeGhPlotId.value] ?? null) : null))

  // === 弹窗显示辅助 ===

  const STATE_LABELS: Record<string, string> = {
    wasteland: '荒地',
    tilled: '已耕',
    planted: '已种',
    growing: '生长中',
    harvestable: '可收获'
  }

  const plotStateLabel = computed(() => (activePlot.value ? (STATE_LABELS[activePlot.value.state] ?? '?') : ''))
  const ghPlotStateLabel = computed(() => (activeGhPlot.value ? (STATE_LABELS[activeGhPlot.value.state] ?? '?') : ''))

  const plotCropGrowthDays = computed(() => {
    if (!activePlot.value?.cropId) return '?'
    return getCropById(activePlot.value.cropId)?.growthDays ?? '?'
  })

  const ghPlotCropGrowthDays = computed(() => {
    if (!activeGhPlot.value?.cropId) return '?'
    return getCropById(activeGhPlot.value.cropId)?.growthDays ?? '?'
  })

  const plotFertName = computed(() => {
    if (!activePlot.value?.fertilizer) return ''
    return getFertilizerById(activePlot.value.fertilizer)?.name ?? activePlot.value.fertilizer
  })

  const canWater = computed(() => {
    if (!activePlot.value) return false
    return (activePlot.value.state === 'planted' || activePlot.value.state === 'growing') && !activePlot.value.watered
  })

  const canFertilize = computed(() => {
    if (!activePlot.value) return false
    return activePlot.value.state !== 'wasteland' && !activePlot.value.fertilizer
  })

  // === 背包物品列表 ===

  const sprinklerItems = computed(() => {
    const types: { type: SprinklerType; itemId: string; name: string }[] = [
      { type: 'bamboo_sprinkler', itemId: 'bamboo_sprinkler', name: '竹筒洒水器' },
      { type: 'copper_sprinkler', itemId: 'copper_sprinkler', name: '铜管洒水器' },
      { type: 'gold_sprinkler', itemId: 'gold_sprinkler', name: '金管洒水器' }
    ]
    return types.map(s => ({ ...s, count: inventoryStore.getItemCount(s.itemId) })).filter(s => s.count > 0)
  })

  const fertilizerItems = computed(() => {
    return FERTILIZERS.map(f => ({
      type: f.id as FertilizerType,
      itemId: f.id,
      name: f.name,
      count: inventoryStore.getItemCount(f.id)
    })).filter(f => f.count > 0)
  })

  const plantableSeeds = computed(() => {
    return getCropsBySeason(gameStore.season)
      .filter(crop => inventoryStore.hasItem(crop.seedId))
      .map(crop => ({
        cropId: crop.id,
        seedId: crop.seedId,
        name: crop.name,
        count: inventoryStore.getItemCount(crop.seedId)
      }))
  })

  // === 地块显示 ===

  const getCropName = (cropId: string): string => {
    const crop = getCropById(cropId)
    return crop?.name ?? cropId
  }

  const hasSprinkler = (plotId: number): boolean => {
    return farmStore.sprinklers.some(s => s.plotId === plotId)
  }

  const needsWater = (plot: (typeof farmStore.plots)[number]): boolean => {
    return (plot.state === 'planted' || plot.state === 'growing') && !plot.watered
  }

  const unwateredCount = computed(() => farmStore.plots.filter(needsWater).length)
  const wastelandCount = computed(() => farmStore.plots.filter(p => p.state === 'wasteland').length)
  const harvestableCount = computed(() => farmStore.plots.filter(p => p.state === 'harvestable' && p.giantCropGroup === null).length)

  const doBatchWater = () => handleBatchWater()
  const doBatchTill = () => handleBatchTill()
  const doBatchHarvest = () => handleBatchHarvest()

  const getPlotDisplay = (plot: (typeof farmStore.plots)[number]): { text: string; color: string; bg: string } => {
    // 巨型作物特殊显示
    if (plot.giantCropGroup !== null) {
      return { text: '巨', color: 'text-accent', bg: 'bg-accent/10' }
    }
    switch (plot.state) {
      case 'wasteland':
        return { text: '荒', color: 'text-muted', bg: 'bg-panel/40' }
      case 'tilled':
        return { text: '耕', color: 'text-earth', bg: 'bg-earth/8' }
      case 'planted':
        return {
          text: plot.watered ? '润' : '苗',
          color: plot.watered ? 'text-water' : 'text-success/60',
          bg: plot.watered ? 'bg-water/8' : 'bg-success/5'
        }
      case 'growing': {
        const crop = getCropById(plot.cropId!)
        const progress = crop ? Math.floor((plot.growthDays / crop.growthDays) * 100) : 0
        return {
          text: plot.watered ? '润' : '长',
          color: plot.watered ? 'text-water' : progress > 60 ? 'text-success' : 'text-success/80',
          bg: plot.watered ? 'bg-water/8' : 'bg-success/8'
        }
      }
      case 'harvestable':
        return { text: '熟', color: 'text-accent', bg: 'bg-accent/15' }
      default:
        return { text: '？', color: 'text-muted', bg: 'bg-panel/40' }
    }
  }

  const getPlotTooltip = (plot: (typeof farmStore.plots)[number]): string => {
    let tip = ''
    if (plot.state === 'wasteland') tip = '荒地（点击开垦）'
    else if (plot.state === 'tilled') tip = '已耕地（点击播种）'
    else if (plot.state === 'harvestable') {
      const crop = getCropById(plot.cropId!)
      tip = `${crop?.name ?? ''}已成熟（点击收获）`
    } else if (plot.state === 'planted' || plot.state === 'growing') {
      const crop = getCropById(plot.cropId!)
      tip = `${crop?.name ?? ''} ${plot.growthDays}/${crop?.growthDays ?? '?'}天 ${plot.watered ? '已浇水' : '需浇水'}`
    }
    if (hasSprinkler(plot.id)) tip += ' [洒水器]'
    if (plot.fertilizer) {
      const fertDef = getFertilizerById(plot.fertilizer)
      tip += ` [${fertDef?.name ?? plot.fertilizer}]`
    }
    return tip
  }

  // === 弹窗操作：农场 ===

  const doTill = () => {
    if (activePlotId.value === null) return
    selectedSeed.value = null
    handlePlotClick(activePlotId.value)
    activePlotId.value = null
  }

  const doPlant = (cropId: string) => {
    if (activePlotId.value === null) return
    selectedSeed.value = cropId
    handlePlotClick(activePlotId.value)
    selectedSeed.value = null
    activePlotId.value = null
  }

  const doWater = () => {
    if (activePlotId.value === null) return
    selectedSeed.value = null
    handlePlotClick(activePlotId.value)
    activePlotId.value = null
  }

  const doHarvest = () => {
    if (activePlotId.value === null) return
    const plot = farmStore.plots.find(p => p.id === activePlotId.value)
    if (plot && plot.giantCropGroup !== null) {
      const result = farmStore.harvestGiantCrop(activePlotId.value)
      if (result) {
        inventoryStore.addItem(result.cropId, result.quantity)
        const cropName = getCropName(result.cropId)
        addLog(`收获了巨型${cropName}！获得了${result.quantity}个${cropName}！`)
        showFloat(`巨型${cropName} ×${result.quantity}`, 'accent')
        sfxHarvest()
      }
      activePlotId.value = null
      return
    }
    selectedSeed.value = null
    handlePlotClick(activePlotId.value)
    activePlotId.value = null
  }

  const doFertilize = (type: FertilizerType) => {
    if (activePlotId.value === null) return
    if (!inventoryStore.removeItem(type)) {
      addLog('没有该肥料了。')
      return
    }
    if (farmStore.applyFertilizer(activePlotId.value, type)) {
      const fertDef = getFertilizerById(type)
      addLog(`施了${fertDef?.name ?? '肥料'}。`)
    } else {
      inventoryStore.addItem(type)
      addLog('无法在此施肥（需要已开垦且未施肥的地块）。')
    }
    activePlotId.value = null
  }

  const doPlaceSprinkler = (type: SprinklerType) => {
    if (activePlotId.value === null) return
    if (!inventoryStore.removeItem(type)) {
      addLog('没有该洒水器了。')
      return
    }
    if (farmStore.placeSprinkler(activePlotId.value, type)) {
      addLog('放置了洒水器，周围地块将自动浇水。')
    } else {
      inventoryStore.addItem(type)
      addLog('无法在此放置洒水器。')
    }
    activePlotId.value = null
  }

  const doRemoveSprinkler = () => {
    if (activePlotId.value === null) return
    const type = farmStore.removeSprinkler(activePlotId.value)
    if (type) {
      inventoryStore.addItem(type)
      addLog('拆除了洒水器，已回收到背包。')
    }
    activePlotId.value = null
  }

  // === 果树 ===

  const getTreeName = (type: string): string => {
    return FRUIT_TREE_DEFS.find(d => d.type === type)?.name ?? type
  }

  const getTreeFruitSeason = (type: string): string => {
    const def = FRUIT_TREE_DEFS.find(d => d.type === type)
    if (!def) return '?'
    return SEASON_NAMES[def.fruitSeason as keyof typeof SEASON_NAMES]
  }

  const plantableSaplings = computed(() => {
    return FRUIT_TREE_DEFS.filter(d => inventoryStore.hasItem(d.saplingId)).map(d => ({
      type: d.type as FruitTreeType,
      saplingId: d.saplingId,
      name: d.name,
      count: inventoryStore.getItemCount(d.saplingId)
    }))
  })

  const plantableWildSeeds = computed(() => {
    return WILD_TREE_DEFS.filter(d => inventoryStore.hasItem(d.seedItemId)).map(d => ({
      type: d.type as WildTreeType,
      seedItemId: d.seedItemId,
      name: d.name,
      count: inventoryStore.getItemCount(d.seedItemId)
    }))
  })

  const hasTapper = computed(() => inventoryStore.getItemCount('tapper') > 0)

  const handlePlantTree = (treeType: FruitTreeType) => {
    const def = FRUIT_TREE_DEFS.find(d => d.type === treeType)
    if (!def) return
    if (!inventoryStore.removeItem(def.saplingId)) {
      addLog('背包中没有该树苗。')
      return
    }
    if (farmStore.plantFruitTree(treeType)) {
      addLog(`种下了${def.name}苗，需28天成熟。`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.plantTree)
      if (tr.message) addLog(tr.message)
    } else {
      inventoryStore.addItem(def.saplingId)
      addLog(`果树位已满（最多${MAX_FRUIT_TREES}棵）。`)
    }
  }

  // === 野树 ===

  const getWildTreeName = (type: string): string => {
    return getWildTreeDef(type)?.name ?? type
  }

  const handlePlantWildTree = (treeType: WildTreeType) => {
    const def = WILD_TREE_DEFS.find(d => d.type === treeType)
    if (!def) return
    if (!inventoryStore.removeItem(def.seedItemId)) {
      addLog('背包中没有该种子。')
      return
    }
    if (farmStore.plantWildTree(treeType)) {
      addLog(`种下了${def.name}，需${def.growthDays}天成熟。`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.plantTree)
      if (tr.message) addLog(tr.message)
    } else {
      inventoryStore.addItem(def.seedItemId)
      addLog(`野树位已满（最多${MAX_WILD_TREES}棵）。`)
    }
  }

  const handleAttachTapper = (treeId: number) => {
    if (!inventoryStore.removeItem('tapper')) {
      addLog('背包中没有采脂器。')
      return
    }
    if (farmStore.attachTapper(treeId)) {
      addLog('安装了采脂器，将定期产出树脂。')
    } else {
      inventoryStore.addItem('tapper')
      addLog('无法安装采脂器（需要已成熟且未装采脂器的野树）。')
    }
  }

  const handleCollectTapProduct = (treeId: number) => {
    const productId = farmStore.collectTapProduct(treeId)
    if (productId) {
      inventoryStore.addItem(productId)
      const def = WILD_TREE_DEFS.find(d => d.tapProduct === productId)
      addLog(`收取了${def?.tapProductName ?? productId}！`)
    }
  }

  // === 温室 ===

  const showGreenhouse = computed(() => homeStore.greenhouseUnlocked)
  const greenhouseMode = ref(false)

  const allSeeds = computed(() => {
    return CROPS.filter(crop => inventoryStore.hasItem(crop.seedId)).map(crop => ({
      cropId: crop.id,
      seedId: crop.seedId,
      name: crop.name,
      count: inventoryStore.getItemCount(crop.seedId)
    }))
  })

  // === 弹窗操作：温室 ===

  const doGhPlant = (cropId: string) => {
    if (activeGhPlotId.value === null) return
    const crop = getCropById(cropId)
    if (!crop) return
    if (!inventoryStore.removeItem(crop.seedId)) {
      addLog('背包中没有该种子了。')
      return
    }
    if (farmStore.greenhousePlantCrop(activeGhPlotId.value, cropId)) {
      addLog(`在温室中播种了${crop.name}。`)
    } else {
      inventoryStore.addItem(crop.seedId)
    }
    activeGhPlotId.value = null
  }

  const doGhHarvest = () => {
    if (activeGhPlotId.value === null) return
    const playerStore = usePlayerStore()
    if (!playerStore.consumeStamina(1)) {
      addLog('体力不足，无法收获。')
      return
    }
    const cropId = farmStore.greenhouseHarvestPlot(activeGhPlotId.value)
    if (cropId) {
      const cropDef = getCropById(cropId)
      const skillStore = useSkillStore()
      const quality = skillStore.rollCropQualityWithBonus(0)
      inventoryStore.addItem(cropId, 1, quality)
      const qualityLabel = quality !== 'normal' ? `(${QUALITY_NAMES[quality]})` : ''
      sfxHarvest()
      showFloat(`+${cropDef?.name ?? cropId}${qualityLabel}`, 'success')
      addLog(`在温室收获了${cropDef?.name ?? cropId}${qualityLabel}！(-1体力)`)
    }
    activeGhPlotId.value = null
  }
</script>
