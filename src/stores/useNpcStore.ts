import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { NpcState, FriendshipLevel, HeartEventDef, Quality, ChildState } from '@/types'
import { NPCS, getNpcById, getHeartEventsForNpc, RECIPES } from '@/data'
import { WEATHER_TIPS, getFortuneTip, getLivingTip, getRecipeTipMessage, NO_RECIPE_TIP, TIP_NPC_IDS } from '@/data/npcTips'
import { getItemById } from '@/data/items'
import { useInventoryStore } from './useInventoryStore'
import { useGameStore } from './useGameStore'
import { usePlayerStore } from './usePlayerStore'
import { useCookingStore } from './useCookingStore'

/** 好感等级阈值 (10心制, 每心250点, 上限2500) */
const FRIENDSHIP_THRESHOLDS: { level: FriendshipLevel; min: number }[] = [
  { level: 'bestFriend', min: 2000 },
  { level: 'friendly', min: 1000 },
  { level: 'acquaintance', min: 500 },
  { level: 'stranger', min: 0 }
]

export const useNpcStore = defineStore('npc', () => {
  const npcStates = ref<NpcState[]>(
    NPCS.map(npc => ({
      npcId: npc.id,
      friendship: 0,
      talkedToday: false,
      giftedToday: false,
      giftsThisWeek: 0,
      dating: false,
      married: false,
      zhiji: false,
      triggeredHeartEvents: []
    }))
  )

  /** 每日提示NPC是否已给过提示 */
  const tipGivenToday = ref<Record<string, boolean>>({})

  /** 子女列表 */
  const children = ref<ChildState[]>([])

  /** 结婚天数计数 */
  const daysMarried = ref<number>(0)

  /** 知己天数计数 */
  const daysZhiji = ref<number>(0)

  /** 是否有待产子女 */
  const pendingChild = ref<boolean>(false)

  /** 子女出生倒计时 */
  const childCountdown = ref<number>(0)

  /** 婚礼倒计时 (0=无婚礼待举行) */
  const weddingCountdown = ref<number>(0)

  /** 婚礼对象NPC ID */
  const weddingNpcId = ref<string | null>(null)

  /** 子女名字池（按性别） */
  const CHILD_NAMES_MALE = ['小龙', '小宝', '团子', '年年']
  const CHILD_NAMES_FEMALE = ['小凤', '阿花', '豆豆', '圆圆']

  /** 获取NPC状态 */
  const getNpcState = (npcId: string): NpcState | undefined => {
    return npcStates.value.find(s => s.npcId === npcId)
  }

  /** 获取好感等级 */
  const getFriendshipLevel = (npcId: string): FriendshipLevel => {
    const state = getNpcState(npcId)
    if (!state) return 'stranger'
    for (const t of FRIENDSHIP_THRESHOLDS) {
      if (state.friendship >= t.min) return t.level
    }
    return 'stranger'
  }

  /** 检查NPC今天是否生日 */
  const isBirthday = (npcId: string): boolean => {
    const npcDef = getNpcById(npcId)
    if (!npcDef?.birthday) return false
    const gameStore = useGameStore()
    return npcDef.birthday.season === gameStore.season && npcDef.birthday.day === gameStore.day
  }

  /** 获取今天过生日的NPC (null if none) */
  const getTodayBirthdayNpc = (): string | null => {
    const gameStore = useGameStore()
    for (const npc of NPCS) {
      if (npc.birthday && npc.birthday.season === gameStore.season && npc.birthday.day === gameStore.day) {
        return npc.id
      }
    }
    return null
  }

  /** 检查是否有可触发的心事件（对话后调用） */
  const checkHeartEvent = (npcId: string): HeartEventDef | null => {
    const state = getNpcState(npcId)
    if (!state) return null
    const events = getHeartEventsForNpc(npcId)
    for (const event of events) {
      // 知己事件仅知己触发
      if (event.requiresZhiji && !state.zhiji) continue
      // 知己不触发恋爱告白（heart_8）
      if (!event.requiresZhiji && state.zhiji && event.id.endsWith('_heart_8')) continue
      if (state.friendship >= event.requiredFriendship && !state.triggeredHeartEvents.includes(event.id)) {
        return event
      }
    }
    return null
  }

  /** 标记心事件为已触发 */
  const markHeartEventTriggered = (npcId: string, eventId: string) => {
    const state = getNpcState(npcId)
    if (state && !state.triggeredHeartEvents.includes(eventId)) {
      state.triggeredHeartEvents.push(eventId)
    }
  }

  /** 调整好感度（心事件选择结果） */
  const adjustFriendship = (npcId: string, amount: number) => {
    const state = getNpcState(npcId)
    if (state) {
      state.friendship = Math.max(0, state.friendship + amount)
    }
  }

  /** 替换对话中的占位符 */
  const replaceDialoguePlaceholders = (text: string): string => {
    const playerStore = usePlayerStore()
    return text.replace(/\{player\}/g, playerStore.playerName).replace(/\{title\}/g, playerStore.honorific)
  }

  /** 与NPC对话 (+20好感) */
  const talkTo = (npcId: string): { message: string; friendshipGain: number } | null => {
    const state = getNpcState(npcId)
    if (!state) return null
    if (state.talkedToday) return null

    state.talkedToday = true
    state.friendship += 20

    const npcDef = getNpcById(npcId)
    if (!npcDef) return null

    // 已婚NPC有特殊对话
    if (state.married) {
      const playerStore = usePlayerStore()
      const name = playerStore.playerName
      const marriedDialogues = [
        `${name}，今天辛苦了，早点回来吃饭。`,
        `我给${name}留了饭菜，还热着呢。`,
        '田里的活干完了吗？别太累了。',
        `有${name}在身边，每天都很开心。`
      ]
      const message = marriedDialogues[Math.floor(Math.random() * marriedDialogues.length)]!
      return { message, friendshipGain: 20 }
    }

    // 知己NPC使用知己专属对话
    if (state.zhiji && npcDef.zhijiDialogues?.length) {
      const raw = npcDef.zhijiDialogues[Math.floor(Math.random() * npcDef.zhijiDialogues.length)]!
      const message = replaceDialoguePlaceholders(raw)
      return { message, friendshipGain: 20 }
    }

    // 约会中NPC使用约会对话
    if (state.dating && npcDef.datingDialogues && npcDef.datingDialogues.length > 0) {
      const raw = npcDef.datingDialogues[Math.floor(Math.random() * npcDef.datingDialogues.length)]!
      const message = replaceDialoguePlaceholders(raw)
      return { message, friendshipGain: 20 }
    }

    const level = getFriendshipLevel(npcId)
    const dialogues = npcDef.dialogues[level]
    const raw = dialogues[Math.floor(Math.random() * dialogues.length)]!
    const message = replaceDialoguePlaceholders(raw)

    return { message, friendshipGain: 20 }
  }

  /** 送礼给NPC (每天1次, 每周2次) */
  const giveGift = (
    npcId: string,
    itemId: string,
    giftBonusMultiplier: number = 1,
    quality: Quality = 'normal'
  ): { gain: number; reaction: string } | null => {
    const state = getNpcState(npcId)
    if (!state) return null
    if (state.giftedToday) return null
    if (state.giftsThisWeek >= 2) return null

    const inventoryStore = useInventoryStore()
    if (!inventoryStore.removeItem(itemId, 1, quality)) return null

    state.giftedToday = true
    state.giftsThisWeek++
    const npcDef = getNpcById(npcId)
    if (!npcDef) return null

    let gain: number
    let reaction: string

    if (npcDef.lovedItems.includes(itemId)) {
      gain = 80
      reaction = '非常喜欢'
    } else if (npcDef.likedItems.includes(itemId)) {
      gain = 45
      reaction = '还不错'
    } else if (npcDef.hatedItems.includes(itemId)) {
      gain = -40
      reaction = '讨厌'
    } else {
      gain = 20
      reaction = '一般'
    }

    // 品质加成
    const qualityMultiplier: Record<Quality, number> = { normal: 1.0, fine: 1.25, excellent: 1.5, supreme: 2.0 }
    // 生日加成 (8倍)
    const birthdayMultiplier = isBirthday(npcId) ? 8 : 1

    gain = Math.floor(gain * qualityMultiplier[quality] * birthdayMultiplier * giftBonusMultiplier)
    state.friendship = Math.max(0, state.friendship + gain)

    return { gain, reaction }
  }

  /** 赠帕开启约会 (需2000好感/8心) */
  const startDating = (npcId: string): { success: boolean; message: string } => {
    const state = getNpcState(npcId)
    if (!state) return { success: false, message: 'NPC不存在。' }

    const npcDef = getNpcById(npcId)
    if (!npcDef?.marriageable) return { success: false, message: '无法与此人约会。' }

    const playerStore = usePlayerStore()
    if (npcDef.gender === playerStore.gender) {
      return { success: false, message: '只能向异性赠帕。' }
    }

    if (state.dating) return { success: false, message: '你们已经在约会了。' }
    if (state.married) return { success: false, message: '你们已经结婚了。' }
    if (npcStates.value.some(s => s.married)) return { success: false, message: '你已经结婚了。' }
    if (state.friendship < 2000) return { success: false, message: '好感度不足（需要8心/2000）。' }

    const inventoryStore = useInventoryStore()
    if (!inventoryStore.removeItem('silk_ribbon')) {
      return { success: false, message: '需要一条丝帕。' }
    }

    state.dating = true
    state.friendship += 160
    return { success: true, message: `${npcDef.name}羞红了脸，接过了你的丝帕……你们开始约会了！` }
  }

  /** 求婚 (需2500好感/10心) */
  const propose = (npcId: string): { success: boolean; message: string } => {
    const state = getNpcState(npcId)
    if (!state) return { success: false, message: 'NPC不存在。' }

    const npcDef = getNpcById(npcId)
    if (!npcDef?.marriageable) return { success: false, message: '这个人无法求婚。' }

    // 只允许异性求婚
    const playerStore = usePlayerStore()
    if (npcDef.gender === playerStore.gender) {
      return { success: false, message: '只能向异性求婚。' }
    }

    // 检查是否已有配偶
    const alreadyMarried = npcStates.value.some(s => s.married)
    if (alreadyMarried) return { success: false, message: '你已经结婚了。' }

    // 检查是否正在筹备婚礼
    if (weddingCountdown.value > 0) return { success: false, message: '婚礼正在筹备中。' }

    // 需要先约会
    if (!state.dating) return { success: false, message: '需要先赠帕约会。' }

    if (state.friendship < 2500) return { success: false, message: '好感度不足（需要10心/2500）。' }

    const inventoryStore = useInventoryStore()
    if (!inventoryStore.removeItem('jade_ring')) {
      return { success: false, message: '需要一枚翡翠戒指。' }
    }

    // 设置婚礼倒计时而非立即结婚
    weddingCountdown.value = 3
    weddingNpcId.value = npcId
    state.friendship += 400
    return { success: true, message: `${npcDef.name}含泪接受了你的翡翠戒指……婚礼将在3天后举行！` }
  }

  /** 获取已婚配偶状态 */
  const getSpouse = (): NpcState | null => {
    return npcStates.value.find(s => s.married) ?? null
  }

  /** 获取知己状态 */
  const getZhiji = (): NpcState | null => {
    return npcStates.value.find(s => s.zhiji) ?? null
  }

  /** 赠玉结为知己 (需同性+2000好感) */
  const becomeZhiji = (npcId: string): { success: boolean; message: string } => {
    const state = getNpcState(npcId)
    if (!state) return { success: false, message: 'NPC不存在。' }

    const npcDef = getNpcById(npcId)
    if (!npcDef?.marriageable) return { success: false, message: '无法与此人结为知己。' }

    const playerStore = usePlayerStore()
    if (npcDef.gender !== playerStore.gender) {
      return { success: false, message: '只能与同性结为知己。' }
    }

    if (state.zhiji) return { success: false, message: '你们已经是知己了。' }
    if (state.dating || state.married) return { success: false, message: '无法与恋人或伴侣结为知己。' }
    if (npcStates.value.some(s => s.zhiji)) return { success: false, message: '你已经有知己了。' }
    if (state.friendship < 2000) return { success: false, message: '好感度不足（需要8心/2000）。' }

    const inventoryStore = useInventoryStore()
    if (!inventoryStore.removeItem('zhiji_jade')) {
      return { success: false, message: '需要一块知己玉佩。' }
    }

    state.zhiji = true
    state.friendship += 160
    const label = playerStore.gender === 'male' ? '蓝颜知己' : '红颜知己'
    return { success: true, message: `${npcDef.name}郑重地接过了玉佩……你们结为了${label}！` }
  }

  /** 断绝知己之缘 */
  const dissolveZhiji = (): { success: boolean; message: string } => {
    const zhijiState = getZhiji()
    if (!zhijiState) return { success: false, message: '你还没有知己。' }

    const playerStore = usePlayerStore()
    if (!playerStore.spendMoney(10000)) {
      return { success: false, message: '金钱不足（需要10000文）。' }
    }

    const npcDef = getNpcById(zhijiState.npcId)
    zhijiState.zhiji = false
    zhijiState.friendship = 1000
    daysZhiji.value = 0

    return { success: true, message: `你和${npcDef?.name ?? '知己'}的知己之缘已断。` }
  }

  /** 每日婚礼倒计时更新 */
  const dailyWeddingUpdate = (): { weddingToday: boolean; npcId: string | null } => {
    if (weddingCountdown.value <= 0 || !weddingNpcId.value) {
      return { weddingToday: false, npcId: null }
    }
    weddingCountdown.value--
    if (weddingCountdown.value <= 0) {
      const npcId = weddingNpcId.value
      const state = getNpcState(npcId)
      if (state) {
        state.married = true
        state.dating = false
        state.friendship = Math.max(state.friendship, 3500)
      }
      weddingNpcId.value = null
      return { weddingToday: true, npcId }
    }
    return { weddingToday: false, npcId: null }
  }

  /** 取消婚礼 */
  const cancelWedding = () => {
    weddingCountdown.value = 0
    weddingNpcId.value = null
  }

  /** 离婚 */
  const divorce = (): { success: boolean; message: string } => {
    const spouse = getSpouse()
    if (!spouse) return { success: false, message: '你还没有结婚。' }

    const playerStore = usePlayerStore()
    if (!playerStore.spendMoney(30000)) {
      return { success: false, message: '金钱不足（需要30000文）。' }
    }

    const npcDef = getNpcById(spouse.npcId)
    spouse.married = false
    spouse.dating = false
    spouse.friendship = 1000
    pendingChild.value = false
    childCountdown.value = 0
    daysMarried.value = 0
    cancelWedding()

    return { success: true, message: `你和${npcDef?.name ?? '配偶'}的婚姻结束了。` }
  }

  /** 放生子女 */
  const releaseChild = (childId: number): { success: boolean; message: string } => {
    const child = children.value.find(c => c.id === childId)
    if (!child) return { success: false, message: '找不到这个孩子。' }

    const playerStore = usePlayerStore()
    if (!playerStore.spendMoney(10000)) {
      return { success: false, message: '金钱不足（需要10000文）。' }
    }

    const name = child.name
    children.value = children.value.filter(c => c.id !== childId)
    return { success: true, message: `${name}被送往了远方亲戚家。` }
  }

  /** 检查是否应触发要孩子对话 */
  const checkChildEvent = (): boolean => {
    const spouse = getSpouse()
    if (!spouse) return false
    if (children.value.length >= 2) return false
    if (pendingChild.value) return false
    if (daysMarried.value < 7) return false
    if (spouse.friendship < 3000) return false
    return Math.random() < 0.05
  }

  /** 确认要孩子 */
  const confirmChild = () => {
    pendingChild.value = true
    childCountdown.value = 14
  }

  /** 与子女互动 */
  const interactWithChild = (childId: number): { message: string; item?: string } | null => {
    const child = children.value.find(c => c.id === childId)
    if (!child) return null
    if (child.interactedToday) return null
    if (child.stage === 'baby') return null

    child.interactedToday = true
    child.friendship = Math.min(300, child.friendship + 2)

    if (child.stage === 'child' && Math.random() < 0.1) {
      const finds = ['wood', 'herb', 'pine_cone', 'wild_berry']
      const item = finds[Math.floor(Math.random() * finds.length)]!
      return { message: `${child.name}递给你一个东西。`, item }
    }

    return { message: `你和${child.name}玩了一会儿。(+2好感)` }
  }

  /** 每日子女更新 */
  const dailyChildUpdate = (): { newBorn?: string } => {
    if (getSpouse()) daysMarried.value++

    if (pendingChild.value) {
      childCountdown.value--
      if (childCountdown.value <= 0) {
        pendingChild.value = false
        const isBoy = Math.random() < 0.5
        const namePool = isBoy ? CHILD_NAMES_MALE : CHILD_NAMES_FEMALE
        const usedNames = children.value.map(c => c.name)
        const availableNames = namePool.filter(n => !usedNames.includes(n))
        const name = availableNames[Math.floor(Math.random() * availableNames.length)] ?? '小宝'
        children.value.push({
          id: children.value.length,
          name,
          daysOld: 0,
          stage: 'baby',
          friendship: 0,
          interactedToday: false
        })
        return { newBorn: name }
      }
    }

    for (const child of children.value) {
      child.daysOld++
      child.interactedToday = false
      if (child.stage === 'baby' && child.daysOld >= 14) {
        child.stage = 'toddler'
      } else if (child.stage === 'toddler' && child.daysOld >= 28) {
        child.stage = 'child'
      } else if (child.stage === 'child' && child.daysOld >= 56) {
        child.stage = 'teen'
      }
    }

    return {}
  }

  /** 检查NPC是否有每日提示功能 */
  const hasDailyTip = (npcId: string): boolean => {
    return (TIP_NPC_IDS as readonly string[]).includes(npcId)
  }

  /** 检查NPC今天是否已给过提示 */
  const isTipGivenToday = (npcId: string): boolean => {
    return tipGivenToday.value[npcId] ?? false
  }

  /** 获取NPC的每日提示 */
  const getDailyTip = (npcId: string): string | null => {
    if (!hasDailyTip(npcId)) return null
    if (tipGivenToday.value[npcId]) return null

    tipGivenToday.value[npcId] = true
    const gameStore = useGameStore()

    switch (npcId) {
      case 'li_yu':
        return WEATHER_TIPS[gameStore.tomorrowWeather]
      case 'zhou_xiucai':
        return getFortuneTip(gameStore.dailyLuck)
      case 'wang_dashen': {
        const cookingStore = useCookingStore()
        const unlockedRecipes = RECIPES.filter(r => cookingStore.unlockedRecipes.includes(r.id))
        if (unlockedRecipes.length === 0) return NO_RECIPE_TIP
        // 每周推荐一个固定食谱（基于年+周数的种子）
        const weekIndex = Math.floor((gameStore.day - 1) / 7)
        const seed = (gameStore.year - 1) * 16 + ['spring', 'summer', 'autumn', 'winter'].indexOf(gameStore.season) * 4 + weekIndex
        const recipe = unlockedRecipes[seed % unlockedRecipes.length]!
        const ingredientNames = recipe.ingredients.map(ing => {
          const item = getItemById(ing.itemId)
          return item ? `${item.name}×${ing.quantity}` : ing.itemId
        })
        return getRecipeTipMessage(recipe.name, ingredientNames)
      }
      case 'liu_cunzhang':
        return getLivingTip(gameStore.day, gameStore.year)
      default:
        return null
    }
  }

  /** 每日重置对话和送礼状态 + 伴侣好感衰减 */
  const dailyReset = () => {
    const gameStore = useGameStore()

    // 重置每日提示
    tipGivenToday.value = {}

    for (const state of npcStates.value) {
      // 只有已婚伴侣不聊天才会掉好感，普通NPC不衰减
      if (!state.talkedToday && state.married) {
        state.friendship = Math.max(0, state.friendship - 10)
      }
      // 知己不聊天也会掉好感（衰减较少）
      if (!state.talkedToday && state.zhiji) {
        state.friendship = Math.max(0, state.friendship - 5)
      }
      state.talkedToday = false
      state.giftedToday = false
      // 每周日重置周送礼计数 (day 7,14,21,28)
      if (gameStore.day % 7 === 0) {
        state.giftsThisWeek = 0
      }
    }

    // 知己天数递增
    if (getZhiji()) daysZhiji.value++
  }

  const serialize = () => {
    return {
      npcStates: npcStates.value,
      children: children.value,
      daysMarried: daysMarried.value,
      daysZhiji: daysZhiji.value,
      pendingChild: pendingChild.value,
      childCountdown: childCountdown.value,
      weddingCountdown: weddingCountdown.value,
      weddingNpcId: weddingNpcId.value,
      friendshipVersion: 2
    }
  }

  const deserialize = (data: ReturnType<typeof serialize>) => {
    const isOldScale = !(data as any).friendshipVersion || (data as any).friendshipVersion < 2
    const savedStates = data.npcStates.map(s => ({
      ...s,
      // 旧存档好感度迁移: ×8 (300制→2500制)
      friendship: isOldScale ? Math.round(s.friendship * 8) : s.friendship,
      married: s.married ?? false,
      dating: s.dating ?? false,
      zhiji: (s as any).zhiji ?? false,
      giftsThisWeek: (s as any).giftsThisWeek ?? 0,
      triggeredHeartEvents: s.triggeredHeartEvents ?? []
    }))
    // 合并：保留已保存的状态，为新增NPC补充默认状态
    const savedIds = new Set(savedStates.map(s => s.npcId))
    const newNpcStates: NpcState[] = NPCS.filter(npc => !savedIds.has(npc.id)).map(npc => ({
      npcId: npc.id,
      friendship: 0,
      talkedToday: false,
      giftedToday: false,
      giftsThisWeek: 0,
      dating: false,
      married: false,
      zhiji: false,
      triggeredHeartEvents: []
    }))
    npcStates.value = [...savedStates, ...newNpcStates]
    children.value = (data as any).children ?? []
    daysMarried.value = (data as any).daysMarried ?? 0
    daysZhiji.value = (data as any).daysZhiji ?? 0
    pendingChild.value = (data as any).pendingChild ?? false
    childCountdown.value = (data as any).childCountdown ?? 0
    weddingCountdown.value = (data as any).weddingCountdown ?? 0
    weddingNpcId.value = (data as any).weddingNpcId ?? null
  }

  return {
    npcStates,
    children,
    daysMarried,
    daysZhiji,
    pendingChild,
    childCountdown,
    weddingCountdown,
    weddingNpcId,
    getNpcState,
    getFriendshipLevel,
    isBirthday,
    getTodayBirthdayNpc,
    checkHeartEvent,
    markHeartEventTriggered,
    adjustFriendship,
    talkTo,
    giveGift,
    startDating,
    propose,
    getSpouse,
    getZhiji,
    becomeZhiji,
    dissolveZhiji,
    dailyWeddingUpdate,
    cancelWedding,
    divorce,
    releaseChild,
    checkChildEvent,
    confirmChild,
    interactWithChild,
    dailyChildUpdate,
    dailyReset,
    hasDailyTip,
    isTipGivenToday,
    getDailyTip,
    tipGivenToday,
    serialize,
    deserialize
  }
})
