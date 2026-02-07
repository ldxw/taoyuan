import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { MonsterDef, CombatAction } from '@/types'
import { getFloor } from '@/data'
import { getBombById } from '@/data/processing'
import { usePlayerStore } from './usePlayerStore'
import { useInventoryStore } from './useInventoryStore'
import { useSkillStore } from './useSkillStore'
import { useAchievementStore } from './useAchievementStore'
import { useCookingStore } from './useCookingStore'
import { useGameStore } from './useGameStore'
import { useWalletStore } from './useWalletStore'

const BASE_STAMINA_COST = 5
const BASE_ATTACK = 10
const DEFEAT_MONEY_PENALTY_RATE = 0.1
const DEFEAT_MONEY_PENALTY_CAP = 1000

export const useMiningStore = defineStore('mining', () => {
  const playerStore = usePlayerStore()
  const inventoryStore = useInventoryStore()
  const skillStore = useSkillStore()

  /** 当前进度 */
  const currentFloor = ref(1)
  const safePointFloor = ref(0)
  const isExploring = ref(false)

  /** 当前层的状态 */
  const floorOresCollected = ref(false)
  const floorMonsterDefeated = ref(false)

  /** 战斗状态 */
  const inCombat = ref(false)
  const combatMonster = ref<MonsterDef | null>(null)
  const combatMonsterHp = ref(0)
  const combatRound = ref(0)
  const combatLog = ref<string[]>([])

  /** 本次探索收集的物品（离开时50%丢失用） */
  const sessionLoot = ref<{ itemId: string; quantity: number }[]>([])

  /** 进入矿洞 */
  const enterMine = (): string => {
    isExploring.value = true
    currentFloor.value = safePointFloor.value + 1
    floorOresCollected.value = false
    floorMonsterDefeated.value = false
    sessionLoot.value = []
    return `进入云隐矿洞，当前第${currentFloor.value}层。`
  }

  /** 挖矿石 */
  const mineOre = (): { success: boolean; message: string } => {
    if (!isExploring.value) return { success: false, message: '你不在矿洞中。' }
    if (floorOresCollected.value) return { success: false, message: '这层的矿石已经采完了。' }

    const pickaxeMultiplier = inventoryStore.getToolStaminaMultiplier('pickaxe')
    const cookingStore = useCookingStore()
    const miningBuff = cookingStore.activeBuff?.type === 'mining' ? cookingStore.activeBuff.value / 100 : 0
    const walletStore = useWalletStore()
    const walletMiningReduction = walletStore.getMiningStaminaReduction()
    const staminaCost = Math.max(
      1,
      Math.floor(
        BASE_STAMINA_COST *
          pickaxeMultiplier *
          (1 - skillStore.getStaminaReduction('mining')) *
          (1 - miningBuff) *
          (1 - walletMiningReduction)
      )
    )
    if (!playerStore.consumeStamina(staminaCost)) {
      return { success: false, message: '体力不足，无法挖矿。' }
    }

    const floor = getFloor(currentFloor.value)
    if (!floor) return { success: false, message: '无效的层数。' }

    // 随机获取矿石 (luck buff 提升稀有矿石概率)
    const luckBuff = cookingStore.activeBuff?.type === 'luck' ? cookingStore.activeBuff.value / 100 : 0
    let oreId: string
    if (luckBuff > 0 && floor.ores.length > 1) {
      // 幸运增益使稀有矿石权重提升
      const weights = floor.ores.map((_, i) => 1 + i * luckBuff)
      const total = weights.reduce((a, b) => a + b, 0)
      let roll = Math.random() * total
      let idx = 0
      for (let i = 0; i < weights.length; i++) {
        roll -= weights[i]!
        if (roll <= 0) {
          idx = i
          break
        }
      }
      oreId = floor.ores[idx]!
    } else {
      oreId = floor.ores[Math.floor(Math.random() * floor.ores.length)]!
    }
    let quantity = 1 + (skillStore.getSkill('mining').perk5 === 'miner' ? 1 : 0)
    // 山丘农场加成：矿石+1
    const gameStore = useGameStore()
    if (gameStore.farmMapType === 'hilltop') quantity += 1
    // 探矿者专精：25% 概率双倍
    if (skillStore.getSkill('mining').perk10 === 'prospector' && Math.random() < 0.25) quantity *= 2
    inventoryStore.addItem(oreId, quantity)
    sessionLoot.value.push({ itemId: oreId, quantity })
    useAchievementStore().discoverItem(oreId)

    // 给经验
    const hilltopXpBonus = gameStore.farmMapType === 'hilltop' ? 1.25 : 1.0
    skillStore.addExp('mining', Math.floor(5 * hilltopXpBonus))

    floorOresCollected.value = true
    return { success: true, message: `挖到了${quantity}个矿石！(-${staminaCost}体力)` }
  }

  /** 使用炸弹 */
  const useBomb = (bombId: string): { success: boolean; message: string } => {
    if (!isExploring.value) return { success: false, message: '你不在矿洞中。' }
    if (floorOresCollected.value) return { success: false, message: '这层的矿石已经采完了。' }

    const bombDef = getBombById(bombId)
    if (!bombDef) return { success: false, message: '无效的炸弹。' }
    if (!inventoryStore.removeItem(bombId)) return { success: false, message: '背包中没有该炸弹。' }

    const floor = getFloor(currentFloor.value)
    if (!floor) return { success: false, message: '无效的层数。' }

    // 收集多份矿石
    const collected: string[] = []
    for (let i = 0; i < bombDef.oreMultiplier; i++) {
      const oreId = floor.ores[Math.floor(Math.random() * floor.ores.length)]!
      let quantity = 1 + (skillStore.getSkill('mining').perk5 === 'miner' ? 1 : 0)
      const gameStore = useGameStore()
      if (gameStore.farmMapType === 'hilltop') quantity += 1
      if (skillStore.getSkill('mining').perk10 === 'prospector' && Math.random() < 0.25) quantity *= 2
      inventoryStore.addItem(oreId, quantity)
      sessionLoot.value.push({ itemId: oreId, quantity })
      collected.push(oreId)
    }

    floorOresCollected.value = true

    // 炸弹清除怪物
    if (bombDef.clearsMonster) {
      floorMonsterDefeated.value = true
    }

    skillStore.addExp('mining', 5 * bombDef.oreMultiplier)
    useAchievementStore().discoverItem(collected[0]!)

    let msg = `${bombDef.name}爆炸了！获得了${bombDef.oreMultiplier}份矿石！`
    if (bombDef.clearsMonster) msg += ' 怪物也被炸飞了！'
    return { success: true, message: msg }
  }

  /** 遭遇怪物 */
  const encounterMonster = (): { found: boolean; message: string } => {
    if (!isExploring.value) return { found: false, message: '你不在矿洞中。' }
    if (floorMonsterDefeated.value) return { found: false, message: '这层已经没有怪物了。' }

    const floor = getFloor(currentFloor.value)
    if (!floor || floor.monsters.length === 0) return { found: false, message: '这层没有怪物。' }

    const monster = floor.monsters[Math.floor(Math.random() * floor.monsters.length)]!
    combatMonster.value = { ...monster }
    combatMonsterHp.value = monster.hp
    combatRound.value = 0
    combatLog.value = [`遭遇了${monster.name}！(HP: ${monster.hp})`]
    inCombat.value = true

    return { found: true, message: `遭遇了${monster.name}！` }
  }

  /** 战斗操作 */
  const combatAction = (action: CombatAction): { message: string; combatOver: boolean; won: boolean } => {
    if (!inCombat.value || !combatMonster.value) {
      return { message: '不在战斗中。', combatOver: true, won: false }
    }

    combatRound.value++
    const monster = combatMonster.value

    if (action === 'flee') {
      inCombat.value = false
      combatLog.value.push('你逃跑了！')
      return { message: '成功逃离了战斗。', combatOver: true, won: false }
    }

    if (action === 'defend') {
      // 防御减少受到的伤害
      const cookingStore = useCookingStore()
      const defenseReduction = cookingStore.activeBuff?.type === 'defense' ? cookingStore.activeBuff.value / 100 : 0
      const damage = Math.max(1, Math.floor(monster.attack * 0.4 * (1 - defenseReduction)))
      playerStore.takeDamage(damage)
      combatLog.value.push(`你举盾防御，受到${damage}点伤害。`)

      if (playerStore.hp <= 0) {
        return handleDefeat()
      }
      return { message: `防御！受到${damage}点伤害。`, combatOver: false, won: false }
    }

    // 攻击
    const playerAttack = BASE_ATTACK + skillStore.miningLevel * 2
    const damageToMonster = Math.max(1, playerAttack - monster.defense)
    combatMonsterHp.value -= damageToMonster

    let msg = `你攻击${monster.name}，造成${damageToMonster}点伤害。`

    if (combatMonsterHp.value <= 0) {
      // 怪物被击败
      inCombat.value = false
      floorMonsterDefeated.value = true
      const wildernessXpBonus = useGameStore().farmMapType === 'wilderness' ? 1.5 : 1.0
      skillStore.addExp('mining', Math.floor(monster.expReward * wildernessXpBonus))

      // 掉落
      const drops: string[] = []
      for (const drop of monster.drops) {
        if (Math.random() < drop.chance) {
          inventoryStore.addItem(drop.itemId)
          sessionLoot.value.push({ itemId: drop.itemId, quantity: 1 })
          useAchievementStore().discoverItem(drop.itemId)
          drops.push(drop.itemId)
        }
      }

      msg += ` ${monster.name}被击败了！(+${monster.expReward}经验)`
      if (drops.length > 0) msg += ` 掉落了物品。`
      combatLog.value.push(msg)
      return { message: msg, combatOver: true, won: true }
    }

    // 怪物反击
    const cookingStore = useCookingStore()
    const defenseReduction = cookingStore.activeBuff?.type === 'defense' ? cookingStore.activeBuff.value / 100 : 0
    const fighterReduction = skillStore.getSkill('mining').perk5 === 'fighter' ? 0.15 : 0
    const monsterDamage = Math.max(1, Math.floor(monster.attack * (1 - fighterReduction) * (1 - defenseReduction)))
    playerStore.takeDamage(monsterDamage)
    msg += ` ${monster.name}反击，你受到${monsterDamage}点伤害。`
    combatLog.value.push(msg)

    if (playerStore.hp <= 0) {
      return handleDefeat()
    }

    return { message: msg, combatOver: false, won: false }
  }

  /** 战斗失败处理 */
  const handleDefeat = (): { message: string; combatOver: boolean; won: boolean } => {
    inCombat.value = false
    isExploring.value = false

    // 丢失50%本次探索物品
    const lostCount = Math.ceil(sessionLoot.value.length / 2)
    for (let i = 0; i < lostCount; i++) {
      const item = sessionLoot.value.pop()
      if (item) inventoryStore.removeItem(item.itemId, item.quantity)
    }

    // 扣除金币
    const moneyLost = Math.min(Math.floor(playerStore.money * DEFEAT_MONEY_PENALTY_RATE), DEFEAT_MONEY_PENALTY_CAP)
    if (moneyLost > 0) playerStore.spendMoney(moneyLost)

    // HP 恢复到50%
    const maxHp = playerStore.getMaxHp()
    playerStore.restoreHealth(Math.floor(maxHp * 0.5))

    let msg = '你在矿洞中倒下了……丢失了一半物品，被送回入口。'
    if (moneyLost > 0) msg = `你在矿洞中倒下了……丢失了一半物品和${moneyLost}文，被送回入口。`
    combatLog.value.push(msg)
    return { message: msg, combatOver: true, won: false }
  }

  /** 前进到下一层 */
  const goNextFloor = (): { success: boolean; message: string } => {
    if (!isExploring.value) return { success: false, message: '你不在矿洞中。' }
    if (!floorMonsterDefeated.value && !floorOresCollected.value) {
      return { success: false, message: '需要先探索当前层（采矿或击败怪物）。' }
    }
    if (currentFloor.value >= 30) {
      return { success: false, message: '已经到达矿洞最深处！' }
    }

    // 检查安全点
    const floor = getFloor(currentFloor.value)
    if (floor?.isSafePoint) {
      safePointFloor.value = currentFloor.value
    }

    currentFloor.value++
    useAchievementStore().recordMineFloor(currentFloor.value)
    floorOresCollected.value = false
    floorMonsterDefeated.value = false

    const newFloor = getFloor(currentFloor.value)
    return { success: true, message: `前进到第${currentFloor.value}层。${newFloor?.isSafePoint ? '（安全点！）' : ''}` }
  }

  /** 离开矿洞 */
  const leaveMine = (): string => {
    isExploring.value = false
    return '你离开了矿洞。'
  }

  const serialize = () => {
    return { currentFloor: currentFloor.value, safePointFloor: safePointFloor.value }
  }

  const deserialize = (data: ReturnType<typeof serialize>) => {
    currentFloor.value = data.currentFloor
    safePointFloor.value = data.safePointFloor
  }

  return {
    currentFloor,
    safePointFloor,
    isExploring,
    floorOresCollected,
    floorMonsterDefeated,
    inCombat,
    combatMonster,
    combatMonsterHp,
    combatRound,
    combatLog,
    enterMine,
    mineOre,
    useBomb,
    encounterMonster,
    combatAction,
    goNextFloor,
    leaveMine,
    serialize,
    deserialize
  }
})
