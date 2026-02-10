<template>
  <div>
    <!-- 返回按钮（在子商铺时显示） -->
    <button v-if="shopStore.currentShopId" class="btn text-xs mb-3 w-full md:w-auto" @click="shopStore.currentShopId = null">
      <ChevronLeft :size="14" />
      返回商圈
    </button>

    <!-- 移动端：购买/出售切换 -->
    <div class="flex gap-1.5 mb-3 md:hidden">
      <button class="btn text-xs flex-1 justify-center" :class="{ 'bg-accent! text-bg!': mobileTab === 'buy' }" @click="mobileTab = 'buy'">
        <ShoppingCart :size="14" />
        购买
      </button>
      <button
        class="btn text-xs flex-1 justify-center"
        :class="{ 'bg-accent! text-bg!': mobileTab === 'sell' }"
        @click="mobileTab = 'sell'"
      >
        <Coins :size="14" />
        出售
      </button>
    </div>

    <div class="flex flex-col md:flex-row gap-4 md:gap-6">
      <!-- 左侧：购买区 -->
      <div class="flex-1" :class="{ 'hidden md:block': mobileTab === 'sell' }">
        <!-- 折扣提示 -->
        <p v-if="hasDiscount" class="text-success text-xs mb-3">商人印章生效中：所有购物价格 -10%</p>

        <!-- ====== 商圈总览 ====== -->
        <template v-if="!shopStore.currentShopId">
          <h3 class="text-accent text-sm mb-3">
            <Store :size="14" class="inline" />
            桃源商圈
          </h3>
          <p class="text-muted text-xs mb-3">点击商铺进入选购。</p>

          <!-- 旅行商人（仅周五/日） -->
          <div v-if="shopStore.isMerchantHere" class="mb-4">
            <h4 class="text-accent text-sm mb-2">
              <MapPin :size="14" class="inline" />
              旅行商人 · 限时特卖
            </h4>
            <p class="text-muted text-xs mb-2">旅行商人今天在桃源村摆摊，带来了稀有货物！</p>
            <div class="flex flex-col gap-2">
              <div
                v-for="item in shopStore.travelingStock"
                :key="item.itemId"
                class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-2"
                :class="item.quantity > 0 ? 'cursor-pointer hover:bg-accent/5' : 'opacity-50'"
                @click="
                  item.quantity > 0 &&
                  openBuyModal(
                    item.name,
                    `剩余${item.quantity}个`,
                    discounted(item.price),
                    () => handleBuyFromTraveler(item.itemId, item.name, item.price),
                    () => item.quantity > 0 && playerStore.money >= discounted(item.price)
                  )
                "
              >
                <div>
                  <p class="text-sm">{{ item.name }}</p>
                  <p class="text-muted text-xs">剩余{{ item.quantity }}个</p>
                </div>
                <span class="text-xs text-accent whitespace-nowrap">{{ discounted(item.price) }}文</span>
              </div>
            </div>
          </div>

          <!-- 六大商铺卡片 -->
          <div class="flex flex-col gap-2">
            <div
              v-for="shop in SHOPS"
              :key="shop.id"
              class="flex items-center justify-between border rounded-xs px-3 py-2"
              :class="isOpen(shop) ? 'border-accent/30 cursor-pointer hover:bg-accent/5' : 'border-accent/10 opacity-50'"
              @click="isOpen(shop) && enterShop(shop.id)"
            >
              <div>
                <span class="text-sm">{{ shop.name }}</span>
                <span class="text-muted text-xs ml-2">{{ shop.npcName }}</span>
                <span v-if="!isOpen(shop)" class="text-danger text-xs ml-2">{{ closedReason(shop) }}</span>
              </div>
              <ChevronRight v-if="isOpen(shop)" :size="14" class="text-muted" />
            </div>
          </div>
        </template>

        <!-- ====== 万物铺 ====== -->
        <template v-else-if="shopStore.currentShopId === 'wanwupu'">
          <ShopHeader name="万物铺" npc="陈伯" />

          <!-- 当季种子 -->
          <h4 class="text-accent text-sm mb-2 mt-3">
            <Sprout :size="14" class="inline" />
            当季种子
          </h4>
          <div class="flex flex-col gap-2">
            <div
              v-for="seed in shopStore.availableSeeds"
              :key="seed.seedId"
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-2 cursor-pointer hover:bg-accent/5"
              @click="
                openBuyModal(
                  seed.cropName + '种子',
                  `${seed.growthDays}天成熟 → 售${seed.sellPrice}文`,
                  discounted(seed.price),
                  () => handleBuySeed(seed.seedId),
                  () => playerStore.money >= discounted(seed.price)
                )
              "
            >
              <div>
                <p class="text-sm">{{ seed.cropName }}种子</p>
                <p class="text-muted text-xs">{{ seed.growthDays }}天 → 售{{ seed.sellPrice }}文</p>
              </div>
              <span class="text-xs text-accent whitespace-nowrap">{{ discounted(seed.price) }}文</span>
            </div>
            <p v-if="shopStore.availableSeeds.length === 0" class="text-muted text-xs">本季没有种子出售。</p>
          </div>

          <!-- 杂货 -->
          <h4 class="text-accent text-sm mb-2 mt-4">
            <Package :size="14" class="inline" />
            杂货
          </h4>
          <div class="flex flex-col gap-2">
            <!-- 背包扩容 -->
            <div
              v-if="inventoryStore.capacity < 60"
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-2 cursor-pointer hover:bg-accent/5"
              @click="
                openBuyModal(
                  '背包扩容',
                  `当前${inventoryStore.capacity}格 → ${inventoryStore.capacity + 4}格`,
                  discounted(bagPrice),
                  handleBuyBag,
                  () => playerStore.money >= discounted(bagPrice)
                )
              "
            >
              <div>
                <p class="text-sm">背包扩容</p>
                <p class="text-muted text-xs">当前{{ inventoryStore.capacity }}格 → {{ inventoryStore.capacity + 4 }}格</p>
              </div>
              <span class="text-xs text-accent whitespace-nowrap">{{ discounted(bagPrice) }}文</span>
            </div>

            <!-- 仓库扩容 -->
            <div
              v-if="warehouseStore.unlocked && warehouseStore.capacity < warehouseStore.MAX_CAPACITY"
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-2 cursor-pointer hover:bg-accent/5"
              @click="
                openBuyModal(
                  '仓库扩容',
                  `当前${warehouseStore.capacity}格 → ${warehouseStore.capacity + warehouseStore.EXPAND_STEP}格`,
                  discounted(warehousePrice),
                  handleBuyWarehouse,
                  () => playerStore.money >= discounted(warehousePrice)
                )
              "
            >
              <div>
                <p class="text-sm">仓库扩容</p>
                <p class="text-muted text-xs">
                  当前{{ warehouseStore.capacity }}格 → {{ warehouseStore.capacity + warehouseStore.EXPAND_STEP }}格
                </p>
              </div>
              <span class="text-xs text-accent whitespace-nowrap">{{ discounted(warehousePrice) }}文</span>
            </div>

            <!-- 农场扩建 -->
            <div
              v-if="farmExpandInfo"
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-2 cursor-pointer hover:bg-accent/5"
              @click="
                openBuyModal(
                  '农场扩建',
                  `${farmStore.farmSize}×${farmStore.farmSize} → ${farmExpandInfo.newSize}×${farmExpandInfo.newSize}`,
                  discounted(farmExpandInfo.price),
                  handleBuyFarmExpand,
                  () => playerStore.money >= discounted(farmExpandInfo!.price)
                )
              "
            >
              <div>
                <p class="text-sm">农场扩建</p>
                <p class="text-muted text-xs">
                  {{ farmStore.farmSize }}×{{ farmStore.farmSize }} → {{ farmExpandInfo.newSize }}×{{ farmExpandInfo.newSize }}
                </p>
              </div>
              <span class="text-xs text-accent whitespace-nowrap">{{ discounted(farmExpandInfo.price) }}文</span>
            </div>

            <!-- 树苗 -->
            <div
              v-for="tree in FRUIT_TREE_DEFS"
              :key="tree.saplingId"
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-2 cursor-pointer hover:bg-accent/5"
              @click="
                openBuyModal(
                  tree.name + '苗',
                  `28天成熟 · ${seasonName(tree.fruitSeason)}季产${tree.fruitName}`,
                  discounted(tree.saplingPrice),
                  () => handleBuySapling(tree.saplingId, tree.saplingPrice, tree.name),
                  () => playerStore.money >= discounted(tree.saplingPrice)
                )
              "
            >
              <div>
                <p class="text-sm">{{ tree.name }}苗</p>
                <p class="text-muted text-xs">28天成熟 · {{ seasonName(tree.fruitSeason) }}季产{{ tree.fruitName }}</p>
              </div>
              <span class="text-xs text-accent whitespace-nowrap">{{ discounted(tree.saplingPrice) }}文</span>
            </div>

            <!-- 干草 -->
            <div
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-2 cursor-pointer hover:bg-accent/5"
              @click="
                openBuyModal('干草', '喂养牲畜用', discounted(HAY_PRICE), handleBuyHay, () => playerStore.money >= discounted(HAY_PRICE))
              "
            >
              <div>
                <p class="text-sm">干草</p>
                <p class="text-muted text-xs">喂养牲畜用</p>
              </div>
              <span class="text-xs text-accent whitespace-nowrap">{{ discounted(HAY_PRICE) }}文</span>
            </div>

            <!-- 雨图腾 -->
            <div
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-2 cursor-pointer hover:bg-accent/5"
              @click="
                openBuyModal(
                  '雨图腾',
                  '使用后可以让明天下雨',
                  discounted(RAIN_TOTEM_PRICE),
                  () => handleBuyItem('rain_totem', RAIN_TOTEM_PRICE, '雨图腾'),
                  () => playerStore.money >= discounted(RAIN_TOTEM_PRICE)
                )
              "
            >
              <div>
                <p class="text-sm">雨图腾</p>
                <p class="text-muted text-xs">使用后可以让明天下雨</p>
              </div>
              <span class="text-xs text-accent whitespace-nowrap">{{ discounted(RAIN_TOTEM_PRICE) }}文</span>
            </div>
          </div>
        </template>

        <!-- ====== 铁匠铺 ====== -->
        <template v-else-if="shopStore.currentShopId === 'tiejiangpu'">
          <ShopHeader name="铁匠铺" npc="孙铁匠" />

          <div class="flex flex-col gap-2">
            <div
              v-for="item in shopStore.blacksmithItems"
              :key="item.itemId"
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-2 cursor-pointer hover:bg-accent/5"
              @click="
                openBuyModal(
                  item.name,
                  item.description,
                  discounted(item.price),
                  () => handleBuyItem(item.itemId, item.price, item.name),
                  () => playerStore.money >= discounted(item.price)
                )
              "
            >
              <div>
                <p class="text-sm">{{ item.name }}</p>
                <p class="text-muted text-xs">{{ item.description }}</p>
              </div>
              <span class="text-xs text-accent whitespace-nowrap">{{ discounted(item.price) }}文</span>
            </div>
          </div>

          <!-- 戒指合成 -->
          <h4 class="text-accent text-sm mb-2 mt-4">
            <CircleDot :size="14" class="inline" />
            戒指合成
          </h4>
          <div class="flex flex-col gap-2">
            <div
              v-for="ring in craftableRings"
              :key="ring.id"
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-2 cursor-pointer hover:bg-accent/5"
              @click="openRingModal(ring)"
            >
              <div>
                <p class="text-sm">
                  {{ ring.name }}
                  <span v-if="inventoryStore.hasRing(ring.id)" class="text-success text-xs ml-1">已拥有</span>
                </p>
                <p class="text-muted text-xs">{{ ring.description }}</p>
              </div>
              <span class="text-xs text-accent whitespace-nowrap">{{ ring.recipeMoney }}文</span>
            </div>
            <p v-if="craftableRings.length === 0" class="text-muted text-xs">没有可合成的戒指。</p>
          </div>
        </template>

        <!-- ====== 镖局 ====== -->
        <template v-else-if="shopStore.currentShopId === 'biaoju'">
          <ShopHeader name="镖局" npc="云飞" />

          <!-- 武器 -->
          <h4 class="text-accent text-sm mb-2">
            <Sword :size="14" class="inline" />
            武器
          </h4>
          <div class="flex flex-col gap-2">
            <div
              v-for="w in SHOP_WEAPONS"
              :key="w.id"
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-2 cursor-pointer hover:bg-accent/5"
              @click="openWeaponModal(w)"
            >
              <div>
                <p class="text-sm">
                  {{ w.name }}
                  <span v-if="inventoryStore.hasWeapon(w.id)" class="text-success text-xs ml-1">已拥有</span>
                </p>
                <p class="text-muted text-xs">{{ WEAPON_TYPE_NAMES[w.type] }} · 攻击{{ w.attack }}</p>
              </div>
              <span class="text-xs text-accent whitespace-nowrap">{{ discounted(w.shopPrice!) }}文</span>
            </div>
          </div>

          <!-- 炸弹 -->
          <h4 class="text-accent text-sm mb-2 mt-4">
            <Bomb :size="14" class="inline" />
            炸弹
          </h4>
          <div class="flex flex-col gap-2">
            <div
              v-for="b in shopBombs"
              :key="b.id"
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-2 cursor-pointer hover:bg-accent/5"
              @click="
                openBuyModal(
                  b.name,
                  b.description,
                  discounted(b.shopPrice!),
                  () => handleBuyItem(b.id, b.shopPrice!, b.name),
                  () => playerStore.money >= discounted(b.shopPrice!)
                )
              "
            >
              <div>
                <p class="text-sm">{{ b.name }}</p>
                <p class="text-muted text-xs">{{ b.description }}</p>
              </div>
              <span class="text-xs text-accent whitespace-nowrap">{{ discounted(b.shopPrice!) }}文</span>
            </div>
          </div>
        </template>

        <!-- ====== 渔具铺 ====== -->
        <template v-else-if="shopStore.currentShopId === 'yugupu'">
          <ShopHeader name="渔具铺" npc="秋月" />

          <!-- 鱼饵 -->
          <h4 class="text-accent text-sm mb-2">
            <Fish :size="14" class="inline" />
            鱼饵
          </h4>
          <div class="flex flex-col gap-2">
            <div
              v-for="b in shopStore.shopBaits"
              :key="b.id"
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-2 cursor-pointer hover:bg-accent/5"
              @click="
                openBuyModal(
                  b.name,
                  b.description,
                  discounted(b.price),
                  () => handleBuyItem(b.id, b.price, b.name),
                  () => playerStore.money >= discounted(b.price)
                )
              "
            >
              <div>
                <p class="text-sm">{{ b.name }}</p>
                <p class="text-muted text-xs">{{ b.description }}</p>
              </div>
              <span class="text-xs text-accent whitespace-nowrap">{{ discounted(b.price) }}文</span>
            </div>
          </div>

          <!-- 浮漂 -->
          <h4 class="text-accent text-sm mb-2 mt-4">
            <Fish :size="14" class="inline" />
            浮漂
          </h4>
          <div class="flex flex-col gap-2">
            <div
              v-for="t in shopStore.shopTackles"
              :key="t.id"
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-2 cursor-pointer hover:bg-accent/5"
              @click="
                openBuyModal(
                  t.name,
                  t.description,
                  discounted(t.price),
                  () => handleBuyItem(t.id, t.price, t.name),
                  () => playerStore.money >= discounted(t.price)
                )
              "
            >
              <div>
                <p class="text-sm">{{ t.name }}</p>
                <p class="text-muted text-xs">{{ t.description }}</p>
              </div>
              <span class="text-xs text-accent whitespace-nowrap">{{ discounted(t.price) }}文</span>
            </div>
          </div>
        </template>

        <!-- ====== 药铺 ====== -->
        <template v-else-if="shopStore.currentShopId === 'yaopu'">
          <ShopHeader name="药铺" npc="林老" />

          <!-- 肥料 -->
          <h4 class="text-accent text-sm mb-2">
            <Leaf :size="14" class="inline" />
            肥料
          </h4>
          <div class="flex flex-col gap-2">
            <div
              v-for="f in shopStore.shopFertilizers"
              :key="f.id"
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-2 cursor-pointer hover:bg-accent/5"
              @click="
                openBuyModal(
                  f.name,
                  f.description,
                  discounted(f.price),
                  () => handleBuyItem(f.id, f.price, f.name),
                  () => playerStore.money >= discounted(f.price)
                )
              "
            >
              <div>
                <p class="text-sm">{{ f.name }}</p>
                <p class="text-muted text-xs">{{ f.description }}</p>
              </div>
              <span class="text-xs text-accent whitespace-nowrap">{{ discounted(f.price) }}文</span>
            </div>
          </div>

          <!-- 草药 -->
          <h4 class="text-accent text-sm mb-2 mt-4">
            <Sprout :size="14" class="inline" />
            草药
          </h4>
          <div class="flex flex-col gap-2">
            <div
              v-for="item in shopStore.apothecaryItems"
              :key="item.itemId"
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-2 cursor-pointer hover:bg-accent/5"
              @click="
                openBuyModal(
                  item.name,
                  item.description,
                  discounted(item.price),
                  () => handleBuyItem(item.itemId, item.price, item.name),
                  () => playerStore.money >= discounted(item.price)
                )
              "
            >
              <div>
                <p class="text-sm">{{ item.name }}</p>
                <p class="text-muted text-xs">{{ item.description }}</p>
              </div>
              <span class="text-xs text-accent whitespace-nowrap">{{ discounted(item.price) }}文</span>
            </div>
          </div>
        </template>

        <!-- ====== 绸缎庄 ====== -->
        <template v-else-if="shopStore.currentShopId === 'chouduanzhuang'">
          <ShopHeader name="绸缎庄" npc="素素" />

          <div class="flex flex-col gap-2">
            <div
              v-for="item in shopStore.textileItems"
              :key="item.itemId"
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-2 cursor-pointer hover:bg-accent/5"
              @click="
                openBuyModal(
                  item.name,
                  item.description,
                  discounted(item.price),
                  () => handleBuyItem(item.itemId, item.price, item.name),
                  () => playerStore.money >= discounted(item.price)
                )
              "
            >
              <div>
                <p class="text-sm">{{ item.name }}</p>
                <p class="text-muted text-xs">{{ item.description }}</p>
              </div>
              <span class="text-xs text-accent whitespace-nowrap">{{ discounted(item.price) }}文</span>
            </div>
          </div>
        </template>
      </div>

      <!-- 右侧：出售区 -->
      <div class="flex-1" :class="{ 'hidden md:block': mobileTab === 'buy' }">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-accent text-sm">
            <TrendingUp :size="14" class="inline" />
            出售物品
          </h3>
          <button v-if="sellableItems.length > 0" class="btn btn-danger text-xs" @click="handleSellAll()">
            <Coins :size="14" />
            一键全部出售
          </button>
        </div>
        <div class="flex flex-col gap-2">
          <div
            v-for="item in sellableItems"
            :key="item.itemId + item.quality"
            class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-2 cursor-pointer hover:bg-accent/5"
            @click="openSellModal(item.itemId, item.quality)"
          >
            <div>
              <span class="text-sm" :class="qualityTextClass(item.quality)">{{ item.def?.name }}</span>
              <span class="text-muted text-xs ml-1">×{{ item.quantity }}</span>
            </div>
            <span class="text-xs text-accent whitespace-nowrap">{{ item.def?.sellPrice }}文</span>
          </div>
          <p v-if="sellableItems.length === 0" class="text-muted text-xs">背包中没有可出售的物品。</p>
        </div>
      </div>
    </div>

    <!-- 商品详情弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="buyModalData || (sellModalData && sellModalItem)"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-40 p-4"
        @click.self="shopModal = null"
      >
        <!-- 购买弹窗 -->
        <div v-if="buyModalData" class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="shopModal = null">
            <X :size="14" />
          </button>
          <p class="text-sm text-accent mb-2 pr-6">{{ buyModalData.name }}</p>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs text-muted">{{ buyModalData.description }}</p>
            <p v-for="(line, i) in buyModalData.extraLines" :key="i" class="text-xs text-muted mt-0.5">{{ line }}</p>
          </div>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">价格</span>
              <span class="text-xs text-accent">{{ buyModalData.price }}文</span>
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <button
              class="btn text-xs w-full justify-center"
              :class="{ 'bg-accent! text-bg!': buyModalData.canBuy() }"
              :disabled="!buyModalData.canBuy()"
              @click="buyModalData.onBuy()"
            >
              <Hammer v-if="buyModalData.buttonText" :size="14" />
              <ShoppingCart v-else :size="14" />
              {{ buyModalData.buttonText ?? '购买' }} {{ buyModalData.price }}文
            </button>
          </div>
        </div>

        <!-- 出售弹窗 -->
        <div v-else-if="sellModalData && sellModalItem && sellModalDef" class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="shopModal = null">
            <X :size="14" />
          </button>
          <p class="text-sm mb-2 pr-6" :class="qualityTextClass(sellModalItem.quality, 'text-accent')">
            {{ sellModalDef.name }}
          </p>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs text-muted">{{ sellModalDef.description }}</p>
          </div>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">数量</span>
              <span class="text-xs">×{{ sellModalItem.quantity }}</span>
            </div>
            <div v-if="sellModalItem.quality !== 'normal'" class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">品质</span>
              <span class="text-xs" :class="qualityTextClass(sellModalItem.quality)">{{ QUALITY_NAMES[sellModalItem.quality] }}</span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">售价</span>
              <span class="text-xs text-accent">{{ sellModalDef.sellPrice }}文</span>
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <button class="btn text-xs w-full justify-center" @click="handleModalSell(1)">
              <Coins :size="14" />
              出售1个 · {{ sellModalDef.sellPrice }}文
            </button>
            <button
              v-if="sellModalItem.quantity > 1"
              class="btn text-xs w-full justify-center"
              @click="handleModalSell(sellModalItem!.quantity)"
            >
              全部出售 · {{ sellModalDef.sellPrice * sellModalItem.quantity }}文
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
    ShoppingCart,
    Coins,
    Sprout,
    Package,
    TrendingUp,
    Fish,
    Leaf,
    Sword,
    MapPin,
    ChevronRight,
    ChevronLeft,
    Store,
    Bomb,
    CircleDot,
    Hammer,
    X
  } from 'lucide-vue-next'
  import {
    useShopStore,
    usePlayerStore,
    useInventoryStore,
    useFarmStore,
    useWalletStore,
    useGameStore,
    useWarehouseStore,
    SEASON_NAMES
  } from '@/stores'
  import { getItemById } from '@/data'
  import { SHOPS, isShopAvailable, getShopClosedReason } from '@/data/shops'
  import type { ShopDef } from '@/data/shops'
  import { SHOP_WEAPONS, WEAPON_TYPE_NAMES } from '@/data/weapons'
  import type { WeaponDef, RingDef, RingEffectType, Season, Quality } from '@/types'
  import { FRUIT_TREE_DEFS } from '@/data/fruitTrees'
  import { BOMBS } from '@/data/processing'
  import { CRAFTABLE_RINGS } from '@/data/rings'
  import { HAY_PRICE } from '@/data/animals'
  import { addLog } from '@/composables/useGameLog'
  import { sfxBuy } from '@/composables/useAudio'
  import { showFloat } from '@/composables/useGameLog'
  import { handleBuySeed, handleSellItem, handleSellItemAll, handleSellAll, QUALITY_NAMES } from '@/composables/useFarmActions'

  const RAIN_TOTEM_PRICE = 300

  const shopStore = useShopStore()
  const playerStore = usePlayerStore()
  const inventoryStore = useInventoryStore()
  const farmStore = useFarmStore()
  const warehouseStore = useWarehouseStore()
  const walletStore = useWalletStore()
  const gameStore = useGameStore()

  // === 移动端切换 ===

  const mobileTab = ref<'buy' | 'sell'>('buy')

  // === 弹窗系统 ===

  type BuyModalState = {
    type: 'buy'
    name: string
    description: string
    price: number
    onBuy: () => void
    canBuy: () => boolean
    extraLines?: string[]
    buttonText?: string
  }

  type SellModalState = {
    type: 'sell'
    itemId: string
    quality: Quality
  }

  const shopModal = ref<BuyModalState | SellModalState | null>(null)

  const buyModalData = computed(() => {
    if (!shopModal.value || shopModal.value.type !== 'buy') return null
    return shopModal.value
  })

  const sellModalData = computed(() => {
    if (!shopModal.value || shopModal.value.type !== 'sell') return null
    return shopModal.value
  })

  const sellModalItem = computed(() => {
    const data = sellModalData.value
    if (!data) return null
    return inventoryStore.items.find(i => i.itemId === data.itemId && i.quality === data.quality) ?? null
  })

  const sellModalDef = computed(() => {
    const data = sellModalData.value
    if (!data) return null
    return getItemById(data.itemId) ?? null
  })

  const openBuyModal = (
    name: string,
    description: string,
    price: number,
    onBuy: () => void,
    canBuy: () => boolean,
    extraLines?: string[],
    buttonText?: string
  ) => {
    shopModal.value = { type: 'buy', name, description, price, onBuy, canBuy, extraLines, buttonText }
  }

  const openSellModal = (itemId: string, quality: Quality) => {
    shopModal.value = { type: 'sell', itemId, quality }
  }

  const openWeaponModal = (w: WeaponDef) => {
    const lines = [`${WEAPON_TYPE_NAMES[w.type]} · 攻击${w.attack} · 暴击${Math.round(w.critRate * 100)}%`]
    if (w.shopMaterials.length > 0) {
      lines.push('需要材料：' + w.shopMaterials.map(m => `${getItemById(m.itemId)?.name ?? m.itemId}×${m.quantity}`).join('、'))
    }
    openBuyModal(
      w.name,
      w.description,
      discounted(w.shopPrice!),
      () => handleBuyWeapon(w),
      () => !inventoryStore.hasWeapon(w.id) && playerStore.money >= discounted(w.shopPrice!) && hasWeaponMaterials(w),
      lines
    )
  }

  const openRingModal = (ring: RingDef) => {
    const lines = [
      '效果：' +
        ring.effects
          .map(eff => RING_EFFECT_LABELS[eff.type] + (eff.value > 0 && eff.value < 1 ? Math.round(eff.value * 100) + '%' : '+' + eff.value))
          .join('、'),
      '材料：' +
        (ring.recipe?.map(m => `${getItemById(m.itemId)?.name ?? m.itemId}×${m.quantity}`).join('、') ?? '') +
        ` + ${ring.recipeMoney}文`
    ]
    openBuyModal(
      ring.name,
      ring.description,
      ring.recipeMoney,
      () => handleCraftRing(ring.id),
      () => canCraftRing(ring),
      lines,
      '合成'
    )
  }

  const handleModalSell = (count: number) => {
    const modal = shopModal.value
    if (!modal || modal.type !== 'sell') return
    if (count === 1) {
      handleSellItem(modal.itemId, modal.quality)
    } else {
      handleSellItemAll(modal.itemId, count, modal.quality)
    }
    // 物品消耗完则关闭弹窗
    if (!inventoryStore.items.find(i => i.itemId === modal.itemId && i.quality === modal.quality)) {
      shopModal.value = null
    }
  }

  // === 折扣系统 ===

  const hasDiscount = computed(() => walletStore.getShopDiscount() > 0 || inventoryStore.getRingEffectValue('shop_discount') > 0)

  const discounted = (price: number): number => {
    const walletDiscount = walletStore.getShopDiscount()
    const ringDiscount = inventoryStore.getRingEffectValue('shop_discount')
    return Math.floor(price * (1 - walletDiscount) * (1 - ringDiscount))
  }

  // === 商铺开放状态 ===

  const isOpen = (shop: ShopDef): boolean => {
    return isShopAvailable(shop, gameStore.day, gameStore.hour, gameStore.weather, gameStore.season)
  }

  const closedReason = (shop: ShopDef): string => {
    return getShopClosedReason(shop, gameStore.day, gameStore.hour, gameStore.weather, gameStore.season)
  }

  const enterShop = (shopId: string) => {
    shopStore.currentShopId = shopId
  }

  // === 旅行商人 ===

  if (shopStore.isMerchantHere) {
    shopStore.refreshMerchantStock()
  }

  const handleBuyFromTraveler = (itemId: string, name: string, originalPrice: number) => {
    const actualPrice = discounted(originalPrice)
    if (shopStore.buyFromTraveler(itemId)) {
      sfxBuy()
      showFloat(`-${actualPrice}文`, 'danger')
      addLog(`从旅行商人处购买了${name}。(-${actualPrice}文)`)
    } else {
      addLog('金币不足或背包已满。')
    }
  }

  // === 万物铺 ===

  const bagPrice = computed(() => {
    const level = (inventoryStore.capacity - 24) / 4
    return 500 + level * 500
  })

  const farmExpandInfo = computed(() => {
    const prices: Record<number, { newSize: number; price: number }> = {
      4: { newSize: 6, price: 2000 },
      6: { newSize: 8, price: 5000 }
    }
    return prices[farmStore.farmSize] ?? null
  })

  const handleBuyBag = () => {
    const actualPrice = discounted(bagPrice.value)
    if (!playerStore.spendMoney(actualPrice)) {
      addLog('金币不足。')
      return
    }
    if (inventoryStore.expandCapacity()) {
      addLog(`背包扩容至${inventoryStore.capacity}格！(-${actualPrice}文)`)
    } else {
      playerStore.earnMoney(actualPrice)
      addLog('背包已满级。')
    }
  }

  const warehousePrice = computed(() => {
    const level = (warehouseStore.capacity - warehouseStore.INITIAL_CAPACITY) / warehouseStore.EXPAND_STEP
    return 800 + level * 400
  })

  const handleBuyWarehouse = () => {
    const actualPrice = discounted(warehousePrice.value)
    if (!playerStore.spendMoney(actualPrice)) {
      addLog('金币不足。')
      return
    }
    if (warehouseStore.expandCapacity()) {
      addLog(`仓库扩容至${warehouseStore.capacity}格！(-${actualPrice}文)`)
    } else {
      playerStore.earnMoney(actualPrice)
      addLog('仓库已满级。')
    }
  }

  const handleBuyFarmExpand = () => {
    const info = farmExpandInfo.value
    if (!info) return
    const actualPrice = discounted(info.price)
    if (!playerStore.spendMoney(actualPrice)) {
      addLog('金币不足。')
      return
    }
    const newSize = farmStore.expandFarm()
    if (newSize) {
      addLog(`农场扩建至${newSize}×${newSize}！(-${actualPrice}文)`)
    } else {
      playerStore.earnMoney(actualPrice)
      addLog('农场已满级。')
    }
  }

  const seasonName = (season: Season): string => {
    return SEASON_NAMES[season] ?? season
  }

  const handleBuySapling = (saplingId: string, price: number, treeName: string) => {
    const actualPrice = discounted(price)
    if (!playerStore.spendMoney(actualPrice)) {
      addLog('金币不足。')
      return
    }
    inventoryStore.addItem(saplingId)
    addLog(`购买了${treeName}苗。(-${actualPrice}文)`)
  }

  const handleBuyHay = () => {
    const actualPrice = discounted(HAY_PRICE)
    if (!playerStore.spendMoney(actualPrice)) {
      addLog('金币不足。')
      return
    }
    inventoryStore.addItem('hay')
    addLog(`购买了干草。(-${actualPrice}文)`)
  }

  // === 镖局 ===

  const shopBombs = computed(() => BOMBS.filter(b => b.shopPrice !== null))

  const hasWeaponMaterials = (w: WeaponDef): boolean => {
    for (const mat of w.shopMaterials) {
      if (inventoryStore.getItemCount(mat.itemId) < mat.quantity) return false
    }
    return true
  }

  const handleBuyWeapon = (w: WeaponDef) => {
    if (inventoryStore.hasWeapon(w.id)) {
      addLog('你已经拥有这把武器了。')
      return
    }
    if (w.shopPrice === null) return
    const actualPrice = discounted(w.shopPrice)
    if (!playerStore.spendMoney(actualPrice)) {
      addLog('金币不足。')
      return
    }
    for (const mat of w.shopMaterials) {
      if (!inventoryStore.removeItem(mat.itemId, mat.quantity)) {
        playerStore.earnMoney(actualPrice)
        addLog('材料不足。')
        return
      }
    }
    inventoryStore.addWeapon(w.id)
    const matStr =
      w.shopMaterials.length > 0 ? ' + ' + w.shopMaterials.map(m => `${getItemById(m.itemId)?.name}×${m.quantity}`).join(' + ') : ''
    addLog(`购买了${w.name}。(-${actualPrice}文${matStr})`)
  }

  // === 戒指合成 ===

  const RING_EFFECT_LABELS: Record<RingEffectType, string> = {
    attack_bonus: '攻击',
    crit_rate_bonus: '暴击',
    defense_bonus: '减伤',
    vampiric: '吸血',
    max_hp_bonus: '生命',
    stamina_reduction: '全局体力减免',
    mining_stamina: '挖矿体力减免',
    farming_stamina: '农耕体力减免',
    fishing_stamina: '钓鱼体力减免',
    crop_quality_bonus: '作物品质',
    crop_growth_bonus: '生长加速',
    fish_quality_bonus: '鱼品质',
    fishing_calm: '鱼速降低',
    sell_price_bonus: '售价加成',
    shop_discount: '商店折扣',
    gift_friendship: '送礼好感',
    monster_drop_bonus: '怪物掉落',
    exp_bonus: '经验加成',
    treasure_find: '宝箱概率',
    ore_bonus: '矿石额外',
    luck: '幸运'
  }

  const craftableRings = computed(() => CRAFTABLE_RINGS)

  const canCraftRing = (ring: RingDef): boolean => {
    if (!ring.recipe) return false
    if (playerStore.money < ring.recipeMoney) return false
    for (const mat of ring.recipe) {
      if (inventoryStore.getItemCount(mat.itemId) < mat.quantity) return false
    }
    return true
  }

  const handleCraftRing = (defId: string) => {
    const result = inventoryStore.craftRing(defId)
    if (result.success) {
      sfxBuy()
      showFloat(result.message, 'success')
      addLog(result.message)
    } else {
      addLog(result.message)
    }
  }

  // === 通用 ===

  const handleBuyItem = (itemId: string, price: number, name: string) => {
    const actualPrice = discounted(price)
    if (shopStore.buyItem(itemId, price)) {
      addLog(`购买了${name}。(-${actualPrice}文)`)
    } else {
      addLog('金币不足或背包已满。')
    }
  }

  const qualityTextClass = (q: Quality, fallback = ''): string => {
    if (q === 'fine') return 'text-quality-fine'
    if (q === 'excellent') return 'text-quality-excellent'
    if (q === 'supreme') return 'text-quality-supreme'
    return fallback
  }

  const sellableItems = computed(() => {
    return inventoryStore.items
      .map(inv => {
        const def = getItemById(inv.itemId)
        return { ...inv, def }
      })
      .filter(item => item.def && item.def.category !== 'seed')
  })
</script>

<!-- ShopHeader 内联子组件 -->
<script lang="ts">
  import { defineComponent, h } from 'vue'

  const ShopHeader = defineComponent({
    name: 'ShopHeader',
    props: {
      name: { type: String, required: true },
      npc: { type: String, required: true }
    },
    setup(props) {
      return () =>
        h('div', { class: 'flex items-center gap-2 mb-3' }, [h('h3', { class: 'text-accent text-sm' }, [`${props.name} · ${props.npc}`])])
    }
  })

  export default { components: { ShopHeader } }
</script>
