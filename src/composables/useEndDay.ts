import {
  useGameStore,
  usePlayerStore,
  useFarmStore,
  useInventoryStore,
  useSaveStore,
  useSkillStore,
  useNpcStore,
  useCookingStore,
  useProcessingStore,
  useAchievementStore,
  useAnimalStore,
  useHomeStore,
  useWalletStore,
  useQuestStore,
  SEASON_NAMES,
  WEATHER_NAMES
} from '@/stores'
import { getItemById, getTodayEvent, getNpcById } from '@/data'
import { RECIPES } from '@/data/recipes'
import { CAVE_UNLOCK_EARNINGS } from '@/data/buildings'
import { addLog, showFloat } from './useGameLog'
import { showEvent, showFestival } from './useDialogs'
import { sfxSleep, useAudio } from './useAudio'

const NPC_NAME_MAP: Record<string, string> = {
  chen_bo: '陈伯',
  liu_niang: '柳娘',
  a_shi: '阿石',
  qiu_yue: '秋月',
  lin_lao: '林老',
  xiao_man: '小满'
}

const getNpcName = (npcId: string): string => {
  return NPC_NAME_MAP[npcId] ?? npcId
}

/** NPC 友好度 → 食谱解锁映射 */
const RECIPE_UNLOCK_MAP: Record<string, string> = {
  chen_bo: 'radish_soup',
  qiu_yue: 'braised_carp',
  lin_lao: 'herbal_porridge',
  liu_niang: 'osmanthus_cake',
  a_shi: 'miner_lunch'
}

/** 检查 NPC 友好度和技能等级解锁食谱 */
const checkRecipeUnlocks = () => {
  const npcStore = useNpcStore()
  const cookingStore = useCookingStore()
  const skillStore = useSkillStore()

  for (const [npcId, recipeId] of Object.entries(RECIPE_UNLOCK_MAP)) {
    const level = npcStore.getFriendshipLevel(npcId)
    if (level !== 'stranger') {
      if (cookingStore.unlockRecipe(recipeId)) {
        addLog(`${getNpcName(npcId)}寄来了新食谱！`)
      }
    }
  }
  for (const recipe of RECIPES) {
    if (recipe.requiredSkill) {
      const skill = skillStore.getSkill(recipe.requiredSkill.type)
      if (skill.level >= recipe.requiredSkill.level) {
        if (cookingStore.unlockRecipe(recipe.id)) {
          addLog(`技能提升解锁了新食谱：${recipe.name}！`)
        }
      }
    }
  }
}

/** 应用季节事件效果 */
const applyEventEffects = (event: { name: string; description: string; effects: any }) => {
  const playerStore = usePlayerStore()
  const npcStore = useNpcStore()
  const inventoryStore = useInventoryStore()
  const effects = event.effects

  if (effects.friendshipBonus) {
    for (const state of npcStore.npcStates) {
      state.friendship += effects.friendshipBonus
    }
  }
  if (effects.moneyReward) {
    playerStore.earnMoney(effects.moneyReward)
    showFloat(`+${effects.moneyReward}文`, 'accent')
  }
  if (effects.staminaBonus) {
    playerStore.restoreStamina(effects.staminaBonus)
    showFloat(`+${effects.staminaBonus}体力`, 'success')
  }
  if (effects.itemReward) {
    for (const item of effects.itemReward) {
      inventoryStore.addItem(item.itemId, item.quantity)
    }
  }
  addLog(`【${event.name}】${event.description}`)
}

/** 日结算处理 */
export const handleEndDay = () => {
  sfxSleep()

  const gameStore = useGameStore()
  const playerStore = usePlayerStore()
  const farmStore = useFarmStore()
  const inventoryStore = useInventoryStore()
  const saveStore = useSaveStore()
  const npcStore = useNpcStore()
  const cookingStore = useCookingStore()
  const processingStore = useProcessingStore()
  const achievementStore = useAchievementStore()
  const animalStore = useAnimalStore()
  const homeStore = useHomeStore()
  const questStore = useQuestStore()

  // 恢复模式
  let recoveryMode: 'normal' | 'late' | 'passout'
  if (playerStore.stamina <= 0 || gameStore.hour >= 26) {
    recoveryMode = 'passout'
  } else if (gameStore.hour >= 24) {
    recoveryMode = 'late'
  } else {
    recoveryMode = 'normal'
  }

  farmStore.dailyUpdate(gameStore.isRainy)
  processingStore.dailyUpdate()

  // 配偶助手（在 dailyReset 之前，因为需要检查 talkedToday）
  const spouse = npcStore.getSpouse()
  if (spouse) {
    const spouseDef = getNpcById(spouse.npcId)
    const spouseName = spouseDef?.name ?? '配偶'
    const bonusChance = spouse.friendship >= 300 ? 0.1 : 0
    if (Math.random() < 0.4 + bonusChance) {
      const unwatered = farmStore.plots.filter(p => (p.state === 'planted' || p.state === 'growing') && !p.watered)
      const count = Math.min(unwatered.length, 2 + Math.floor(Math.random() * 3))
      for (let i = 0; i < count; i++) farmStore.waterPlot(unwatered[i]!.id)
      if (count > 0) addLog(`${spouseName}帮你浇了${count}块地。`)
    }
    if (Math.random() < 0.3 + bonusChance) {
      const result = animalStore.feedAll()
      if (result.fedCount > 0) addLog(`${spouseName}帮你喂了所有牲畜。`)
    }
    if (spouse.friendship >= 200 && Math.random() < 0.25 + bonusChance) {
      const foods = ['rice_ball', 'congee', 'steamed_bun', 'tea']
      const food = foods[Math.floor(Math.random() * foods.length)]!
      inventoryStore.addItem(food)
      addLog(`${spouseName}做了一份${getItemById(food)?.name ?? '食物'}。`)
    }
  }

  npcStore.dailyReset()
  cookingStore.dailyReset()

  // 动物产出
  const animalProducts = animalStore.dailyUpdate()
  if (animalProducts.products.length > 0) {
    for (const p of animalProducts.products) {
      inventoryStore.addItem(p.itemId, 1, p.quality)
    }
    addLog(`动物们产出了${animalProducts.products.length}件产品。`)
  }

  // 洞穴产出
  const caveProducts = homeStore.dailyCaveUpdate()
  for (const p of caveProducts) {
    inventoryStore.addItem(p.itemId, p.quantity)
    const itemDef = getItemById(p.itemId)
    addLog(`山洞中发现了${itemDef?.name ?? p.itemId}。`)
  }

  // 果树更新
  const fruitResult = farmStore.dailyFruitTreeUpdate(gameStore.season)
  for (const f of fruitResult.fruits) {
    inventoryStore.addItem(f.fruitId, 1, f.quality)
  }
  if (fruitResult.fruits.length > 0) {
    addLog(`果树产出了${fruitResult.fruits.length}个水果。`)
  }

  // 野生树木更新
  const wildTreeResult = farmStore.dailyWildTreeUpdate()
  for (const p of wildTreeResult.products) {
    inventoryStore.addItem(p.productId)
  }
  if (wildTreeResult.products.length > 0) {
    addLog(`采脂器收获了${wildTreeResult.products.map(p => p.productName).join('、')}。`)
  }

  // 温室更新
  if (homeStore.greenhouseUnlocked) {
    farmStore.greenhouseDailyUpdate()
  }

  // 酒窖更新
  if (homeStore.farmhouseLevel >= 3) {
    const cellarResult = homeStore.dailyCellarUpdate()
    for (const r of cellarResult.ready) {
      addLog(`酒窖中的${getItemById(r.itemId)?.name ?? r.itemId}品质提升了！`)
    }
  }

  // 钱包解锁检查
  const walletStore = useWalletStore()
  const newWalletItems = walletStore.checkAndUnlock()
  for (const name of newWalletItems) {
    addLog(`解锁了钱袋物品：${name}！`)
  }

  // 委托每日更新
  const expiredQuests = questStore.dailyUpdate()
  for (const eq of expiredQuests) {
    addLog(`委托「${eq.description}」已过期。`)
  }
  questStore.generateDailyQuests(gameStore.season, gameStore.day)

  // 子女每日更新
  const childResult = npcStore.dailyChildUpdate()
  if (childResult.newBorn) {
    addLog(`${childResult.newBorn}出生了！恭喜！`)
  }

  // 检查子女事件
  if (npcStore.checkChildEvent()) {
    const spouseDef2 = getNpcById(npcStore.getSpouse()?.npcId ?? '')
    addLog(`${spouseDef2?.name ?? '配偶'}提议要个孩子……（下次对话时确认）`)
    npcStore.confirmChild()
  }

  const { seasonChanged, oldSeason } = gameStore.nextDay()
  const { moneyLost } = playerStore.dailyReset(recoveryMode)

  let summary: string
  if (recoveryMode === 'passout') {
    summary =
      moneyLost > 0
        ? `你体力耗尽倒下了……有人把你送回家。丢失了${moneyLost}文。次日仅恢复50%体力。`
        : `你体力耗尽倒下了……次日仅恢复50%体力。`
  } else if (recoveryMode === 'late') {
    summary = '你熬夜到很晚才睡……次日仅恢复75%体力。'
  } else {
    summary = '美好的一天结束了。'
  }

  addLog(
    `—— 第${gameStore.year}年 ${SEASON_NAMES[gameStore.season]} 第${gameStore.day}天 ${gameStore.weekdayName} ${WEATHER_NAMES[gameStore.weather]} ——`
  )
  addLog(summary)

  // 换季处理
  if (seasonChanged) {
    const { witheredCount, reclaimedCount } = farmStore.onSeasonChange(gameStore.season)
    addLog(`—— 季节更替：${SEASON_NAMES[oldSeason]}→${SEASON_NAMES[gameStore.season]} ——`)
    if (witheredCount > 0) {
      addLog(`${witheredCount}株不适应新季节的作物枯萎了……`)
    }
    if (reclaimedCount > 0) {
      addLog(`${reclaimedCount}块荒废的耕地被杂草覆盖了。`)
    }
    if (oldSeason === 'winter' && gameStore.season === 'spring') {
      addLog('新的一年开始了！农场经过一冬有些荒废，需要重新开垦。')
    }
    farmStore.fruitTreeSeasonUpdate()
  }

  // 闪电
  if (gameStore.weather === 'stormy') {
    const strike = farmStore.lightningStrike()
    if (strike.hit) {
      addLog(`雷暴中一道闪电击中了你的农场，一株${strike.cropName}被毁了！`)
    }
  }

  if (gameStore.isRainy) {
    addLog('今天下雨，作物自动浇水。')
  }

  // 天气预报
  addLog(`明日天气预报：${WEATHER_NAMES[gameStore.tomorrowWeather]}`)

  // 食谱解锁
  checkRecipeUnlocks()

  // 季节事件
  const event = getTodayEvent(gameStore.season, gameStore.day)
  if (event) {
    applyEventEffects(event)
    const { startFestivalBgm } = useAudio()
    startFestivalBgm(gameStore.season)
    if (event.interactive && event.festivalType) {
      showFestival(event.festivalType)
    }
    showEvent(event)
  }

  // 成就检查
  const newAchievements = achievementStore.checkAchievements()
  for (const a of newAchievements) {
    addLog(`【成就达成】${a.name}！${a.reward.money ? `获得${a.reward.money}文` : ''}`)
    showFloat(`成就: ${a.name}`, 'accent')
  }

  // 洞穴解锁检查
  if (!homeStore.caveUnlocked && achievementStore.stats.totalMoneyEarned >= CAVE_UNLOCK_EARNINGS) {
    homeStore.unlockCave()
    addLog('你的累计收入引起了注意……村后的山洞已为你开放！去农舍面板选择山洞用途吧。')
  }

  // 荒野农场被动矿石
  if (gameStore.farmMapType === 'wilderness') {
    const orePool = ['copper_ore', 'iron_ore', 'gold_ore']
    const randomOre = orePool[Math.floor(Math.random() * orePool.length)]!
    const qty = 1 + Math.floor(Math.random() * 2)
    inventoryStore.addItem(randomOre, qty)
    const oreDef = getItemById(randomOre)
    addLog(`荒野中发现了${qty}个${oreDef?.name ?? randomOre}。`)
  }

  // 自动存档
  saveStore.autoSave()
}

export const useEndDay = () => {
  return { handleEndDay }
}
