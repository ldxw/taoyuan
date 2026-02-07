import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { NpcState, FriendshipLevel, HeartEventDef, Quality, ChildState } from '@/types'
import { NPCS, getNpcById, getHeartEventsForNpc } from '@/data'
import { useInventoryStore } from './useInventoryStore'
import { useGameStore } from './useGameStore'

/** 好感等级阈值 */
const FRIENDSHIP_THRESHOLDS: { level: FriendshipLevel; min: number }[] = [
  { level: 'bestFriend', min: 300 },
  { level: 'friendly', min: 150 },
  { level: 'acquaintance', min: 50 },
  { level: 'stranger', min: 0 }
]

export const useNpcStore = defineStore('npc', () => {
  const npcStates = ref<NpcState[]>(
    NPCS.map(npc => ({
      npcId: npc.id,
      friendship: 0,
      talkedToday: false,
      giftedToday: false,
      married: false,
      triggeredHeartEvents: []
    }))
  )

  /** 子女列表 */
  const children = ref<ChildState[]>([])

  /** 结婚天数计数 */
  const daysMarried = ref<number>(0)

  /** 是否有待产子女 */
  const pendingChild = ref<boolean>(false)

  /** 子女出生倒计时 */
  const childCountdown = ref<number>(0)

  /** 子女名字池 */
  const CHILD_NAMES = ['小宝', '阿花', '小龙', '小凤', '团子', '豆豆', '年年', '圆圆']

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

  /** 与NPC对话 (+2好感) */
  const talkTo = (npcId: string): { message: string; friendshipGain: number } | null => {
    const state = getNpcState(npcId)
    if (!state) return null
    if (state.talkedToday) return null

    state.talkedToday = true
    state.friendship += 2

    const npcDef = getNpcById(npcId)
    if (!npcDef) return null

    // 已婚NPC有特殊对话
    if (state.married) {
      const marriedDialogues = [
        '今天辛苦了，早点回来吃饭。',
        '我给你留了饭菜，还热着呢。',
        '田里的活干完了吗？别太累了。',
        '有你在身边，每天都很开心。'
      ]
      const message = marriedDialogues[Math.floor(Math.random() * marriedDialogues.length)]!
      return { message, friendshipGain: 2 }
    }

    const level = getFriendshipLevel(npcId)
    const dialogues = npcDef.dialogues[level]
    const message = dialogues[Math.floor(Math.random() * dialogues.length)]!

    return { message, friendshipGain: 2 }
  }

  /** 送礼给NPC */
  const giveGift = (
    npcId: string,
    itemId: string,
    giftBonusMultiplier: number = 1,
    quality: Quality = 'normal'
  ): { gain: number; reaction: string } | null => {
    const state = getNpcState(npcId)
    if (!state) return null
    if (state.giftedToday) return null

    const inventoryStore = useInventoryStore()
    if (!inventoryStore.removeItem(itemId)) return null

    state.giftedToday = true
    const npcDef = getNpcById(npcId)
    if (!npcDef) return null

    let gain: number
    let reaction: string

    if (npcDef.lovedItems.includes(itemId)) {
      gain = 10
      reaction = '非常喜欢'
    } else if (npcDef.likedItems.includes(itemId)) {
      gain = 3
      reaction = '还不错'
    } else if (npcDef.hatedItems.includes(itemId)) {
      gain = -5
      reaction = '讨厌'
    } else {
      gain = 1
      reaction = '一般'
    }

    // 品质加成
    const qualityMultiplier: Record<Quality, number> = { normal: 1.0, fine: 1.25, excellent: 1.5, supreme: 2.0 }
    // 生日加成
    const birthdayMultiplier = isBirthday(npcId) ? 5 : 1

    gain = Math.floor(gain * qualityMultiplier[quality] * birthdayMultiplier * giftBonusMultiplier)
    state.friendship = Math.max(0, state.friendship + gain)

    return { gain, reaction }
  }

  /** 求婚 */
  const propose = (npcId: string): { success: boolean; message: string } => {
    const state = getNpcState(npcId)
    if (!state) return { success: false, message: 'NPC不存在。' }

    const npcDef = getNpcById(npcId)
    if (!npcDef?.marriageable) return { success: false, message: '这个人无法求婚。' }

    // 检查是否已有配偶
    const alreadyMarried = npcStates.value.some(s => s.married)
    if (alreadyMarried) return { success: false, message: '你已经结婚了。' }

    if (state.friendship < 300) return { success: false, message: '好感度不足（需要300）。' }

    const inventoryStore = useInventoryStore()
    if (!inventoryStore.removeItem('jade_ring')) {
      return { success: false, message: '需要一枚翡翠戒指。' }
    }

    state.married = true
    state.friendship += 50
    return { success: true, message: `${npcDef.name}含泪接受了你的翡翠戒指……你们结婚了！` }
  }

  /** 获取已婚配偶状态 */
  const getSpouse = (): NpcState | null => {
    return npcStates.value.find(s => s.married) ?? null
  }

  /** 检查是否应触发要孩子对话 */
  const checkChildEvent = (): boolean => {
    const spouse = getSpouse()
    if (!spouse) return false
    if (children.value.length >= 2) return false
    if (pendingChild.value) return false
    if (daysMarried.value < 7) return false
    if (spouse.friendship < 250) return false
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
        const usedNames = children.value.map(c => c.name)
        const availableNames = CHILD_NAMES.filter(n => !usedNames.includes(n))
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

  /** 每日重置对话和送礼状态 + 好感衰减 */
  const dailyReset = () => {
    const floorMap: Record<FriendshipLevel, number> = { bestFriend: 300, friendly: 150, acquaintance: 50, stranger: 0 }

    for (const state of npcStates.value) {
      if (!state.talkedToday) {
        if (state.married) {
          state.friendship = Math.max(0, state.friendship - 2)
        } else {
          const currentLevel = getFriendshipLevel(state.npcId)
          const floor = floorMap[currentLevel]
          state.friendship = Math.max(floor, state.friendship - 1)
        }
      }
      state.talkedToday = false
      state.giftedToday = false
    }
  }

  const serialize = () => {
    return {
      npcStates: npcStates.value,
      children: children.value,
      daysMarried: daysMarried.value,
      pendingChild: pendingChild.value,
      childCountdown: childCountdown.value
    }
  }

  const deserialize = (data: ReturnType<typeof serialize>) => {
    npcStates.value = data.npcStates.map(s => ({
      ...s,
      married: s.married ?? false,
      triggeredHeartEvents: s.triggeredHeartEvents ?? []
    }))
    children.value = (data as any).children ?? []
    daysMarried.value = (data as any).daysMarried ?? 0
    pendingChild.value = (data as any).pendingChild ?? false
    childCountdown.value = (data as any).childCountdown ?? 0
  }

  return {
    npcStates,
    children,
    daysMarried,
    pendingChild,
    childCountdown,
    getNpcState,
    getFriendshipLevel,
    isBirthday,
    getTodayBirthdayNpc,
    checkHeartEvent,
    markHeartEventTriggered,
    adjustFriendship,
    talkTo,
    giveGift,
    propose,
    getSpouse,
    checkChildEvent,
    confirmChild,
    interactWithChild,
    dailyChildUpdate,
    dailyReset,
    serialize,
    deserialize
  }
})
